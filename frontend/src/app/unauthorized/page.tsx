"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Unauthorized() {
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/20 bg-slate-900/60 p-8 text-center backdrop-blur-xl shadow-2xl shadow-rose-950/25">

        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-rose-500/5 blur-3xl"></div>

        <div className="relative">

          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-100">
            Access Denied
          </h1>
          
          <p className="mb-6 text-sm text-slate-400">
            Your account ({user?.email}) with the role <span className="font-semibold text-rose-400">{user?.role || "unknown"}</span> does not have authorization to view this resource.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (user?.role === "Borrower") {
                  router.push("/borrower");
                } else if (user?.role) {
                  router.push("/dashboard");
                } else {
                  router.push("/login");
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-700 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back to Portal
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
