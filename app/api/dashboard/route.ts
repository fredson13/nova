import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { start: weekStart, end: weekEnd } = getWeekBounds(now);

    // Leituras de hoje
    const todayReadings = await prisma.reading.findMany({
      where: {
        data: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: { machine: true },
    });

    // Leituras da semana
    const weekReadings = await prisma.reading.findMany({
      where: {
        data: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: { machine: true },
    });

    // Calcular totais
    const todayTotal = todayReadings.reduce((acc, r) => acc + (r?.lucroPeriodo ?? 0), 0);
    const weekTotal = weekReadings.reduce((acc, r) => acc + (r?.lucroPeriodo ?? 0), 0);

    const todayEntrada = todayReadings.reduce((acc, r) => acc + (r?.entradaPeriodo ?? 0), 0);
    const todaySaida = todayReadings.reduce((acc, r) => acc + (r?.saidaPeriodo ?? 0), 0);

    const weekEntrada = weekReadings.reduce((acc, r) => acc + (r?.entradaPeriodo ?? 0), 0);
    const weekSaida = weekReadings.reduce((acc, r) => acc + (r?.saidaPeriodo ?? 0), 0);

    // Total de máquinas ativas
    const totalMachines = await prisma.machine.count({
      where: { ativa: true },
    });

    // Leituras de hoje
    const todayCount = todayReadings.length;

    return NextResponse.json({
      today: {
        lucro: todayTotal,
        entrada: todayEntrada,
        saida: todaySaida,
        count: todayCount,
      },
      week: {
        lucro: weekTotal,
        entrada: weekEntrada,
        saida: weekSaida,
        count: weekReadings.length,
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      },
      totalMachines,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
