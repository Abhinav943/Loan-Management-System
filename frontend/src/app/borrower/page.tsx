"use client";

import { useState, useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import {
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  UploadCloud,
  Sliders,
  LogOut,
  Landmark,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

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

interface Loan {
  _id: string;
  status: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  totalRepayment: number;
  rejectionReason?: string;
}
const formatINR = (num: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
};

export default function BorrowerPortal() {
  const { user, logout } = useAuth();

  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [loadingActiveLoan, setLoadingActiveLoan] = useState(true);

  const [step, setStep] = useState(2); 
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [pan, setPan] = useState("");
  const [dob, setDob] = useState("");
  const [monthlySalary, setMonthlySalary] = useState<number | "">("");
  const [employmentMode, setEmploymentMode] = useState("Salaried");
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [isBrePassed, setIsBrePassed] = useState(false);

  const [salarySlipFile, setSalarySlipFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [loanAmount, setLoanAmount] = useState(100000);
  const [tenure, setTenure] = useState(180);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyLoans = async () => {
    try {
      const response = await api.get("/api/borrower/my-loans");
      const loans: Loan[] = response.data?.data || [];
      const active = loans.find((l: Loan) => 
        ["Pending", "Verified", "Sanctioned", "Disbursed"].includes(l.status)
      );
   
      if (active) {
        setActiveLoan(active);
      } else if (loans.length > 0) {
        setActiveLoan(loans[0]); 
      }
    } catch (e: unknown) {
      console.error("Failed to load loans", e);
    } finally {
      setLoadingActiveLoan(false);
    }
  };

  useEffect(() => {
    const loadLoans = async () => {
      setLoadingActiveLoan(true);
      await fetchMyLoans();
    };
    loadLoans();
  }, []);


  useEffect(() => {

    const errors: string[] = [];

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (pan && !panRegex.test(pan.toUpperCase())) {
      errors.push("PAN must match valid format (e.g. ABCDE1234F).");
    }

    if (dob) {
      const age = getAge(dob);
      if (age < 23 || age > 50) {
        errors.push(`Age is ${age} years. Must be between 23 and 50.`);
      }
    }

    if (monthlySalary !== "" && monthlySalary < 25000) {
      errors.push("Monthly salary must be at least ₹25,000.");
    }

    if (employmentMode === "Unemployed") {
      errors.push("Unemployed applicants are ineligible for credit.");
    }

    setTimeout(() => {
      setBreErrors(errors);
      const isFilled = pan && dob && monthlySalary && employmentMode;
      setIsBrePassed(!!isFilled && errors.length === 0);
    }, 0);
  }, [pan, dob, monthlySalary, employmentMode, step]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, and PNG files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }
    setSalarySlipFile(file);
    toast.success("Salary slip selected!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };


  const interestRate = 12; 
  const simpleInterest = (loanAmount * interestRate * tenure) / (365 * 100);
  const totalRepayment = Math.round(loanAmount + simpleInterest);
  const dailyRepayment = totalRepayment / tenure;

  const handleSubmitApplication = async () => {
    if (!salarySlipFile) {
      toast.error("Salary slip document is required.");
      return;
    }

    setIsSubmitting(true);
    const loadToast = toast.loading("Uploading documents & running validations...");

    const formData = new FormData();
    formData.append("pan", pan.toUpperCase());
    formData.append("dob", dob);
    formData.append("monthlySalary", String(monthlySalary));
    formData.append("employmentMode", employmentMode);
    formData.append("loanAmount", String(loanAmount));
    formData.append("tenure", String(tenure));
    formData.append("salarySlip", salarySlipFile);

    try {
      const response = await api.post("/api/borrower/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Application Submitted Successfully!", { id: loadToast });
      setActiveLoan(response.data?.data);
    } catch (err: unknown) {

      const error = err as { response?: { data?: { message?: string; errors?: string[] } } };
      const errMsg = error.response?.data?.message || "Failed to submit application.";
      const errDetails = error.response?.data?.errors;
      if (errDetails && Array.isArray(errDetails)) {
        toast.error(`${errMsg}: ${errDetails.join(", ")}`, { id: loadToast });
      } else {
        toast.error(errMsg, { id: loadToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loadingActiveLoan && activeLoan && ["Pending", "Verified", "Sanctioned", "Disbursed"].includes(activeLoan.status)) {
    const statusMap: Record<string, { label: string; desc: string; step: number }> = {
      Pending: { label: "Applied", desc: "Your application is waiting for Sales Verification.", step: 1 },
      Verified: { label: "Verified", desc: "Sales has verified your details. Pending credit approval.", step: 2 },
      Sanctioned: { label: "Sanctioned", desc: "Congratulations! Your loan is sanctioned. Awaiting disbursement.", step: 3 },
      Disbursed: { label: "Disbursed", desc: "Funds have been released! Loan is currently active.", step: 4 }
    };

    const currentStatus = statusMap[activeLoan.status] || { label: activeLoan.status, desc: "", step: 1 };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="border-b border-slate-900 bg-slate-900/40 py-4 px-6 backdrop-blur-md">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-100 font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-indigo-600 text-white shadow-md shadow-emerald-500/20">
                <Landmark className="h-4 w-4" />
              </div>
              <span>LMS</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Borrower Portal
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full py-12 px-6 flex flex-col justify-center">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
            <div className="text-center space-y-3 mb-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-100">Active Loan Application</h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {currentStatus.desc}
              </p>
            </div>


            <div className="relative mb-12">
              <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-slate-850"></div>
              <div
                className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-emerald-500 transition-all duration-500"
                style={{ width: `${((currentStatus.step - 1) / 3) * 100}%` }}
              ></div>

              <div className="relative flex justify-between">
                {[
                  { step: 1, label: "Applied" },
                  { step: 2, label: "Verified" },
                  { step: 3, label: "Sanctioned" },
                  { step: 4, label: "Disbursed" }
                ].map((s) => {
                  const isActive = s.step <= currentStatus.step;
                  const isCurrent = s.step === currentStatus.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div
                        className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-all ${
                          isActive
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                            : "bg-slate-900 text-slate-500 border-slate-800"
                        } ${isCurrent ? "scale-110 ring-4 ring-emerald-500/20" : ""}`}
                      >
                        {isActive && s.step < currentStatus.step ? "✓" : s.step}
                      </div>
                      <span
                        className={`mt-2 text-xs font-semibold ${
                          isActive ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-6 border border-slate-900 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900 text-sm font-semibold">
                <span className="text-slate-400">Application Reference</span>
                <span className="text-slate-200 uppercase font-mono">{activeLoan._id.substring(activeLoan._id.length - 8)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Loan Amount</span>
                  <span className="text-slate-200 font-semibold">{formatINR(activeLoan.loanAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Tenure</span>
                  <span className="text-slate-200 font-semibold">{activeLoan.tenure} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Interest Rate</span>
                  <span className="text-slate-200 font-semibold">{activeLoan.interestRate}% p.a.</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Total Repayment Owed</span>
                  <span className="text-emerald-400 font-semibold">{formatINR(activeLoan.totalRepayment)}</span>
                </div>
              </div>
            </div>

            {activeLoan.status === "Disbursed" && (
              <div className="mt-6 text-center text-xs text-slate-500 italic">
                Credit accounts are processed in collection. Repayments can be recorded by collections executive.
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const isRejected = activeLoan?.status === "Rejected";
  const isClosed = activeLoan?.status === "Closed";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-900 bg-slate-900/40 py-4 px-6 backdrop-blur-md">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-100 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-indigo-600 text-white shadow-md shadow-emerald-500/20">
              <Landmark className="h-4 w-4" />
            </div>
            <span>LMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Borrower Portal
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>


      <main className="flex-1 max-w-3xl mx-auto w-full py-12 px-6 flex flex-col justify-center">

        {isRejected && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Your previous application was Rejected</p>
              <p className="text-xs text-rose-400/90 mt-1">
                Reason: {activeLoan.rejectionReason || "No explanation provided."}
              </p>
              <button 
                onClick={() => setActiveLoan(null)}
                className="mt-2 text-xs font-semibold text-rose-200 underline hover:text-rose-100"
              >
                Apply for a new loan
              </button>
            </div>
          </div>
        )}

        {isClosed && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold">Your previous loan has been fully paid & Closed</p>
              <p className="text-xs text-emerald-400/90 mt-1">
                Thank you for your timely repayment! Your credit score has been updated.
              </p>
              <button 
                onClick={() => setActiveLoan(null)}
                className="mt-2 text-xs font-semibold text-emerald-200 underline hover:text-emerald-100"
              >
                Apply for a new loan
              </button>
            </div>
          </div>
        )}

        {(!activeLoan || (!isRejected && !isClosed)) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">

            <div className="flex justify-between items-center mb-8 pb-5 border-b border-slate-850">
              <div>
                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">
                  Step {step} of 4
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-1">
                  {step === 2 && "Eligibility Profile Check"}
                  {step === 3 && "Document Verification"}
                  {step === 4 && "Configure Loan Terms"}
                </h2>
              </div>
              <div className="flex gap-1.5">
                {[2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-12 rounded-full transition-all duration-300 ${
                      s <= step ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" : "bg-slate-800"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {step === 2 && (
              <div className="space-y-6">

                {breErrors.length > 0 && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                    <div>
                      <p className="font-semibold text-rose-400 mb-1">Business Rule Engine Flags ({breErrors.length}):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {breErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Applicant Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Permanent Account Number (PAN)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      required
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Employment Mode
                    </label>
                    <select
                      value={employmentMode}
                      onChange={(e) => setEmploymentMode(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-100 transition-all focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Salaried">Salaried Employee</option>
                      <option value="Self-Employed">Self Employed Professional</option>
                      <option value="Unemployed">Unemployed / No Mode</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Monthly Salary / Net Income (INR)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 35000"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 px-4 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setStep(3)}
                    disabled={!isBrePassed}
                    className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Proceed to Documents
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-slate-400 text-xs leading-relaxed">
                  Please upload your recent official salary slip. Files must be in PDF, JPG, or PNG format and cannot exceed 5MB in size.
                </p>

                {!salarySlipFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                      isDragging
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-400 mb-4 shadow">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">
                      Drag and drop your file here, or{" "}
                      <label className="text-emerald-400 hover:text-emerald-300 cursor-pointer underline">
                        browse files
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">PDF, JPEG, or PNG up to 5MB</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex items-center justify-between shadow">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-200 truncate max-w-xs md:max-w-md">
                          {salarySlipFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(salarySlipFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {salarySlipFile.type.split("/")[1].toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSalarySlipFile(null)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-slate-900 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!salarySlipFile}
                    className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Configure Term
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-3 space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">Loan Amount Required</span>
                        <span className="text-slate-200 font-bold text-base">{formatINR(loanAmount)}</span>
                      </div>
                      <input
                        type="range"
                        min={50000}
                        max={500000}
                        step={5000}
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500 font-semibold font-mono">
                        <span>₹50,000</span>
                        <span>₹5,00,000</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">Credit Tenure (Days)</span>
                        <span className="text-slate-200 font-bold text-base">{tenure} Days</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={365}
                        step={1}
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-500 font-semibold font-mono">
                        <span>30 Days</span>
                        <span>365 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5 backdrop-blur-md space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-emerald-500/10">
                      <Sliders className="h-5 w-5 text-emerald-400" />
                      <span className="text-slate-200 font-bold text-sm">Repayment Summary</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Principal Amount</span>
                        <span className="text-slate-200 font-semibold">{formatINR(loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Interest (12% p.a.)</span>
                        <span className="text-slate-200 font-semibold">{formatINR(simpleInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Daily Repayment Rate</span>
                        <span className="text-slate-200 font-semibold">{formatINR(dailyRepayment)}/Day</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-emerald-500/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Total Repayment</span>
                      <span className="text-base font-extrabold text-emerald-400">{formatINR(totalRepayment)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-850">
                  <button
                    onClick={() => setStep(3)}
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-98 disabled:opacity-40"
                  >
                    {isSubmitting ? "Submitting Application..." : "Submit & Apply"}
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
