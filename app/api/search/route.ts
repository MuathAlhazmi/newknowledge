import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchEnrolledForUser } from "@/lib/search-enrolled";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";

  const hits = await searchEnrolledForUser(user.id, q);
  return NextResponse.json({ hits });
}
