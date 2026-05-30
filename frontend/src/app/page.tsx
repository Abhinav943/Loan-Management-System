"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const role = user.role;
    if (role === "Borrower") {
      router.push("/borrower");
    } else if (role === "Sales") {
      router.push("/dashboard/sales");
    } else if (role === "Sanction") {
      router.push("/dashboard/sanction");
    } else if (role === "Disbursement") {
      router.push("/dashboard/disbursement");
    } else if (role === "Collection") {
      router.push("/dashboard/collection");
    } else if (role === "Admin") {
      router.push("/dashboard/sales");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
        <p className="text-slate-500 text-sm font-medium">Navigating to Portal...</p>
      </div>
    </div>
  );
}
