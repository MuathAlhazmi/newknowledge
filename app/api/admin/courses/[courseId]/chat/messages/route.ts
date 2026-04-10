import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fetchStaffChatMessages } from "@/lib/chat-messages-api";

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
  const participantId = url.searchParams.get("participantId")?.trim() ?? "";

  if (!participantId) {
    return NextResponse.json({ error: "participant_required" }, { status: 400 });
  }

  const messages = await fetchStaffChatMessages({
    courseId,
    staffUserId: user.id,
    participantId,
    afterMessageId: after,
  });

  return NextResponse.json({ messages });
}
