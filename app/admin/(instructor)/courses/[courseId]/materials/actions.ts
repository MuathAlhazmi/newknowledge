"use server";

import { revalidatePath } from "next/cache";
import { deleteStoredMaterialPdf } from "@/lib/delete-material-storage";
import { requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";

export type SaveMaterialResult =
  | { ok: true }
  | { ok: false; error: "saveValidation" | "saveFailed" };

export type MaterialMutationResult =
  | { ok: true }
  | { ok: false; error: "notFound" | "validation" | "failed" };

async function materialForCourse(courseId: string, materialId: string) {
  return db.material.findFirst({
    where: { id: materialId, courseId },
    select: { id: true, pdfPath: true },
  });
}

export async function saveCourseMaterialAction(
  courseId: string,
  title: string,
  pdfPath: string,
): Promise<SaveMaterialResult> {
  const t = title.trim();
  const p = pdfPath.trim();
  if (!t || !p) {
    return { ok: false, error: "saveValidation" };
  }

  await requireCourseEditor(courseId);

  try {
    await db.material.create({
      data: { courseId, title: t, pdfPath: p },
    });
  } catch {
    return { ok: false, error: "saveFailed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function updateMaterialTitleAction(
  courseId: string,
  materialId: string,
  title: string,
): Promise<MaterialMutationResult> {
  const t = title.trim();
  if (!t || t.length > 300) {
    return { ok: false, error: "validation" };
  }

  await requireCourseEditor(courseId);
  const row = await materialForCourse(courseId, materialId);
  if (!row) return { ok: false, error: "notFound" };

  try {
    await db.material.update({
      where: { id: materialId },
      data: { title: t },
    });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function replaceMaterialPdfAction(
  courseId: string,
  materialId: string,
  newPdfPath: string,
): Promise<MaterialMutationResult> {
  const nextPath = newPdfPath.trim();
  if (!nextPath) {
    return { ok: false, error: "validation" };
  }

  await requireCourseEditor(courseId);
  const row = await materialForCourse(courseId, materialId);
  if (!row) return { ok: false, error: "notFound" };

  const oldPath = row.pdfPath;
  if (oldPath === nextPath) {
    revalidatePath(`/admin/courses/${courseId}/materials`);
    return { ok: true };
  }

  try {
    await db.material.update({
      where: { id: materialId },
      data: { pdfPath: nextPath },
    });
  } catch {
    return { ok: false, error: "failed" };
  }

  await deleteStoredMaterialPdf(oldPath);
  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function deleteMaterialAction(
  courseId: string,
  materialId: string,
): Promise<MaterialMutationResult> {
  await requireCourseEditor(courseId);
  const row = await materialForCourse(courseId, materialId);
  if (!row) return { ok: false, error: "notFound" };

  const pdfPath = row.pdfPath;

  try {
    await db.material.delete({ where: { id: materialId } });
  } catch {
    return { ok: false, error: "failed" };
  }

  await deleteStoredMaterialPdf(pdfPath);
  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}
