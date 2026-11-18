import { getDb, getMongoClient } from "./mongodb";
import { GridFSBucket, ObjectId } from "mongodb";
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
  "submissions",
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

type RequestSession = {
  userId: string;
  email: string;
  role: "admin" | "guru" | "siswa" | "kurikulum" | "kepsek";
  nama: string;
};

async function getProfile(db: Awaited<ReturnType<typeof getDb>>, collection: "guru" | "siswa", session: RequestSession) {
  return db.collection(collection).findOne({
    $or: [{ userId: session.userId }, { email: session.email }, { id: session.userId }],
  });
}

/**
 * Return only records the signed-in account is allowed to see.
 * School-wide read access is reserved for admin/kurikulum/kepsek.
 */
async function getReadFilter(name: CollectionName, session: RequestSession): Promise<Record<string, unknown>> {
  if (["admin", "kurikulum", "kepsek"].includes(session.role)) return {};

  const db = await getDb();
  if (session.role === "guru") {
    const profile = await getProfile(db, "guru", session);
    const assignedClasses = Array.isArray(profile?.kelas)
      ? profile.kelas.map((value: unknown) => String(value).trim()).filter(Boolean)
      : String(profile?.kelas ?? "").split(",").map((value: string) => value.trim()).filter(Boolean);
    const ownContent = {
      $or: [
        { ownerId: session.userId }, { createdBy: session.userId },
        { guruId: session.userId }, { userId: session.userId },
        { ownerEmail: session.email }, { guruEmail: session.email },
      ],
    };

    // Guru boleh melihat kelas yang memang ditugaskan kepadanya, bukan
    // kelas milik guru lain hanya karena nama guru/wali kebetulan sama.
    if (name === "kelas") {
      return assignedClasses.length
        ? { $or: [{ waliUserId: session.userId }, { ownerId: session.userId }, { nama: { $in: assignedClasses } }] }
        : { $or: [{ waliUserId: session.userId }, { ownerId: session.userId }] };
    }
    if (name === "siswa") {
      const classes = await db.collection("kelas").find(
        assignedClasses.length
          ? { $or: [{ waliUserId: session.userId }, { ownerId: session.userId }, { nama: { $in: assignedClasses } }] }
          : { $or: [{ waliUserId: session.userId }, { ownerId: session.userId }] },
      ).toArray();
      const classNames = [...assignedClasses, ...classes.map((item) => String(item.nama ?? item.namaKelas ?? ""))].filter(Boolean);
      return classNames.length ? { kelas: { $in: [...new Set(classNames)] } } : { _id: { $exists: false } };
    }
    if (name === "submissions") {
      const ownedTasks = await db.collection("tasks").find(ownContent, { projection: { id: 1 } }).toArray();
      const taskIds = ownedTasks.map((task) => String(task.id));
      return taskIds.length ? { taskId: { $in: taskIds } } : { _id: { $exists: false } };
    }
    if (["material", "tasks", "grades", "attendance", "schedules"].includes(name)) return ownContent;
    if (name === "announcements") return {};
    return { _id: { $exists: false } };
  }

  const profile = await getProfile(db, "siswa", session);
  if (name === "siswa") {
    return { $or: [{ userId: session.userId }, { id: String(profile?.id ?? "") }] };
  }
  if (name === "kelas") {
    const className = String(profile?.kelas ?? "");
    return className ? { $or: [{ nama: className }, { namaKelas: className }] } : { _id: { $exists: false } };
  }
  if (name === "submissions") return { studentUserId: session.userId };
  if (["material", "tasks", "schedules"].includes(name)) {
    const className = String(profile?.kelas ?? "");
    return className ? { kelas: className } : { _id: { $exists: false } };
  }
  if (name === "grades" || name === "attendance") {
    const studentId = String(profile?.id ?? session.userId);
    const nis = String(profile?.nis ?? "");
    return { $or: [{ siswaId: studentId }, { siswaUserId: session.userId }, ...(nis ? [{ nis }] : [])] };
  }
  if (name === "announcements") return {};
  return { _id: { $exists: false } };
}

