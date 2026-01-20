/*
  Warnings:

  - The primary key for the `discount_codes` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `discount_codes` DROP PRIMARY KEY,
    MODIFY `code` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`code`);
