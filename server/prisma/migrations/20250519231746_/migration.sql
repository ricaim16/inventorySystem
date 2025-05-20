/*
  Warnings:

  - A unique constraint covering the columns `[batch_number]` on the table `Medicines` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "KeyResults" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'No Status';

-- AlterTable
ALTER TABLE "Medicines" ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Medicines_batch_number_key" ON "Medicines"("batch_number");

-- AddForeignKey
ALTER TABLE "Medicines" ADD CONSTRAINT "Medicines_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