async function syncProfilesFromUsers(db: Awaited<ReturnType<typeof getDb>>, users: Record<string, unknown>[], mongoSession: import("mongodb").ClientSession) {
  const validIds = users.map((u) => String(u.id));
  for (const user of users) {
    const id = String(user.id);
    const email = normalizeEmail(user.email);
    const role = normalizeRoleLabel(user.role);
    const target = role === "Guru" ? "guru" : role === "Siswa" ? "siswa" : null;
    for (const collectionName of ["guru", "siswa"] as const) {
      const collection = db.collection(collectionName);
      if (collectionName !== target) {
        await collection.deleteMany({ userId: id }, { session: mongoSession });
        continue;
      }
      const old = await collection.findOne({ $or: [{ userId: id }, { email }] }, { session: mongoSession });
      const profileId = String(old?.id ?? id);
      const linkedFields: Record<string, unknown> = {
        id: profileId, userId: id, nama: String(user.nama ?? ""), email,
        status: String(user.status ?? "Aktif"),
      };
      const unsetFields: Record<string, ""> = {};
      const allowedFields = collectionName === "guru"
        ? (["nip", "mapel", "kelas"] as const)
        : (["nis", "kelas", "jurusan"] as const);
      for (const field of allowedFields) {
        if (user[field] !== undefined && user[field] !== null && user[field] !== "") linkedFields[field] = user[field];
        else unsetFields[field] = "";
      }
      await collection.updateOne(
        { $or: [{ userId: id }, { email }] },
        { $set: linkedFields, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}), $setOnInsert: { createdAt: new Date() } },
        { upsert: true, session: mongoSession },
      );
    }
  }
  // Jangan menghapus profil legacy yang belum memiliki userId; hanya unlink
  // profil yang jelas menunjuk akun yang sudah tidak ada.
  await db.collection("guru").deleteMany({ userId: { $exists: true, $nin: validIds } }, { session: mongoSession });
  await db.collection("siswa").deleteMany({ userId: { $exists: true, $nin: validIds } }, { session: mongoSession });
}

