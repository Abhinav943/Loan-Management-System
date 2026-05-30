"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

interface AuthErrorResponse {
  message?: string;
  errors?: string[];
}

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@lms.com", label: "Admin" },
  { role: "Sales", email: "sales@lms.com", label: "Sales" },
  { role: "Sanction", email: "sanction@lms.com", label: "Sanction" },
  { role: "Disbursement", email: "disbursement@lms.com", label: "Disburs." },
  { role: "Collection", email: "collection@lms.com", label: "Collect." },
  { role: "Borrower", email: "borrower@lms.com", label: "Borrower" },
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading(isLogin ? "Authenticating..." : "Creating Account...");
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Welcome back!", { id: loadingToast });
      } else {
        await signup(fullName, email, password);
        toast.success("Account created successfully! Welcome to LMS.", { id: loadingToast });
      }
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<AuthErrorResponse>;
        const errMsg =
          axiosError.response?.data?.message ??
          axiosError.message ??
          "Authentication failed.";
        const errorDetails = axiosError.response?.data?.errors;
        if (errorDetails && Array.isArray(errorDetails)) {
          toast.error(`${errMsg}: ${errorDetails.join(", ")}`, { id: loadingToast });
        } else {
          toast.error(errMsg, { id: loadingToast });
        }
      } else {
        const genericError = err as Error;
        toast.error(genericError.message || "Authentication failed.", { id: loadingToast });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const triggerQuickLogin = async (demoEmail: string) => {
    setSubmitting(true);
    const loadingToast = toast.loading(`Logging in as ${demoEmail}...`);
    try {
      await login(demoEmail, "Password123!");
      toast.success("Logged in successfully!", { id: loadingToast });
      router.push("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<AuthErrorResponse>;
        toast.error(axiosError.response?.data?.message || "Quick login failed.", { id: loadingToast });
      } else {
        const genericError = err as Error;
        toast.error(genericError.message || "Quick login failed.", { id: loadingToast });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-950">
      {/* Branding Section */}
      <div className="relative hidden lg:flex w-1/2 flex-col justify-between bg-slate-900 p-12 overflow-hidden border-r border-slate-800">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="relative flex items-center gap-3 text-slate-100 font-bold text-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          <span>Antigravity LMS</span>
        </div>
        <div className="relative my-auto space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">The Intelligent Loan Management Suite.</h1>
          <p className="text-slate-400 leading-relaxed">
            Manage your entire credit lifecycle in a single platform. Powered by automatic Business Rule Engines, dual-token security, and role-based operational modules.
          </p>
        </div>
        <div className="relative text-slate-500 text-sm flex gap-4">
          <span>&copy; 2026 Antigravity Financial Systems</span>
          <span>&bull;</span>
          <span>Version 1.2.0</span>
        </div>
      </div>

      {/* Forms Section */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">
              {isLogin ? "Welcome back" : "Create borrower account"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin ? "Sign in to access your portal" : "Enter details to check eligibility and register"}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="fullName">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input id="fullName" type="text" required placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} disabled={submitting}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input id="email" type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={submitting}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input id="password" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={submitting}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none">
              {isLogin ? "Sign In" : "Register"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="text-center text-sm text-slate-400">
            {isLogin ? (
              <span>
                New borrower? <button type="button" onClick={() => setIsLogin(false)} className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline">Create an account</button>
              </span>
            ) : (
              <span>
                Already registered? <button type="button" onClick={() => setIsLogin(true)} className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline">Sign in here</button>
              </span>
            )}
          </div>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-850"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-950 px-3 text-slate-500 font-semibold tracking-widest">Demo Quick Access</span></div>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-900/20 p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400"><ShieldCheck className="h-4 w-4 text-indigo-400" /><span>Select Role for Fast Seeding (Password: Password123!)</span></div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} type="button" onClick={() => triggerQuickLogin(acc.email)} disabled={submitting}
                  className="rounded-lg border border-slate-800/80 bg-slate-900/60 py-2 px-1 text-center text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/50 hover:bg-slate-850 hover:text-slate-100 active:scale-95 disabled:opacity-50">
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
