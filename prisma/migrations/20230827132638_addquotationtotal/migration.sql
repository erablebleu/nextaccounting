/*
  Warnings:

  - Added the required column `total` to the `quotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_vat` to the `quotations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "total" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "total_vat" DECIMAL(65,30) NOT NULL;
