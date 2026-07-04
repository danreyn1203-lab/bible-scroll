-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "thumbnailUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "attendsChurch" BOOLEAN,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "denomination" TEXT;

-- CreateTable
CREATE TABLE "SponsoredPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "linkUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amountCents" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeratorApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,
    "experience" TEXT NOT NULL,
    "whyJoin" TEXT NOT NULL,
    "references" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ModeratorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsoredPost_status_endsAt_idx" ON "SponsoredPost"("status", "endsAt");

-- CreateIndex
CREATE INDEX "SponsoredPost_userId_idx" ON "SponsoredPost"("userId");

-- CreateIndex
CREATE INDEX "ModeratorApplication_status_createdAt_idx" ON "ModeratorApplication"("status", "createdAt");
