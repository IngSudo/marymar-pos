/*
  Warnings:

  - You are about to drop the column `tipo` on the `Gasto` table. All the data in the column will be lost.
  - You are about to drop the `CostoFijo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoCostoRecurrente" AS ENUM ('SUELDO', 'OPERATIVO');

-- AlterTable
ALTER TABLE "Gasto" DROP COLUMN "tipo";

-- DropTable
DROP TABLE "CostoFijo";

-- DropEnum
DROP TYPE "TipoGasto";

-- CreateTable
CREATE TABLE "CostoRecurrente" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "tipo" "TipoCostoRecurrente" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostoRecurrente_pkey" PRIMARY KEY ("id")
);
