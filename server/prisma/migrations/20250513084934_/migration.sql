/*
  Warnings:

  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `target_value` to the `KeyResults` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_quantity` to the `Medicines` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "KeyResults" DROP CONSTRAINT "KeyResults_objective_id_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- AlterTable
ALTER TABLE "KeyResults" ADD COLUMN     "start_value" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "target_value" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "weight" SET DEFAULT 1,
ALTER COLUMN "progress" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Medicines" ADD COLUMN     "initial_quantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Objectives" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "progress" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "otp" INTEGER;

-- DropTable
DROP TABLE "PasswordResetToken";

-- AddForeignKey
ALTER TABLE "KeyResults" ADD CONSTRAINT "KeyResults_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "Objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
