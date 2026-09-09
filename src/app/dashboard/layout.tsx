'use client';

import React from 'react';
import { FinanceProvider } from '@/context/FinanceContext';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinanceProvider>
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-[#ededed]">
        <Navbar />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <footer className="border-t border-[#262626] py-6 text-center text-xs text-[#71717a] bg-[#0c0c0c]">
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-2">
            <p className="font-mono">
              PUP Association of Concerned Computer Engineering Students for Service &bull; Room 424 CEA Bldg.
            </p>
            <p className="flex items-center gap-1 font-mono text-[11px] text-[#555]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00bb7f]" />
              Encrypted with AES-256-GCM &bull; Immutable SHA-256 Ledger
            </p>
          </div>
        </footer>
      </div>
    </FinanceProvider>
  );
}
