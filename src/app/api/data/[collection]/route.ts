import { NextResponse } from "next/server";
import { isCollectionName, listCollection, replaceCollection } from "@/lib/server-data";
import { getSession } from "@/lib/auth";

const readRoles: Record<string, string[]> = {
  users: ["admin"],
  guru: ["admin", "kurikulum", "kepsek"],
  siswa: ["admin", "kurikulum", "kepsek"],
  kelas: ["admin", "guru", "kurikulum", "kepsek"],
  mapel: ["admin", "kurikulum", "kepsek"],
  material: ["admin", "guru", "siswa"],
  tasks: ["admin", "guru", "siswa"],
  announcements: ["admin", "guru", "siswa", "kurikulum", "kepsek"],
  grades: ["admin", "guru", "siswa", "kurikulum", "kepsek"],
  attendance: ["admin", "guru", "kepsek"],
  schedules: ["admin", "guru", "siswa", "kurikulum", "kepsek"],
  reports: ["admin", "kurikulum", "kepsek"],
  actions: ["admin", "kepsek"],
};

function authorize(collection: string, role: string, write = false) {
  const readers = readRoles[collection] ?? [];
  if (!readers.includes(role)) return false;
  if (!write) return true;

  if (["users", "guru", "siswa", "kelas", "mapel"].includes(collection)) return role === "admin";
  if (["material", "tasks"].includes(collection)) return ["admin", "guru"].includes(role);
  if (collection === "grades") return ["admin", "guru", "kurikulum"].includes(role);
  if (collection === "attendance") return ["admin", "guru"].includes(role);
  if (collection === "schedules") return role === "admin";
  if (collection === "reports") return ["admin", "kurikulum"].includes(role);
  if (collection === "announcements") return ["admin", "guru", "kurikulum"].includes(role);
  return false;
}

function errorMessage(error: unknown, fallback: string) {
  return process.env.NODE_ENV === "development" && error instanceof Error
    ? error.message
    : fallback;
}

export async function GET(_request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;
    if (!isCollectionName(collection)) return NextResponse.json({ error: "Collection tidak diizinkan." }, { status: 404 });
    const session = await getSession();
    if (!session || !authorize(collection, session.role)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

    const data = await listCollection(collection);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/data error", error);
    return NextResponse.json(
      { error: errorMessage(error, "Gagal mengambil data dari MongoDB.") },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;
    if (!isCollectionName(collection)) return NextResponse.json({ error: "Collection tidak diizinkan." }, { status: 404 });

    const session = await getSession();
    if (!session || !authorize(collection, session.role, true)) {
      return NextResponse.json({ error: "Kamu tidak memiliki izin mengubah data ini." }, { status: 403 });
    }

    if (collection === "actions") {
      return NextResponse.json({ error: "Gunakan endpoint activity untuk activity log." }, { status: 405 });
    }

    const body = await request.json() as { data?: unknown };
    if (!Array.isArray(body.data)) {
      return NextResponse.json(
        { error: "Payload harus berupa array pada properti data." },
        { status: 400 },
      );
    }

    const data = await replaceCollection(collection, body.data as Record<string, unknown>[]);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("PUT /api/data error", error);
    return NextResponse.json(
      { error: errorMessage(error, "Gagal menyimpan data ke MongoDB.") },
      { status: 500 },
    );
  }
}
