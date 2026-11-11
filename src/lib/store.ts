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
