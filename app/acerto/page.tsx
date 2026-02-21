"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Coins,
  TrendingUp,
  TrendingDown,
  Edit2,
  X,
  Check,
  Printer,
} from "lucide-react";

interface MachineReport {
  machine: {
    id: string;
    nome: string;
    localizacao: string;
    porcentagemPonto: number;
  };
  totalEntrada: number;
  totalSaida: number;
  totalLucro: number;
  porcentagemPonto: number;
  valorPonto: number;
  valorOperador: number;
  readings: any[];
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  machines: MachineReport[];
  total: {
    entrada: number;
    saida: number;
    lucro: number;
    valorPonto: number;
    valorOperador: number;
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AcertoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingMachine, setEditingMachine] = useState<string | null>(null);
  const [newPercentage, setNewPercentage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReport();
    }
  }, [status, weekOffset]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-report?weekOffset=${weekOffset}`);
      const json = await res.json();
      setReport(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePercentage = async (machineId: string) => {
    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error("Porcentagem inválida (0-100)");
      return;
    }

    try {
      const res = await fetch(`/api/machines/${machineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentagemPonto: percentage }),
      });

      if (res.ok) {
        toast.success("Porcentagem atualizada!");
        setEditingMachine(null);
        fetchReport();
      } else {
        toast.error("Erro ao atualizar");
      }
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Acerto Semanal" />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Navegação de Semana */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center justify-between"
        >
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <div className="text-sm text-gray-500">Período</div>
            <div className="font-bold">
              {report?.weekStart && report?.weekEnd
                ? `${formatDate(report.weekStart)} - ${formatDate(report.weekEnd)}`
                : "Carregando..."}
            </div>
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </button>
        </motion.div>

        {/* Resumo Geral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-emerald-600 to-emerald-700 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Fechamento Total</h2>
            <button
              onClick={handlePrint}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors print:hidden"
            >
              <Printer size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-sm mb-1">Total Entrou</div>
              <div className="font-bold text-lg">
                {formatCurrency(report?.total?.entrada ?? 0)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-sm mb-1">Total Saiu</div>
              <div className="font-bold text-lg">
                {formatCurrency(report?.total?.saida ?? 0)}
              </div>
            </div>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <div className="text-emerald-100 text-sm mb-1">Lucro Líquido</div>
            <div className="font-bold text-2xl">
              {formatCurrency(report?.total?.lucro ?? 0)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/30 rounded-lg p-3">
              <div className="text-amber-100 text-sm mb-1">Valor do Ponto</div>
              <div className="font-bold text-lg">
                {formatCurrency(report?.total?.valorPonto ?? 0)}
              </div>
            </div>
            <div className="bg-emerald-400/30 rounded-lg p-3">
              <div className="text-emerald-100 text-sm mb-1">
                Valor Operador
              </div>
              <div className="font-bold text-lg">
                {formatCurrency(report?.total?.valorOperador ?? 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Link para Relatório por Ponto */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => router.push("/relatorio-ponto")}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
        >
          <Coins size={20} />
          Ver Relatório por Ponto
        </motion.button>

        {/* Relatório por Máquina */}
        <h2 className="text-lg font-bold text-gray-800 mt-6">Por Máquina</h2>

        {report?.machines?.length === 0 ? (
          <div className="card text-center text-gray-500">
            Nenhuma leitura neste período
          </div>
        ) : (
          report?.machines?.map((m, index) => (
            <motion.div
              key={m?.machine?.id ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">
                    {m?.machine?.nome}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {m?.machine?.localizacao}
                  </p>
                </div>
                <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                  {m?.readings?.length ?? 0} leituras
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Entrada</span>
                  <div className="font-bold text-emerald-600">
                    {formatCurrency(m?.totalEntrada ?? 0)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Saída</span>
                  <div className="font-bold text-red-600">
                    {formatCurrency(m?.totalSaida ?? 0)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Lucro</span>
                  <div
                    className={`font-bold ${
                      (m?.totalLucro ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(m?.totalLucro ?? 0)}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">% do Ponto:</span>
                  {editingMachine === m?.machine?.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded-lg text-sm"
                        value={newPercentage}
                        onChange={(e) => setNewPercentage(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          handleUpdatePercentage(m?.machine?.id ?? '')
                        }
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingMachine(null)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingMachine(m?.machine?.id ?? null);
                        setNewPercentage(String(m?.porcentagemPonto ?? 30));
                      }}
                      className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg"
                    >
                      {m?.porcentagemPonto ?? 0}%
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50 rounded-lg p-2 text-center">
                    <span className="text-xs text-amber-600">Ponto</span>
                    <div className="font-bold text-amber-700">
                      {formatCurrency(m?.valorPonto ?? 0)}
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 text-center">
                    <span className="text-xs text-emerald-600">Operador</span>
                    <div className="font-bold text-emerald-700">
                      {formatCurrency(m?.valorOperador ?? 0)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </main>

      <Navigation />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          nav,
          header button,
          .print\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
          .card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ddd;
          }
        }
      `}</style>
    </div>
  );
}
