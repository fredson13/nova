"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  FileText,
  History,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/lancamento", icon: Plus, label: "Lançar" },
  { href: "/acerto", icon: FileText, label: "Acerto" },
  { href: "/historico", icon: History, label: "Histórico" },
  { href: "/maquinas", icon: Settings, label: "Máquinas" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
