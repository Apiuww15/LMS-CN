import { seed } from "./data";

const PREFIX = "educn-live-v3-";
const REFRESH_MS = 5000;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function loadCollection<K extends keyof typeof seed>(key: K): (typeof seed)[K] {
  // MongoDB adalah satu-satunya sumber data. Cache browser tidak digunakan
  // untuk initial state agar data lama tidak muncul kembali.
  return clone(seed[key]);
}

export async function fetchCollection<K extends keyof typeof seed>(key: K): Promise<(typeof seed)[K]> {
  const response = await fetch(`/api/data/${String(key)}`, {
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep HTTP status message.
    }
    throw new Error(message);
  }

  const json = (await response.json()) as { data: (typeof seed)[K] };
  const value = clone(json.data);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PREFIX + String(key), JSON.stringify(value));
    } catch {
      // Cache is optional and never controls the application.
    }
  }

  return value;
}

export async function saveCollection<K extends keyof typeof seed>(
  key: K,
  value: (typeof seed)[K],
) {
  const response = await fetch(`/api/data/${String(key)}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ data: value }),
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep HTTP status message.
    }
    throw new Error(message);
  }

  const json = (await response.json()) as { data?: (typeof seed)[K] };
  const serverValue = json.data ?? value;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PREFIX + String(key), JSON.stringify(serverValue));
    } catch {
      // Cache is optional.
    }
  }

  return serverValue;
}

export async function resetCollection<K extends keyof typeof seed>(key: K) {
  return saveCollection(key, clone(seed[key]));
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function logAction(title: string, detail = "") {
  if (typeof window === "undefined") return;

  try {
    const time = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    await fetch("/api/activity", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ title, detail, time }),
      keepalive: true,
    });
  } catch (error) {
    // Audit log failure must never make a successful CRUD operation
    // look like it failed. Keep it in the console for development only.
    if (process.env.NODE_ENV === "development") {
      console.warn("Audit log gagal dicatat:", error);
    }
  }
}

export function pollingInterval() {
  return REFRESH_MS;
}

export const authKey = PREFIX + "auth";


export async function deleteClassRecordFromApi(id: string): Promise<{ reassigned: number; replacementClass: string | null }> {
  const requestDelete = async (replacementClassId?: string): Promise<{ reassigned?: number; replacementClass?: string | null }> => {
    const query = new URLSearchParams({ id });
    if (replacementClassId) query.set("replacementClassId", replacementClassId);
    const response = await fetch(`/api/data/kelas?${query.toString()}`, { method: "DELETE", credentials: "include", cache: "no-store" });
    const body = await response.json().catch(() => ({})) as { error?: string; requiresReplacement?: boolean; linkedCount?: number; alternatives?: { id: string; nama: string }[]; reassigned?: number; replacementClass?: string | null };
    if (response.ok) return body;
    if (response.status === 409 && body.requiresReplacement) {
      const alternatives = body.alternatives ?? [];
      if (!alternatives.length) throw new Error("Kelas ini masih digunakan akun guru/siswa. Buat kelas pengganti terlebih dahulu, pindahkan akun ke kelas tersebut, lalu hapus kelas ini.");
      const choices = alternatives.map((item, index) => `${index + 1}. ${item.nama}`).join("\n");
      const answer = window.prompt(`Kelas ini masih digunakan oleh ${body.linkedCount ?? "beberapa"} akun. Pilih kelas pengganti agar akun tetap terhubung:\n${choices}\n\nMasukkan nomor kelas pengganti:`);
      if (answer === null) throw new Error("Penghapusan kelas dibatalkan.");
      const index = Number(answer.trim()) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= alternatives.length) throw new Error("Pilihan kelas pengganti tidak valid. Penghapusan dibatalkan.");
      return requestDelete(alternatives[index].id);
    }
    throw new Error(body.error || `Gagal menghapus kelas (HTTP ${response.status}).`);
  };
  const result = await requestDelete();
  return { reassigned: result.reassigned ?? 0, replacementClass: result.replacementClass ?? null };
}
