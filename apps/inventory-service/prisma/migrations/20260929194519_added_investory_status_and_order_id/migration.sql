/*
  Warnings:

  - A unique constraint covering the columns `[productId]` on the table `InventoryReservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_productId_key" ON "InventoryReservation"("productId");
