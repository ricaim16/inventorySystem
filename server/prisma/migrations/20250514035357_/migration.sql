-- DropIndex
DROP INDEX "Medicines_invoice_number_key";

-- AlterTable
ALTER TABLE "Medicines" ALTER COLUMN "invoice_number" DROP NOT NULL;
