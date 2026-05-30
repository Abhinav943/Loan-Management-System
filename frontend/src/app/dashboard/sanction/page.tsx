"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { ShieldAlert, CheckCircle, Ban, Eye, X, Calendar, FileText, ExternalLink, Calculator } from "lucide-react";
import toast from "react-hot-toast";

// Currency Formatter
const formatINR = (num: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
};

// Date Formatter
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

// Age Calculator
const getAge = (dobString: string): number => {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function SanctionPanel() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Detail state
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

  // Reject input state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifiedLoans = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/dashboard/sanction/verified");
      setLoans(response.data?.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load verified loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifiedLoans();
  }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(true);
    const loadToast = toast.loading("Sanctioning credit line...");
    try {
      await api.put(`/api/dashboard/sanction/approve/${loanId}`, {
        status: "Sanctioned"
      });
      toast.success("Loan sanctioned successfully! Forwarded to Disbursement.", { id: loadToast });
      setSelectedLoan(null);
      fetchVerifiedLoans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to sanction loan.", { id: loadToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }

    setActionLoading(true);
    const loadToast = toast.loading("Recording rejection...");
    try {
      await api.put(`/api/dashboard/sanction/approve/${selectedLoan._id}`, {
        status: "Rejected",
        rejectionReason: rejectionReason
      });
      toast.success("Application successfully rejected.", { id: loadToast });
      setSelectedLoan(null);
      setShowRejectForm(false);
      setRejectionReason("");
      fetchVerifiedLoans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject loan.", { id: loadToast });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-indigo-400" />
          Sanction - Review Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform credit assessments on verified applications and issue sanctions.
        </p>
      </div>

      {/* Main Grid / Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
            <p className="text-slate-500 text-xs">Querying verified applications...</p>
          </div>
        </div>
      ) : loans.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/10 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500 shadow">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No Verified Applications</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            There are no applications currently verified by Sales waiting for Sanction reviews.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-900/10 shadow-lg backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 font-semibold uppercase border-b border-slate-900">
                <tr>
                  <th className="px-6 py-4">Borrower</th>
                  <th className="px-6 py-4 text-right">Loan Amount</th>
                  <th className="px-6 py-4 text-center">Tenure</th>
                  <th className="px-6 py-4 text-right">Repayment Owed</th>
                  <th className="px-6 py-4">Verification Date</th>
                  <th className="px-6 py-4 text-center">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50 text-slate-300">
                {loans.map((loan) => (
                  <tr key={loan._id} className="hover:bg-slate-900/20 transition-colors">
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {loan.borrowerId?.fullName || "Verified Applicant"}
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        {loan.borrowerId?.email || "No email"}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-bold text-slate-100">
                      {formatINR(loan.loanAmount)}
                    </td>

                    {/* Tenure */}
                    <td className="px-6 py-4 text-center font-semibold text-slate-400">
                      {loan.tenure} days
                    </td>

                    {/* Total Repayment */}
                    <td className="px-6 py-4 text-right font-bold text-emerald-400">
                      {formatINR(loan.totalRepayment)}
                    </td>

                    {/* Updated date (Verification Date) */}
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(loan.updatedAt)}
                      </div>
                    </td>

                    {/* Inspect button */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowRejectForm(false);
                          setRejectionReason("");
                        }}
                        className="flex items-center gap-1.5 mx-auto rounded-lg bg-indigo-500/10 border border-indigo-500/20 py-1.5 px-3 font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Assess Credit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credit Assessment Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-850 p-6">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                  Assessment Reference: {selectedLoan._id.substring(selectedLoan._id.length - 8)}
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Assess Applicant Credit File
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Applicant Bio */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
                    Applicant Information
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Full Name:</span>
                      <span className="text-slate-200 font-semibold">{selectedLoan.borrowerId?.fullName || "Applicant"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200 font-semibold">{selectedLoan.borrowerId?.email || "No email"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age:</span>
                      <span className="text-slate-200 font-semibold">
                        {getAge(selectedLoan.dob)} Years ({formatDate(selectedLoan.dob)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PAN ID:</span>
                      <span className="text-slate-200 font-mono font-semibold uppercase">{selectedLoan.pan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly salary:</span>
                      <span className="text-slate-200 font-semibold">{formatINR(selectedLoan.monthlySalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Employment Mode:</span>
                      <span className="text-slate-200 font-semibold">{selectedLoan.employmentMode}</span>
                    </div>
                  </div>
                </div>

                {/* Loan math */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
                    Loan Configuration Math
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Principal Requested:</span>
                      <span className="text-slate-200 font-semibold">{formatINR(selectedLoan.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interest rate:</span>
                      <span className="text-slate-200 font-semibold">{selectedLoan.interestRate}% p.a. (Fixed)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tenure requested:</span>
                      <span className="text-slate-200 font-semibold">{selectedLoan.tenure} Days</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-850/50">
                      <span className="text-slate-500 font-semibold">Calculated Interest:</span>
                      <span className="text-slate-200 font-semibold">
                        {formatINR(selectedLoan.totalRepayment - selectedLoan.loanAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-850 font-semibold">
                      <span className="text-slate-400">Total Repayment Owed:</span>
                      <span className="text-emerald-400 font-bold">{formatINR(selectedLoan.totalRepayment)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Slip File view */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
                  Uploaded Verification Docs
                </h4>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="text-left text-xs">
                      <p className="font-semibold text-slate-200">
                        applicant_salary_slip.pdf
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Uploaded to Secure Cloud Storage
                      </p>
                    </div>
                  </div>
                  <a
                    href={selectedLoan.salarySlipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-850 bg-slate-900 py-1.5 px-3 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View File
                  </a>
                </div>
              </div>

              {/* Rejection input inline block */}
              {showRejectForm && (
                <form onSubmit={handleReject} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-rose-400">Provide Mandate Rejection Reason</label>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      Cancel Rejection
                    </button>
                  </div>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide reason (e.g., salary slip details do not match stated income, or age threshold validation mismatch)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-850 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1.5 px-4 text-xs transition-colors disabled:opacity-50"
                    >
                      Confirm Rejection Decision
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Actions Footer */}
            {!showRejectForm && (
              <div className="flex items-center justify-between border-t border-slate-850 p-6 bg-slate-900/30">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Decline Application
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedLoan._id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-98 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Issue Sanction
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
