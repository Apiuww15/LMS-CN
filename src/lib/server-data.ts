import { getDb, getMongoClient } from "./mongodb";
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

export const COLLECTIONS = [
  "users",
  "guru",
  "siswa",
  "kelas",
  "mapel",
  "material",
  "tasks",
  "announcements",
  "grades",
  "attendance",
  "schedules",
  "reports",
  "actions",
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export function isCollectionName(value: string): value is CollectionName {
  return (COLLECTIONS as readonly string[]).includes(value);
}

function sanitizeDoc(doc: Record<string, unknown>) {
  const { _id, passwordHash, password, ...safe } = doc;
  void passwordHash;
  void password;
  return safe;
}

export async function listCollection(name: CollectionName) {
  const db = await getDb();
  const docs = await db
    .collection(name)
    .find({}, { projection: { passwordHash: 0, password: 0 } })
    .sort({ _id: -1 })
    .toArray();

  return docs.map((doc) => sanitizeDoc(doc as Record<string, unknown>));
}

const roleMap: Record<string, "admin" | "guru" | "siswa" | "kurikulum" | "kepsek"> = {
  Admin: "admin",
  Guru: "guru",
  Siswa: "siswa",
  Kurikulum: "kurikulum",
  Kepsek: "kepsek",
};

function roleToAuthRole(value: unknown) {
  return roleMap[String(value ?? "Siswa")] ?? "siswa";
}

function formatCreatedAt(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function replaceCollection(
  name: CollectionName,
  rows: Record<string, unknown>[],
) {
  const db = await getDb();
  const collection = db.collection(name);

  if (name !== "users") {
    const normalized: Record<string, unknown>[] = rows.map(
      (row): Record<string, unknown> => ({
        ...row,
        id: String(row.id ?? randomUUID()),
      }),
    );

    await collection.deleteMany({});
    if (normalized.length > 0) {
      await collection.insertMany(normalized);
    }
    return normalized;
  }

  /*
   * User management is special because one UI save updates both
   * users and auth_accounts. We validate everything BEFORE mutating,
   * then use a MongoDB transaction so a failed account sync does not
   * leave users half-saved.
   */
  const existingUsers = (await collection.find({}).toArray()).map(
    (doc) => doc as Record<string, unknown>,
  );

  const accountsCollection = db.collection("auth_accounts");
  const existingAccounts = (await accountsCollection.find({}).toArray()).map(
    (doc) => doc as Record<string, unknown>,
  );

  const normalized: Record<string, unknown>[] = rows.map(
    (row): Record<string, unknown> => ({
      ...row,
      id: String(row.id ?? randomUUID()),
      email: normalizeEmail(row.email),
      createdAt: formatCreatedAt(row.createdAt),
    }),
  );

  const emails = normalized
    .map((row) => String(row.email ?? ""))
    .filter(Boolean);

  const badEmail = emails.find((email) => !isValidEmail(email));
  if (badEmail) {
    throw new Error(`Format email tidak valid: ${badEmail}`);
  }

  const duplicateEmails = emails.filter(
    (email, index) => emails.indexOf(email) !== index,
  );
  if (duplicateEmails.length > 0) {
    throw new Error(
      `Email pengguna duplikat: ${[...new Set(duplicateEmails)].join(", ")}`,
    );
  }

  const existingUserIds = new Set(
    existingUsers.map((row) => String(row.id ?? "")),
  );

  const existingUserByEmail = new Map<string, Record<string, unknown>>();
  for (const user of existingUsers) {
    const email = normalizeEmail(user.email);
    if (email) existingUserByEmail.set(email, user);
  }

  const accountByUserId = new Map<string, Record<string, unknown>>();
  const accountByEmail = new Map<string, Record<string, unknown>>();
  for (const account of existingAccounts) {
    const userId = String(account.userId ?? "");
    const email = normalizeEmail(account.email);
    if (userId) accountByUserId.set(userId, account);
    if (email) accountByEmail.set(email, account);
  }

  for (const row of normalized) {
    const userId = String(row.id);
    const email = String(row.email ?? "");
    const password = typeof row.password === "string" ? row.password.trim() : "";
    const existingUser = existingUserByEmail.get(email);

    if (existingUser && String(existingUser.id) !== userId) {
      throw new Error(`Email ${email} sudah digunakan pengguna lain.`);
    }

    const existingAccount = accountByUserId.get(userId) ?? accountByEmail.get(email);
    const isNewUser = !existingUserIds.has(userId);

    if (isNewUser && !existingAccount && !password) {
      throw new Error(`Password wajib diisi untuk akun baru: ${email}`);
    }
  }

  const safeRows = normalized.map((row) => {
    const { password, passwordHash, ...safe } = row;
    void password;
    void passwordHash;
    return safe;
  });

  const preparedAccounts: Array<Record<string, unknown>> = [];

  for (const row of normalized) {
    const userId = String(row.id);
    const email = String(row.email ?? "");
    const role = roleToAuthRole(row.role);
    const status = String(row.status ?? "Aktif");
    const password = typeof row.password === "string" ? row.password.trim() : "";
    const existingAccount = accountByUserId.get(userId) ?? accountByEmail.get(email);

    const passwordHash = password
      ? await hashPassword(password)
      : typeof existingAccount?.passwordHash === "string"
        ? existingAccount.passwordHash
        : undefined;

    preparedAccounts.push({
      id: String(existingAccount?.id ?? `acc-${userId}`),
      userId,
      email,
      role,
      status,
      passwordHash,
      createdAt: existingAccount?.createdAt ?? new Date(),
      updatedAt: new Date(),
      existingId: existingAccount?._id,
    });
  }

  const client = await getMongoClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      await collection.deleteMany({}, { session });
      if (safeRows.length > 0) {
        await collection.insertMany(safeRows, { session });
      }

      const userIds = normalized.map((row) => String(row.id));

      if (userIds.length > 0) {
        await accountsCollection.deleteMany(
          { userId: { $nin: userIds } },
          { session },
        );
      } else {
        await accountsCollection.deleteMany({}, { session });
      }

      for (const account of preparedAccounts) {
        const { existingId, ...accountDoc } = account;
        if (existingId) {
          await accountsCollection.updateOne(
            { _id: existingId },
            { $set: accountDoc },
            { session },
          );
        } else if (accountDoc.passwordHash) {
          await accountsCollection.insertOne(accountDoc, { session });
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return safeRows;
}

export async function appendAction(action: {
  id: string;
  title: string;
  detail: string;
  time: string;
}) {
  const db = await getDb();
  const actions = db.collection("actions");
  await actions.insertOne(action);

  const old = await actions
    .find({}, { projection: { _id: 1 } })
    .sort({ _id: -1 })
    .skip(100)
    .toArray();

  if (old.length > 0) {
    await actions.deleteMany({
      _id: { $in: old.map((item) => item._id) },
    });
  }
}

const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, "hex");

  return (
    expected.length === derived.length &&
    timingSafeEqual(expected, derived)
  );
}

export { verifyPassword };
