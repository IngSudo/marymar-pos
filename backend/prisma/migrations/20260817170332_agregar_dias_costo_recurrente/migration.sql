-- CreateEnum
CREATE TYPE "EstadoDia" AS ENUM ('EXTRA_PENDIENTE', 'INVALIDO', 'PAGADO');

-- CreateTable
CREATE TABLE "DiaCostoRecurrente" (
    "id" SERIAL NOT NULL,
    "costoRecurrenteId" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoDia" NOT NULL,
    "nota" TEXT,
    "pagoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaCostoRecurrente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiaCostoRecurrente_costoRecurrenteId_fecha_key" ON "DiaCostoRecurrente"("costoRecurrenteId", "fecha");

-- AddForeignKey
ALTER TABLE "DiaCostoRecurrente" ADD CONSTRAINT "DiaCostoRecurrente_costoRecurrenteId_fkey" FOREIGN KEY ("costoRecurrenteId") REFERENCES "CostoRecurrente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaCostoRecurrente" ADD CONSTRAINT "DiaCostoRecurrente_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "PagoCostoRecurrente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
