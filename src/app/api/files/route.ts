import { NextResponse } from "next/server";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const blockedExtensions = new Set([
  "exe", "dll", "msi", "bat", "cmd", "com", "scr", "ps1", "sh", "bash",
  "vbs", "vbe", "wsf", "wsh", "jar", "class", "apk", "dmg", "app", "deb", "rpm",
]);


function safeName(value: string) {
  return value.replace(/[\\r\\n"]/g, "_").replace(/[^\p{L}\p{N}._() -]/gu, "_").slice(0, 180) || "file";
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    const purpose = String(form.get("purpose") ?? "");
    const taskId = String(form.get("taskId") ?? "");
    const recordId = String(form.get("recordId") ?? "");

    if (!(file instanceof File)) return NextResponse.json({ error: "Pilih file yang akan diunggah." }, { status: 400 });
    if (!["material", "task", "submission"].includes(purpose)) return NextResponse.json({ error: "Jenis unggahan tidak valid." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Ukuran file harus antara 1 byte dan 50 MB." }, { status: 413 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (blockedExtensions.has(ext)) return NextResponse.json({ error: "File executable atau script tidak diizinkan untuk keamanan akun sekolah." }, { status: 415 });

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "educn_files" });

    let metadata: Record<string, unknown> = {
      purpose, ownerId: session.userId, ownerEmail: session.email, role: session.role,
      uploadedAt: new Date(), originalName: safeName(file.name), contentType: file.type || "application/octet-stream",
    };

    if (purpose === "submission") {
      if (session.role !== "siswa" || !taskId) return NextResponse.json({ error: "Hanya siswa yang dapat mengumpulkan tugas." }, { status: 403 });
      const profile = await db.collection("siswa").findOne({ $or: [{ userId: session.userId }, { email: session.email }] });
      if (!profile) return NextResponse.json({ error: "Profil siswa tidak ditemukan." }, { status: 403 });
      const task = await db.collection("tasks").findOne({ id: taskId, kelas: String(profile.kelas ?? "") });
      if (!task) return NextResponse.json({ error: "Tugas tidak ditemukan untuk kelas kamu." }, { status: 404 });
      if (task.deadline) {
        const due = new Date(String(task.deadline));
        if (!Number.isNaN(due.getTime())) {
          due.setHours(23, 59, 59, 999);
          if (due.getTime() < Date.now()) return NextResponse.json({ error: "Batas pengumpulan tugas sudah lewat." }, { status: 409 });
        }
      }
      metadata = { ...metadata, taskId, studentUserId: session.userId, studentName: session.nama, nis: String(profile.nis ?? ""), kelas: String(profile.kelas ?? "") };
    } else {
      if (!["guru", "admin"].includes(session.role)) return NextResponse.json({ error: "Hanya guru/admin yang dapat mengunggah materi atau lampiran tugas." }, { status: 403 });
      metadata = { ...metadata, recordId };
    }

    const upload = bucket.openUploadStream(safeName(file.name), { metadata });
    const bytes = Buffer.from(await file.arrayBuffer());
    await new Promise<void>((resolve, reject) => {
      upload.once("finish", () => resolve());
      upload.once("error", reject);
      upload.end(bytes);
    });

    const fileId = String(upload.id);
    if (purpose === "submission") {
      const now = new Date().toISOString();
      await db.collection("submissions").updateOne(
        { taskId, studentUserId: session.userId },
        { $set: {
          id: `submission-${taskId}-${session.userId}`, taskId, studentUserId: session.userId,
          studentName: session.nama, nis: String(metadata.nis ?? ""), kelas: String(metadata.kelas ?? ""),
          fileId, fileName: safeName(file.name), submittedAt: now, status: "Dikumpulkan",
        } },
        { upsert: true },
      );
    }
    return NextResponse.json({ fileId, fileName: safeName(file.name), size: file.size, contentType: file.type }, { status: 201 });
  } catch (error) {
    console.error("POST /api/files error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal mengunggah file." }, { status: 500 });
  }
}


export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    const url = new URL(request.url);
    const fileIdValue = url.searchParams.get("id");
    const inline = url.searchParams.get("inline") === "1";
    if (!fileIdValue || !ObjectId.isValid(fileIdValue)) return NextResponse.json({ error: "ID file tidak valid." }, { status: 400 });

    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "educn_files" });
    const fileId = new ObjectId(fileIdValue);
    const fileDoc = await db.collection("educn_files.files").findOne({ _id: fileId });
    if (!fileDoc) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 404 });

    const meta = (fileDoc.metadata ?? {}) as Record<string, unknown>;
    const purpose = String(meta.purpose ?? "");
    let allowed = ["admin", "kurikulum", "kepsek"].includes(session.role);

    if (purpose === "submission") {
      allowed = allowed || (session.role === "siswa" && meta.studentUserId === session.userId);
      if (session.role === "guru") {
        const task = await db.collection("tasks").findOne({ id: String(meta.taskId), $or: [{ ownerId: session.userId }, { createdBy: session.userId }, { guruId: session.userId }] });
        allowed = Boolean(task);
      }
    } else if (purpose === "material" || purpose === "task") {
      const recordCollection = purpose === "material" ? "material" : "tasks";
      const record = await db.collection(recordCollection).findOne({ fileId: fileIdValue });
      if (record) {
        if (session.role === "guru") allowed = allowed || record.ownerId === session.userId || record.createdBy === session.userId || record.guruId === session.userId;
        if (session.role === "siswa") {
          const profile = await db.collection("siswa").findOne({ $or: [{ userId: session.userId }, { email: session.email }] });
          allowed = allowed || Boolean(profile && String(record.kelas ?? "") === String(profile.kelas ?? ""));
        }
        if (session.role === "admin") allowed = true;
      }
    }

    if (!allowed) return NextResponse.json({ error: "Kamu tidak memiliki akses ke file ini." }, { status: 403 });

    const stream = bucket.openDownloadStream(fileId);
    const webStream = Readable.toWeb(stream) as ReadableStream;
    const filename = safeName(String(meta.originalName ?? fileDoc.filename ?? "download"));
    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    const previewMime: Record<string, string> = {
      pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      gif: "image/gif", webp: "image/webp", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
    };
    const safeInline = inline && Boolean(previewMime[extension]);
    return new Response(webStream, {
      headers: {
        "Content-Type": safeInline ? previewMime[extension] : String(meta.contentType ?? "application/octet-stream"),
        "Content-Length": String(fileDoc.length),
        "Content-Disposition": `${safeInline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/files error", error);
    return NextResponse.json({ error: "Gagal mengambil file." }, { status: 500 });
  }
}
