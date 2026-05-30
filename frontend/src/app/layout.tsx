import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, RouteGuard } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LMS - Premium Loan Management System",
  description: "A secure, role-based dashboard for loan applications, reviews, disbursements, and repayments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AuthProvider>
          <RouteGuard>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                className: "bg-slate-900 text-slate-100 border border-slate-800",
                duration: 4000,
              }}
            />
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
