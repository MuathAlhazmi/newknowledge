-- AlterTable: add nullable phone, backfill, enforce NOT NULL + unique
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS n FROM "User"
)
UPDATE "User" AS u
SET "phone" = '+96650' || LPAD(o.n::text, 6, '0')
FROM ordered o
WHERE u.id = o.id AND u."phone" IS NULL;

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
