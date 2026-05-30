"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  ShieldCheck,
  Coins,
  CreditCard,
  LogOut,
  Landmark,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    {
      name: "Sales (Leads)",
      path: "/dashboard/sales",
      icon: Users,
      roles: ["Admin", "Sales"]
    },
    {
      name: "Sanction Review",
      path: "/dashboard/sanction",
      icon: ShieldCheck,
      roles: ["Admin", "Sanction"]
    },
    {
      name: "Disbursement",
      path: "/dashboard/disbursement",
      icon: Coins,
      roles: ["Admin", "Disbursement"]
    },
    {
      name: "Collection",
      path: "/dashboard/collection",
      icon: CreditCard,
      roles: ["Admin", "Collection"]
    }
  ];

  const visibleModules = modules.filter(
    (mod) => user && mod.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-900 bg-slate-900/30 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-indigo-600 text-white shadow-md shadow-emerald-500/20">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-100">LMS</span>
        </div>

        <div className="px-6 py-5 border-b border-slate-900/50 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.fullName}</p>
            <span className="inline-block mt-0.5 rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/15 uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          {visibleModules.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-linear-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500 font-bold"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-400" />
            Logout
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="relative flex w-full max-w-xs flex-col bg-slate-900 p-6 border-r border-slate-850">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pb-6 border-b border-slate-850 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-indigo-600 text-white">
                <Landmark className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-100">LMS</span>
            </div>

            <nav className="flex-1 space-y-1">
              {visibleModules.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-850">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex h-16 items-center justify-between border-b border-slate-900 bg-slate-900/30 px-6 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-emerald-500 to-indigo-600 text-white">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-200 text-sm">LMS</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
