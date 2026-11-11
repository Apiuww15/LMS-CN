import { NextResponse } from "next/server";
import { appendAction } from "@/lib/server-data";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    const body = await request.json();
    const title = String(body.title ?? "Aksi sistem");
    const detail = String(body.detail ?? "");
    const time = String(body.time ?? new Date().toISOString());
    await appendAction({ id: crypto.randomUUID(), title, detail, time });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/activity error", error);
    return NextResponse.json({ error: "Gagal mencatat aktivitas." }, { status: 500 });
  }
}
