-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentReport_contentId_idx" ON "ContentReport"("contentId");

-- CreateIndex
CREATE INDEX "ContentReport_userId_idx" ON "ContentReport"("userId");
