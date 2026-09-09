'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckSquare,
  PlusCircle,
  FileText,
  Sparkles,
  LogOut,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, availableProfiles, transactions } = useFinance();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Count pending approvals for badge
  const pendingT1Count = transactions.filter((t) => t.status === 'TIER_1_PENDING').length;
  const pendingT2Count = transactions.filter((t) => t.status === 'TIER_2_PENDING').length;
  const pendingT3Count = transactions.filter((t) => t.status === 'TIER_3_PENDING').length;

  const totalPending = pendingT1Count + pendingT2Count + pendingT3Count;

  const navLinks = [
    { href: '/dashboard', label: 'Financial Hub', icon: LayoutDashboard },
    {
      href: '/dashboard/approvals',
      label: '3-Tier Approvals',
      icon: CheckSquare,
      badge: totalPending > 0 ? totalPending : undefined,
    },
    { href: '/dashboard/expenses/new', label: 'Submit Voucher', icon: PlusCircle },
    { href: '/dashboard/audit', label: 'Audit Ledger', icon: ShieldCheck },
    { href: '/dashboard/ai-copilot', label: 'AI Strategist', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f26223] to-[#ff6b35] text-white shadow-lg shadow-[#f26223]/25 transition-transform group-hover:scale-105">
              <span className="font-mono text-xl font-black tracking-tighter">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-tight text-white">ACCESS</span>
                <span className="rounded bg-[#f26223]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#f26223] border border-[#f26223]/30">
                  VAULT
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#71717a]">PUP CpE Department Finance</p>
            </div>
          </Link>

          {/* Term Pill */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#121212] px-3 py-1 text-xs text-[#a1a1aa]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00bb7f] animate-pulse" />
            <span>Active Term: <strong className="text-white font-mono">{currentUser.incumbent_term}</strong></span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#171717] text-[#f26223] border border-[#f26223]/30 shadow-sm'
                    : 'text-[#a1a1aa] hover:bg-[#121212] hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f26223] px-1 text-[10px] font-bold text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Role Switcher (For Pair Testing) & User Menu */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2.5 rounded-xl border border-[#262626] bg-[#121212] px-3 py-1.5 text-left transition hover:border-[#f26223]/50 focus:outline-none"
              title="Click to switch position account for testing"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#f26223]">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{currentUser.incumbent_name}</p>
                <p className="text-[10px] text-[#f26223] font-medium leading-tight mt-0.5">{currentUser.position_title}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
            </button>

            {/* Dropdown Menu */}
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#262626] bg-[#141414] p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 border-b border-[#222] mb-1">
                  <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Switch Active Position</p>
                  <p className="text-[10px] text-[#71717a]">Persistent role accounts with incumbent attribution</p>
                </div>
                {Object.entries(availableProfiles).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentUser(profile);
                      setShowRoleSwitcher(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition',
                      currentUser.role === profile.role
                        ? 'bg-[#f26223]/15 text-white border border-[#f26223]/40'
                        : 'text-[#a1a1aa] hover:bg-[#1f1f1f] hover:text-white'
                    )}
                  >
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-[#f26223]" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{profile.incumbent_name}</span>
                        <span className="text-[10px] font-mono text-[#f26223]">({profile.role.replace('_', ' ')})</span>
                      </div>
                      <p className="text-[11px] text-[#71717a]">{profile.position_title}</p>
                      <p className="text-[10px] font-mono text-[#555]">{profile.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/login')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#121212] text-[#71717a] transition hover:border-[#fb2c36]/40 hover:text-[#fb2c36]"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
