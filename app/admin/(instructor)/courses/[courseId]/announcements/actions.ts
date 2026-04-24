"use server";

import { AnnouncementKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";

function parseKind(raw: string): AnnouncementKind {
  const u = raw.trim().toUpperCase();
  if (u === AnnouncementKind.CONTENT) return AnnouncementKind.CONTENT;
  if (u === AnnouncementKind.QUIZ) return AnnouncementKind.QUIZ;
  if (u === AnnouncementKind.TEAMS) return AnnouncementKind.TEAMS;
  return AnnouncementKind.MANUAL;
}

export async function createAnnouncementAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const { user } = await requireCourseEditor(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const kind = parseKind(String(formData.get("kind") ?? ""));
  const publishNow = String(formData.get("publishNow") ?? "") === "on";
  if (!title || title.length > 300) return;

  await db.announcement.create({
    data: {
      courseId,
      createdById: user.id,
      title,
      body: body || null,
      kind,
      publishedAt: publishNow ? new Date() : null,
    },
  });

  revalidatePath(`/admin/courses/${courseId}/announcements`);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/announcements`);
}

export async function updateAnnouncementAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  await requireCourseEditor(courseId);
  const announcementId = String(formData.get("announcementId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const kind = parseKind(String(formData.get("kind") ?? ""));
  if (!announcementId || !title || title.length > 300) return;

  const row = await db.announcement.findFirst({
    where: { id: announcementId, courseId },
    select: { id: true },
  });
  if (!row) return;

  await db.announcement.update({
    where: { id: announcementId },
    data: { title, body: body || null, kind },
  });

  revalidatePath(`/admin/courses/${courseId}/announcements`);
  revalidatePath(`/courses/${courseId}/announcements`);
}

export async function togglePublishAnnouncementAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  await requireCourseEditor(courseId);
  const announcementId = String(formData.get("announcementId") ?? "").trim();
  if (!announcementId) return;

  const row = await db.announcement.findFirst({
    where: { id: announcementId, courseId },
    select: { id: true, publishedAt: true },
  });
  if (!row) return;

  await db.announcement.update({
    where: { id: announcementId },
    data: { publishedAt: row.publishedAt ? null : new Date() },
  });

  revalidatePath(`/admin/courses/${courseId}/announcements`);
  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteAnnouncementAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  await requireCourseEditor(courseId);
  const announcementId = String(formData.get("announcementId") ?? "").trim();
  if (!announcementId) return;

  const row = await db.announcement.findFirst({
    where: { id: announcementId, courseId },
    select: { id: true },
  });
  if (!row) return;

  await db.announcement.delete({ where: { id: announcementId } });

  revalidatePath(`/admin/courses/${courseId}/announcements`);
  revalidatePath(`/courses/${courseId}/announcements`);
  revalidatePath(`/courses/${courseId}`);
}
