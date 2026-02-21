"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Monitor, ChevronRight, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";

interface Machine {
  id: string;
  nome: string;
  tipo: string | null;
  valorMoeda: number;
  localizacao: string;
}

interface Ponto {
  id: string;
  nome: string;
  endereco: string | null;
  machines: Machine[];
}

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [machinesSemPonto, setMachinesSemPonto] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPonto, setSelectedPonto] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [pontosRes, machinesRes] = await Promise.all([
        fetch("/api/pontos"),
        fetch("/api/machines")
      ]);
      
      const pontosData = await pontosRes.json();
      const machinesData = await machinesRes.json();
      
      setPontos(pontosData);
      
      // Máquinas sem ponto vinculado
      const semPonto = machinesData.filter((m: any) => !m.pontoId);
      setMachinesSemPonto(semPonto);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMachine = (machineId: string) => {
    router.push(`/lancamento?machineId=${machineId}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Selecionar Ponto" />

      <main className="p-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Escolha o Ponto para Lançar Leitura
          </h2>
          <p className="text-sm text-gray-500">
            Selecione um ponto e depois a máquina
          </p>
        </motion.div>

        {/* Lista de Pontos */}
        <div className="space-y-4">
          {pontos.map((ponto, index) => (
            <motion.div
              key={ponto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <button
                onClick={() => setSelectedPonto(selectedPonto === ponto.id ? null : ponto.id)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">{ponto.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {ponto.machines.length} máquina(s)
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedPonto === ponto.id ? "rotate-90" : ""}`}
                />
              </button>

              {/* Máquinas do Ponto */}
              {selectedPonto === ponto.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-gray-100"
                >
                  {ponto.machines.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">
                      Nenhuma máquina cadastrada neste ponto
                    </p>
                  ) : (
                    <div className="p-2">
                      {ponto.machines.map((machine) => (
                        <button
                          key={machine.id}
                          onClick={() => handleSelectMachine(machine.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-left flex-1">
                            <h4 className="font-medium text-gray-800">{machine.nome}</h4>
                            <p className="text-xs text-gray-500">
                              {machine.tipo || "Tipo não definido"} • Moeda: R$ {machine.valorMoeda.toFixed(2)}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Máquinas sem Ponto */}
          {machinesSemPonto.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <button
                onClick={() => setSelectedPonto(selectedPonto === "sem-ponto" ? null : "sem-ponto")}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">Máquinas Avulsas</h3>
                    <p className="text-sm text-gray-500">
                      {machinesSemPonto.length} máquina(s) sem ponto
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedPonto === "sem-ponto" ? "rotate-90" : ""}`}
                />
              </button>

              {selectedPonto === "sem-ponto" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-gray-100"
                >
                  <div className="p-2">
                    {machinesSemPonto.map((machine) => (
                      <button
                        key={machine.id}
                        onClick={() => handleSelectMachine(machine.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="font-medium text-gray-800">{machine.nome}</h4>
                          <p className="text-xs text-gray-500">
                            {machine.tipo || "Tipo não definido"} • {machine.localizacao}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {pontos.length === 0 && machinesSemPonto.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum ponto cadastrado
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Cadastre um ponto para começar
              </p>
              <button
                onClick={() => router.push("/pontos")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Cadastrar Ponto
              </button>
            </div>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-secondary py-3"
          >
            Ver Dashboard
          </button>
          <button
            onClick={() => router.push("/acerto")}
            className="btn-primary py-3"
          >
            Ver Acerto
          </button>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
