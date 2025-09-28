/*
  Warnings:

  - You are about to drop the column `destinationId` on the `wikis` table. All the data in the column will be lost.
  - You are about to drop the column `regionId` on the `wikis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wikis" DROP COLUMN "destinationId",
DROP COLUMN "regionId";

-- CreateTable
CREATE TABLE "_WikiRelatedTours" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WikiRelatedTours_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WikiRelatedTours_B_index" ON "_WikiRelatedTours"("B");

-- AddForeignKey
ALTER TABLE "_WikiRelatedTours" ADD CONSTRAINT "_WikiRelatedTours_A_fkey" FOREIGN KEY ("A") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WikiRelatedTours" ADD CONSTRAINT "_WikiRelatedTours_B_fkey" FOREIGN KEY ("B") REFERENCES "wikis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
