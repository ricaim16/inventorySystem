/*
  Warnings:

  - Added the required column `sale_id` to the `Returns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Returns" ADD COLUMN     "sale_id" TEXT NOT NULL;
