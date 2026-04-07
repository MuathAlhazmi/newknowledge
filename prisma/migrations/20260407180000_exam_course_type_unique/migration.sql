-- One PRE and one POST per course (matches guards / grading). Deduplicate if needed.
WITH ranked AS (
  SELECT
    id,
    "courseId",
    "type",
    ROW_NUMBER() OVER (
      PARTITION BY "courseId", "type"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "Exam"
),
losers AS (
  SELECT id, "courseId", "type" FROM ranked WHERE rn > 1
),
canonical AS (
  SELECT id, "courseId", "type" FROM ranked WHERE rn = 1
)
UPDATE "ExamAttempt" ea
SET "examId" = c.id
FROM losers l
JOIN canonical c ON c."courseId" = l."courseId" AND c."type" = l."type"
WHERE ea."examId" = l.id;

DELETE FROM "Exam" e
WHERE e.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "courseId", "type" ORDER BY "createdAt" ASC, id ASC) AS rn
    FROM "Exam"
  ) z WHERE z.rn > 1
);

CREATE UNIQUE INDEX "Exam_courseId_type_key" ON "Exam"("courseId", "type");
