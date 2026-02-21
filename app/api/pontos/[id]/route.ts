import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const ponto = await prisma.ponto.findUnique({
      where: { id: params.id },
      include: {
        machines: {
          where: { ativa: true },
          orderBy: { nome: "asc" }
        }
      }
    });

    if (!ponto) {
      return NextResponse.json({ error: "Ponto não encontrado" }, { status: 404 });
    }

    return NextResponse.json(ponto);
  } catch (error) {
    console.error("Erro ao buscar ponto:", error);
    return NextResponse.json({ error: "Erro ao buscar ponto" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nome, endereco, ativo } = body;

    const ponto = await prisma.ponto.update({
      where: { id: params.id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(endereco !== undefined && { endereco }),
        ...(ativo !== undefined && { ativo })
      }
    });

    return NextResponse.json(ponto);
  } catch (error) {
    console.error("Erro ao atualizar ponto:", error);
    return NextResponse.json({ error: "Erro ao atualizar ponto" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await prisma.ponto.update({
      where: { id: params.id },
      data: { ativo: false }
    });

    return NextResponse.json({ message: "Ponto desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar ponto:", error);
    return NextResponse.json({ error: "Erro ao deletar ponto" }, { status: 500 });
  }
}
