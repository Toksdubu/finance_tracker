'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OfficialFinanceSheet } from '@/components/tracker/OfficialFinanceSheet';
import {
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  AlertTriangle,
  ChevronRight,
  Layers,
  Table as TableIcon,
  CreditCard,
  Building2,
  Banknote,
  Percent,
  PlusCircle,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const {
    currentUser,
    events,
    transactions,
    totalAllocated,
    totalSpent,
    remainingBalance,
    walletTotals,
    fundingSourceTotals,
  } = useFinance();

  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('ALL');

  // Pending counts
  const pendingT1 = transactions.filter((t) => t.status === 'TIER_1_PENDING').length;
  const pendingT2 = transactions.filter((t) => t.status === 'TIER_2_PENDING').length;
  const pendingT3 = transactions.filter((t) => t.status === 'TIER_3_PENDING').length;
  const totalPending = pendingT1 + pendingT2 + pendingT3;

  return (
    <div className="space-y-8">
      {/* Welcome & Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#ff7900]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#ff7900]">
              PUP ACCESS Financial Command Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Treasury & Event Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 font-sans">
            Multi-wallet tracking (GCash, GoTyme, Cash), Quota vs. Partnership reconciliation, and 3-tier approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/expenses/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7900] to-[#ff6b35] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#ff7900]/25 transition hover:brightness-110"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit Voucher</span>
          </Link>
          <Link
            href="/dashboard/approvals"
            className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#141414] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#ff7900]/50"
          >
            <span>Approvals ({totalPending})</span>
          </Link>
        </div>
      </div>

      {/* Multi-Wallet Custody Reconciliation (Directly learning from ACCESS spreadsheet) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa] flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#ff7900]" />
            Active Custody Wallets & Balances
          </h2>
          <span className="text-[11px] font-mono text-[#71717a]">
            Net Liquid Funds: <strong className="text-[#00bb7f] font-bold">{formatCurrency(remainingBalance)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* GCash Wallet */}
          <div
            onClick={() => setSelectedWalletFilter(selectedWalletFilter === 'GCASH' ? 'ALL' : 'GCASH')}
            className={`rounded-2xl border p-4 transition cursor-pointer ${
              selectedWalletFilter === 'GCASH'
                ? 'border-[#0055ff] bg-[#0055ff]/10 shadow-lg shadow-[#0055ff]/10'
                : 'border-[#262626] bg-[#141414] hover:border-[#333]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0055ff]/20 text-[#0055ff] font-bold text-xs">
                  G
                </div>
                <span className="text-xs font-bold text-white font-mono">GCash Wallet</span>
              </div>
              <span className="text-[10px] font-mono text-[#71717a]">Primary Disbursement</span>
            </div>
            <div className="text-xl font-bold text-[#00bb7f] font-mono">
              {formatCurrency(walletTotals.gcash.balance)}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#71717a] mt-2 pt-2 border-t border-[#222]">
              <span>In: {formatCurrency(walletTotals.gcash.in)}</span>
              <span className="text-[#fb2c36]">Out: {formatCurrency(walletTotals.gcash.out)}</span>
            </div>
          </div>

          {/* GoTyme Digital Bank */}
          <div
            onClick={() => setSelectedWalletFilter(selectedWalletFilter === 'GOTYME' ? 'ALL' : 'GOTYME')}
            className={`rounded-2xl border p-4 transition cursor-pointer ${
              selectedWalletFilter === 'GOTYME'
                ? 'border-[#00bb7f] bg-[#00bb7f]/10 shadow-lg shadow-[#00bb7f]/10'
                : 'border-[#262626] bg-[#141414] hover:border-[#333]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00bb7f]/20 text-[#00bb7f] font-bold text-xs">
                  T
                </div>
                <span className="text-xs font-bold text-white font-mono">GoTyme Bank</span>
              </div>
              <span className="text-[10px] font-mono text-[#71717a]">Court & Reserves</span>
            </div>
            <div className="text-xl font-bold text-[#00bb7f] font-mono">
              {formatCurrency(walletTotals.gotyme.balance)}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#71717a] mt-2 pt-2 border-t border-[#222]">
              <span>In: {formatCurrency(walletTotals.gotyme.in)}</span>
              <span className="text-[#fb2c36]">Out: {formatCurrency(walletTotals.gotyme.out)}</span>
            </div>
          </div>

          {/* Physical Cash on Hand */}
          <div
            onClick={() => setSelectedWalletFilter(selectedWalletFilter === 'CASH_ON_HAND' ? 'ALL' : 'CASH_ON_HAND')}
            className={`rounded-2xl border p-4 transition cursor-pointer ${
              selectedWalletFilter === 'CASH_ON_HAND'
                ? 'border-[#ff7900] bg-[#ff7900]/10 shadow-lg shadow-[#ff7900]/10'
                : 'border-[#262626] bg-[#141414] hover:border-[#333]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7900]/20 text-[#ff7900] font-bold text-xs">
                  ₱
                </div>
                <span className="text-xs font-bold text-white font-mono">Cash on Hand</span>
              </div>
              <span className="text-[10px] font-mono text-[#71717a]">Petty Cash / DP</span>
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {formatCurrency(walletTotals.cash.balance)}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-[#71717a] mt-2 pt-2 border-t border-[#222]">
              <span>In: {formatCurrency(walletTotals.cash.in)}</span>
              <span className="text-[#fb2c36]">Out: {formatCurrency(walletTotals.cash.out)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quota vs. Partnerships Reconciliation Bar (Learning directly from lines 57-67 of spreadsheet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sports Quota Collections */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ff7900]" />
              Sports Team Quota Collections
            </span>
            <span className="rounded bg-[#ff7900]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ff7900] border border-[#ff7900]/30">
              Left: {formatCurrency(fundingSourceTotals.quota.balance)}
            </span>
          </div>
          <p className="text-[11px] text-[#71717a] font-sans">
            Fees collected from Basketball (7 teams), Volleyball (6 teams), Badminton (5 teams), and Esports (25 teams).
          </p>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-[#a1a1aa]">Total Quota Collected: <strong>{formatCurrency(fundingSourceTotals.quota.in)}</strong></span>
            <span className="text-[#fb2c36]">Disbursed: <strong>{formatCurrency(fundingSourceTotals.quota.out)}</strong></span>
          </div>
        </div>

        {/* Corporate Partnerships & Sponsors */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00bb7f]" />
              Partnerships & Sponsorships
            </span>
            <span className="rounded bg-[#00bb7f]/15 px-2 py-0.5 text-[10px] font-semibold text-[#00bb7f] border border-[#00bb7f]/30">
              Left: {formatCurrency(fundingSourceTotals.partnerships.balance)}
            </span>
          </div>
          <p className="text-[11px] text-[#71717a] font-sans">
            Sponsorship grants (e.g. Bettermind ₱3,000) and department subsidies.
          </p>
          <div className="flex justify-between text-xs pt-1">
            <span className="text-[#a1a1aa]">Total Sponsored: <strong>{formatCurrency(fundingSourceTotals.partnerships.in)}</strong></span>
            <span className="text-[#fb2c36]">Disbursed: <strong>{formatCurrency(fundingSourceTotals.partnerships.out)}</strong></span>
          </div>
        </div>
      </div>

      {/* Official Finance Tracker Spreadsheet */}
      <OfficialFinanceSheet />

      {/* Event Quota & Category Breakdown Summary (Replicating ACCESS right-hand table) */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#ff7900]" />
          Event Quota per Category Structure (Activity-Based Summary)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3">
            <p className="text-[#a1a1aa] font-bold">Basketball</p>
            <p className="text-[11px] text-[#71717a]">7 Teams &bull; ₱2,125.71/team</p>
            <p className="text-base font-bold text-white mt-2">₱14,880.00</p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3">
            <p className="text-[#a1a1aa] font-bold">Volleyball</p>
            <p className="text-[11px] text-[#71717a]">6 Teams &bull; ₱2,493.33/team</p>
            <p className="text-base font-bold text-white mt-2">₱14,960.00</p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3">
            <p className="text-[#a1a1aa] font-bold">Badminton</p>
            <p className="text-[11px] text-[#71717a]">5 Teams &bull; ₱457.14/team</p>
            <p className="text-base font-bold text-white mt-2">₱2,320.00</p>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3">
            <p className="text-[#a1a1aa] font-bold">Esports</p>
            <p className="text-[11px] text-[#71717a]">25 Teams &bull; ₱220.00/team</p>
            <p className="text-base font-bold text-white mt-2">₱5,244.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
