import { NextResponse } from "next/server";
import { pingMongoDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const database = await pingMongoDB();
    return NextResponse.json({
      ok: true,
      database,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/health error", error);
    const message = error instanceof Error ? error.message : "Unknown MongoDB error";
    return NextResponse.json(
      {
        ok: false,
        error: "MongoDB tidak dapat dijangkau.",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 503 },
    );
  }
}
