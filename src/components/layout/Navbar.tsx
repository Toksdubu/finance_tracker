'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  CheckSquare,
  PlusCircle,
  Sparkles,
  LogOut,
  ChevronDown,
  PieChart,
  Menu,
  X,
  Table as TableIcon,
  Wallet,
  Check,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    availableProfiles,
    transactions,
    netTrackerBalance,
  } = useFinance();

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoleSwitcher(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowRoleSwitcher(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    { href: '/dashboard/ai-copilot', label: 'AI Strategist', icon: Sparkles, isAi: true },
  ];

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Helper to get role styling
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'PRESIDENT':
        return {
          bg: 'bg-[#00bb7f]/10 text-[#00bb7f] border-[#00bb7f]/30',
          dot: 'bg-[#00bb7f]',
          label: 'Stage 3 Sign-Off',
        };
      case 'FINANCE_OFFICER':
        return {
          bg: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
          dot: 'bg-[#f59e0b]',
          label: 'Stage 2 Audit',
        };
      case 'PROJECT_HEAD':
        return {
          bg: 'bg-[#3080ff]/10 text-[#3080ff] border-[#3080ff]/30',
          dot: 'bg-[#3080ff]',
          label: 'Stage 1 Endorse',
        };
      default:
        return {
          bg: 'bg-[#ff7900]/10 text-[#ff7900] border-[#ff7900]/30',
          dot: 'bg-[#ff7900]',
          label: 'Authorized Signer',
        };
    }
  };

  const currentRoleStyle = getRoleStyle(currentUser.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222222] bg-[#0a0a0a]/90 backdrop-blur-xl">
      {/* Subtle Ambient Top Accent Glow */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff7900]/60 to-transparent" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Left: Brand & Organization Identity */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
          >
            {/* Glowing Brand Badge */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7900] to-[#e65100] text-white shadow-lg shadow-[#ff7900]/25 transition-transform duration-200 group-hover:scale-105 group-focus:scale-105">
              <span className="font-mono text-xl font-black tracking-tighter">A</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00bb7f] border-2 border-[#0a0a0a]" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-extrabold tracking-tight text-white group-hover:text-[#ff7900] transition-colors">
                  PUP ACCESS
                </span>
                <span className="rounded-md bg-[#ff7900]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#ff7900] border border-[#ff7900]/30 tracking-wider">
                  TREASURY
                </span>
              </div>
              <p className="text-[10px] text-[#71717a] font-medium leading-tight hidden xs:block">
                CpE Dept. &bull; Room 424 CEA
              </p>
            </div>
          </Link>

          {/* Real-time Vault Liquidity Pill (Desktop) */}
          <Link
            href="/dashboard"
            title="Click to view Official Central Ledger"
            className="hidden md:flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-1.5 text-xs font-mono text-[#a1a1aa] hover:border-[#ff7900]/50 hover:bg-[#161616] transition group"
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#00bb7f] animate-pulse" />
              <span className="text-[11px] text-[#71717a] group-hover:text-white transition">Net Balance:</span>
            </div>
            <span className="font-bold text-white group-hover:text-[#00bb7f] transition">
              {formatCurrency(netTrackerBalance)}
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links (Adaptive Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-1.5 lg:gap-2 rounded-xl px-2.5 lg:px-3 py-2 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#181818] text-[#ff7900] border border-[#ff7900]/40 font-semibold shadow-sm'
                    : 'text-[#a1a1aa] hover:bg-[#121212] hover:text-white'
                )}
              >
                {link.isAi ? (
                  <div className="relative h-4 w-4 rounded-full overflow-hidden border border-[#ff7900]/60 flex-shrink-0 bg-[#161616]">
                    <img src="/ai-avatar.png" alt="AI" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isActive ? 'text-[#ff7900]' : 'text-[#71717a]'
                    )}
                  />
                )}
                <span className="whitespace-nowrap">{link.label}</span>
                {link.badge !== undefined && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7900] px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {link.badge}
                  </span>
                )}
                {link.isAi && (
                  <span className="hidden xl:inline-block rounded bg-[#38bdf8]/15 px-1 py-0.2 text-[8px] font-mono text-[#38bdf8] border border-[#38bdf8]/30">
                    AI
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Active Officer & Role Switcher + Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Role Switcher Menu */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className={cn(
                'flex items-center gap-2 sm:gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all duration-150 focus:outline-none cursor-pointer',
                showRoleSwitcher
                  ? 'border-[#ff7900] bg-[#1a1a1a] shadow-lg shadow-[#ff7900]/10'
                  : 'border-[#262626] bg-[#121212] hover:border-[#ff7900]/50 hover:bg-[#161616]'
              )}
              title="Click to switch position account for testing"
              aria-expanded={showRoleSwitcher}
            >
              {/* Officer Initials Avatar */}
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold border transition-colors',
                  currentRoleStyle.bg
                )}
              >
                {getInitials(currentUser.incumbent_name)}
              </div>

              {/* Officer Details (Desktop) */}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-none truncate max-w-[125px]">
                  {currentUser.incumbent_name}
                </p>
                <p className="text-[10px] text-[#ff7900] font-medium leading-tight mt-0.5 truncate max-w-[125px]">
                  {currentUser.position_title}
                </p>
              </div>

              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-[#71717a] transition-transform duration-200',
                  showRoleSwitcher && 'rotate-180 text-[#ff7900]'
                )}
              />
            </button>

            {/* Dropdown Menu (Full Fidelity with Role Authority Badges) */}
            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#262626] bg-[#141414] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-[#222] mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#ff7900]" />
                      Executive Role Accounts
                    </p>
                    <span className="text-[10px] font-mono text-[#00bb7f] bg-[#00bb7f]/10 px-2 py-0.5 rounded border border-[#00bb7f]/20">
                      Testing Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717a] mt-0.5 leading-snug">
                    Switch between active officers to test multi-tier approval permissions.
                  </p>
                </div>

                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {Object.entries(availableProfiles).map(([key, profile]) => {
                    const isSelected = currentUser.id === profile.id;
                    const style = getRoleStyle(profile.role);

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setCurrentUser(profile);
                          setShowRoleSwitcher(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left text-xs transition cursor-pointer',
                          isSelected
                            ? 'bg-[#ff7900]/15 border border-[#ff7900]/40 text-white'
                            : 'border border-transparent text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Profile Avatar */}
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold border flex-shrink-0',
                              style.bg
                            )}
                          >
                            {getInitials(profile.incumbent_name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate text-xs">
                                {profile.incumbent_name}
                              </span>
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider border',
                                  style.bg
                                )}
                              >
                                {style.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#71717a] truncate mt-0.5">
                              {profile.position_title}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7900] text-white flex-shrink-0 shadow-sm">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#222] mt-2 pt-2 px-2 flex items-center justify-between text-[10px] font-mono text-[#71717a]">
                  <span>Active Term: {currentUser.incumbent_term}</span>
                  <span className="text-[#a1a1aa]">CEA Room 424</span>
                </div>
              </div>
            )}
          </div>

          {/* Log Out Shortcut */}
          <button
            onClick={() => router.push('/login')}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#121212] text-[#71717a] transition hover:border-[#fb2c36]/40 hover:text-[#fb2c36] hover:bg-[#181818]"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#121212] text-[#ededed] hover:border-[#ff7900]/50 hover:bg-[#181818] transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#262626] bg-[#0c0c0c] px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200 shadow-2xl">
          {/* Mobile Live Balance Pill */}
          <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#141414] p-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00bb7f] animate-pulse" />
              <span className="text-[#a1a1aa]">Net Liquid Balance:</span>
            </div>
            <span className="font-bold text-[#00bb7f] text-sm">{formatCurrency(netTrackerBalance)}</span>
          </div>

          {/* Nav Links */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition',
                    isActive
                      ? 'bg-[#181818] text-[#ff7900] font-bold border border-[#ff7900]/30'
                      : 'text-[#a1a1aa] hover:bg-[#141414] hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {link.isAi ? (
                      <div className="relative h-5 w-5 rounded-full overflow-hidden border border-[#ff7900]/60 flex-shrink-0 bg-[#161616]">
                        <img src="/ai-avatar.png" alt="AI" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <Icon className={cn('h-4 w-4', isActive ? 'text-[#ff7900]' : 'text-[#71717a]')} />
                    )}
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

          {/* Mobile User Profile & Logout */}
          <div className="border-t border-[#222] pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold border',
                  currentRoleStyle.bg
                )}
              >
                {getInitials(currentUser.incumbent_name)}
              </div>
              <div>
                <p className="font-semibold text-white leading-none">{currentUser.incumbent_name}</p>
                <p className="text-[10px] text-[#ff7900] leading-tight mt-0.5">{currentUser.position_title}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/login');
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1 text-xs text-[#a1a1aa] hover:text-[#fb2c36] hover:border-[#fb2c36]/40 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
