import { NextResponse } from "next/server";
import { recomputeCourseGrade } from "@/lib/guards";

type RecomputePayload = {
  userId?: unknown;
  courseId?: unknown;
};

export async function POST(req: Request) {
  const secret = process.env.INTERNAL_RECOMPUTE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 503 });
  }

  const given = req.headers.get("x-internal-recompute-secret")?.trim();
  if (!given || given !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: RecomputePayload;
  try {
    body = (await req.json()) as RecomputePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";
  if (!userId || !courseId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await recomputeCourseGrade(userId, courseId);
  } catch (err) {
    console.warn("[internal/recompute-grade] recompute failed", err);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
