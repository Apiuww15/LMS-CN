import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";

const allowedRoles = new Set(["admin", "guru", "siswa", "kurikulum", "kepsek"]);

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !allowedRoles.has(session.role)) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const db = await getDb();
    const names = ["users", "guru", "siswa", "kelas", "mapel", "material", "tasks", "announcements", "grades", "attendance", "schedules", "reports", "actions"] as const;
    const entries = await Promise.all(names.map(async (name) => [name, await db.collection(name).countDocuments()] as const));
    const counts = Object.fromEntries(entries) as Record<(typeof names)[number], number>;

    const [activeSiswa, activeGuru, activeUsers] = await Promise.all([
      db.collection("siswa").countDocuments({ status: "Aktif" }),
      db.collection("guru").countDocuments({ status: "Aktif" }),
      db.collection("users").countDocuments({ status: "Aktif" }),
    ]);

    const gradeAgg = await db.collection("grades").aggregate([
      { $group: { _id: null, avg: { $avg: "$akhir" } } },
    ]).toArray();

    const avgGrade = typeof gradeAgg[0]?.avg === "number" ? Number(gradeAgg[0].avg.toFixed(1)) : 0;

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
