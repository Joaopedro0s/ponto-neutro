/**
 * Seed só para banco vazio, usado no build da Vercel (`vercel-build`).
 * Nunca apaga dados: se qualquer tabela principal tiver registros, não faz nada.
 */
import "dotenv/config";

// Mesma prioridade do prisma.config.ts: conexão direta (sem pooler) quando existir.
process.env.DATABASE_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

async function main() {
  // Importados depois de ajustar a URL: o cliente do banco lê DATABASE_URL ao ser criado.
  const { db } = await import("../src/lib/db");
  const { seed } = await import("./seed");
  try {
    // Além do usuário de demonstração, confere as demais tabelas: o seed faz TRUNCATE,
    // então só pode rodar num banco realmente vazio.
    const counts = await Promise.all([
      db.user.count(),
      db.professional.count(),
      db.service.count(),
      db.customer.count(),
      db.appointment.count(),
      db.quote.count(),
    ]);
    if (counts.some((n) => n > 0)) {
      console.log("Seed ignorado: banco já tem dados");
      return;
    }
    await seed();
    console.log("Seed executado");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