async function syncUsersFromProfiles(
  db: Awaited<ReturnType<typeof getDb>>,
  collectionName: "guru" | "siswa",
  profiles: Record<string, unknown>[],
  mongoSession: import("mongodb").ClientSession,
  cleanupOrphans = true,
) {
  const role = collectionName === "guru" ? "Guru" : "Siswa";
  const emails = profiles.map((profile) => normalizeEmail(profile.email)).filter(Boolean);
  const duplicate = emails.find((email, index) => emails.indexOf(email) !== index);
  if (duplicate) throw new Error(`Email ${role.toLowerCase()} duplikat: ${duplicate}`);

  for (const profile of profiles) {
    const requestedUserId = String(profile.userId ?? "").trim();
    const profileEmail = normalizeEmail(profile.email);
    const existingUser = await db.collection("users").findOne(
      { $or: [...(requestedUserId ? [{ id: requestedUserId }] : []), ...(profileEmail ? [{ email: profileEmail }] : [])] },
      { session: mongoSession },
    );
    const email = profileEmail || normalizeEmail(existingUser?.email);
    // Older imported profiles may have neither an email nor a linked user.
    // Keep them editable/deletable; newly created profiles are required by
    // the UI to provide a valid email before they reach this synchronization.
    if (!email) continue;
    if (!isValidEmail(email)) {
      throw new Error(`Email wajib diisi dengan format yang valid untuk data ${role.toLowerCase()}.`);
    }

    if (existingUser && normalizeRoleLabel(existingUser.role) !== role) {
      throw new Error(`Email ${email} sudah terdaftar dengan peran ${String(existingUser.role)}.`);
    }

    const accountByRequestedId = requestedUserId
      ? await db.collection("auth_accounts").findOne({ userId: requestedUserId }, { session: mongoSession })
      : null;
    const accountByEmail = await db.collection("auth_accounts").findOne({ email }, { session: mongoSession });
    const existingAccount = accountByRequestedId ?? accountByEmail;
    const userId = String(existingUser?.id ?? existingAccount?.userId ?? requestedUserId ?? randomUUID());

    if (existingUser && String(existingUser.id) !== userId) {
      throw new Error(`Email ${email} sudah digunakan pengguna lain.`);
    }
    if (existingAccount && String(existingAccount.userId) !== userId) {
      throw new Error(`Email ${email} sudah terhubung ke akun lain.`);
    }

    const suppliedPassword = typeof profile.password === "string" ? profile.password.trim() : "";
    const passwordHash = suppliedPassword
      ? await hashPassword(suppliedPassword)
      : typeof existingAccount?.passwordHash === "string"
        ? existingAccount.passwordHash
        : undefined;
    // Deleting or editing another profile must not fail just because an older
    // linked user has no auth_accounts document yet. A password is mandatory
    // only when this operation is actually creating a brand-new user record.
    if (!passwordHash && !existingUser) {
      throw new Error(`Kata sandi wajib diisi saat membuat akun ${role.toLowerCase()} baru (${email}).`);
    }

    const user = {
      id: userId,
      nama: String(profile.nama ?? existingUser?.nama ?? ""),
      email,
      role,
      status: String(profile.status ?? existingUser?.status ?? "Aktif"),
      createdAt: existingUser?.createdAt ?? formatCreatedAt(undefined),
      ...(collectionName === "guru"
        ? { nip: String(profile.nip ?? ""), mapel: String(profile.mapel ?? ""), kelas: String(profile.kelas ?? "") }
        : { nis: String(profile.nis ?? ""), kelas: String(profile.kelas ?? ""), jurusan: String(profile.jurusan ?? "") }),
    };

    await db.collection("users").updateOne(
      { id: userId },
      {
        $set: user,
        $unset: collectionName === "guru"
          ? { nis: "", jurusan: "" }
          : { nip: "", mapel: "" },
      },
      { upsert: true, session: mongoSession },
    );
    // Keep existing auth credentials intact. Only create/update an auth
    // account when a hash exists; profile deletion must never demand a new
    // password for every remaining legacy profile.
    if (passwordHash) {
      await db.collection("auth_accounts").updateOne(
        { userId },
        {
          $set: {
            id: String(existingAccount?.id ?? `acc-${userId}`),
            userId,
            email,
            role: collectionName,
            status: user.status,
            passwordHash,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, session: mongoSession },
      );
    } else if (existingAccount) {
      await db.collection("auth_accounts").updateOne(
        { userId },
        { $set: { email, role: collectionName, status: user.status, updatedAt: new Date() } },
        { session: mongoSession },
      );
    }
    await db.collection(collectionName).updateOne(
      { id: String(profile.id) },
      { $set: { userId, email }, $unset: { password: "", passwordHash: "" } },
      { session: mongoSession },
    );
    await db.collection(collectionName === "guru" ? "siswa" : "guru").deleteMany(
      { userId },
      { session: mongoSession },
    );
  }

  // Cleanup orphan accounts for full profile replacement/deletion flows.
  // Incremental Excel imports must not remove unrelated legacy accounts.
  if (!cleanupOrphans) return;
  const linkedProfiles = await db.collection(collectionName).find(
    { userId: { $exists: true, $ne: "" } },
    { session: mongoSession, projection: { userId: 1 } },
  ).toArray();
  const linkedIds = new Set(linkedProfiles.map((row) => String(row.userId)));
  const roleUsers = await db.collection("users").find(
    { role },
    { session: mongoSession, projection: { id: 1 } },
  ).toArray();
  const orphanIds = roleUsers.map((row) => String(row.id)).filter((id) => !linkedIds.has(id));
  if (orphanIds.length) {
    await db.collection("users").deleteMany({ id: { $in: orphanIds } }, { session: mongoSession });
    await db.collection("auth_accounts").deleteMany({ userId: { $in: orphanIds } }, { session: mongoSession });
  }
}



/** Import many student/teacher profiles atomically and create their login accounts. */
export async function importProfiles(
  collectionName: "guru" | "siswa",
  inputRows: Record<string, unknown>[],
  session: RequestSession,
) {
  if (session.role !== "admin") throw new Error("Hanya administrator yang dapat mengimpor data.");
  if (!Array.isArray(inputRows) || inputRows.length === 0) throw new Error("File Excel tidak berisi data.");
  if (inputRows.length > 1000) throw new Error("Maksimal 1.000 baris per sekali impor.");

  const db = await getDb();
  const role = collectionName === "guru" ? "Guru" : "Siswa";
  const idField = collectionName === "guru" ? "nip" : "nis";
  const prepared: Record<string, unknown>[] = inputRows.map((row, index) => {
    const nama = String(row.nama ?? "").trim();
    const email = normalizeEmail(row.email);
    const password = String(row.password ?? "").trim();
    const identity = String(row[idField] ?? "").trim();
    const kelas = String(row.kelas ?? "").trim();
    const status = String(row.status ?? "Aktif").trim() || "Aktif";
    if (!nama || !identity || !kelas || !email || !password) {
      throw new Error(`Baris ${index + 2}: Nama, ${idField.toUpperCase()}, email, password, dan kelas wajib diisi.`);
    }
    if (!isValidEmail(email)) throw new Error(`Baris ${index + 2}: format email ${email} tidak valid.`);
    if (password.length < 8) throw new Error(`Baris ${index + 2}: password minimal 8 karakter.`);
    if (!(["Aktif", "Non-aktif"].includes(status))) throw new Error(`Baris ${index + 2}: status harus Aktif atau Non-aktif.`);
    if (collectionName === "guru" && !String(row.mapel ?? "").trim()) throw new Error(`Baris ${index + 2}: mata pelajaran wajib diisi untuk guru.`);
    if (collectionName === "siswa" && !String(row.jurusan ?? "").trim()) throw new Error(`Baris ${index + 2}: jurusan wajib diisi untuk siswa.`);
    return {
      ...row,
      id: randomUUID(),
      nama,
      email,
      password,
      status,
      ...(collectionName === "guru"
        ? { nip: identity, mapel: String(row.mapel ?? "").trim(), kelas }
        : { nis: identity, kelas, jurusan: String(row.jurusan ?? "").trim() }),
    };
  });

  const duplicateInFile = (field: string) => {
    const values = prepared.map((row) => String(row[field] ?? "").trim().toLowerCase());
    return values.find((value, index) => value && values.indexOf(value) !== index);
  };
  const duplicateEmail = duplicateInFile("email");
  const duplicateIdentity = duplicateInFile(idField);
  if (duplicateEmail) throw new Error(`Email duplikat di file Excel: ${duplicateEmail}`);
  if (duplicateIdentity) throw new Error(`${idField.toUpperCase()} duplikat di file Excel: ${duplicateIdentity}`);

  const emails = prepared.map((row) => String(row.email));
  const identities = prepared.map((row) => String(row[idField]));
  const existingProfile = await db.collection(collectionName).findOne({ $or: [{ email: { $in: emails } }, { [idField]: { $in: identities } }] });
  if (existingProfile) throw new Error(`Email atau ${idField.toUpperCase()} sudah terdaftar: ${String(existingProfile.email ?? existingProfile[idField] ?? "")}`);
  const existingUser = await db.collection("users").findOne({ email: { $in: emails } });
  if (existingUser) throw new Error(`Email sudah digunakan akun lain: ${String(existingUser.email)}`);
  const existingAccount = await db.collection("auth_accounts").findOne({ email: { $in: emails } });
  if (existingAccount) throw new Error(`Email sudah digunakan akun login lain: ${String(existingAccount.email)}`);

  const safeProfiles = prepared.map(({ password: _password, ...row }) => ({ ...row, createdAt: new Date().toISOString() }));
  const client = await getMongoClient();
  const mongoSession = client.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await db.collection(collectionName).insertMany(safeProfiles, { session: mongoSession });
      await syncUsersFromProfiles(db, collectionName, prepared, mongoSession, false);
    });
  } finally {
    await mongoSession.endSession();
  }
  return safeProfiles;
}


