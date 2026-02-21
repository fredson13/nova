"use client";

import { signOut } from "next-auth/react";
import { LogOut, Coins } from "lucide-react";
import toast from "react-hot-toast";

export function Header({ title }: { title: string }) {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-4 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={28} className="text-amber-300" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Sair"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
}
