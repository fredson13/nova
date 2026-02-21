"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Edit2, Trash2, X, Check, Monitor } from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";

interface Machine {
  id: string;
  nome: string;
}

interface Ponto {
  id: string;
  nome: string;
  endereco: string | null;
  machines: Machine[];
}

export default function PontosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", endereco: "" });

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

  const fetchPontos = async () => {
    try {
      const res = await fetch("/api/pontos");
      const data = await res.json();
      setPontos(data);
    } catch (error) {
      toast.error("Erro ao carregar pontos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const url = editingId ? `/api/pontos/${editingId}` : "/api/pontos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(editingId ? "Ponto atualizado!" : "Ponto cadastrado!");
      setShowForm(false);
      setEditingId(null);
      setFormData({ nome: "", endereco: "" });
      fetchPontos();
    } catch (error) {
      toast.error("Erro ao salvar ponto");
    }
  };

  const handleEdit = (ponto: Ponto) => {
    setFormData({ nome: ponto.nome, endereco: ponto.endereco || "" });
    setEditingId(ponto.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este ponto?")) return;

    try {
      await fetch(`/api/pontos/${id}`, { method: "DELETE" });
      toast.success("Ponto excluído!");
      fetchPontos();
    } catch (error) {
      toast.error("Erro ao excluir ponto");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: "", endereco: "" });
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
      <Header title="Pontos" />

      <main className="p-4 max-w-lg mx-auto">
        {/* Botão Adicionar */}
        {!showForm && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowForm(true)}
            className="w-full btn-primary mb-4 flex items-center justify-center gap-2 py-4"
          >
            <Plus className="w-6 h-6" />
            Cadastrar Novo Ponto
          </motion.button>
        )}

        {/* Formulário */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 mb-4"
          >
            <h3 className="font-semibold text-lg mb-4">
              {editingId ? "Editar Ponto" : "Novo Ponto"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Nome do Ponto *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Bar do João"
                />
              </div>
              <div>
                <label className="input-label">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Rua das Flores, 123"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelForm} className="btn-secondary flex-1">
                  <X className="w-5 h-5 mr-2 inline" />
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  <Check className="w-5 h-5 mr-2 inline" />
                  {editingId ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Lista de Pontos */}
        <div className="space-y-3">
          {pontos.map((ponto, index) => (
            <motion.div
              key={ponto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{ponto.nome}</h3>
                    {ponto.endereco && (
                      <p className="text-sm text-gray-500">{ponto.endereco}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Monitor className="w-3 h-3" />
                      {ponto.machines.length} máquina(s)
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(ponto)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ponto.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {pontos.length === 0 && !showForm && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">
                Nenhum ponto cadastrado
              </h3>
              <p className="text-sm text-gray-500">
                Clique no botão acima para cadastrar
              </p>
            </div>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}
