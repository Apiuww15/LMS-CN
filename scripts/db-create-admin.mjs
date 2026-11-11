import { MongoClient } from "mongodb";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const scryptAsync = promisify(scrypt);
const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "educn_lms";
if (!uri) throw new Error("MONGODB_URI belum tersedia di .env.local");
if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) throw new Error("MONGODB_URI harus diawali mongodb:// atau mongodb+srv://");

const rl = createInterface({ input, output });
const nama = (await rl.question("Nama Admin: ")).trim();
const email = (await rl.question("Email Admin: ")).trim().toLowerCase();
const password = await rl.question("Password Admin: ");
rl.close();
if (!nama || !email || !password) throw new Error("Nama, email, dan password wajib diisi.");

const salt = randomBytes(16).toString("hex");
const key = (await scryptAsync(password, salt, 64)).toString("hex");
const passwordHash = `${salt}:${key}`;
const userId = `usr-${Date.now()}`;
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);
  await db.collection("users").updateOne(
    { email },
    { $set: { id: userId, nama, email, role: "Admin", status: "Aktif", createdAt: new Date().toISOString() } },
    { upsert: true },
  );
  await db.collection("auth_accounts").updateOne(
    { email },
    { $set: { email, role: "admin", userId, status: "Aktif", passwordHash, updatedAt: new Date() }, $setOnInsert: { id: `acc-${userId}`, createdAt: new Date() } },
    { upsert: true },
  );
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("auth_accounts").createIndex({ email: 1 }, { unique: true });
  console.log(`Admin ${email} berhasil dibuat/diubah.`);
} finally {
  await client.close();
}
