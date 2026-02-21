import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash("johndoe123", 10);
  
  const user = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: {},
    create: {
      email: "john@doe.com",
      name: "Administrador",
      password: hashedPassword,
    },
  });

  console.log("Usuário admin criado:", user.email);

  // Criar pontos de exemplo
  const ponto1 = await prisma.ponto.upsert({
    where: { id: "ponto-bar-joao" },
    update: {},
    create: {
      id: "ponto-bar-joao",
      nome: "Bar do João",
      endereco: "Rua das Flores, 123",
    },
  });

  const ponto2 = await prisma.ponto.upsert({
    where: { id: "ponto-lanchonete-maria" },
    update: {},
    create: {
      id: "ponto-lanchonete-maria",
      nome: "Lanchonete Maria",
      endereco: "Av. Principal, 456",
    },
  });

  console.log("Pontos criados:", ponto1.nome, ponto2.nome);

  // Criar máquinas de exemplo vinculadas aos pontos
  const machines = [
    { nome: "Máquina 01", localizacao: "Entrada", tipo: "Caça-níquel", valorMoeda: 1, porcentagemPonto: 30, pontoId: ponto1.id },
    { nome: "Máquina 02", localizacao: "Fundo", tipo: "Caça-níquel", valorMoeda: 0.50, porcentagemPonto: 35, pontoId: ponto1.id },
    { nome: "Máquina 03", localizacao: "Balcão", tipo: "Roleta", valorMoeda: 2, porcentagemPonto: 40, pontoId: ponto2.id },
  ];

  for (const m of machines) {
    const machine = await prisma.machine.upsert({
      where: { id: m.nome.replace(/\s/g, "-").toLowerCase() },
      update: m,
      create: {
        id: m.nome.replace(/\s/g, "-").toLowerCase(),
        ...m,
      },
    });
    console.log("Máquina criada:", machine.nome);
  }

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
