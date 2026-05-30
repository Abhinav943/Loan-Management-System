"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Users, FileCheck, Ban, Search, Calendar } from "lucide-react";
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

export default function SalesPanel() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [rejectingLoanId, setRejectingLoanId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ data: Loan[] }>("/api/dashboard/sales/pending");
      setLoans(response.data?.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load pending leads.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchLeads();
    })();
  }, []);

  const handleVerify = async (loanId: string) => {
    const loadToast = toast.loading("Verifying applicant details...");
    try {
      await api.put(`/api/dashboard/sales/verify/${loanId}`, {
        status: "Verified"
      });
      toast.success("Lead verified! Forwarded to Sanction panel.", { id: loadToast });
      fetchLeads();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to verify lead.";
      toast.error(msg, { id: loadToast });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLoanId || !rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    const loadToast = toast.loading("Recording rejection decision...");
    try {
      await api.put(`/api/dashboard/sales/verify/${rejectingLoanId}`, {
        status: "Rejected",
        rejectionReason: rejectionReason
      });
      toast.success("Application successfully rejected.", { id: loadToast });
      setRejectingLoanId(null);
      setRejectionReason("");
      fetchLeads();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to record rejection.";
      toast.error(msg, { id: loadToast });
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const name = loan.borrowerId?.fullName || "";
    const email = loan.borrowerId?.email || "";
    const pan = loan.pan || "";
    const query = search.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      pan.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
            <Users className="h-6 w-6 text-indigo-400 animate-pulse" />
            Sales - Lead Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and verify incoming borrower pre-applications (Pending Verification).
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-900 bg-slate-900/50 py-2.5 pr-4 pl-10 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
            <p className="text-slate-500 text-xs">Querying pending applications...</p>
          </div>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No Pending Leads</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            There are no active applications waiting for Sales verification at this time.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-lg backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4 font-mono">PAN</th>
                  <th className="px-6 py-4 text-right">Income</th>
                  <th className="px-6 py-4 text-right">Amount Required</th>
                  <th className="px-6 py-4 text-center">Tenure</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-slate-300">
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {loan.borrowerId?.fullName || "Unregistered Lead"}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {loan.borrowerId?.email || "No email"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono text-slate-400 uppercase tracking-wider">
                      {loan.pan}
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-300">
                      {loan.monthlySalary ? formatINR(loan.monthlySalary) : "—"}
                      <span className="block text-[9px] text-indigo-400 font-normal">
                        {loan.employmentMode}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {formatINR(loan.loanAmount)}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-400">
                      {loan.tenure} days
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {loan.createdAt ? formatDate(loan.createdAt) : "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerify(loan._id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-2.5 font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
                          title="Verify Lead"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          Verify
                        </button>

                        <button
                          onClick={() => setRejectingLoanId(loan._id)}
                          className="flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/20 py-1.5 px-2.5 font-semibold text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
                          title="Reject Application"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectingLoanId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ban className="h-5 w-5 text-rose-500" />
                Reject Loan Lead
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Please enter a valid rejection reason to decline this loan request. This is logged and shown to the borrower.
              </p>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                required
                rows={3}
                placeholder="Applicant has insufficient credit scoring / documents failed verification..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingLoanId(null);
                    setRejectionReason("");
                  }}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-500"
                >
                  Decline Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
