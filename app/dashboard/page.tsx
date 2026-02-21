"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Calendar,
  Activity,
} from "lucide-react";

interface DashboardData {
  today: {
    lucro: number;
    entrada: number;
    saida: number;
    count: number;
  };
  week: {
    lucro: number;
    entrada: number;
    saida: number;
    count: number;
    start: string;
    end: string;
  };
  totalMachines: number;
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
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboard();
    }
  }, [status]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
      <Header title="Dashboard" />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Resumo do Dia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span className="font-semibold">Hoje</span>
            </div>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {data?.today?.count ?? 0} leituras
            </span>
          </div>
          <div className="text-3xl font-bold mb-4">
            {formatCurrency(data?.today?.lucro ?? 0)}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1 text-emerald-100 mb-1">
                <ArrowUpCircle size={16} /> Entrada
              </div>
              <div className="font-semibold">
                {formatCurrency(data?.today?.entrada ?? 0)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1 text-emerald-100 mb-1">
                <ArrowDownCircle size={16} /> Saída
              </div>
              <div className="font-semibold">
                {formatCurrency(data?.today?.saida ?? 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Resumo da Semana */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={20} />
              <span className="font-semibold">Esta Semana</span>
            </div>
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {data?.week?.start && data?.week?.end
                ? `${formatDate(data.week.start)} - ${formatDate(data.week.end)}`
                : ""}
            </span>
          </div>
          <div className="text-3xl font-bold mb-4">
            {formatCurrency(data?.week?.lucro ?? 0)}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1 text-amber-100 mb-1">
                <ArrowUpCircle size={16} /> Entrada
              </div>
              <div className="font-semibold">
                {formatCurrency(data?.week?.entrada ?? 0)}
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1 text-amber-100 mb-1">
                <ArrowDownCircle size={16} /> Saída
              </div>
              <div className="font-semibold">
                {formatCurrency(data?.week?.saida ?? 0)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cards Info */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Coins size={20} className="text-emerald-500" />
              <span className="text-sm font-medium">Máquinas</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {data?.totalMachines ?? 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              {(data?.week?.lucro ?? 0) >= 0 ? (
                <TrendingUp size={20} className="text-green-500" />
              ) : (
                <TrendingDown size={20} className="text-red-500" />
              )}
              <span className="text-sm font-medium">Leituras Semana</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {data?.week?.count ?? 0}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-4 mt-4"
        >
          <button
            onClick={() => router.push("/lancamento")}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <ArrowUpCircle size={20} />
            Nova Leitura
          </button>
          <button
            onClick={() => router.push("/acerto")}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Coins size={20} />
            Ver Acerto
          </button>
        </motion.div>
      </main>

      <Navigation />
    </div>
  );
}
