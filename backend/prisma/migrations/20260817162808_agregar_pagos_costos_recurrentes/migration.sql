-- CreateTable
CREATE TABLE "PagoCostoRecurrente" (
    "id" SERIAL NOT NULL,
    "costoRecurrenteId" INTEGER NOT NULL,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" INTEGER NOT NULL,

    CONSTRAINT "PagoCostoRecurrente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PagoCostoRecurrente" ADD CONSTRAINT "PagoCostoRecurrente_costoRecurrenteId_fkey" FOREIGN KEY ("costoRecurrenteId") REFERENCES "CostoRecurrente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoCostoRecurrente" ADD CONSTRAINT "PagoCostoRecurrente_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
