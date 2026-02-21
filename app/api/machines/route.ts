import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const machines = await prisma.machine.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      include: { ponto: true },
    });

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Erro ao buscar máquinas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar máquinas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, localizacao, porcentagemPonto, tipo, valorMoeda, pontoId } = body ?? {};

    if (!nome || !localizacao) {
      return NextResponse.json(
        { error: "Nome e localização são obrigatórios" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.create({
      data: {
        nome,
        localizacao,
        porcentagemPonto: porcentagemPonto ?? 30,
        tipo: tipo || null,
        valorMoeda: valorMoeda ?? 1,
        pontoId: pontoId || null,
      },
      include: { ponto: true },
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Erro ao criar máquina:", error);
    return NextResponse.json(
      { error: "Erro ao criar máquina" },
      { status: 500 }
    );
  }
}
