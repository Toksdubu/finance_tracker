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
  PieChart,
  Menu,
  X,
  Table as TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, availableProfiles, transactions } = useFinance();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Count pending approvals for badge
  const pendingT1Count = transactions.filter((t) => t.status === 'TIER_1_PENDING').length;
  const pendingT2Count = transactions.filter((t) => t.status === 'TIER_2_PENDING').length;
  const pendingT3Count = transactions.filter((t) => t.status === 'TIER_3_PENDING').length;

  const totalPending = pendingT1Count + pendingT2Count + pendingT3Count;

  const navLinks = [
    { href: '/dashboard', label: 'Finance Sheet', icon: TableIcon },
    { href: '/dashboard/budgets', label: 'Master Budget', icon: PieChart },
    {
      href: '/dashboard/approvals',
      label: 'Approvals Desk',
      icon: CheckSquare,
      badge: totalPending > 0 ? totalPending : undefined,
    },
    { href: '/dashboard/expenses/new', label: 'Submit Voucher', icon: PlusCircle },
    { href: '/dashboard/audit', label: 'Audit Trail', icon: ShieldCheck },
    { href: '/dashboard/ai-copilot', label: 'AI Strategist', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#262626] bg-[#0a0a0a]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7900] to-[#f26223] text-white shadow-lg shadow-[#ff7900]/25 transition-transform group-hover:scale-105">
              <span className="font-mono text-xl font-black tracking-tighter">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-tight text-white">PUP ACCESS</span>
                <span className="rounded bg-[#ff7900]/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#ff7900] border border-[#ff7900]/30">
                  TREASURY
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#71717a]">Computer Engineering Dept.</p>
            </div>
          </Link>

          {/* Active Term Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#121212] px-3 py-1 text-xs text-[#a1a1aa]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00bb7f] animate-pulse" />
            <span>Active Term: <strong className="text-white font-mono">{currentUser.incumbent_term}</strong></span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-[#1a1a1a] text-[#ff7900] border border-[#ff7900]/30 font-semibold shadow-sm'
                    : 'text-[#a1a1aa] hover:bg-[#121212] hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7900] px-1 text-[10px] font-bold text-white shadow-sm">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Role Switcher & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2.5 rounded-xl border border-[#262626] bg-[#121212] px-3 py-1.5 text-left transition hover:border-[#ff7900]/50 focus:outline-none cursor-pointer"
              title="Click to switch position account for testing"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] text-[#ff7900]">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">
                  {currentUser.incumbent_name}
                </p>
                <p className="text-[10px] text-[#ff7900] font-medium leading-tight mt-0.5 truncate max-w-[120px]">
                  {currentUser.position_title}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
            </button>

            {/* Dropdown Menu */}
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#262626] bg-[#141414] p-2.5 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="px-2.5 py-2 border-b border-[#222] mb-1.5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Switch Testing Profile
                  </p>
                  <p className="text-[11px] text-[#71717a] mt-0.5">
                    Test the workflow from the viewpoint of any officer
                  </p>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {Object.entries(availableProfiles).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setCurrentUser(profile);
                        setShowRoleSwitcher(false);
                      }}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer',
                        currentUser.id === profile.id
                          ? 'bg-[#ff7900]/15 text-white border border-[#ff7900]/40'
                          : 'text-[#a1a1aa] hover:bg-[#1f1f1f] hover:text-white'
                      )}
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-[#ff7900] flex-shrink-0" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">{profile.incumbent_name}</span>
                          <span className="text-[10px] font-mono text-[#ff7900]">
                            ({profile.role.replace('_', ' ')})
                          </span>
                        </div>
                        <p className="text-[11px] text-[#71717a] truncate">{profile.position_title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/login')}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#121212] text-[#71717a] transition hover:border-[#fb2c36]/40 hover:text-[#fb2c36]"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#121212] text-[#ededed] hover:border-[#ff7900]/50"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#262626] bg-[#0d0d0d] px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition',
                  isActive
                    ? 'bg-[#1a1a1a] text-[#ff7900] font-bold border border-[#ff7900]/30'
                    : 'text-[#a1a1aa] hover:bg-[#141414] hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7900] px-1.5 text-[10px] font-bold text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
