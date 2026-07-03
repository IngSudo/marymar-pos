const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const categoriaAlmuerzos = await prisma.categoria.create({
    data: { nombre: "Almuerzos" },
  });
  const categoriaOtros = await prisma.categoria.create({
    data: { nombre: "Otros platos" },
  });

  await prisma.producto.createMany({
    data: [
      {
        nombre: "Almuerzo estudiante",
        precio: 2.5,
        categoriaId: categoriaAlmuerzos.id,
      },
      {
        nombre: "Almuerzo general",
        precio: 3.0,
        categoriaId: categoriaAlmuerzos.id,
      },
      {
        nombre: "Encebollado",
        precio: 5.0,
        categoriaId: categoriaOtros.id,
      },
    ],
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { usuario: "admin" },
    update: {},
    create: {
      nombre: "Admin MaryMar",
      usuario: "admin",
      password: passwordHash,
      rol: "ADMIN",
    },
  });

  console.log("Seed completado ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
