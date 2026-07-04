-- CreateTable
CREATE TABLE "ReadingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 5,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingPlan_userId_idx" ON "ReadingPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterest_userId_entityId_key" ON "UserInterest"("userId", "entityId");

-- AddForeignKey
ALTER TABLE "ReadingPlan" ADD CONSTRAINT "ReadingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingPlan" ADD CONSTRAINT "ReadingPlan_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
