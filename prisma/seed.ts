import { PrismaClient, TipoMetrica, NivelHabilidade } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Passwords iniciais — documentadas para o primeiro login (secção 6.2/17.4).
// Podem ser sobrepostas por variáveis de ambiente antes de correr o seed.
const PASS_GONCALO = process.env.SEED_PASS_GONCALO || "futsal2026";
const PASS_ADJUNTO = process.env.SEED_PASS_ADJUNTO || "futsal2026";
const BCRYPT_COST = 10;

async function main() {
  // Evita duplicar se o seed correr mais do que uma vez.
  const jaExiste = await prisma.clube.findFirst({
    where: { nome: "Juventude Sport Clube" },
  });
  if (jaExiste) {
    console.log("Seed já aplicado (clube existente). A sair.");
    return;
  }

  // 1. Clube
  const clube = await prisma.clube.create({
    data: {
      nome: "Juventude Sport Clube",
      corPrimaria: "#1A2FD4",
      corSecundaria: "#FFD700",
    },
  });

  // 2. Época ativa
  await prisma.epoca.create({
    data: {
      nome: "2025/26",
      dataInicio: new Date("2025-09-01"),
      dataFim: new Date("2026-06-30"),
      ativa: true,
      clubeId: clube.id,
    },
  });

  // 3. Utilizadores (permissões iguais)
  await prisma.utilizador.createMany({
    data: [
      {
        nome: "Gonçalo Pereira",
        email: "goncalo@jsc.pt",
        passwordHash: await bcrypt.hash(PASS_GONCALO, BCRYPT_COST),
        clubeId: clube.id,
      },
      {
        nome: "Treinador Adjunto",
        email: "adjunto@jsc.pt",
        passwordHash: await bcrypt.hash(PASS_ADJUNTO, BCRYPT_COST),
        clubeId: clube.id,
      },
    ],
  });

  // 4. Escalões
  await prisma.escalao.createMany({
    data: [
      { nome: "Traquinas", idadeMin: 6, idadeMax: 8, ordem: 0, clubeId: clube.id },
      { nome: "Benjamins", idadeMin: 9, idadeMax: 10, ordem: 1, clubeId: clube.id },
    ],
  });

  // 5. Métricas configuráveis exemplo
  await prisma.metricaConfig.createMany({
    data: [
      { nome: "Dribles completados", tipo: TipoMetrica.NUMERO, ordem: 0, clubeId: clube.id },
      { nome: "1x1 ganhos", tipo: TipoMetrica.NUMERO, ordem: 1, clubeId: clube.id },
      { nome: "Atitude", tipo: TipoMetrica.ESCALA, ordem: 2, clubeId: clube.id },
    ],
  });

  // 6. Habilidades exemplo por nível
  await prisma.habilidade.createMany({
    data: [
      { nome: "Rolo", nivel: NivelHabilidade.BASICO, ordem: 0, clubeId: clube.id },
      { nome: "Corta", nivel: NivelHabilidade.BASICO, ordem: 1, clubeId: clube.id },
      { nome: "Vírgula", nivel: NivelHabilidade.INTERMEDIO, ordem: 0, clubeId: clube.id },
      { nome: "Flip-flap", nivel: NivelHabilidade.INTERMEDIO, ordem: 1, clubeId: clube.id },
      { nome: "Elástico", nivel: NivelHabilidade.AVANCADO, ordem: 0, clubeId: clube.id },
      { nome: "Chapéu", nivel: NivelHabilidade.AVANCADO, ordem: 1, clubeId: clube.id },
    ],
  });

  console.log("Seed concluído.");
  console.log("Login inicial:");
  console.log(`  goncalo@jsc.pt / ${PASS_GONCALO}`);
  console.log(`  adjunto@jsc.pt / ${PASS_ADJUNTO}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
