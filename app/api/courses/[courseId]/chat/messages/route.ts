import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchLearnerChatMessages } from "@/lib/chat-messages-api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;
  const url = new URL(req.url);
  const after = url.searchParams.get("after");

  const messages = await fetchLearnerChatMessages({
    courseId,
    userId: user.id,
    afterMessageId: after,
  });

  return NextResponse.json({ messages });
}
