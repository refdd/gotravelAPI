/*
  Warnings:

  - You are about to drop the column `imageAlt` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `blogId` on the `tours` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tours" DROP CONSTRAINT "tours_blogId_fkey";

-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "imageAlt";

-- AlterTable
ALTER TABLE "tours" DROP COLUMN "blogId";

-- CreateTable
CREATE TABLE "_BlogRelatedTours" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogRelatedTours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BlogRelatedTours_B_index" ON "_BlogRelatedTours"("B");

-- AddForeignKey
ALTER TABLE "_BlogRelatedTours" ADD CONSTRAINT "_BlogRelatedTours_A_fkey" FOREIGN KEY ("A") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogRelatedTours" ADD CONSTRAINT "_BlogRelatedTours_B_fkey" FOREIGN KEY ("B") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
