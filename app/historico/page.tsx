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
  Filter,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Calendar,
  X,
} from "lucide-react";

interface Reading {
  id: string;
  machineId: string;
  machine: {
    nome: string;
    localizacao: string;
  };
  data: string;
  entradaAtual: number;
  saidaAtual: number;
  displayValor: number;
  entradaAnterior: number;
  saidaAnterior: number;
  entradaPeriodo: number;
  saidaPeriodo: number;
  lucroPeriodo: number;
  houveReset: boolean;
  porcentagemPontoUsada: number;
}

interface Machine {
  id: string;
  nome: string;
  localizacao: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoricoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedMachine, setSelectedMachine] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMachines();
      fetchReadings();
    }
  }, [status]);

  const fetchMachines = async () => {
    try {
      const res = await fetch("/api/machines");
      const json = await res.json();
      setMachines(json ?? []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMachine) params.append("machineId", selectedMachine);
      if (startDate) params.append("startDate", startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.append("endDate", end.toISOString());
      }

      const res = await fetch(`/api/readings?${params.toString()}`);
      const json = await res.json();
      setReadings(json ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchReadings();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedMachine("");
    setStartDate("");
    setEndDate("");
    setTimeout(fetchReadings, 100);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir esta leitura?")) return;

    try {
      const res = await fetch(`/api/readings/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Leitura excluída!");
        fetchReadings();
      } else {
        toast.error("Erro ao excluir");
      }
    } catch (error) {
      toast.error("Erro ao excluir");
    }
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
      <Header title="Histórico" />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Botão de Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex-1 flex items-center justify-center gap-2"
          >
            <Filter size={20} />
            Filtros
            {(selectedMachine || startDate || endDate) && (
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                Ativos
              </span>
            )}
          </button>
          {(selectedMachine || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="btn-danger px-4"
              title="Limpar filtros"
            >
              <X size={20} />
            </button>
          )}
        </motion.div>

        {/* Painel de Filtros */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="card space-y-4"
          >
            <div>
              <label className="input-label">Máquina</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-10"
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                >
                  <option value="">Todas as máquinas</option>
                  {machines?.map((m) => (
                    <option key={m?.id} value={m?.id}>
                      {m?.nome} - {m?.localizacao}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Data Início</label>
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Data Fim</label>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button onClick={handleFilter} className="btn-primary w-full">
              Aplicar Filtros
            </button>
          </motion.div>
        )}

        {/* Contador */}
        <div className="text-sm text-gray-500">
          {readings?.length ?? 0} leituras encontradas
        </div>

        {/* Lista de Leituras */}
        {readings?.length === 0 ? (
          <div className="card text-center text-gray-500 py-10">
            <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
            Nenhuma leitura encontrada
          </div>
        ) : (
          readings?.map((r, index) => (
            <motion.div
              key={r?.id ?? index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(index, 10) }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">
                    {r?.machine?.nome}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(r?.data)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r?.houveReset && (
                    <span
                      className="text-amber-500"
                      title="Houve reset de contador"
                    >
                      <AlertTriangle size={18} />
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(r?.id ?? '')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Entrada Atual</span>
                  <div className="font-bold">
                    {r?.entradaAtual?.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Saída Atual</span>
                  <div className="font-bold">
                    {r?.saidaAtual?.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <span className="text-gray-500">Display</span>
                  <div className="font-bold">
                    {formatCurrency(r?.displayValor ?? 0)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div className="bg-emerald-50 rounded-lg p-2">
                  <span className="text-emerald-600">Ent. Período</span>
                  <div className="font-bold text-emerald-700">
                    {r?.entradaPeriodo?.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <span className="text-red-600">Saí. Período</span>
                  <div className="font-bold text-red-700">
                    {r?.saidaPeriodo?.toLocaleString("pt-BR")}
                  </div>
                </div>
                <div
                  className={`rounded-lg p-2 ${
                    (r?.lucroPeriodo ?? 0) >= 0
                      ? "bg-emerald-100"
                      : "bg-red-100"
                  }`}
                >
                  <span
                    className={(
                      r?.lucroPeriodo ?? 0) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    Lucro
                  </span>
                  <div
                    className={`font-bold ${
                      (r?.lucroPeriodo ?? 0) >= 0
                        ? "text-emerald-700"
                        : "text-red-700"
                    }`}
                  >
                    {formatCurrency(r?.lucroPeriodo ?? 0)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 flex justify-between">
                <span>% Ponto usado: {r?.porcentagemPontoUsada ?? 0}%</span>
                {r?.houveReset && (
                  <span className="text-amber-600 font-medium">
                    Reset de contador
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </main>

      <Navigation />
    </div>
  );
}
