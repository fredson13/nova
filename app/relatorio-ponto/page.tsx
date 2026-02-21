"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Monitor,
  Printer,
  TrendingUp,
  TrendingDown,
  Coins,
} from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";

interface MaquinaRelatorio {
  id: string;
  nome: string;
  tipo: string | null;
  valorMoeda: number;
  localizacao: string;
  porcentagemPonto: number;
  totalEntrada: number;
  totalSaida: number;
  totalDisplay: number;
  totalLucro: number;
  valorPonto: number;
  valorOperador: number;
  quantidadeLeituras: number;
}

interface PontoRelatorio {
  ponto: {
    id: string;
    nome: string;
    endereco: string | null;
  };
  maquinas: MaquinaRelatorio[];
  totais: {
    totalEntrada: number;
    totalSaida: number;
    totalDisplay: number;
    totalLucro: number;
    valorPonto: number;
    valorOperador: number;
    quantidadeMaquinas: number;
  };
}

interface RelatorioData {
  periodo: { inicio: string; fim: string };
  relatorios: PontoRelatorio[];
  totaisGerais: {
    totalEntrada: number;
    totalSaida: number;
    totalDisplay: number;
    totalLucro: number;
    valorPonto: number;
    valorOperador: number;
    quantidadePontos: number;
    quantidadeMaquinas: number;
  };
}

interface Ponto {
  id: string;
  nome: string;
}

