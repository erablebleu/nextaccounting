/*
  Warnings:

  - You are about to drop the column `allow_connection` on the `contacts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contacts" DROP COLUMN "allow_connection",
ADD COLUMN     "connection_emails" TEXT[];
