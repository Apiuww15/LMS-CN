import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { listCollection, type CollectionName } from "@/lib/server-data";

const allowedRoles = new Set(["admin", "guru", "siswa", "kurikulum", "kepsek"]);

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !allowedRoles.has(session.role)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const names = ["users", "guru", "siswa", "kelas", "mapel", "material", "tasks", "announcements", "grades", "attendance", "schedules", "reports", "actions"] as const;
    let counts: Record<(typeof names)[number], number>;
    let activeSiswa = 0;
    let activeGuru = 0;
    let activeUsers = 0;
    let avgGrade = 0;

    if (session.role === "guru" || session.role === "siswa") {
      const visibleNames: CollectionName[] = session.role === "guru"
        ? ["kelas", "siswa", "material", "tasks", "announcements", "grades", "attendance", "schedules"]
        : ["kelas", "siswa", "material", "tasks", "announcements", "grades", "schedules"];
      const visible = await Promise.all(visibleNames.map(async (name) => [name, await listCollection(name, session)] as const));
      const byName = Object.fromEntries(visible) as Partial<Record<CollectionName, Record<string, unknown>[]>>;
      counts = Object.fromEntries(names.map((name) => [name, byName[name]?.length ?? 0])) as Record<(typeof names)[number], number>;
      activeSiswa = (byName.siswa ?? []).filter((row) => row.status === "Aktif").length;
      const gradeRows = byName.grades ?? [];
      const grades = gradeRows.map((row) => Number(row.akhir)).filter(Number.isFinite);
      avgGrade = grades.length ? Number((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1)) : 0;
    } else {
      const db = await getDb();
      const entries = await Promise.all(names.map(async (name) => [name, await db.collection(name).countDocuments()] as const));
      counts = Object.fromEntries(entries) as Record<(typeof names)[number], number>;
      const [siswaCount, guruCount, userCount] = await Promise.all([
        db.collection("siswa").countDocuments({ status: "Aktif" }),
        db.collection("guru").countDocuments({ status: "Aktif" }),
        db.collection("users").countDocuments({ status: "Aktif" }),
      ]);
      activeSiswa = siswaCount;
      activeGuru = guruCount;
      activeUsers = userCount;
      const gradeAgg = await db.collection("grades").aggregate([
        { $group: { _id: null, avg: { $avg: "$akhir" } } },
      ]).toArray();
      avgGrade = typeof gradeAgg[0]?.avg === "number" ? Number(gradeAgg[0].avg.toFixed(1)) : 0;
    }

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      role: session.role,
      counts: { ...counts, activeSiswa, activeGuru, activeUsers },
      metrics: { avgGrade },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/summary error", error);
    return NextResponse.json({ error: "Gagal membaca ringkasan MongoDB." }, { status: 500 });
  }
}
