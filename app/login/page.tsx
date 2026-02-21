"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Coins, LogIn, UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Email ou senha inválidos");
        } else {
          toast.success("Login realizado!");
          router.replace("/dashboard");
        }
      } else {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data?.error ?? "Erro ao cadastrar");
        } else {
          toast.success("Conta criada! Fazendo login...");
          const result = await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });
          if (!result?.error) {
            router.replace("/dashboard");
          }
        }
      }
    } catch (error) {
      toast.error("Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <Coins size={40} className="text-amber-300" />
          </div>
          <h1 className="text-3xl font-bold text-white">Caça-Níqueis</h1>
          <p className="text-emerald-100 mt-2">Gestão de Máquinas</p>
        </div>

        <div className="card">
          <div className="flex mb-6">
            <button
              type="button"
              className={`flex-1 py-3 text-center font-semibold rounded-l-xl transition-colors ${
                isLogin
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-center font-semibold rounded-r-xl transition-colors ${
                !isLogin
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="input-label">Nome</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="input-label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-12"
                  placeholder="******"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isLogin ? (
                <LogIn size={20} />
              ) : (
                <UserPlus size={20} />
              )}
              {loading
                ? "Aguarde..."
                : isLogin
                ? "Entrar"
                : "Criar Conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
