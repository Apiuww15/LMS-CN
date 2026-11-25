import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["admin", "guru"].includes(session.role)) return NextResponse.json({ error: "Hanya Admin atau Guru yang dapat menambahkan jadwal." }, { status: 403 });
    const body = await request.json() as { hari?: unknown; jamMulai?: unknown; jamSelesai?: unknown; kelasId?: unknown; mapelId?: unknown; guruId?: unknown };
    const hari = String(body.hari ?? "").trim(); const jamMulai = String(body.jamMulai ?? "").trim(); const jamSelesai = String(body.jamSelesai ?? "").trim();
    const kelasId = String(body.kelasId ?? "").trim(); const mapelId = String(body.mapelId ?? "").trim();
    if (!hari || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamMulai) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(jamSelesai) || jamMulai >= jamSelesai || !kelasId || !mapelId) return NextResponse.json({ error: "Hari, rentang jam, kelas, dan mata pelajaran harus diisi dengan benar." }, { status: 400 });
    const db = await getDb();
    const kelas = await db.collection("kelas").findOne({ id: kelasId });
    const mapel = await db.collection("mapel").findOne({ id: mapelId });
    if (!kelas || !mapel) return NextResponse.json({ error: "Kelas atau mata pelajaran tidak ditemukan. Pilih data yang sudah dibuat." }, { status: 404 });
    let teacher: any;
    if (session.role === "guru") {
      teacher = await db.collection("guru").findOne({ $or: [{ userId: session.userId }, { email: session.email }] });
      if (!teacher) return NextResponse.json({ error: "Profil guru tidak ditemukan." }, { status: 404 });
      const teacherClassId = String(teacher.waliKelasId ?? "");
      if (!teacherClassId || teacherClassId !== kelasId) return NextResponse.json({ error: "Jadwal Guru hanya dapat dibuat untuk kelas yang menjadi Wali Kelas-nya." }, { status: 403 });
    } else {
      const guruId = String(body.guruId ?? "").trim();
      teacher = await db.collection("guru").findOne({ id: guruId });
      if (!teacher) return NextResponse.json({ error: "Pilih guru dari data Guru yang sudah dibuat." }, { status: 400 });
    }
    const teacherProfileId = String(teacher.id ?? "");
    const teacherUserId = String(teacher.userId ?? teacher.id ?? "");
    const assignments = Array.isArray(teacher.teachingAssignments) ? teacher.teachingAssignments : [];
    const hasExactAssignment = assignments.some((assignment: any) => String(assignment.mapelId) === mapelId && Array.isArray(assignment.kelasIds) && assignment.kelasIds.map(String).includes(kelasId));
    if (!hasExactAssignment) return NextResponse.json({ error: "Guru tersebut belum ditugaskan untuk mata pelajaran dan kelas yang dipilih. Periksa penugasan guru." }, { status: 400 });
    const jam = `${jamMulai} - ${jamSelesai}`;
    const duplicate = await db.collection("schedules").findOne({ hari, kelasId, jamMulai, jamSelesai });
    if (duplicate) return NextResponse.json({ error: "Jadwal pada kelas, hari, dan jam tersebut sudah ada." }, { status: 409 });
    const record = { id: randomUUID(), hari, jam, jamMulai, jamSelesai, kelasId, kelas: String(kelas.nama ?? kelas.namaKelas ?? ""), mapelId, mapel: String(mapel.nama ?? ""), guruId: teacherUserId, guruProfileId: teacherProfileId, guru: String(teacher.nama ?? ""), createdBy: session.userId, createdAt: new Date().toISOString() };
    await db.collection("schedules").insertOne(record);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("POST /api/schedules error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan jadwal." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["admin", "guru"].includes(session.role)) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
    const db = await getDb();
    const filter: Record<string, unknown> = { id };
    if (session.role === "guru") {
      const profile = await db.collection("guru").findOne({ $or: [{ userId: session.userId }, { email: session.email }] });
      const waliKelasId = String(profile?.waliKelasId ?? "");
      if (!waliKelasId) return NextResponse.json({ error: "Akun ini belum memiliki kelas wali." }, { status: 403 });
      filter.kelasId = waliKelasId;
    }
    const result = await db.collection("schedules").deleteOne(filter as any);
    if (!result.deletedCount) return NextResponse.json({ error: "Jadwal tidak ditemukan atau bukan milik kelas yang diizinkan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/schedules error", error);
    return NextResponse.json({ error: "Jadwal gagal dihapus." }, { status: 500 });
  }
}
