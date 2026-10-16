'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Lock,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Copy,
  Check,
  Building2,
  Wallet,
  CornerDownRight,
  Send,
  Info,
} from 'lucide-react';
import { ApprovalTier, ExpenseTransaction, UserProfile } from '@/types/finance';

export default function ApprovalsPage() {
  const {
    currentUser,
    setCurrentUser,
    availableProfiles,
    transactions,
    approveTransaction,
    rejectTransaction,
  } = useFinance();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<
    'MY_ACTION' | 'ALL_PENDING' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'COMPLETED' | 'RETURNED'
  >('ALL_PENDING');

  // Modals & Interactivity State
  const [selectedTxForProof, setSelectedTxForProof] = useState<ExpenseTransaction | null>(null);
  const [returnModalTx, setReturnModalTx] = useState<ExpenseTransaction | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'return' | 'info';
    text: string;
  } | null>(null);

  // Helper to trigger toast
  const showToast = (type: 'success' | 'return' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Determine which tier a transaction currently requires
  const getRequiredTier = (status: string): ApprovalTier | null => {
    if (status === 'TIER_1_PENDING') return 'TIER_1_PROJECT_HEAD';
    if (status === 'TIER_2_PENDING') return 'TIER_2_FINANCE_OFFICER';
    if (status === 'TIER_3_PENDING') return 'TIER_3_PRESIDENT';
    return null;
  };

  // Check if current user has the authority to approve this tier
  const canUserApproveTier = (tier: ApprovalTier | null): boolean => {
    if (!tier) return false;
    if (currentUser.role === 'ADMIN') return true;
    if (tier === 'TIER_1_PROJECT_HEAD') {
      return currentUser.role === 'PROJECT_HEAD' || currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'PRESIDENT';
    }
    if (tier === 'TIER_2_FINANCE_OFFICER') {
      return currentUser.role === 'FINANCE_OFFICER' || currentUser.role === 'PRESIDENT';
    }
    if (tier === 'TIER_3_PRESIDENT') {
      return currentUser.role === 'PRESIDENT';
    }
    return false;
  };

  // Recommended role profile to switch to for testing
  const getRecommendedProfileForTier = (tier: ApprovalTier): UserProfile => {
    if (tier === 'TIER_1_PROJECT_HEAD') {
      return availableProfiles.projectHead || availableProfiles.sho || availableProfiles.julianna;
    }
    if (tier === 'TIER_2_FINANCE_OFFICER') {
      return availableProfiles.treasurer || availableProfiles.erica;
    }
    return availableProfiles.president;
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Tab filtering
      if (activeTab === 'MY_ACTION') {
        const requiredTier = getRequiredTier(tx.status);
        if (!requiredTier) return false;
        if (!canUserApproveTier(requiredTier)) return false;
      } else if (activeTab === 'ALL_PENDING') {
        if (!tx.status.includes('PENDING')) return false;
      } else if (activeTab === 'TIER_1') {
        if (tx.status !== 'TIER_1_PENDING') return false;
      } else if (activeTab === 'TIER_2') {
        if (tx.status !== 'TIER_2_PENDING') return false;
      } else if (activeTab === 'TIER_3') {
        if (tx.status !== 'TIER_3_PENDING') return false;
      } else if (activeTab === 'COMPLETED') {
        if (tx.status !== 'CERTIFIED_DISBURSED' && tx.status !== 'LIQUIDATED') return false;
      } else if (activeTab === 'RETURNED') {
        if (tx.status !== 'REJECTED') return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (tx.tracking_number || tx.transaction_id || '').toLowerCase().includes(q);
        const matchesTitle = (tx.title || '').toLowerCase().includes(q);
        const matchesDesc = (tx.description || '').toLowerCase().includes(q);
        const matchesPayee = (tx.person_responsible || tx.submitted_by_name || '').toLowerCase().includes(q);
        const matchesCat = (tx.category_name || tx.spreadsheet_category || '').toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesDesc && !matchesPayee && !matchesCat) return false;
      }

      // 3. Event filter
      if (selectedEventFilter !== 'ALL' && tx.event_budget_id !== selectedEventFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery, selectedEventFilter, currentUser]);

  // Tab counters
  const myActionCount = transactions.filter((t) => {
    const tier = getRequiredTier(t.status);
    return tier && canUserApproveTier(tier);
  }).length;
  const allPendingCount = transactions.filter((t) => t.status.includes('PENDING')).length;
  const tier1Count = transactions.filter((t) => t.status === 'TIER_1_PENDING').length;
  const tier2Count = transactions.filter((t) => t.status === 'TIER_2_PENDING').length;
  const tier3Count = transactions.filter((t) => t.status === 'TIER_3_PENDING').length;
  const completedCount = transactions.filter((t) => t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED').length;
  const returnedCount = transactions.filter((t) => t.status === 'REJECTED').length;

  // Extract distinct events for dropdown filter
  const distinctEvents = useMemo(() => {
    const map = new Map<string, string>();
    transactions.forEach((t) => {
      if (t.event_budget_id && t.event_name) {
        map.set(t.event_budget_id, t.event_name);
      }
    });
    return Array.from(map.entries());
  }, [transactions]);

  // Handle Approve
  const handleApprove = (tx: ExpenseTransaction, isOverride = false) => {
    const requiredTier = getRequiredTier(tx.status);
    if (!requiredTier) return;

    const note = approvalNotes[tx.id] || 'Verified and approved according to PUP ACCESS standard operating procedure.';
    approveTransaction(tx.id, requiredTier, note);

    // Clear note for this item
    setApprovalNotes((prev) => {
      const next = { ...prev };
      delete next[tx.id];
      return next;
    });

    if (requiredTier === 'TIER_1_PROJECT_HEAD') {
      showToast('success', `✓ Endorsed ${tx.tracking_number}! Advanced to Step 2: Treasurer Audit.`);
    } else if (requiredTier === 'TIER_2_FINANCE_OFFICER') {
      showToast('success', `✓ Audited ${tx.tracking_number}! Advanced to Step 3: President Executive Sign-Off.`);
    } else if (requiredTier === 'TIER_3_PRESIDENT') {
      showToast('success', `🎉 Disbursed! ${tx.tracking_number} is certified and marked Complete on the Finance Sheet.`);
    }
  };

  // Handle Return
  const handleConfirmReturn = () => {
    if (!returnModalTx || !returnReason.trim()) return;
    const requiredTier = getRequiredTier(returnModalTx.status) || 'TIER_1_PROJECT_HEAD';

    rejectTransaction(returnModalTx.id, requiredTier, returnReason);
    showToast('return', `Returned ${returnModalTx.tracking_number} for revision with feedback.`);
    setReturnReason('');
    setReturnModalTx(null);
  };

  // Preset feedback suggestions for return modal
  const presetReasons = [
    'Blurry or illegible official receipt photo',
    'Official Receipt (OR) / BIR Invoice missing TIN number',
    'Claimed amount does not match the computed receipt total',
    'Missing itemized breakdown of items purchased',
    'Exceeds designated category envelope balance',
    'Please verify payee account / GCash mobile number',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-semibold shadow-2xl transition-all duration-300 border ${
            toastMessage.type === 'success'
              ? 'bg-[#002b1a] border-[#00bb7f] text-[#00e599]'
              : toastMessage.type === 'return'
              ? 'bg-[#3b1219] border-[#fb2c36] text-[#ff8088]'
              : 'bg-[#1e1b4b] border-[#6366f1] text-[#a5b4fc]'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 text-[#00bb7f]" />}
          {toastMessage.type === 'return' && <AlertCircle className="h-4 w-4 text-[#fb2c36]" />}
          {toastMessage.type === 'info' && <Info className="h-4 w-4 text-[#6366f1]" />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white font-mono text-sm leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="border-b border-[#262626] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7900] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ff7900]">
              Review & Approvals Desk
            </span>
            <span className="rounded-full bg-[#ff7900]/15 text-[#ff7900] border border-[#ff7900]/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              3-Stage Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
            Voucher Approvals & Sign-Offs
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 font-sans max-w-2xl">
            Authorize organizational disbursements in 3 sequential steps: Committee Lead Endorsement &rarr; Treasurer Financial Audit &rarr; President Executive Sign-Off.
          </p>
        </div>

        {/* Quick Guide Trigger */}
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-2 self-start md:self-auto rounded-xl border border-[#333] bg-[#141414] hover:bg-[#1a1a1a] px-3.5 py-2 text-xs font-semibold text-[#ededed] transition hover:border-[#ff7900]/50 cursor-pointer shadow-sm"
        >
          <HelpCircle className="h-4 w-4 text-[#ff7900]" />
          <span>How Approvals Work</span>
          {showHowItWorks ? <ChevronUp className="h-3.5 w-3.5 text-[#71717a]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />}
        </button>
      </div>

      {/* Explainer Accordion (How Approvals Work) */}
      {showHowItWorks && (
        <div className="rounded-2xl border border-[#333] bg-gradient-to-br from-[#141414] to-[#0e0e0e] p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ff7900]" />
              The 3-Stage Financial Approval Cycle
            </h3>
            <span className="text-[11px] font-mono text-[#71717a]">PUP ACCESS Standard Governance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="rounded-xl border border-[#3080ff]/20 bg-[#3080ff]/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3080ff] text-white font-mono text-xs font-bold">1</span>
                <h4 className="text-xs font-bold text-[#3080ff] uppercase tracking-wider font-mono">Stage 1: Committee Lead</h4>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                The Project Head confirms that the purchase or expense was legitimate, within the project scope, and actually received.
              </p>
              <div className="text-[10px] font-mono text-[#71717a] pt-1">
                Authorized: <span className="text-white">Project Heads / Event Leads</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f59e0b] text-white font-mono text-xs font-bold">2</span>
                <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider font-mono">Stage 2: Treasurer Audit</h4>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                The Treasurer or Finance Lead checks the BIR official receipt math, validates the TIN number, and deducts from the envelope buffer.
              </p>
              <div className="text-[10px] font-mono text-[#71717a] pt-1">
                Authorized: <span className="text-white">Treasurer / Finance Custodians</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#00bb7f]/20 bg-[#00bb7f]/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00bb7f] text-white font-mono text-xs font-bold">3</span>
                <h4 className="text-xs font-bold text-[#00bb7f] uppercase tracking-wider font-mono">Stage 3: President Sign-Off</h4>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                The Organization President reviews the audited voucher and grants final disbursement authorization. Funds are released and marked Complete!
              </p>
              <div className="text-[10px] font-mono text-[#71717a] pt-1">
                Authorized: <span className="text-white">Organization President</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Signer Context Banner with 1-Click Role Switcher */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1f1f1f] to-[#141414] text-[#ff7900] border border-[#333] shadow-inner">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">
                You are currently reviewing as:
              </span>
              <span className="rounded bg-[#00bb7f]/15 text-[#00bb7f] text-[10px] font-mono font-bold px-1.5 py-0.5 border border-[#00bb7f]/30">
                Active Session
              </span>
            </div>
            <p className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{currentUser.incumbent_name}</span>
              <span className="text-xs font-mono font-medium text-[#ff7900]">
                ({currentUser.position_title})
              </span>
            </p>
            <p className="text-[11px] text-[#a1a1aa] font-sans">
              Term: {currentUser.incumbent_term} &bull; Signing Authority:{' '}
              {currentUser.role === 'PRESIDENT' && <strong className="text-[#00bb7f]">Stage 3 (Final Sign-off)</strong>}
              {currentUser.role === 'FINANCE_OFFICER' && <strong className="text-[#f59e0b]">Stage 2 (Treasurer Audit)</strong>}
              {currentUser.role === 'PROJECT_HEAD' && <strong className="text-[#3080ff]">Stage 1 (Committee Endorsement)</strong>}
              {currentUser.role === 'ADMIN' && <strong className="text-[#00bb7f]">All Stages (Administrator Override)</strong>}
            </p>
          </div>
        </div>

        {/* 1-Click Role Switcher for Pair Testing */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-1.5 border-t lg:border-t-0 border-[#222] pt-3 lg:pt-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a]">
            Switch Testing Profile:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { profile: availableProfiles.projectHead, label: 'Ren (Lead)' },
              { profile: availableProfiles.treasurer, label: 'Daniel (Treasurer)' },
              { profile: availableProfiles.erica, label: 'Erica (Finance)' },
              { profile: availableProfiles.president, label: 'Sophia (President)' },
            ].map(({ profile, label }) => {
              if (!profile) return null;
              const isActive = currentUser.id === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => {
                    setCurrentUser(profile);
                    showToast('info', `Switched review role to ${profile.incumbent_name} (${profile.position_title})`);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition cursor-pointer ${
                    isActive
                      ? 'bg-[#ff7900] text-white font-bold shadow-md shadow-[#ff7900]/20'
                      : 'border border-[#333] bg-[#171717] text-[#a1a1aa] hover:border-[#ff7900]/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs with Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* Needs My Action Tab */}
          <button
            onClick={() => setActiveTab('MY_ACTION')}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold font-mono transition whitespace-nowrap cursor-pointer ${
              activeTab === 'MY_ACTION'
                ? 'bg-[#00bb7f] text-black shadow-lg shadow-[#00bb7f]/20 font-black'
                : 'text-[#00bb7f] bg-[#00bb7f]/10 border border-[#00bb7f]/30 hover:bg-[#00bb7f]/20'
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Needs My Sign-Off</span>
            {myActionCount > 0 && (
              <span
                className={`ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  activeTab === 'MY_ACTION' ? 'bg-black text-[#00bb7f]' : 'bg-[#00bb7f] text-black'
                }`}
              >
                {myActionCount}
              </span>
            )}
          </button>

          {[
            { id: 'ALL_PENDING', label: 'All Pending', count: allPendingCount },
            { id: 'TIER_1', label: 'Stage 1: Lead', count: tier1Count },
            { id: 'TIER_2', label: 'Stage 2: Treasurer', count: tier2Count },
            { id: 'TIER_3', label: 'Stage 3: President', count: tier3Count },
            { id: 'COMPLETED', label: 'Disbursed History', count: completedCount },
            { id: 'RETURNED', label: 'Returned', count: returnedCount },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold font-mono transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#ff7900] text-white shadow-md shadow-[#ff7900]/20 font-bold'
                    : 'text-[#a1a1aa] hover:bg-[#141414] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-mono ${
                      isActive ? 'bg-white text-[#ff7900] font-bold' : 'bg-[#222] text-[#888]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Total results count */}
        <span className="text-[11px] font-mono text-[#71717a] self-end sm:self-auto">
          Showing {filteredTransactions.length} of {transactions.length} records
        </span>
      </div>

      {/* Search & Event Quick Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Voucher ID (e.g. TXN-0016), title, person responsible, or category..."
            className="w-full rounded-xl border border-[#262626] bg-[#121212] pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#ff7900] focus:outline-none transition font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#71717a] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <select
            value={selectedEventFilter}
            onChange={(e) => setSelectedEventFilter(e.target.value)}
            className="w-full rounded-xl border border-[#262626] bg-[#121212] px-3 py-2.5 text-xs text-white focus:border-[#ff7900] focus:outline-none transition font-sans"
          >
            <option value="ALL">All Designated Events</option>
            {distinctEvents.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00bb7f]/10 text-[#00bb7f] mx-auto border border-[#00bb7f]/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white font-mono">
            {activeTab === 'MY_ACTION'
              ? 'All Caught Up! No Vouchers Need Your Action.'
              : 'No Vouchers Found'}
          </h3>
          <p className="text-xs text-[#71717a] max-w-md mx-auto leading-relaxed">
            {activeTab === 'MY_ACTION'
              ? `There are currently no vouchers in the queue waiting on a sign-off from ${currentUser.position_title}. Check the "All Pending" tab to inspect vouchers at other stages.`
              : 'Try clearing your search query or switching to another filter tab.'}
          </p>
          {activeTab === 'MY_ACTION' && allPendingCount > 0 && (
            <button
              onClick={() => setActiveTab('ALL_PENDING')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-white hover:border-[#ff7900]/50 transition cursor-pointer"
            >
              <span>View All {allPendingCount} Pending Vouchers</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#ff7900]" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => {
            const isTier1 = tx.status === 'TIER_1_PENDING';
            const isTier2 = tx.status === 'TIER_2_PENDING';
            const isTier3 = tx.status === 'TIER_3_PENDING';
            const isCompleted = tx.status === 'CERTIFIED_DISBURSED' || tx.status === 'LIQUIDATED';
            const isRejected = tx.status === 'REJECTED';

            const requiredTier = getRequiredTier(tx.status);
            const userCanSign = canUserApproveTier(requiredTier);
            const recommendedProfile = requiredTier ? getRecommendedProfileForTier(requiredTier) : null;

            // Approvals History Trail
            const t1Approval = tx.approvals.find((a) => a.tier === 'TIER_1_PROJECT_HEAD');
            const t2Approval = tx.approvals.find((a) => a.tier === 'TIER_2_FINANCE_OFFICER');
            const t3Approval = tx.approvals.find((a) => a.tier === 'TIER_3_PRESIDENT');

            const currentNote = approvalNotes[tx.id] || '';

            return (
              <div
                key={tx.id}
                className={`rounded-2xl border transition-all duration-200 bg-[#141414] shadow-sm hover:border-[#ff7900]/50 ${
                  userCanSign && !isCompleted && !isRejected
                    ? 'border-[#00bb7f]/60 ring-1 ring-[#00bb7f]/20 bg-gradient-to-b from-[#141414] to-[#0d1612]'
                    : 'border-[#262626]'
                }`}
              >
                {/* Card Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#222]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Tracking ID with Copy */}
                    <div className="flex items-center gap-1 rounded-lg bg-[#1e1e1e] px-2.5 py-1 border border-[#333]">
                      <span className="font-mono font-bold text-sm text-[#ff7900]">
                        {tx.tracking_number || tx.transaction_id}
                      </span>
                      <button
                        onClick={() => handleCopyId(tx.tracking_number || tx.transaction_id || '')}
                        title="Copy tracking number"
                        className="text-[#71717a] hover:text-white transition p-0.5"
                      >
                        {copiedId === (tx.tracking_number || tx.transaction_id) ? (
                          <Check className="h-3 w-3 text-[#00bb7f]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {/* Date */}
                    <span className="text-xs font-mono text-[#a1a1aa] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#71717a]" />
                      {tx.date_formatted || formatDate(tx.transacted_at)}
                    </span>

                    {/* Category */}
                    <span className="rounded-md bg-[#222] px-2 py-0.5 text-[11px] font-mono text-[#ededed] border border-[#333]">
                      {tx.category_name || tx.spreadsheet_category || 'General Expense'}
                    </span>

                    {/* Wallet */}
                    {tx.wallet && (
                      <span className="rounded-md bg-[#1a1a1a] px-2 py-0.5 text-[11px] font-mono text-[#a1a1aa] border border-[#2a2a2a] flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-[#ff7900]" />
                        {tx.wallet}
                      </span>
                    )}
                  </div>

                  {/* Stage Status Badge */}
                  <div>
                    {isTier1 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3080ff]/15 px-3 py-1 text-xs font-mono font-bold text-[#3080ff] border border-[#3080ff]/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3080ff] animate-ping" />
                        Stage 1: Awaiting Committee Lead
                      </span>
                    )}
                    {isTier2 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs font-mono font-bold text-[#f59e0b] border border-[#f59e0b]/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] animate-ping" />
                        Stage 2: Awaiting Treasurer Audit
                      </span>
                    )}
                    {isTier3 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff7900]/15 px-3 py-1 text-xs font-mono font-bold text-[#ff7900] border border-[#ff7900]/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#ff7900] animate-ping" />
                        Stage 3: Awaiting President Sign-Off
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00bb7f]/15 px-3 py-1 text-xs font-mono font-bold text-[#00bb7f] border border-[#00bb7f]/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Disbursed & Certified
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fb2c36]/15 px-3 py-1 text-xs font-mono font-bold text-[#fb2c36] border border-[#fb2c36]/30">
                        <XCircle className="h-3.5 w-3.5" />
                        Returned for Revision
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-Step Visual Progress Stepper */}
                <div className="px-5 py-4 bg-[#0e0e0e]/60 border-b border-[#222]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Step 1 Node */}
                    <div
                      className={`rounded-xl p-2.5 border transition ${
                        t1Approval
                          ? 'bg-[#00bb7f]/10 border-[#00bb7f]/30 text-[#00bb7f]'
                          : isTier1
                          ? 'bg-[#3080ff]/10 border-[#3080ff]/50 text-[#3080ff] ring-1 ring-[#3080ff]/30'
                          : 'bg-[#121212] border-[#222] text-[#555]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          {t1Approval ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00bb7f]" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3080ff] text-white text-[9px]">1</span>
                          )}
                          Stage 1: Lead
                        </span>
                        <span className="text-[10px]">
                          {t1Approval ? '✓ Endorsed' : isTier1 ? 'Awaiting Sign-off' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a1a1aa] font-sans truncate">
                        {t1Approval ? (
                          <>By <strong className="text-white">{t1Approval.approver_incumbent_name}</strong></>
                        ) : (
                          'Project Head Endorsement'
                        )}
                      </p>
                    </div>

                    {/* Step 2 Node */}
                    <div
                      className={`rounded-xl p-2.5 border transition ${
                        t2Approval
                          ? 'bg-[#00bb7f]/10 border-[#00bb7f]/30 text-[#00bb7f]'
                          : isTier2
                          ? 'bg-[#f59e0b]/10 border-[#f59e0b]/50 text-[#f59e0b] ring-1 ring-[#f59e0b]/30'
                          : 'bg-[#121212] border-[#222] text-[#555]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          {t2Approval ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00bb7f]" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-white text-[9px]">2</span>
                          )}
                          Stage 2: Treasurer
                        </span>
                        <span className="text-[10px]">
                          {t2Approval ? '✓ Audited' : isTier2 ? 'Awaiting Audit' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a1a1aa] font-sans truncate">
                        {t2Approval ? (
                          <>By <strong className="text-white">{t2Approval.approver_incumbent_name}</strong></>
                        ) : (
                          'Receipt Math & Buffer Verification'
                        )}
                      </p>
                    </div>

                    {/* Step 3 Node */}
                    <div
                      className={`rounded-xl p-2.5 border transition ${
                        t3Approval
                          ? 'bg-[#00bb7f]/10 border-[#00bb7f]/30 text-[#00bb7f]'
                          : isTier3
                          ? 'bg-[#ff7900]/10 border-[#ff7900]/50 text-[#ff7900] ring-1 ring-[#ff7900]/30'
                          : 'bg-[#121212] border-[#222] text-[#555]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          {t3Approval ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00bb7f]" />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ff7900] text-white text-[9px]">3</span>
                          )}
                          Stage 3: President
                        </span>
                        <span className="text-[10px]">
                          {t3Approval ? '✓ Disbursed' : isTier3 ? 'Awaiting Sign-off' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a1a1aa] font-sans truncate">
                        {t3Approval ? (
                          <>By <strong className="text-white">{t3Approval.approver_incumbent_name}</strong></>
                        ) : (
                          'Executive Sign-Off & Fund Release'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Left: Info */}
                    <div className="md:col-span-3 space-y-2">
                      <h3 className="text-base font-bold text-white font-sans">{tx.title}</h3>
                      <p className="text-xs text-[#a1a1aa] leading-relaxed">
                        {tx.description || tx.remarks || 'No additional description provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#71717a] pt-1">
                        <div>
                          Event: <strong className="text-white font-medium">{tx.event_name}</strong>
                        </div>
                        <div>
                          Claimant / Payee:{' '}
                          <strong className="text-[#ff7900] font-medium">
                            {tx.person_responsible || tx.submitted_by_name}
                          </strong>
                        </div>
                        {tx.receipt_proof && (
                          <div className="flex items-center gap-1">
                            Proof Document:{' '}
                            <button
                              onClick={() => setSelectedTxForProof(tx)}
                              className="text-[#3080ff] hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              <FileText className="h-3 w-3" />
                              {tx.receipt_proof.name}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount Box */}
                    <div className="flex flex-col justify-center items-start md:items-end border-t md:border-t-0 md:border-l border-[#262626] pt-3 md:pt-0 md:pl-5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717a]">
                        Disbursement Total
                      </span>
                      <span className="text-2xl font-black text-white font-mono tracking-tight text-[#00bb7f]">
                        {formatCurrency(tx.amount || tx.money_out || 0)}
                      </span>
                      <span className="text-[10px] font-mono text-[#71717a] mt-0.5">
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* AI Receipt Verification Box (if receipt available) */}
                  {tx.receipt && (
                    <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#00bb7f] flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Receipt OCR Match ({tx.receipt.file_name})
                        </span>
                        <span className="text-[#a1a1aa]">
                          Confidence:{' '}
                          <strong className="text-white">
                            {Math.round((tx.receipt.ai_confidence || 0.98) * 100)}% Match
                          </strong>
                        </span>
                      </div>

                      {tx.receipt.ai_extracted_json && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-[#71717a]">
                          <div>
                            Vendor: <span className="text-white font-medium">{tx.receipt.ai_extracted_json.vendor}</span>
                          </div>
                          <div>
                            OR / Invoice #: <span className="text-white font-medium">{tx.receipt.ai_extracted_json.or_number}</span>
                          </div>
                          <div>
                            Date: <span className="text-white font-medium">{tx.receipt.ai_extracted_json.date}</span>
                          </div>
                          <div>
                            Receipt Total:{' '}
                            <span className="text-[#00bb7f] font-bold">
                              {formatCurrency(tx.receipt.ai_extracted_json.computed_total || tx.amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection / Returned Reason Notice */}
                  {isRejected && tx.remarks && (
                    <div className="rounded-xl border border-[#fb2c36]/30 bg-[#fb2c36]/10 p-3 text-xs text-[#fb2c36] space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        Audit Return Notice:
                      </p>
                      <p className="text-[#ff99a0]">{tx.remarks}</p>
                    </div>
                  )}

                  {/* ACTION AREA (User-Friendly Guidance & Actions) */}
                  {!isCompleted && !isRejected && (
                    <div className="rounded-xl border border-[#262626] bg-[#0f0f0f] p-4 space-y-3">
                      {userCanSign ? (
                        /* Current user CAN sign this step */
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#00bb7f]">
                            <span className="h-2 w-2 rounded-full bg-[#00bb7f] animate-ping" />
                            <span>
                              Ready for your review! As <strong>{currentUser.position_title}</strong>, you can authorize this step.
                            </span>
                          </div>

                          {/* Quick optional note */}
                          <div className="relative">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) =>
                                setApprovalNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))
                              }
                              placeholder="Optional review comment (e.g. Items verified in Room 424 / Receipt matches envelope)..."
                              className="w-full rounded-xl border border-[#262626] bg-[#0a0a0a] px-3.5 py-2 text-xs text-white placeholder-[#555] focus:border-[#00bb7f] focus:outline-none transition font-sans"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                setReturnModalTx(tx);
                                setReturnReason('');
                              }}
                              className="flex items-center gap-1.5 rounded-xl border border-[#fb2c36]/30 bg-[#fb2c36]/10 px-4 py-2 text-xs font-semibold text-[#fb2c36] hover:bg-[#fb2c36]/20 transition cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Return with Feedback</span>
                            </button>

                            <button
                              onClick={() => handleApprove(tx)}
                              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00bb7f] to-[#009b68] px-6 py-2 text-xs font-bold text-white shadow-lg shadow-[#00bb7f]/20 hover:brightness-110 transition cursor-pointer"
                            >
                              <CheckSquare className="h-4 w-4" />
                              <span>
                                {isTier1 && 'Endorse Voucher (Stage 1)'}
                                {isTier2 && 'Audit & Advance to President (Stage 2)'}
                                {isTier3 && 'Authorize & Certify Disbursement (Stage 3)'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Current user CANNOT sign this step under their current profile */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="text-xs text-[#a1a1aa] flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-[#f59e0b]" />
                              <span>
                                Awaiting action by{' '}
                                <strong className="text-white">
                                  {isTier1 && 'Committee Head'}
                                  {isTier2 && 'Finance Officer / Treasurer'}
                                  {isTier3 && 'Organization President'}
                                </strong>
                              </span>
                            </p>
                            <p className="text-[11px] text-[#71717a]">
                              You are currently viewing as {currentUser.incumbent_name} ({currentUser.position_title}).
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {recommendedProfile && (
                              <button
                                onClick={() => {
                                  setCurrentUser(recommendedProfile);
                                  showToast('info', `Switched review role to ${recommendedProfile.incumbent_name} to test approval.`);
                                }}
                                className="flex items-center gap-1.5 rounded-xl border border-[#ff7900]/40 bg-[#ff7900]/10 px-3.5 py-1.5 text-xs font-mono font-semibold text-[#ff7900] hover:bg-[#ff7900]/20 transition cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Switch to {recommendedProfile.incumbent_name.split(' ')[0]}</span>
                              </button>
                            )}

                            {/* Admin override button */}
                            <button
                              onClick={() => handleApprove(tx, true)}
                              className="rounded-xl border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-mono text-[#a1a1aa] hover:text-white hover:border-[#555] transition cursor-pointer"
                              title="Approve immediately as administrative override"
                            >
                              Admin Override
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed Trail Details */}
                  {isCompleted && tx.approvals.length > 0 && (
                    <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3 text-xs space-y-1.5">
                      <p className="text-[10px] font-mono font-semibold uppercase text-[#71717a]">
                        Complete Executive Sign-Off Trail:
                      </p>
                      <div className="space-y-1">
                        {tx.approvals.map((appr) => (
                          <div key={appr.id} className="flex items-center gap-2 text-[11px] font-mono text-[#a1a1aa]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00bb7f]" />
                            <span>
                              <strong>{appr.tier.replace('TIER_', 'Stage ').replace(/_/g, ' ')}</strong> signed by{' '}
                              <span className="text-white font-semibold">{appr.approver_incumbent_name}</span> ({appr.approver_position}) on{' '}
                              {formatDate(appr.signed_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof / Receipt Preview Modal */}
      {selectedTxForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3080ff]/10 text-[#3080ff] border border-[#3080ff]/20">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Receipt & Proof Verification
                  </h3>
                  <p className="text-xs text-[#71717a]">
                    Voucher {selectedTxForProof.tracking_number || selectedTxForProof.transaction_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTxForProof(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl border border-[#333] text-[#a1a1aa] hover:text-white hover:bg-[#222] transition"
              >
                &times;
              </button>
            </div>

            {/* Document Preview Area */}
            <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 text-center space-y-4">
              <div className="h-44 w-full rounded-lg bg-gradient-to-b from-[#181818] to-[#111] border border-dashed border-[#333] flex flex-col items-center justify-center p-4">
                <FileText className="h-12 w-12 text-[#ff7900] mb-2" />
                <p className="text-sm font-bold text-white font-mono">
                  {selectedTxForProof.receipt_proof?.name || 'RECEIPT_ATTACHMENT.pdf'}
                </p>
                <p className="text-xs text-[#71717a] mt-1 font-mono">
                  Format: {selectedTxForProof.receipt_proof?.file_type?.toUpperCase() || 'PDF Document'} &bull; Digital Verification: Active
                </p>
              </div>

              {/* Data Extraction & Verification Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left font-mono text-xs">
                <div className="rounded-lg bg-[#141414] p-2.5 border border-[#222]">
                  <span className="text-[10px] text-[#71717a] block">Claimed Amount</span>
                  <span className="text-sm font-bold text-[#00bb7f]">
                    {formatCurrency(selectedTxForProof.amount || selectedTxForProof.money_out || 0)}
                  </span>
                </div>
                <div className="rounded-lg bg-[#141414] p-2.5 border border-[#222]">
                  <span className="text-[10px] text-[#71717a] block">Person Responsible</span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {selectedTxForProof.person_responsible || selectedTxForProof.submitted_by_name}
                  </span>
                </div>
                <div className="rounded-lg bg-[#141414] p-2.5 border border-[#222]">
                  <span className="text-[10px] text-[#71717a] block">Status on Sheet</span>
                  <span className="text-xs font-semibold text-[#00bb7f]">
                    {selectedTxForProof.verification || 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-[#71717a]">
                Document attached to official PUP ACCESS treasury archives
              </span>
              <button
                onClick={() => setSelectedTxForProof(null)}
                className="rounded-xl bg-[#222] hover:bg-[#2c2c2c] px-5 py-2 text-xs font-semibold text-white transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Revision Modal */}
      {returnModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fb2c36]/15 text-[#fb2c36] border border-[#fb2c36]/30">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Return Voucher for Revision
                </h3>
                <p className="text-xs text-[#71717a]">
                  Voucher {returnModalTx.tracking_number || returnModalTx.transaction_id} &bull; {returnModalTx.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#a1a1aa] leading-relaxed">
              Select or type a reason for returning this expenditure voucher. The submitter ({returnModalTx.submitted_by_name}) will receive these instructions to update their submission.
            </p>

            {/* Quick-Pick Reason Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a]">
                Quick Audit Feedback Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetReasons.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReturnReason(preset)}
                    className="rounded-lg border border-[#333] bg-[#1b1b1b] hover:bg-[#252525] px-2.5 py-1 text-[11px] text-[#ededed] transition text-left cursor-pointer hover:border-[#fb2c36]/50"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Detailed Feedback Note
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Explain what needs correction (e.g. Please re-upload clear photo of the BIR Invoice with visible TIN number)..."
                rows={3}
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-xs text-white placeholder-[#555] focus:border-[#fb2c36] focus:outline-none transition font-sans"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
              <button
                onClick={() => setReturnModalTx(null)}
                className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={!returnReason.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-[#fb2c36] px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Feedback & Return</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
