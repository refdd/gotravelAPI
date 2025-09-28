/*
  Warnings:

  - You are about to drop the column `destinationId` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the column `regionId` on the `blogs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "destinationId",
DROP COLUMN "regionId";

-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "blogId" TEXT;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
