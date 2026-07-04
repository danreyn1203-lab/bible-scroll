-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('verse', 'history', 'theology', 'catechism', 'funfact');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('book', 'person', 'place', 'event', 'theme', 'doctrine', 'word', 'period', 'theologian', 'artifact');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "preferredTranslation" TEXT NOT NULL DEFAULT 'ESV',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT,
    "ref" TEXT NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEntityLink" (
    "contentId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "ContentEntityLink_pkey" PRIMARY KEY ("contentId","entityId")
);

-- CreateTable
CREATE TABLE "ContentRelated" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "ContentRelated_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateTable
CREATE TABLE "UserLike" (
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLike_pkey" PRIMARY KEY ("userId","contentId")
);

-- CreateTable
CREATE TABLE "UserSave" (
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSave_pkey" PRIMARY KEY ("userId","contentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ContentEntityLink" ADD CONSTRAINT "ContentEntityLink_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEntityLink" ADD CONSTRAINT "ContentEntityLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRelated" ADD CONSTRAINT "ContentRelated_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRelated" ADD CONSTRAINT "ContentRelated_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSave" ADD CONSTRAINT "UserSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSave" ADD CONSTRAINT "UserSave_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
