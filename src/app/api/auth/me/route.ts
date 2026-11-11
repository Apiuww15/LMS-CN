import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: session });
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });

    const body = await request.json() as { nama?: unknown; telepon?: unknown };
    const nome = String(body.nama ?? "").trim();
    const telepon = String(body.telepon ?? "").trim();
    if (!nome) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });

    const db = await getDb();
    const result = await db.collection("users").findOneAndUpdate(
      { id: session.userId },
      { $set: { nama: nome, telepon } },
      { returnDocument: "after", projection: { _id: 0, passwordHash: 0 } },
    );

    if (!result) return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true, user: result });
  } catch (error) {
    console.error("PATCH /api/auth/me error", error);
    return NextResponse.json({ error: "Profil gagal diperbarui." }, { status: 500 });
  }
}
