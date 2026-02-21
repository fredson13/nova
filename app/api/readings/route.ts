import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (machineId) where.machineId = machineId;
    if (startDate && endDate) {
      where.data = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const readings = await prisma.reading.findMany({
      where,
      include: { machine: true },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(readings);
  } catch (error) {
    console.error("Erro ao buscar leituras:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leituras" },
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
    const { machineId, entradaAtual, saidaAtual, displayValor } = body ?? {};

    if (!machineId || entradaAtual === undefined || saidaAtual === undefined || displayValor === undefined) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar a máquina para pegar a porcentagem do ponto
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      return NextResponse.json(
        { error: "Máquina não encontrada" },
        { status: 404 }
      );
    }

    // Buscar a última leitura desta máquina
    const lastReading = await prisma.reading.findFirst({
      where: { machineId },
      orderBy: { data: "desc" },
    });

    const entradaAnterior = lastReading?.entradaAtual ?? 0;
    const saidaAnterior = lastReading?.saidaAtual ?? 0;
    const displayAnterior = lastReading?.displayValor ?? 0;

    // Detectar reset de contador
    const houveResetEntrada = entradaAtual < entradaAnterior;
    const houveResetSaida = saidaAtual < saidaAnterior;
    const houveResetDisplay = displayValor < displayAnterior;
    const houveReset = houveResetEntrada || houveResetSaida || houveResetDisplay;

    // Calcular período
    let entradaPeriodo: number;
    let saidaPeriodo: number;
    let displayPeriodo: number;

    if (houveResetEntrada) {
      entradaPeriodo = entradaAtual;
    } else {
      entradaPeriodo = entradaAtual - entradaAnterior;
    }

    if (houveResetSaida) {
      saidaPeriodo = saidaAtual;
    } else {
      saidaPeriodo = saidaAtual - saidaAnterior;
    }

    if (houveResetDisplay) {
      displayPeriodo = displayValor;
    } else {
      displayPeriodo = displayValor - displayAnterior;
    }

    const lucroPeriodo = entradaPeriodo - saidaPeriodo;

    const reading = await prisma.reading.create({
      data: {
        machineId,
        entradaAtual: parseFloat(String(entradaAtual)),
        saidaAtual: parseFloat(String(saidaAtual)),
        displayValor: parseFloat(String(displayValor)),
        displayAnterior,
        displayPeriodo,
        entradaAnterior,
        saidaAnterior,
        entradaPeriodo,
        saidaPeriodo,
        lucroPeriodo,
        houveReset,
        porcentagemPontoUsada: machine.porcentagemPonto,
      },
      include: { machine: true },
    });

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Erro ao criar leitura:", error);
    return NextResponse.json(
      { error: "Erro ao criar leitura" },
      { status: 500 }
    );
  }
}
