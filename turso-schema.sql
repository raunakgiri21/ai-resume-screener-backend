-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateName" TEXT NOT NULL,
    "jobDescriptionText" TEXT NOT NULL,
    "resumeText" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matchingSkills" TEXT NOT NULL,
    "skillGaps" TEXT NOT NULL,
    "interviewQuestions" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Analysis_candidateName_idx" ON "Analysis"("candidateName");

-- CreateIndex
CREATE INDEX "Analysis_score_idx" ON "Analysis"("score");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");
