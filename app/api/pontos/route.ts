import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const pontos = await prisma.ponto.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        machines: {
          where: { ativa: true },
          orderBy: { nome: "asc" }
        }
      }
    });
    return NextResponse.json(pontos);
  } catch (error) {
    console.error("Erro ao buscar pontos:", error);
    return NextResponse.json({ error: "Erro ao buscar pontos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, endereco } = body;

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const ponto = await prisma.ponto.create({
      data: { nome, endereco: endereco || "" }
    });

    return NextResponse.json(ponto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ponto:", error);
    return NextResponse.json({ error: "Erro ao criar ponto" }, { status: 500 });
  }
}
