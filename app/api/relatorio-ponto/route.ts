import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

function getWeekBounds(weekOffset: number = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0");
    const pontoId = searchParams.get("pontoId");

    const { monday, sunday } = getWeekBounds(weekOffset);

    // Buscar todos os pontos com suas máquinas
    const pontos = await prisma.ponto.findMany({
      where: { ativo: true },
      include: {
        machines: {
          where: { ativa: true },
          include: {
            readings: {
              where: {
                data: { gte: monday, lte: sunday },
              },
            },
          },
        },
      },
    });

    // Filtrar por ponto se especificado
    const pontosFiltered = pontoId
      ? pontos.filter((p) => p.id === pontoId)
      : pontos;

    // Calcular relatório por ponto
    const relatorios = pontosFiltered.map((ponto) => {
      let totalEntrada = 0;
      let totalSaida = 0;
      let totalLucro = 0;
      let totalDisplay = 0;

      const maquinasRelatorio = ponto.machines.map((machine) => {
        const machineEntrada = machine.readings.reduce(
          (sum, r) => sum + r.entradaPeriodo,
          0
        );
        const machineSaida = machine.readings.reduce(
          (sum, r) => sum + r.saidaPeriodo,
          0
        );
        const machineDisplay = machine.readings.reduce(
          (sum, r) => sum + r.displayPeriodo,
          0
        );
        const machineLucro = machineEntrada - machineSaida;

        totalEntrada += machineEntrada;
        totalSaida += machineSaida;
        totalLucro += machineLucro;
        totalDisplay += machineDisplay;

        const valorPonto = machineLucro * (machine.porcentagemPonto / 100);
        const valorOperador = machineLucro - valorPonto;

        return {
          id: machine.id,
          nome: machine.nome,
          tipo: machine.tipo,
          valorMoeda: machine.valorMoeda,
          localizacao: machine.localizacao,
          porcentagemPonto: machine.porcentagemPonto,
          totalEntrada: machineEntrada,
          totalSaida: machineSaida,
          totalDisplay: machineDisplay,
          totalLucro: machineLucro,
          valorPonto,
          valorOperador,
          quantidadeLeituras: machine.readings.length,
        };
      });

      // Calcular valores totais do ponto
      const valorPontoTotal = maquinasRelatorio.reduce(
        (sum, m) => sum + m.valorPonto,
        0
      );
      const valorOperadorTotal = maquinasRelatorio.reduce(
        (sum, m) => sum + m.valorOperador,
        0
      );

      return {
        ponto: {
          id: ponto.id,
          nome: ponto.nome,
          endereco: ponto.endereco,
        },
        maquinas: maquinasRelatorio,
        totais: {
          totalEntrada,
          totalSaida,
          totalDisplay,
          totalLucro,
          valorPonto: valorPontoTotal,
          valorOperador: valorOperadorTotal,
          quantidadeMaquinas: ponto.machines.length,
        },
      };
    });

    // Calcular totais gerais
    const totaisGerais = {
      totalEntrada: relatorios.reduce(
        (sum, r) => sum + r.totais.totalEntrada,
        0
      ),
      totalSaida: relatorios.reduce((sum, r) => sum + r.totais.totalSaida, 0),
      totalDisplay: relatorios.reduce(
        (sum, r) => sum + r.totais.totalDisplay,
        0
      ),
      totalLucro: relatorios.reduce((sum, r) => sum + r.totais.totalLucro, 0),
      valorPonto: relatorios.reduce((sum, r) => sum + r.totais.valorPonto, 0),
      valorOperador: relatorios.reduce(
        (sum, r) => sum + r.totais.valorOperador,
        0
      ),
      quantidadePontos: relatorios.length,
      quantidadeMaquinas: relatorios.reduce(
        (sum, r) => sum + r.totais.quantidadeMaquinas,
        0
      ),
    };

    return NextResponse.json({
      periodo: {
        inicio: monday.toISOString(),
        fim: sunday.toISOString(),
      },
      relatorios,
      totaisGerais,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório por ponto:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