export async function importUsers(inputRows: Record<string, unknown>[], session: RequestSession) {
  if (session.role !== "admin") throw new Error("Hanya administrator yang dapat mengimpor akun pengguna.");
  if (!Array.isArray(inputRows) || inputRows.length === 0) throw new Error("File Excel tidak berisi data.");
  if (inputRows.length > 1000) throw new Error("Maksimal 1.000 baris per sekali impor.");

  const db = await getDb();
  const prepared = inputRows.map((row, index) => {
    const nama = String(row.nama ?? "").trim();
    const email = normalizeEmail(row.email);
    const password = String(row.password ?? "").trim();
    const roleLabel = normalizeRoleLabel(row.role);
    const role = roleToAuthRole(roleLabel);
    const status = String(row.status ?? "Aktif").trim() || "Aktif";
    const nip = String(row.nip ?? "").trim();
    const nis = String(row.nis ?? "").trim();
    const mapel = String(row.mapel ?? "").trim();
    const kelas = String(row.kelas ?? "").trim();
    const jurusan = String(row.jurusan ?? "").trim().toUpperCase();
    if (!nama || !email || !password || !roleLabel) throw new Error(`Baris ${index + 2}: Nama, Email, Password, dan Peran wajib diisi.`);
    if (!isValidEmail(email)) throw new Error(`Baris ${index + 2}: format email ${email} tidak valid.`);
    if (password.length < 8) throw new Error(`Baris ${index + 2}: password minimal 8 karakter.`);
    if (!["Aktif", "Non-aktif"].includes(status)) throw new Error(`Baris ${index + 2}: status harus Aktif atau Non-aktif.`);
    if (role === "guru" && (!nip || !mapel || !kelas)) throw new Error(`Baris ${index + 2}: NIP, Mata Pelajaran, dan Kelas wajib untuk Guru.`);
    if (role === "siswa" && (!nis || !kelas || !jurusan)) throw new Error(`Baris ${index + 2}: NIS, Kelas, dan Jurusan wajib untuk Siswa.`);
    if (role === "guru" && jurusan) throw new Error(`Baris ${index + 2}: kolom Jurusan hanya digunakan untuk Siswa.`);
    if (role === "siswa" && (nip || mapel)) throw new Error(`Baris ${index + 2}: kolom NIP/Mata Pelajaran hanya digunakan untuk Guru.`);
    return {
      id: randomUUID(), nama, email, password, role: roleLabel, status,
      ...(role === "guru" ? { nip, mapel, kelas } : {}),
      ...(role === "siswa" ? { nis, kelas, jurusan } : {}),
      createdAt: formatCreatedAt(undefined),
    } as Record<string, unknown>;
  });

  const checkDuplicate = (field: string, label: string) => {
    const values = prepared.map((row) => String(row[field] ?? "").trim().toLowerCase()).filter(Boolean);
    const duplicate = values.find((value, index) => values.indexOf(value) !== index);
    if (duplicate) throw new Error(`${label} duplikat di file Excel: ${duplicate}`);
  };
  checkDuplicate("email", "Email");
  checkDuplicate("nip", "NIP");
  checkDuplicate("nis", "NIS");

  const emails = prepared.map((row) => String(row.email));
  const identities = {
    nip: prepared.map((row) => String(row.nip ?? "")).filter(Boolean),
    nis: prepared.map((row) => String(row.nis ?? "")).filter(Boolean),
  };
  const [existingUser, existingAccount, existingGuru, existingSiswa] = await Promise.all([
    db.collection("users").findOne({ email: { $in: emails } }),
    db.collection("auth_accounts").findOne({ email: { $in: emails } }),
    identities.nip.length ? db.collection("guru").findOne({ $or: [{ email: { $in: emails } }, { nip: { $in: identities.nip } }] }) : null,
    identities.nis.length ? db.collection("siswa").findOne({ $or: [{ email: { $in: emails } }, { nis: { $in: identities.nis } }] }) : null,
  ]);
  const conflict = existingUser ?? existingAccount ?? existingGuru ?? existingSiswa;
  if (conflict) throw new Error(`Email, NIP, atau NIS sudah terdaftar: ${String((conflict as Record<string, unknown>).email ?? (conflict as Record<string, unknown>).nip ?? (conflict as Record<string, unknown>).nis ?? "data lama")}`);

  const safeRows = prepared.map(({ password: _password, ...row }) => row);
  const accounts = await Promise.all(prepared.map(async (row) => ({
    id: `acc-${String(row.id)}`, userId: String(row.id), email: String(row.email), role: roleToAuthRole(row.role),
    status: String(row.status), passwordHash: await hashPassword(String(row.password)), createdAt: new Date(), updatedAt: new Date(),
  })));
  const client = await getMongoClient();
  const mongoSession = client.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      if (safeRows.length) await db.collection("users").insertMany(safeRows, { session: mongoSession });
      if (accounts.length) await db.collection("auth_accounts").insertMany(accounts, { session: mongoSession });
      const guruProfiles = prepared.filter((row) => roleToAuthRole(row.role) === "guru").map((row) => ({
        id: String(row.id), userId: String(row.id), nama: String(row.nama), email: String(row.email),
        nip: String(row.nip), mapel: String(row.mapel), kelas: String(row.kelas), status: String(row.status), createdAt: new Date(),
      }));
      const siswaProfiles = prepared.filter((row) => roleToAuthRole(row.role) === "siswa").map((row) => ({
        id: String(row.id), userId: String(row.id), nama: String(row.nama), email: String(row.email),
        nis: String(row.nis), kelas: String(row.kelas), jurusan: String(row.jurusan), status: String(row.status), createdAt: new Date(),
      }));
      if (guruProfiles.length) await db.collection("guru").insertMany(guruProfiles, { session: mongoSession });
      if (siswaProfiles.length) await db.collection("siswa").insertMany(siswaProfiles, { session: mongoSession });
    });
  } finally {
    await mongoSession.endSession();
  }
  return safeRows;
}

