import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARI Research Lab - Academic Network & PostgreSQL Recursive Optimization",
  description: "Academic collaboration and discussion network with deep PostgreSQL recursive CTEs and performance benchmarking.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        <Suspense fallback={<div className="h-16 bg-slate-900 border-b border-slate-800" />}>
          <Navbar />
        </Suspense>
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Academic Module...</div>}>
          <main className="flex-1">{children}</main>
        </Suspense>
        
        {/* Academic Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-semibold text-slate-400">
              ARI Research Lab — Academic Collaboration & Discourse Network
            </p>
            <p>
              Developed for PostgreSQL recursive graph research (WITH RECURSIVE), tree hierarchy indexing, and query plan optimization.
            </p>
            <div className="flex justify-center gap-4 pt-1 font-mono text-[11px] text-slate-600">
              <span>PostgreSQL 18.1</span>
              <span>•</span>
              <span>Next.js 16 + React 19</span>
              <span>•</span>
              <span>Node.js Express API</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
