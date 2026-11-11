import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "educn_lms";
if (!uri) throw new Error("MONGODB_URI belum tersedia di .env.local");

const collections = ["users", "guru", "siswa", "kelas", "mapel", "material", "tasks", "announcements", "grades", "attendance", "schedules", "reports", "actions", "auth_accounts"];
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);
  for (const name of collections) {
    await db.collection(name).deleteMany({});
  }
  console.log(`Database ${dbName} sudah dikosongkan. Semua data operasional = 0.`);
} finally {
  await client.close();
}
