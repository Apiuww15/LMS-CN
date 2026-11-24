import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ id: session.userId }, { projection: { _id: 0, passwordHash: 0, password: 0 } });
    const rawRole = String(user?.role ?? session.role).trim().toLowerCase();
    const roleAliases: Record<string, string> = {
      admin: "admin", administrator: "admin", "administrator sekolah": "admin",
      guru: "guru", teacher: "guru",
      siswa: "siswa", student: "siswa",
      kurikulum: "kurikulum", curriculum: "kurikulum",
      kepsek: "kepsek", "kepala sekolah": "kepsek", principal: "kepsek",
    };
    const role = roleAliases[rawRole] ?? String(session.role).trim().toLowerCase();
    const profileCollection = role === "guru" ? "guru" : role === "siswa" ? "siswa" : null;
    const profile = profileCollection ? await db.collection(profileCollection).findOne({ $or: [{ userId: session.userId }, { email: session.email }, { id: session.userId }] }, { projection: { _id: 0, passwordHash: 0, password: 0 } }) : null;
    const classId = role === "guru" ? String(profile?.waliKelasId ?? user?.waliKelasId ?? "") : String(profile?.kelasId ?? user?.kelasId ?? "");
    const className = role === "guru" ? String(profile?.waliKelas ?? user?.waliKelas ?? "") : String(profile?.kelas ?? user?.kelas ?? "");
    const classDoc = classId ? await db.collection("kelas").findOne({ id: classId }, { projection: { _id: 0 } }) : className ? await db.collection("kelas").findOne({ nama: className }, { projection: { _id: 0 } }) : null;
    const resolvedClassName = String(classDoc?.nama ?? className ?? "");
    const studentCount = classDoc ? await db.collection("siswa").countDocuments({ $or: [{ kelasId: String(classDoc.id) }, { kelas: resolvedClassName }] }) : 0;
    const mapelIds = Array.isArray(profile?.mapelIds) ? profile.mapelIds.map(String) : (profile?.mapelId ? [String(profile.mapelId)] : []);
    const mapelOptions = mapelIds.length ? await db.collection("mapel").find({ id: { $in: mapelIds } }, { projection: { _id: 0, id: 1, nama: 1, kode: 1 } }).toArray() : [];
    return NextResponse.json({ authenticated: true, user: {
      ...session, ...(user ?? {}), role,
      kelasId: String(classDoc?.id ?? classId), kelas: resolvedClassName,
      jurusan: String(classDoc?.jurusan ?? profile?.jurusan ?? user?.jurusan ?? ""),
      waliKelas: String(classDoc?.wali ?? (role === "guru" ? profile?.nama ?? session.nama : "")),
      jumlahSiswa: Number(studentCount),
      mapelIds, mapelOptions,
      avatarFileId: String(user?.avatarFileId ?? profile?.avatarFileId ?? ""),
    } });
  } catch (error) {
    console.error("GET /api/auth/me error", error);
    return NextResponse.json({ authenticated: true, user: session });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Belum login." }, { status: 401 });
    const body = await request.json() as { nama?: unknown; telepon?: unknown; avatarFileId?: unknown };
    const nama = String(body.nama ?? "").trim();
    const telepon = String(body.telepon ?? "").trim();
    const avatarFileId = body.avatarFileId === undefined ? undefined : String(body.avatarFileId ?? "").trim();
    if (!nama) return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    const db = await getDb();
    if (avatarFileId) {
      if (!ObjectId.isValid(avatarFileId)) return NextResponse.json({ error: "File foto profil tidak valid." }, { status: 400 });
      const file = await db.collection("educn_files.files").findOne({ _id: new ObjectId(avatarFileId), "metadata.ownerId": session.userId, "metadata.purpose": "profile" });
      if (!file) return NextResponse.json({ error: "Foto profil tidak ditemukan atau bukan milik akun ini." }, { status: 403 });
    }
    const set: Record<string, unknown> = { nama, telepon };
    if (avatarFileId !== undefined) set.avatarFileId = avatarFileId;
    const result = await db.collection("users").findOneAndUpdate({ id: session.userId }, { $set: set }, { returnDocument: "after", projection: { _id: 0, passwordHash: 0, password: 0 } });
    if (!result) return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 });
    const profileCollection = session.role === "guru" ? "guru" : session.role === "siswa" ? "siswa" : null;
    if (profileCollection) await db.collection(profileCollection).updateOne({ userId: session.userId }, { $set: { nama, telepon, ...(avatarFileId !== undefined ? { avatarFileId } : {}) } });
    return NextResponse.json({ ok: true, user: result });
  } catch (error) {
    console.error("PATCH /api/auth/me error", error);
    return NextResponse.json({ error: "Profil gagal diperbarui." }, { status: 500 });
  }
}
