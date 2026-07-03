-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('DIARIO', 'MENSUAL');

-- CreateTable
CREATE TABLE "CostoFijo" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostoFijo_pkey" PRIMARY KEY ("id")
);
