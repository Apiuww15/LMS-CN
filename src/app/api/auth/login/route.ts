import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/server-data";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import type { Role } from "@/lib/portal";

const VALID_ROLES = new Set<Role>(["admin", "guru", "siswa", "kurikulum", "kepsek"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const db = await getDb();
    const account = await db.collection("auth_accounts").findOne({ email, status: "Aktif" });

    if (!account || typeof account.passwordHash !== "string" || !VALID_ROLES.has(account.role as Role)) {
      return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    }

    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) return NextResponse.json({ error: "Email atau kata sandi tidak sesuai." }, { status: 401 });

    await db.collection("auth_accounts").updateOne(
      { _id: account._id },
      { $set: { lastLoginAt: new Date() } },
    );

    const user = await db.collection("users").findOne(
      { id: account.userId },
      { projection: { _id: 0, passwordHash: 0 } },
    );

    if (!user) {
      return NextResponse.json({ error: "Profil akun belum tersedia di database." }, { status: 409 });
    }

    const role = account.role as Role;
    const nama = typeof user.nama === "string" ? user.nama : email.split("@")[0];

    const token = createSessionToken({
      userId: String(account.userId),
      email,
      role,
      nama,
    });

    const response = NextResponse.json({
      ok: true,
      user: { id: String(account.userId), email, role, nama },
    });

    response.cookies.set({
      name: sessionCookieName,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login error", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Login gagal karena server tidak dapat mengakses MongoDB.",
      },
      { status: 500 },
    );
  }
}
