"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { CreditCard, Search, PlusCircle, History, ArrowRight, X, FileCheck } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import type { Loan, Payment, CelebrationInfo } from "@/types";

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

export default function CollectionPanel() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [recordingLoan, setRecordingLoan] = useState<Loan | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [actionLoading, setActionLoading] = useState(false);

  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  const [celebratingLoan, setCelebratingLoan] = useState<CelebrationInfo | null>(null);

  const fetchDisbursedLoans = async () => {
    try {
      const response = await api.get<{ data: Loan[] }>("/api/dashboard/collection/disbursed");
      setLoans(response.data?.data || []);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message || "Failed to load active credit lines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchDisbursedLoans();
    })();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingLoan || !utrNumber.trim() || !paymentAmount || paymentAmount <= 0) {
      toast.error("Please fill in all required payment details.");
      return;
    }
    const uppercaseUtr = utrNumber.trim().toUpperCase();
    const allUtrs = loans.flatMap((l) => l.payments || []).map((p) => p.utrNumber.toUpperCase());
    if (allUtrs.includes(uppercaseUtr)) {
      toast.error("This UTR number has already been recorded in the system.");
      return;
    }

    setActionLoading(true);
    const loadToast = toast.loading("Recording transaction ledger...");
    try {
      const response = await api.post(`/api/dashboard/collection/payment/${recordingLoan._id}`, {
        utrNumber: uppercaseUtr,
        amount: Number(paymentAmount),
        paymentDate: paymentDate
      });

      const result = response.data?.data as { loanStatus?: string } | undefined;
      
      const totalPaidSoFar = (recordingLoan.totalPaid || 0) + Number(paymentAmount);
      
      if (totalPaidSoFar >= recordingLoan.totalRepayment || result?.loanStatus === "Closed") {
        setCelebratingLoan({
          borrowerName: recordingLoan.borrowerId?.fullName || "Borrower",
          amount: recordingLoan.totalRepayment
        });
        setRecordingLoan(null);
      } else {
        toast.success("Payment recorded successfully!", { id: loadToast });
        setRecordingLoan(null);
      }

      setUtrNumber("");
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().substring(0, 10));
      setLoading(true);
      fetchDisbursedLoans();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message || "Failed to record payment.", { id: loadToast });
    } finally {
      setActionLoading(false);
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
            <CreditCard className="h-6 w-6 text-indigo-400" />
            Collection - Repayment Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor credit balances, inspect payment histories, and record new payment redemptions.
          </p>
        </div>


        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search active accounts by name..."
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
            <p className="text-slate-500 text-xs">Querying collection logs...</p>
          </div>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow">
            <CreditCard className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No Active Disbursed Loans</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            There are no active, disbursed credit balances currently outstanding.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLoans.map((loan) => {
            const paid = loan.totalPaid || 0;
            const owed = loan.totalRepayment;
            const remaining = loan.remainingBalance ?? Math.max(0, owed - paid);
            const progress = Math.min(100, (paid / owed) * 100);

            return (
              <div
                key={loan._id}
                className="rounded-2xl border border-slate-900 bg-slate-900/15 p-6 space-y-4 hover:border-slate-800 transition-all flex flex-col justify-between shadow-md"
              >
                <div>

                  <div className="flex justify-between items-start border-b border-slate-900/60 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        {loan.borrowerId?.fullName || "Active Borrower"}
                      </h3>
                      <p className="text-slate-500 text-[10px] mt-0.5">{loan.borrowerId?.email}</p>
                    </div>
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                      Active Balance
                    </span>
                  </div>


                  <div className="grid grid-cols-3 gap-2 py-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Total Repayment</span>
                      <span className="text-slate-300 font-semibold">{formatINR(owed)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Total Repaid</span>
                      <span className="text-slate-300 font-semibold">{formatINR(paid)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Outstanding</span>
                      <span className="text-indigo-400 font-bold">{formatINR(remaining)}</span>
                    </div>
                  </div>


                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Repayment progress</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-900/40 mt-4">
                  <button
                    onClick={() => setHistoryLoan(loan)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <History className="h-3.5 w-3.5" />
                    Payment History ({loan.payments?.length || 0})
                  </button>

                  <button
                    onClick={() => {
                      setRecordingLoan(loan);
                      setUtrNumber("");
                      setPaymentAmount(remaining); 
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 py-2 px-3 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recordingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-400" />
                  Record Repayment
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add a payment for <span className="font-semibold text-slate-200">{recordingLoan.borrowerId?.fullName}</span>.
                </p>
              </div>
              <button
                onClick={() => setRecordingLoan(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="rounded-lg bg-slate-950 p-3 border border-slate-850 flex justify-between items-center">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="text-indigo-400 font-bold font-mono">
                  {formatINR(recordingLoan.remainingBalance ?? (recordingLoan.totalRepayment - (recordingLoan.totalPaid || 0)))}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Unique UTR Number (Must be unique)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CMS123456789"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Payment Amount (INR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={recordingLoan.remainingBalance ?? (recordingLoan.totalRepayment - (recordingLoan.totalPaid || 0))}
                  placeholder="e.g. 5000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Repayment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordingLoan(null)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
                >
                  Record Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <History className="h-5 w-5 text-indigo-400" />
                  Repayment ledger
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  History of payments recorded for <span className="font-semibold text-slate-200">{historyLoan.borrowerId?.fullName}</span>.
                </p>
              </div>
              <button
                onClick={() => setHistoryLoan(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
              {!historyLoan.payments || historyLoan.payments.length === 0 ? (
                <p className="text-center text-slate-500 py-6 italic">No payments have been recorded yet for this active balance.</p>
              ) : (
                historyLoan.payments.map((p: Payment, idx: number) => {
                  const dateStr = p.paymentDate ?? p.createdAt;
                  return (
                    <div key={p._id || idx} className="rounded-lg bg-slate-950 p-3 border border-slate-850 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-300 font-mono uppercase">{p.utrNumber}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Recorded: {dateStr ? formatDate(dateStr) : "—"}</p>
                      </div>
                      <span className="font-extrabold text-emerald-400">{formatINR(p.amount)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setHistoryLoan(null)}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {celebratingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-slate-900 p-8 text-center shadow-2xl shadow-emerald-950/30 space-y-6 relative overflow-hidden">

            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
            
            <div className="relative space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-inner animate-bounce">
                <FileCheck className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                Credit Line Settle & Closed!
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Payment verified. The loan outstanding balance for <span className="font-semibold text-slate-200">{celebratingLoan.borrowerName}</span> of <span className="font-semibold text-slate-200">{formatINR(celebratingLoan.amount)}</span> has been fully satisfied. 
                The account is now officially closed in the ledger.
              </p>

              <button
                onClick={() => setCelebratingLoan(null)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110"
              >
                Return to Repayment List
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
