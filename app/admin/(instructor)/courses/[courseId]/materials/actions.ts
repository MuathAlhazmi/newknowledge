"use server";

import { MaterialKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { deleteStoredMaterialFile } from "@/lib/delete-material-storage";
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
    select: { id: true, filePath: true, kind: true },
  });
}

export async function saveCourseMaterialAction(
  courseId: string,
  title: string,
  filePath: string,
  kind: MaterialKind,
  folderId?: string | null,
): Promise<SaveMaterialResult> {
  const t = title.trim();
  const p = filePath.trim();
  if (!t || !p) {
    return { ok: false, error: "saveValidation" };
  }
  if (kind !== MaterialKind.PDF && kind !== MaterialKind.DOCX) {
    return { ok: false, error: "saveValidation" };
  }

  await requireCourseEditor(courseId);

  let resolvedFolderId: string | null = null;
  if (folderId?.trim()) {
    const folder = await db.materialFolder.findFirst({
      where: { id: folderId.trim(), courseId },
      select: { id: true },
    });
    if (!folder) return { ok: false, error: "saveValidation" };
    resolvedFolderId = folder.id;
  }

  try {
    await db.material.create({
      data: {
        courseId,
        title: t,
        filePath: p,
        kind,
        folderId: resolvedFolderId,
      },
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

export async function deleteMaterialAction(
  courseId: string,
  materialId: string,
): Promise<MaterialMutationResult> {
  await requireCourseEditor(courseId);
  const row = await materialForCourse(courseId, materialId);
  if (!row) return { ok: false, error: "notFound" };

  const filePath = row.filePath;

  try {
    await db.material.delete({ where: { id: materialId } });
  } catch {
    return { ok: false, error: "failed" };
  }

  await deleteStoredMaterialFile(filePath);
  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function createMaterialFolderAction(
  courseId: string,
  name: string,
  parentId?: string | null,
): Promise<MaterialMutationResult> {
  const n = name.trim();
  if (!n || n.length > 200) return { ok: false, error: "validation" };

  await requireCourseEditor(courseId);
  if (parentId?.trim()) {
    const parent = await db.materialFolder.findFirst({
      where: { id: parentId.trim(), courseId },
      select: { id: true },
    });
    if (!parent) return { ok: false, error: "validation" };
  }

  try {
    await db.materialFolder.create({
      data: {
        courseId,
        name: n,
        parentId: parentId?.trim() || null,
      },
    });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function renameMaterialFolderAction(
  courseId: string,
  folderId: string,
  name: string,
): Promise<MaterialMutationResult> {
  const n = name.trim();
  if (!n || n.length > 200) return { ok: false, error: "validation" };

  await requireCourseEditor(courseId);
  const row = await db.materialFolder.findFirst({
    where: { id: folderId, courseId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "notFound" };

  try {
    await db.materialFolder.update({
      where: { id: folderId },
      data: { name: n },
    });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function deleteMaterialFolderAction(
  courseId: string,
  folderId: string,
): Promise<MaterialMutationResult | { ok: false; error: "notEmpty" }> {
  await requireCourseEditor(courseId);
  const row = await db.materialFolder.findFirst({
    where: { id: folderId, courseId },
    select: { id: true },
  });
  if (!row) return { ok: false, error: "notFound" };

  const [childCount, matCount] = await Promise.all([
    db.materialFolder.count({ where: { parentId: folderId, courseId } }),
    db.material.count({ where: { folderId, courseId } }),
  ]);
  if (childCount > 0 || matCount > 0) {
    return { ok: false, error: "notEmpty" };
  }

  try {
    await db.materialFolder.delete({ where: { id: folderId } });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}

export async function moveMaterialToFolderAction(
  courseId: string,
  materialId: string,
  folderId: string | null,
): Promise<MaterialMutationResult> {
  await requireCourseEditor(courseId);
  const mat = await db.material.findFirst({
    where: { id: materialId, courseId },
    select: { id: true },
  });
  if (!mat) return { ok: false, error: "notFound" };

  let resolvedFolderId: string | null = null;
  if (folderId?.trim()) {
    const folder = await db.materialFolder.findFirst({
      where: { id: folderId.trim(), courseId },
      select: { id: true },
    });
    if (!folder) return { ok: false, error: "validation" };
    resolvedFolderId = folder.id;
  }

  try {
    await db.material.update({
      where: { id: materialId },
      data: { folderId: resolvedFolderId },
    });
  } catch {
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/admin/courses/${courseId}/materials`);
  return { ok: true };
}
