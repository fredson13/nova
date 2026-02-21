import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekOffset = parseInt(searchParams.get("weekOffset") ?? "0");

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const { start: weekStart, end: weekEnd } = getWeekBounds(baseDate);

    const readings = await prisma.reading.findMany({
      where: {
        data: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: { machine: true },
      orderBy: { data: "asc" },
    });

    // Agrupar por máquina
    const machineMap = new Map<string, any>();
    
    for (const reading of readings) {
      const machineId = reading?.machineId ?? '';
      if (!machineMap.has(machineId)) {
        machineMap.set(machineId, {
          machine: reading?.machine,
          readings: [],
          totalEntrada: 0,
          totalSaida: 0,
          totalLucro: 0,
          porcentagemPonto: reading?.machine?.porcentagemPonto ?? 30,
        });
      }
      const data = machineMap.get(machineId);
      data.readings.push(reading);
      data.totalEntrada += reading?.entradaPeriodo ?? 0;
      data.totalSaida += reading?.saidaPeriodo ?? 0;
      data.totalLucro += reading?.lucroPeriodo ?? 0;
    }

    const machineReports = Array.from(machineMap.values()).map((data) => {
      const valorPonto = data.totalLucro * (data.porcentagemPonto / 100);
      const valorOperador = data.totalLucro - valorPonto;
      return {
        ...data,
        valorPonto,
        valorOperador,
      };
    });

    // Totais gerais
    const totalGeral = {
      entrada: machineReports.reduce((acc, m) => acc + (m?.totalEntrada ?? 0), 0),
      saida: machineReports.reduce((acc, m) => acc + (m?.totalSaida ?? 0), 0),
      lucro: machineReports.reduce((acc, m) => acc + (m?.totalLucro ?? 0), 0),
      valorPonto: machineReports.reduce((acc, m) => acc + (m?.valorPonto ?? 0), 0),
      valorOperador: machineReports.reduce((acc, m) => acc + (m?.valorOperador ?? 0), 0),
    };

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      machines: machineReports,
      total: totalGeral,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório semanal:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório semanal" },
      { status: 500 }
    );
  }
}
