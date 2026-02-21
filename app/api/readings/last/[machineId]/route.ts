import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { machineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const lastReading = await prisma.reading.findFirst({
      where: { machineId: params?.machineId },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(lastReading ?? null);
  } catch (error) {
    console.error("Erro ao buscar última leitura:", error);
    return NextResponse.json(
      { error: "Erro ao buscar última leitura" },
      { status: 500 }
    );
  }
}
