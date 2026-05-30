"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardIndex() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const role = user.role;
    if (role === "Sales") {
      router.push("/dashboard/sales");
    } else if (role === "Sanction") {
      router.push("/dashboard/sanction");
    } else if (role === "Disbursement") {
      router.push("/dashboard/disbursement");
    } else if (role === "Collection") {
      router.push("/dashboard/collection");
    } else if (role === "Admin") {
      router.push("/dashboard/sales");
    } else {
      router.push("/unauthorized");
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center py-20 bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-indigo-500"></div>
        <p className="text-slate-500 text-xs font-medium">Entering Dashboard Panel...</p>
      </div>
    </div>
  );
}
