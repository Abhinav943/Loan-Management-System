"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Coins, CheckCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import type { Loan } from "@/types";

const formatINR = (num: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export default function DisbursementPanel() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSanctionedLoans = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Loan[] }>("/api/dashboard/disbursement/sanctioned");
      setLoans(response.data?.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load sanctioned loans.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchSanctionedLoans();
    })();
  }, []);

  const handleDisburse = async (loanId: string) => {
    const loadToast = toast.loading("Executing capital release transaction...");
    try {
      await api.put(`/api/dashboard/disbursement/disburse/${loanId}`);
      toast.success("Capital Disbursed! Funds released to borrower bank account.", { id: loadToast });
      fetchSanctionedLoans();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to disburse loan.";
      toast.error(msg, { id: loadToast });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <Coins className="h-6 w-6 text-indigo-400" />
          Disbursement - Fund Release
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Approve capital release and execute bank wire transfers for approved credit lines.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
            <p className="text-slate-500 text-xs">Querying sanctioned loans...</p>
          </div>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow">
            <Coins className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No Loans Pending Disbursement</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            There are no credit lines approved by Sanction waiting for capital releases at this time.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-lg backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4 text-right">Disbursement Amount</th>
                  <th className="px-6 py-4 text-center">Tenure</th>
                  <th className="px-6 py-4 text-right">Repayment Due</th>
                  <th className="px-6 py-4">Sanctioned Date</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-slate-300">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-900/20 transition-colors">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {loan.borrowerId?.fullName || "Sanctioned Borrower"}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {loan.borrowerId?.email || "No email"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-100">
                      {formatINR(loan.loanAmount)}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-400">
                      {loan.tenure} days
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {formatINR(loan.totalRepayment)}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {loan.updatedAt ?? loan.createdAt ? formatDate(loan.updatedAt ?? loan.createdAt ?? "") : "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDisburse(loan._id)}
                        className="flex items-center gap-1.5 mx-auto rounded-lg bg-linear-to-r from-emerald-500 to-emerald-600 hover:brightness-110 py-1.5 px-3 font-semibold text-white shadow-md shadow-emerald-500/10 transition-all active:scale-95"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Release Capital
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