export default function RelatorioPontoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedPontoId, setSelectedPontoId] = useState<string>("");
  const [expandedPonto, setExpandedPonto] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPontos();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRelatorio();
    }
  }, [status, weekOffset, selectedPontoId]);

  const fetchPontos = async () => {
    try {
      const res = await fetch("/api/pontos");
      const data = await res.json();
      setPontos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRelatorio = async () => {
    try {
      setLoading(true);
      let url = `/api/relatorio-ponto?weekOffset=${weekOffset}`;
      if (selectedPontoId) {
        url += `&pontoId=${selectedPontoId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setRelatorio(data);
    } catch (error) {
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Relatório por Ponto" />

      <main className="p-4 max-w-lg mx-auto">
        {/* Filtro de Ponto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-4"
        >
          <label className="input-label">Filtrar por Ponto</label>
          <select
            value={selectedPontoId}
            onChange={(e) => setSelectedPontoId(e.target.value)}
            className="input-field"
          >
            <option value="">Todos os Pontos</option>
            {pontos.map((ponto) => (
              <option key={ponto.id} value={ponto.id}>
                {ponto.nome}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Navegação de Semana */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-gray-800">
                {relatorio
                  ? `${formatDate(relatorio.periodo.inicio)} - ${formatDate(
                      relatorio.periodo.fim
                    )}`
                  : "Carregando..."}
              </p>
              <p className="text-sm text-gray-500">
                {weekOffset === 0
                  ? "Semana Atual"
                  : weekOffset === -1
                  ? "Semana Passada"
                  : `${Math.abs(weekOffset)} semana(s) atrás`}
              </p>
            </div>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={weekOffset >= 0}
            >
              <ChevronRight
                className={`w-6 h-6 ${weekOffset >= 0 ? "opacity-30" : ""}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Totais Gerais */}
        {relatorio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 mb-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white"
          >
            <h3 className="font-bold text-lg mb-3">Fechamento Geral</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="opacity-80">Total Entrou:</span>
                <p className="font-bold text-lg">
                  {formatCurrency(relatorio.totaisGerais.totalEntrada)}
                </p>
              </div>
              <div>
                <span className="opacity-80">Total Saiu:</span>
                <p className="font-bold text-lg">
                  {formatCurrency(relatorio.totaisGerais.totalSaida)}
                </p>
              </div>
              <div>
                <span className="opacity-80">Lucro Líquido:</span>
                <p className="font-bold text-lg flex items-center gap-1">
                  {relatorio.totaisGerais.totalLucro >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatCurrency(relatorio.totaisGerais.totalLucro)}
                </p>
              </div>
              <div>
                <span className="opacity-80">Display Período:</span>
                <p className="font-bold text-lg">
                  {relatorio.totaisGerais.totalDisplay.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="border-t border-white/30 mt-3 pt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="opacity-80">Valor dos Pontos:</span>
                <p className="font-bold text-lg">
                  {formatCurrency(relatorio.totaisGerais.valorPonto)}
                </p>
              </div>
              <div>
                <span className="opacity-80">Valor Operador:</span>
                <p className="font-bold text-lg">
                  {formatCurrency(relatorio.totaisGerais.valorOperador)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 text-xs opacity-80">
              <span>{relatorio.totaisGerais.quantidadePontos} ponto(s)</span>
              <span>•</span>
              <span>
                {relatorio.totaisGerais.quantidadeMaquinas} máquina(s)
              </span>
            </div>
          </motion.div>
        )}

        {/* Relatório por Ponto */}
        {relatorio?.relatorios.map((pontoRel, index) => (
          <motion.div
            key={pontoRel.ponto.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card mb-4 overflow-hidden"
          >
            {/* Cabeçalho do Ponto */}
            <button
              onClick={() =>
                setExpandedPonto(
                  expandedPonto === pontoRel.ponto.id ? null : pontoRel.ponto.id
                )
              }
              className="w-full p-4 flex items-center justify-between bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">
                    {pontoRel.ponto.nome}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {pontoRel.totais.quantidadeMaquinas} máquina(s)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    pontoRel.totais.totalLucro >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(pontoRel.totais.totalLucro)}
                </p>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedPonto === pontoRel.ponto.id ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            {/* Totais do Ponto */}
            <div className="p-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Entrou:</span>
                  <p className="font-semibold">
                    {formatCurrency(pontoRel.totais.totalEntrada)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Saiu:</span>
                  <p className="font-semibold">
                    {formatCurrency(pontoRel.totais.totalSaida)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Display:</span>
                  <p className="font-semibold">
                    {pontoRel.totais.totalDisplay.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                <div>
                  <span className="text-gray-500">Valor do Ponto:</span>
                  <p className="font-bold text-purple-600">
                    {formatCurrency(pontoRel.totais.valorPonto)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Valor Operador:</span>
                  <p className="font-bold text-blue-600">
                    {formatCurrency(pontoRel.totais.valorOperador)}
                  </p>
                </div>
              </div>
            </div>

            {/* Máquinas (expandido) */}
            {expandedPonto === pontoRel.ponto.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="border-t border-gray-100"
              >
                {pontoRel.maquinas.map((maquina) => (
                  <div
                    key={maquina.id}
                    className="p-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-800">
                        {maquina.nome}
                      </span>
                      {maquina.tipo && (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {maquina.tipo}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        R$ {maquina.valorMoeda.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Entrada:</span>
                        <p className="font-medium">
                          {maquina.totalEntrada.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Saída:</span>
                        <p className="font-medium">
                          {maquina.totalSaida.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Display:</span>
                        <p className="font-medium">
                          {maquina.totalDisplay.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Lucro:</span>
                        <p
                          className={`font-bold ${
                            maquina.totalLucro >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(maquina.totalLucro)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-purple-600">
                        Ponto ({maquina.porcentagemPonto}%):{" "}
                        {formatCurrency(maquina.valorPonto)}
                      </span>
                      <span className="text-blue-600">
                        Operador: {formatCurrency(maquina.valorOperador)}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}

        {relatorio?.relatorios.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">
              Nenhum dado encontrado
            </h3>
            <p className="text-sm text-gray-500">
              Não há leituras para este período
            </p>
          </div>
        )}

        {/* Botão Imprimir */}
        <button
          onClick={handlePrint}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2 mt-4"
        >
          <Printer className="w-5 h-5" />
          Imprimir Relatório
        </button>
      </main>

      <Navigation />
    </div>
  );
}
