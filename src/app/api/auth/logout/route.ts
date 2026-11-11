import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: sessionCookieName, value: "", httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
