import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const machine = await prisma.machine.findUnique({
      where: { id: params?.id },
    });

    if (!machine) {
      return NextResponse.json(
        { error: "Máquina não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Erro ao buscar máquina:", error);
    return NextResponse.json(
      { error: "Erro ao buscar máquina" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, localizacao, porcentagemPonto, ativa, tipo, valorMoeda, pontoId } = body ?? {};

    const machine = await prisma.machine.update({
      where: { id: params?.id },
      data: {
        ...(nome && { nome }),
        ...(localizacao && { localizacao }),
        ...(porcentagemPonto !== undefined && { porcentagemPonto }),
        ...(ativa !== undefined && { ativa }),
        ...(tipo !== undefined && { tipo }),
        ...(valorMoeda !== undefined && { valorMoeda }),
        ...(pontoId !== undefined && { pontoId: pontoId || null }),
      },
      include: { ponto: true },
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Erro ao atualizar máquina:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar máquina" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.machine.update({
      where: { id: params?.id },
      data: { ativa: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir máquina:", error);
    return NextResponse.json(
      { error: "Erro ao excluir máquina" },
      { status: 500 }
    );
  }
}
