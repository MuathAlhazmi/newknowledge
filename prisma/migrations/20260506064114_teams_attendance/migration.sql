-- AlterTable
ALTER TABLE "GradingConfig" ADD COLUMN     "manualWeight" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TeamsSessionAttendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "markedById" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamsSessionAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualAssessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualAssessmentScore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "gradedById" TEXT NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualAssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamsSessionAttendance_sessionId_userId_idx" ON "TeamsSessionAttendance"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamsSessionAttendance_sessionId_userId_key" ON "TeamsSessionAttendance"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "ManualAssessment_courseId_idx" ON "ManualAssessment"("courseId");

-- CreateIndex
CREATE INDEX "ManualAssessmentScore_assessmentId_userId_idx" ON "ManualAssessmentScore"("assessmentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualAssessmentScore_assessmentId_userId_key" ON "ManualAssessmentScore"("assessmentId", "userId");

-- AddForeignKey
ALTER TABLE "TeamsSessionAttendance" ADD CONSTRAINT "TeamsSessionAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "teams_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamsSessionAttendance" ADD CONSTRAINT "TeamsSessionAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamsSessionAttendance" ADD CONSTRAINT "TeamsSessionAttendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAssessment" ADD CONSTRAINT "ManualAssessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAssessment" ADD CONSTRAINT "ManualAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAssessmentScore" ADD CONSTRAINT "ManualAssessmentScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ManualAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAssessmentScore" ADD CONSTRAINT "ManualAssessmentScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualAssessmentScore" ADD CONSTRAINT "ManualAssessmentScore_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