export async function listCollection(name: CollectionName, session: RequestSession) {
  const db = await getDb();
  const filter = await getReadFilter(name, session);
  const docs = await db
    .collection(name)
    .find(filter, { projection: { passwordHash: 0, password: 0 } })
    .sort({ _id: -1 })
    .toArray();

  return docs.map((doc) => sanitizeDoc(doc as Record<string, unknown>));
}

function normalizeRoleLabel(value: unknown) {
  const role = String(value ?? "").trim().toLowerCase();
  const labels: Record<string, string> = {
    admin: "Admin",
    guru: "Guru",
    siswa: "Siswa",
    kurikulum: "Kurikulum",
    kepsek: "Kepsek",
  };
  return labels[role] ?? String(value ?? "").trim();
}

const roleMap: Record<string, "admin" | "guru" | "siswa" | "kurikulum" | "kepsek"> = {
  Admin: "admin", admin: "admin",
  Guru: "guru", guru: "guru",
  Siswa: "siswa", siswa: "siswa",
  Kurikulum: "kurikulum", kurikulum: "kurikulum",
  Kepsek: "kepsek", kepsek: "kepsek",
};

function roleToAuthRole(value: unknown) {
  const role = String(value ?? "Siswa").trim();
  const mapped = roleMap[role] ?? roleMap[role.toLowerCase()];
  if (!mapped) throw new Error(`Peran pengguna tidak valid: ${role}`);
  return mapped;
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
  session: RequestSession,
) {
  const db = await getDb();
  const collection = db.collection(name);

  if (name !== "users") {
    const withCredentials: Record<string, unknown>[] = rows.map((row) => ({
      ...row,
      id: String(row.id ?? randomUUID()),
      ...(session.role === "guru" ? {
        ownerId: session.userId,
        ownerEmail: session.email,
        createdBy: session.userId,
        guruId: session.userId,
        guruEmail: session.email,
      } : {}),
    }));
    // Password hanya dipakai untuk membuat/memperbarui auth_accounts dan
    // tidak pernah disimpan pada dokumen profil guru/siswa.
    const normalized: Record<string, unknown>[] = withCredentials.map((row) => {
      if (name !== "guru" && name !== "siswa") return row;
      const { password: _password, passwordHash: _passwordHash, ...safe } = row;
      void _password;
      void _passwordHash;
      return safe;
    });

    // Non-admin users may only replace their own records. Never run a
    // collection-wide delete from a teacher/student session.
    if (session.role === "guru") {
      const allowedCollections = new Set(["material", "tasks", "grades", "attendance"]);
      if (!allowedCollections.has(name)) throw new Error("Guru tidak diizinkan mengubah koleksi ini.");
      const ownFilter = await getReadFilter(name, session);
      const client = await getMongoClient();
      const mongoSession = client.startSession();
      try {
        await mongoSession.withTransaction(async () => {
          await collection.deleteMany(ownFilter, { session: mongoSession });
          if (normalized.length) await collection.insertMany(normalized, { session: mongoSession });
        });
      } finally {
        await mongoSession.endSession();
      }
      return normalized;
    }

    if (session.role !== "admin") {
      throw new Error("Hanya administrator yang dapat mengubah koleksi ini.");
    }

    const client = await getMongoClient();
    const mongoSession = client.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        await collection.deleteMany({}, { session: mongoSession });
        if (normalized.length > 0) await collection.insertMany(normalized, { session: mongoSession });
        if (name === "guru" || name === "siswa") {
          await syncUsersFromProfiles(db, name, withCredentials, mongoSession);
        }
      });
    } finally {
      await mongoSession.endSession();
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
      role: normalizeRoleLabel(row.role),
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
  const mongoSession = client.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      await collection.deleteMany({}, { session: mongoSession });
      if (safeRows.length > 0) {
        await collection.insertMany(safeRows, { session: mongoSession });
      }

      const userIds = normalized.map((row) => String(row.id));

      if (userIds.length > 0) {
        await accountsCollection.deleteMany(
          { userId: { $nin: userIds } },
          { session: mongoSession },
        );
      } else {
        await accountsCollection.deleteMany({}, { session: mongoSession });
      }

      for (const account of preparedAccounts) {
        const { existingId, ...accountDoc } = account;
        if (existingId) {
          await accountsCollection.updateOne(
            { _id: existingId },
            { $set: accountDoc },
            { session: mongoSession },
          );
        } else if (accountDoc.passwordHash) {
          await accountsCollection.insertOne(accountDoc, { session: mongoSession });
        }
      }
      await syncProfilesFromUsers(db, normalized, mongoSession);
    });
  } finally {
    await mongoSession.endSession();
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


/** Delete one teaching resource with ownership checks and dependent submissions cleanup. */
export async function deleteTeachingRecord(
  name: "material" | "tasks",
  id: string,
  session: RequestSession,
) {
  if (!id.trim()) throw new Error("ID data tidak valid.");
  if (!["admin", "guru"].includes(session.role)) throw new Error("Kamu tidak memiliki izin menghapus data ini.");

  const db = await getDb();
  const collection = db.collection(name);
  const ownerFilter = session.role === "admin"
    ? { id }
    : { id, $or: [{ ownerId: session.userId }, { createdBy: session.userId }, { guruId: session.userId }, { ownerEmail: session.email }, { guruEmail: session.email }] };
  const record = await collection.findOne(ownerFilter);
  if (!record) throw new Error("Data tidak ditemukan atau bukan milik akun kamu.");

  const client = await getMongoClient();
  const mongoSession = client.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await collection.deleteOne({ _id: record._id }, { session: mongoSession });
      if (name === "tasks") {
        await db.collection("submissions").deleteMany({ taskId: id }, { session: mongoSession });
      }
    });
  } finally {
    await mongoSession.endSession();
  }

  // Remove GridFS attachments after the record transaction succeeds. A file
  // cleanup failure is logged but never restores a task that was deleted.
  const bucket = new GridFSBucket(db, { bucketName: "educn_files" });
  const fileDocs = name === "material"
    ? await db.collection("educn_files.files").find({ "metadata.purpose": "material", "metadata.recordId": id }, { projection: { _id: 1 } }).toArray()
    : await db.collection("educn_files.files").find({ $or: [
        { "metadata.purpose": "task", "metadata.recordId": id },
        { "metadata.purpose": "submission", "metadata.taskId": id },
      ] }, { projection: { _id: 1 } }).toArray();
  for (const file of fileDocs) {
    try { await bucket.delete(file._id as ObjectId); }
    catch (error) { console.warn("GridFS cleanup failed", String(file._id), error); }
  }
  return { id, deleted: true };
}
