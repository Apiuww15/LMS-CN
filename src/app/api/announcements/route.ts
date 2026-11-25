import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const writers = ["admin"];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    if (!writers.includes(session.role)) return NextResponse.json({ error: "Role ini tidak diizinkan membuat pengumuman." }, { status: 403 });
    const body = await request.json() as { id?: string; judul?: string; isi?: string; audience?: string; attachments?: { fileId: string; fileName: string; contentType: string; size: number }[] };
    const id = String(body.id ?? "").trim();
    const judul = String(body.judul ?? "").trim();
    const isi = String(body.isi ?? "").trim();
    const audience = String(body.audience ?? "Semua");
    if (!id || id.length > 180 || !judul || judul.length > 180 || !isi || isi.length > 12000) return NextResponse.json({ error: "ID, judul, dan isi pengumuman wajib diisi dengan batas panjang yang sesuai." }, { status: 400 });
    if (!["Semua", "Guru", "Siswa"].includes(audience)) return NextResponse.json({ error: "Target pengumuman tidak valid." }, { status: 400 });
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    if (attachments.length > 12) return NextResponse.json({ error: "Maksimal 12 lampiran per pengumuman." }, { status: 400 });
    const db = await getDb();
    if (await db.collection("announcements").findOne({ id })) return NextResponse.json({ error: "ID pengumuman sudah digunakan." }, { status: 409 });
    const safeAttachments: { fileId: string; fileName: string; contentType: string; size: number }[] = [];
    for (const file of attachments) {
      if (!ObjectId.isValid(String(file.fileId ?? ""))) return NextResponse.json({ error: "ID lampiran tidak valid." }, { status: 400 });
      const stored = await db.collection("educn_files.files").findOne({ _id: new ObjectId(file.fileId), "metadata.purpose": "announcement", "metadata.announcementId": id, "metadata.ownerId": session.userId, "metadata.audience": audience });
      if (!stored) return NextResponse.json({ error: "Lampiran belum selesai diunggah atau bukan milik pengumuman ini." }, { status: 400 });
      safeAttachments.push({ fileId: String(stored._id), fileName: String(stored.metadata?.originalName ?? stored.filename ?? "lampiran"), contentType: String(stored.metadata?.contentType ?? "application/octet-stream"), size: Number(stored.length ?? 0) });
    }
    const row = { id, judul, isi, audience, tanggal: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }), status: "Terbit", attachments: safeAttachments, createdBy: session.userId, createdByRole: session.role, createdAt: new Date() };
    await db.collection("announcements").insertOne(row);
    return NextResponse.json({ data: row }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/announcements error", error);
    return NextResponse.json({ error: "Gagal menyimpan pengumuman." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    if (!writers.includes(session.role)) return NextResponse.json({ error: "Role ini tidak diizinkan menghapus pengumuman." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) return NextResponse.json({ error: "ID pengumuman wajib diisi." }, { status: 400 });
    const db = await getDb();
    const announcement = await db.collection("announcements").findOne({ id });
    if (!announcement) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    if (session.role === "guru" && String(announcement.createdBy ?? "") !== session.userId) return NextResponse.json({ error: "Guru hanya dapat menghapus pengumuman yang dibuat sendiri." }, { status: 403 });
    const attachments = Array.isArray(announcement.attachments) ? announcement.attachments as { fileId?: string }[] : [];
    for (const file of attachments) {
      if (file.fileId && ObjectId.isValid(file.fileId)) {
        await db.collection("educn_files.files").deleteOne({ _id: new ObjectId(file.fileId), "metadata.announcementId": id });
        await db.collection("educn_files.chunks").deleteMany({ files_id: new ObjectId(file.fileId) });
      }
    }
    await db.collection("announcements").deleteOne({ id });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("DELETE /api/announcements error", error);
    return NextResponse.json({ error: "Gagal menghapus pengumuman." }, { status: 500 });
  }
}
