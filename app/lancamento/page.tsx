"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Monitor, Save, AlertTriangle, ArrowLeft, MapPin, Coins } from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";

interface Machine {
  id: string;
  nome: string;
  tipo: string | null;
  valorMoeda: number;
  localizacao: string;
  porcentagemPonto: number;
  ponto?: { id: string; nome: string } | null;
}

interface LastReading {
  entradaAtual: number;
  saidaAtual: number;
  displayValor: number;
  data: string;
}

function LancamentoContent() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedMachineId = searchParams.get("machineId");

  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [lastReading, setLastReading] = useState<LastReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [entradaAtual, setEntradaAtual] = useState("");
  const [saidaAtual, setSaidaAtual] = useState("");
  const [displayValor, setDisplayValor] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMachines();
    }
  }, [status]);

  useEffect(() => {
    if (preSelectedMachineId && machines.length > 0) {
      setSelectedMachine(preSelectedMachineId);
    }
  }, [preSelectedMachineId, machines]);

  useEffect(() => {
    if (selectedMachine) {
      fetchLastReading(selectedMachine);
    } else {
      setLastReading(null);
    }
  }, [selectedMachine]);

  const fetchMachines = async () => {
    try {
      const res = await fetch("/api/machines");
      const data = await res.json();
      setMachines(data);
    } catch (error) {
      toast.error("Erro ao carregar máquinas");
    } finally {
      setLoading(false);
    }
  };

  const fetchLastReading = async (machineId: string) => {
    try {
      const res = await fetch(`/api/readings/last/${machineId}`);
      const data = await res.json();
      setLastReading(data);
    } catch (error) {
      setLastReading(null);
    }
  };

  const currentMachine = machines.find((m) => m.id === selectedMachine);

  // Cálculos
  const entradaNum = parseFloat(entradaAtual) || 0;
  const saidaNum = parseFloat(saidaAtual) || 0;
  const displayNum = parseFloat(displayValor) || 0;

  const entradaAnterior = lastReading?.entradaAtual ?? 0;
  const saidaAnterior = lastReading?.saidaAtual ?? 0;
  const displayAnterior = lastReading?.displayValor ?? 0;

  const houveResetEntrada = entradaNum < entradaAnterior && entradaNum > 0;
  const houveResetSaida = saidaNum < saidaAnterior && saidaNum > 0;
  const houveResetDisplay = displayNum < displayAnterior && displayNum > 0;
  const houveReset = houveResetEntrada || houveResetSaida || houveResetDisplay;

  const entradaPeriodo = houveResetEntrada ? entradaNum : entradaNum - entradaAnterior;
  const saidaPeriodo = houveResetSaida ? saidaNum : saidaNum - saidaAnterior;
  const displayPeriodo = houveResetDisplay ? displayNum : displayNum - displayAnterior;
  const lucroPeriodo = entradaPeriodo - saidaPeriodo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMachine) {
      toast.error("Selecione uma máquina");
      return;
    }

    if (!entradaAtual || !saidaAtual || !displayValor) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineId: selectedMachine,
          entradaAtual: entradaNum,
          saidaAtual: saidaNum,
          displayValor: displayNum,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Leitura registrada com sucesso!");
      setEntradaAtual("");
      setSaidaAtual("");
      setDisplayValor("");
      fetchLastReading(selectedMachine);
    } catch (error) {
      toast.error("Erro ao registrar leitura");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
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
      <Header title="Lançar Leitura" />

      <main className="p-4 max-w-lg mx-auto">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para seleção
          </button>

          {/* Seleção de Máquina */}
          <div className="card p-4">
            <label className="input-label">Máquina</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="input-field text-lg"
            >
              <option value="">Selecione uma máquina</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.nome} - {machine.localizacao}
                </option>
              ))}
            </select>

            {/* Info da Máquina Selecionada */}
            {currentMachine && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Monitor className="w-4 h-4" />
                  <span className="font-medium">{currentMachine.nome}</span>
                </div>
                {currentMachine.ponto && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{currentMachine.ponto.nome}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Tipo: {currentMachine.tipo || "N/D"}</span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    Moeda: R$ {currentMachine.valorMoeda.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Leitura Anterior */}
          {lastReading && (
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Leitura Anterior</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-blue-600">Entrada:</span>
                  <p className="font-bold text-blue-800">{entradaAnterior.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-blue-600">Saída:</span>
                  <p className="font-bold text-blue-800">{saidaAnterior.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-blue-600">Display:</span>
                  <p className="font-bold text-blue-800">{displayAnterior.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                {new Date(lastReading.data).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}

          {/* Campos de Entrada */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Valores Atuais</h3>
            <div className="space-y-4">
              <div>
                <label className="input-label">Entrada Atual</label>
                <input
                  type="number"
                  value={entradaAtual}
                  onChange={(e) => setEntradaAtual(e.target.value)}
                  className="input-field text-xl font-bold"
                  placeholder="0"
                  step="any"
                />
              </div>
              <div>
                <label className="input-label">Saída Atual</label>
                <input
                  type="number"
                  value={saidaAtual}
                  onChange={(e) => setSaidaAtual(e.target.value)}
                  className="input-field text-xl font-bold"
                  placeholder="0"
                  step="any"
                />
              </div>
              <div>
                <label className="input-label">Display Atual</label>
                <input
                  type="number"
                  value={displayValor}
                  onChange={(e) => setDisplayValor(e.target.value)}
                  className="input-field text-xl font-bold"
                  placeholder="0"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Prévia dos Cálculos */}
          {selectedMachine && (entradaAtual || saidaAtual || displayValor) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
            >
              <h3 className="font-semibold text-green-800 mb-3">Prévia do Cálculo</h3>

              {houveReset && (
                <div className="flex items-center gap-2 p-2 bg-yellow-100 text-yellow-800 rounded-lg mb-3 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Detectado reset de contador
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Entrada Período</span>
                  <p className="text-lg font-bold text-gray-800">
                    {entradaPeriodo.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Saída Período</span>
                  <p className="text-lg font-bold text-gray-800">
                    {saidaPeriodo.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Display Período</span>
                  <p className="text-lg font-bold text-purple-600">
                    {displayPeriodo.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${lucroPeriodo >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <span className="text-xs text-gray-500">Lucro Período</span>
                  <p className={`text-lg font-bold ${lucroPeriodo >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatCurrency(lucroPeriodo)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={saving || !selectedMachine}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-6 h-6" />
            {saving ? "Salvando..." : "Registrar Leitura"}
          </button>
        </motion.form>
      </main>

      <Navigation />
    </div>
  );
}

export default function LancamentoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <LancamentoContent />
    </Suspense>
  );
}
