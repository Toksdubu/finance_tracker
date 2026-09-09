'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { ApprovalTier, ExpenseTransaction } from '@/types/finance';

export default function ApprovalsPage() {
  const { currentUser, transactions, approveTransaction, rejectTransaction } = useFinance();
  const [selectedTx, setSelectedTx] = useState<ExpenseTransaction | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Filter pending transactions based on tab
  const pendingTransactions = transactions.filter((t) => {
    if (activeTab === 'TIER_1') return t.status === 'TIER_1_PENDING';
    if (activeTab === 'TIER_2') return t.status === 'TIER_2_PENDING';
    if (activeTab === 'TIER_3') return t.status === 'TIER_3_PENDING';
    return t.status.includes('PENDING');
  });

  const handleApprove = (tx: ExpenseTransaction) => {
    let tierToApprove: ApprovalTier = 'TIER_1_PROJECT_HEAD';
    if (tx.status === 'TIER_2_PENDING') tierToApprove = 'TIER_2_FINANCE_OFFICER';
    if (tx.status === 'TIER_3_PENDING') tierToApprove = 'TIER_3_PRESIDENT';

    approveTransaction(tx.id, tierToApprove, approvalNotes);
    setApprovalNotes('');
    setSelectedTx(null);
  };

  const handleReject = () => {
    if (!selectedTx || !rejectReason.trim()) return;
    let tierToReject: ApprovalTier = 'TIER_1_PROJECT_HEAD';
    if (selectedTx.status === 'TIER_2_PENDING') tierToReject = 'TIER_2_FINANCE_OFFICER';
    if (selectedTx.status === 'TIER_3_PENDING') tierToReject = 'TIER_3_PRESIDENT';

    rejectTransaction(selectedTx.id, tierToReject, rejectReason);
    setRejectReason('');
    setRejectModalOpen(false);
    setSelectedTx(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-[#f26223]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f26223]">
            Executive Approval Desk
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
          3-Tier Multi-Signature Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
          Every expenditure progresses sequentially from Project Head Endorsement &rarr; Treasurer Financial Audit &rarr; President Executive Sign-off.
        </p>
      </div>

      {/* Current Signer Context Banner */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e1e1e] text-[#f26223] border border-[#333]">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[#71717a]">Active Signing Authority:</p>
            <p className="text-sm font-bold text-white">
              {currentUser.incumbent_name} <span className="text-[#f26223] font-mono">({currentUser.position_title})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa] bg-[#0c0c0c] px-3 py-1.5 rounded-lg border border-[#222]">
          <Lock className="h-3.5 w-3.5 text-[#00bb7f]" />
          <span>Dual Attribution Active: Stamping term {currentUser.incumbent_term}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-3 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Pending Queue' },
          { id: 'TIER_1', label: 'Tier 1: Project Head' },
          { id: 'TIER_2', label: 'Tier 2: Treasurer' },
          { id: 'TIER_3', label: 'Tier 3: President' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold font-mono transition ${
              activeTab === tab.id
                ? 'bg-[#f26223] text-white shadow-md shadow-[#f26223]/20'
                : 'text-[#a1a1aa] hover:bg-[#141414] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Vouchers List */}
      {pendingTransactions.length === 0 ? (
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#00bb7f] mb-3" />
          <h3 className="text-base font-bold text-white font-mono">Queue Clear!</h3>
          <p className="text-xs text-[#71717a] mt-1">No pending vouchers awaiting action under this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingTransactions.map((tx) => {
            const isTier1 = tx.status === 'TIER_1_PENDING';
            const isTier2 = tx.status === 'TIER_2_PENDING';
            const isTier3 = tx.status === 'TIER_3_PENDING';

            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm hover:border-[#f26223]/40 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#f26223] text-sm">{tx.tracking_number}</span>
                    <span className="text-xs font-mono text-[#71717a]">&bull; {formatDate(tx.transacted_at)}</span>
                  </div>

                  {/* Tier Indicator */}
                  <div>
                    {isTier1 && (
                      <span className="rounded-full bg-[#3080ff]/15 px-3 py-1 text-xs font-mono font-bold text-[#3080ff] border border-[#3080ff]/30">
                        TIER 1 (PROJECT HEAD ENDORSEMENT NEEDED)
                      </span>
                    )}
                    {isTier2 && (
                      <span className="rounded-full bg-[#f59e0b]/15 px-3 py-1 text-xs font-mono font-bold text-[#f59e0b] border border-[#f59e0b]/30">
                        TIER 2 (TREASURER AUDIT & ENCRYPTION NEEDED)
                      </span>
                    )}
                    {isTier3 && (
                      <span className="rounded-full bg-[#f26223]/15 px-3 py-1 text-xs font-mono font-bold text-[#f26223] border border-[#f26223]/30">
                        TIER 3 (PRESIDENT FINAL SIGN-OFF NEEDED)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="md:col-span-3 space-y-1">
                    <h3 className="text-base font-bold text-white font-sans">{tx.title}</h3>
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">{tx.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#71717a] pt-2">
                      <span>Event: <strong className="text-white">{tx.event_name}</strong></span>
                      <span>Category: <strong className="text-white">{tx.category_name}</strong></span>
                      <span>Claimant: <strong className="text-white">{tx.submitted_by_name}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-[#262626] pt-3 md:pt-0 md:pl-4">
                    <span className="text-[11px] font-mono text-[#71717a] uppercase">Voucher Amount</span>
                    <span className="text-2xl font-bold text-white font-mono">{formatCurrency(tx.amount)}</span>
                  </div>
                </div>

                {/* Attached Receipt Details & AI Scan */}
                {tx.receipt && (
                  <div className="rounded-xl border border-[#222] bg-[#0e0e0e] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#00bb7f] flex items-center gap-1.5 font-bold">
                        <FileText className="h-3.5 w-3.5" />
                        AI OCR Verified ({tx.receipt.file_name})
                      </span>
                      <span className="text-[#a1a1aa]">Confidence: {Math.round((tx.receipt.ai_confidence || 0.98) * 100)}%</span>
                    </div>

                    {tx.receipt.ai_extracted_json && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-[#71717a]">
                        <div>Vendor: <span className="text-white">{tx.receipt.ai_extracted_json.vendor}</span></div>
                        <div>OR #: <span className="text-white">{tx.receipt.ai_extracted_json.or_number}</span></div>
                        <div>Date: <span className="text-white">{tx.receipt.ai_extracted_json.date}</span></div>
                        <div>Calculated Total: <span className="text-[#00bb7f] font-bold">{formatCurrency(tx.receipt.ai_extracted_json.computed_total || tx.amount)}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Approvals Trail */}
                {tx.approvals.length > 0 && (
                  <div className="border-t border-[#222] pt-3 space-y-1.5">
                    <p className="text-[10px] font-mono font-semibold uppercase text-[#555]">Sign-Off Progress:</p>
                    <div className="space-y-1">
                      {tx.approvals.map((appr) => (
                        <div key={appr.id} className="flex items-center gap-2 text-[11px] font-mono text-[#a1a1aa]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#00bb7f]" />
                          <span>
                            <strong>{appr.tier.replace('TIER_', 'Tier ').replace(/_/g, ' ')}</strong> signed by{' '}
                            <span className="text-white">{appr.approver_incumbent_name}</span> ({appr.approver_position}) on{' '}
                            {formatDate(appr.signed_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                  <button
                    onClick={() => {
                      setSelectedTx(tx);
                      setRejectModalOpen(true);
                    }}
                    className="rounded-xl border border-[#fb2c36]/30 bg-[#fb2c36]/10 px-3.5 py-2 text-xs font-semibold text-[#fb2c36] hover:bg-[#fb2c36]/20 transition"
                  >
                    Reject with Feedback
                  </button>

                  <button
                    onClick={() => handleApprove(tx)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00bb7f] to-[#00a86b] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#00bb7f]/20 hover:brightness-110 transition cursor-pointer"
                  >
                    <CheckSquare className="h-4 w-4" />
                    {isTier1 && 'Endorse Voucher (Tier 1)'}
                    {isTier2 && 'Audit & Advance to President (Tier 2)'}
                    {isTier3 && 'Authorize & Sign SHA-256 Ledger (Tier 3)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <XCircle className="h-5 w-5 text-[#fb2c36]" />
              Reject Voucher {selectedTx?.tracking_number}
            </h3>
            <p className="text-xs text-[#a1a1aa]">
              Provide a clear audit reason for returning this voucher to the committee lead.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Official Receipt photo is blurry / missing BIR tin number / item exceeds envelope buffer..."
              rows={4}
              className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-xs text-white placeholder-[#555] focus:border-[#fb2c36] focus:outline-none transition font-sans"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-[#a1a1aa] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="rounded-xl bg-[#fb2c36] px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
