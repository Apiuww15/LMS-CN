import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { importProfiles, importUsers } from "@/lib/server-data";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Hanya administrator yang dapat mengimpor data." }, { status: 403 });
    }
    const body = await request.json() as { collection?: string; rows?: Record<string, unknown>[] };
    if (body.collection !== "guru" && body.collection !== "siswa" && body.collection !== "pengguna") {
      return NextResponse.json({ error: "Jenis impor tidak valid." }, { status: 400 });
    }
    if (!Array.isArray(body.rows)) {
      return NextResponse.json({ error: "Data Excel tidak valid." }, { status: 400 });
    }
    const data = body.collection === "pengguna"
      ? await importUsers(body.rows, session)
      : await importProfiles(body.collection, body.rows, session);
    return NextResponse.json({ ok: true, imported: data.length, data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/data/import error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Impor Excel gagal." }, { status: 400 });
  }
}
