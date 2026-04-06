import { NextResponse } from "next/server";
import { getCurrentUser, resolvePostLoginPath } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const path = await resolvePostLoginPath(user);
  return NextResponse.redirect(new URL(path, request.url));
}
