-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('NONE', 'CASH', 'CREDIT', 'CBE', 'COOP', 'AWASH', 'EBIRR');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilePicture" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "address" TEXT,
    "certificate" TEXT,
    "Photo" TEXT,
    "gender" "Gender",
    "dob" TIMESTAMP(3),
    "salary" DOUBLE PRECISION NOT NULL,
    "joining_date" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "role" "Role" NOT NULL,
    "biography" TEXT,

    CONSTRAINT "Members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suppliers" (
    "id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "contact_info" TEXT NOT NULL,
    "payment_info_cbe" TEXT,
    "payment_info_coop" TEXT,
    "payment_info_boa" TEXT,
    "payment_info_awash" TEXT,
    "payment_info_ebirr" TEXT,
    "location" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosageForms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DosageForms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicines" (
    "id" TEXT NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "brand_name" TEXT,
    "batch_number" TEXT,
    "category_id" TEXT NOT NULL,
    "dosage_form_id" TEXT NOT NULL,
    "medicine_weight" DOUBLE PRECISION,
    "quantity" INTEGER NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "sell_price" DOUBLE PRECISION,
    "total_price" DOUBLE PRECISION NOT NULL,
    "expire_date" TIMESTAMP(3) NOT NULL,
    "required_prescription" BOOLEAN NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'NONE',
    "Payment_file" TEXT,
    "details" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sales" (
    "id" TEXT NOT NULL,
    "product_name" TEXT,
    "product_batch_number" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'NONE',
    "prescription" BOOLEAN NOT NULL,
    "dosage_form_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "sealed_date" TIMESTAMP(3) NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expenses" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "payment_method" "PaymentMethod",
    "receipt" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "additional_info" TEXT,

    CONSTRAINT "Expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Returns" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_batch_number" TEXT NOT NULL,
    "dosage_form_id" TEXT NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "reason_for_return" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "medicine_id" TEXT NOT NULL,

    CONSTRAINT "Returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCredits" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "credit_amount" DOUBLE PRECISION NOT NULL,
    "medicine_name" TEXT,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unpaid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_unpaid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "payment_method" "PaymentMethod",
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "credit_date" TIMESTAMP(3) NOT NULL,
    "payment_file" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCredits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCredit" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "credit_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unpaid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_unpaid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "medicine_name" TEXT,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'NONE',
    "description" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "credit_date" TIMESTAMP(3) NOT NULL,
    "payment_file" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "CustomerCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objectives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "time_period" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyResults" (
    "id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "KeyResults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Members_user_id_key" ON "Members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Medicines_invoice_number_key" ON "Medicines"("invoice_number");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicines" ADD CONSTRAINT "Medicines_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicines" ADD CONSTRAINT "Medicines_dosage_form_id_fkey" FOREIGN KEY ("dosage_form_id") REFERENCES "DosageForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicines" ADD CONSTRAINT "Medicines_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicines" ADD CONSTRAINT "Medicines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_dosage_form_id_fkey" FOREIGN KEY ("dosage_form_id") REFERENCES "DosageForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Returns" ADD CONSTRAINT "Returns_dosage_form_id_fkey" FOREIGN KEY ("dosage_form_id") REFERENCES "DosageForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Returns" ADD CONSTRAINT "Returns_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCredits" ADD CONSTRAINT "SupplierCredits_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCredits" ADD CONSTRAINT "SupplierCredits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCredits" ADD CONSTRAINT "SupplierCredits_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCredit" ADD CONSTRAINT "CustomerCredit_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCredit" ADD CONSTRAINT "CustomerCredit_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCredit" ADD CONSTRAINT "CustomerCredit_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResults" ADD CONSTRAINT "KeyResults_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "Objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
