-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('PDF', 'DOCX');

-- CreateTable
CREATE TABLE "MaterialFolder" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MaterialFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialFolder_courseId_parentId_idx" ON "MaterialFolder"("courseId", "parentId");

-- AddForeignKey
ALTER TABLE "MaterialFolder" ADD CONSTRAINT "MaterialFolder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialFolder" ADD CONSTRAINT "MaterialFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MaterialFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable Material (before FK to folder)
ALTER TABLE "Material" ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "kind" "MaterialKind" NOT NULL DEFAULT 'PDF';

ALTER TABLE "Material" RENAME COLUMN "pdfPath" TO "filePath";

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MaterialFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rename ZoomSession -> teams_sessions for Prisma @@map
ALTER TABLE "ZoomSession" RENAME TO "teams_sessions";
ALTER TABLE "teams_sessions" RENAME CONSTRAINT "ZoomSession_pkey" TO "teams_sessions_pkey";
ALTER TABLE "teams_sessions" RENAME CONSTRAINT "ZoomSession_courseId_fkey" TO "teams_sessions_courseId_fkey";

-- AnnouncementKind: ZOOM -> TEAMS
CREATE TYPE "AnnouncementKind_new" AS ENUM ('MANUAL', 'CONTENT', 'QUIZ', 'TEAMS');

ALTER TABLE "Announcement" ALTER COLUMN "kind" DROP DEFAULT;

ALTER TABLE "Announcement"
  ALTER COLUMN "kind" TYPE "AnnouncementKind_new"
  USING (
    CASE
      WHEN "kind"::text = 'ZOOM' THEN 'TEAMS'::"AnnouncementKind_new"
      ELSE ("kind"::text)::"AnnouncementKind_new"
    END
  );

ALTER TABLE "Announcement" ALTER COLUMN "kind" SET DEFAULT 'MANUAL'::"AnnouncementKind_new";

DROP TYPE "AnnouncementKind";

ALTER TYPE "AnnouncementKind_new" RENAME TO "AnnouncementKind";
