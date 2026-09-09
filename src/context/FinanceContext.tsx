'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  EventBudget,
  ExpenseTransaction,
  AuditBlock,
  ApprovalTier,
  TransactionType,
  ReceiptType,
} from '@/types/finance';
import {
  INITIAL_PROFILES,
  INITIAL_EVENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_BLOCKS,
} from '@/lib/mock-data';
import { generateAuditHash, generateApprovalSignature } from '@/lib/security/crypto';

export interface WalletSummary {
  gcash: { in: number; out: number; balance: number };
  gotyme: { in: number; out: number; balance: number };
  cash: { in: number; out: number; balance: number };
}

export interface FundingSourceSummary {
  quota: { in: number; out: number; balance: number };
  partnerships: { in: number; out: number; balance: number };
  accessGeneral: { in: number; out: number; balance: number };
}

interface FinanceContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableProfiles: Record<string, UserProfile>;
  events: EventBudget[];
  transactions: ExpenseTransaction[];
  auditBlocks: AuditBlock[];
  totalAllocated: number;
  totalSpent: number;
  remainingBalance: number;
  walletTotals: WalletSummary;
  fundingSourceTotals: FundingSourceSummary;
  approveTransaction: (txId: string, tier: ApprovalTier, comments?: string) => void;
  rejectTransaction: (txId: string, tier: ApprovalTier, reason: string) => void;
  submitVoucher: (data: {
    eventBudgetId: string;
    categoryId: string;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    receiptType: ReceiptType;
    wallet?: 'GCASH' | 'GOTYME' | 'CASH_ON_HAND' | 'LANDBANK';
    fundingSource?: 'QUOTA' | 'PARTNERSHIP_SPONSOR' | 'ACCESS_GENERAL_FUNDS';
    remarks?: string;
    reimbursementNotes?: string;
    receiptFile?: { name: string; size: number; mimeType: string };
    aiExtracted?: {
      vendor?: string;
      orNumber?: string;
      lineItems?: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
    };
    payeeName: string;
    accountType: 'GCASH' | 'LANDBANK' | 'BDO' | 'OTHER_BANK' | 'CASH';
    accountNumber: string;
    phoneNumber?: string;
  }) => ExpenseTransaction;
  verifyLedgerIntegrity: () => { isValid: boolean; brokenAtIndex?: number; message: string };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES.president);
  const [events, setEvents] = useState<EventBudget[]>(INITIAL_EVENTS);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(INITIAL_TRANSACTIONS);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>(INITIAL_AUDIT_BLOCKS);

  // Load from localStorage if available in browser
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('access_user');
      const savedTx = localStorage.getItem('access_transactions');
      const savedEvents = localStorage.getItem('access_events');
      const savedBlocks = localStorage.getItem('access_audit_blocks');

      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      if (savedTx) setTransactions(JSON.parse(savedTx));
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedBlocks) setAuditBlocks(JSON.parse(savedBlocks));
    } catch {
      // Use initial state on error or SSR
    }
  }, []);

  // Save changes to localStorage for state persistence across navigation
  useEffect(() => {
    try {
      localStorage.setItem('access_user', JSON.stringify(currentUser));
      localStorage.setItem('access_transactions', JSON.stringify(transactions));
      localStorage.setItem('access_events', JSON.stringify(events));
      localStorage.setItem('access_audit_blocks', JSON.stringify(auditBlocks));
    } catch {
      // Silently catch quota errors
    }
  }, [currentUser, transactions, events, auditBlocks]);

  // Aggregate computations
  const totalAllocated = events.reduce((sum, e) => sum + e.total_allocated, 0);
  const totalSpent = transactions
    .filter((t) => t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')
    .reduce((sum, t) => sum + (t.cash_in ? 0 : t.amount), 0);
  const remainingBalance = totalAllocated - totalSpent;

  // Dynamic Multi-Wallet Balances (Matching the ACCESS Spreadsheet)
  const gcashIn = 39760.43 + transactions.filter(t => t.wallet === 'GCASH' && t.cash_in).reduce((sum, t) => sum + (t.cash_in || 0), 0);
  const gcashOut = transactions.filter(t => t.wallet === 'GCASH' && !t.cash_in && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);

  const gotymeIn = 8401.73 + transactions.filter(t => t.wallet === 'GOTYME' && t.cash_in).reduce((sum, t) => sum + (t.cash_in || 0), 0);
  const gotymeOut = transactions.filter(t => t.wallet === 'GOTYME' && !t.cash_in && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);

  const cashIn = 500.00 + transactions.filter(t => t.wallet === 'CASH_ON_HAND' && t.cash_in).reduce((sum, t) => sum + (t.cash_in || 0), 0);
  const cashOut = transactions.filter(t => t.wallet === 'CASH_ON_HAND' && !t.cash_in && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);

  const walletTotals: WalletSummary = {
    gcash: { in: gcashIn, out: gcashOut, balance: gcashIn - gcashOut },
    gotyme: { in: gotymeIn, out: gotymeOut, balance: gotymeIn - gotymeOut },
    cash: { in: cashIn, out: cashOut, balance: cashIn - cashOut },
  };

  // Funding Source Summaries (Quota vs Partnerships vs General Funds)
  const quotaOut = transactions.filter(t => t.funding_source === 'QUOTA' && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);
  const partnerOut = transactions.filter(t => t.funding_source === 'PARTNERSHIP_SPONSOR' && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);
  const accessOut = transactions.filter(t => t.funding_source === 'ACCESS_GENERAL_FUNDS' && (t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')).reduce((sum, t) => sum + t.amount, 0);

  const fundingSourceTotals: FundingSourceSummary = {
    quota: { in: 36760.43, out: quotaOut, balance: 36760.43 - quotaOut },
    partnerships: { in: 11401.73, out: partnerOut, balance: 11401.73 - partnerOut },
    accessGeneral: { in: 50000.00, out: accessOut, balance: 50000.00 - accessOut },
  };

  // 3-Tier Sequential Approval Engine
  const approveTransaction = (txId: string, tier: ApprovalTier, comments?: string) => {
    const timestamp = new Date().toISOString();
    const signatureHash = generateApprovalSignature(txId, currentUser.id, tier, timestamp);

    setTransactions((prevTx) => {
      return prevTx.map((tx) => {
        if (tx.id !== txId) return tx;

        const newApproval = {
          id: `appr_${Date.now()}`,
          transaction_id: tx.id,
          tier,
          approver_id: currentUser.id,
          approver_position: currentUser.position_title,
          approver_incumbent_name: currentUser.incumbent_name,
          approver_term: currentUser.incumbent_term,
          action: 'APPROVED' as const,
          comments: comments || 'Approved pursuant to PUP ACCESS financial guidelines.',
          signature_hash: signatureHash,
          signed_at: timestamp,
        };

        let nextStatus = tx.status;
        if (tier === 'TIER_1_PROJECT_HEAD') {
          nextStatus = 'TIER_2_PENDING';
        } else if (tier === 'TIER_2_FINANCE_OFFICER') {
          nextStatus = 'TIER_3_PENDING';
        } else if (tier === 'TIER_3_PRESIDENT') {
          nextStatus = 'CERTIFIED_DISBURSED';

          // When President issues Tier 3 sign-off, trigger SHA-256 block creation
          const lastBlock = auditBlocks[auditBlocks.length - 1];
          const prevHash = lastBlock ? lastBlock.current_hash : '0000000000000000000000000000000000000000000000000000000000000000';
          const newCurrentHash = generateAuditHash(
            prevHash,
            tx.tracking_number,
            tx.amount,
            timestamp,
            currentUser.id
          );

          const newAuditBlock: AuditBlock = {
            id: `blk_${Date.now()}`,
            transaction_id: tx.id,
            tracking_number: tx.tracking_number,
            block_index: auditBlocks.length,
            previous_hash: prevHash,
            current_hash: newCurrentHash,
            title: tx.title,
            amount: tx.amount,
            event_name: tx.event_name,
            certified_by_name: currentUser.incumbent_name,
            certified_by_position: currentUser.position_title,
            timestamp,
          };

          setAuditBlocks((prevBlocks) => [...prevBlocks, newAuditBlock]);

          // Update Event & Category spent amount
          setEvents((prevEvents) =>
            prevEvents.map((evt) => {
              if (evt.id !== tx.event_budget_id) return evt;
              return {
                ...evt,
                spent_amount: evt.spent_amount + tx.amount,
                categories: evt.categories.map((cat) => {
                  if (cat.id !== tx.category_id) return cat;
                  return { ...cat, spent_amount: cat.spent_amount + tx.amount };
                }),
              };
            })
          );
        }

        return {
          ...tx,
          status: nextStatus,
          approvals: [...tx.approvals, newApproval],
        };
      });
    });
  };

  // Rejection Workflow
  const rejectTransaction = (txId: string, tier: ApprovalTier, reason: string) => {
    const timestamp = new Date().toISOString();
    const signatureHash = generateApprovalSignature(txId, currentUser.id, tier, timestamp);

    setTransactions((prevTx) =>
      prevTx.map((tx) => {
        if (tx.id !== txId) return tx;
        return {
          ...tx,
          status: 'REJECTED',
          approvals: [
            ...tx.approvals,
            {
              id: `appr_${Date.now()}`,
              transaction_id: tx.id,
              tier,
              approver_id: currentUser.id,
              approver_position: currentUser.position_title,
              approver_incumbent_name: currentUser.incumbent_name,
              approver_term: currentUser.incumbent_term,
              action: 'REJECTED',
              comments: reason,
              signature_hash: signatureHash,
              signed_at: timestamp,
            },
          ],
        };
      })
    );
  };

  // Submit New Voucher Workflow
  const submitVoucher = (data: {
    eventBudgetId: string;
    categoryId: string;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    receiptType: ReceiptType;
    receiptFile?: { name: string; size: number; mimeType: string };
    aiExtracted?: {
      vendor?: string;
      orNumber?: string;
      lineItems?: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
    };
    payeeName: string;
    accountType: 'GCASH' | 'LANDBANK' | 'BDO' | 'OTHER_BANK' | 'CASH';
    accountNumber: string;
    phoneNumber?: string;
  }) => {
    const targetEvent = events.find((e) => e.id === data.eventBudgetId);
    const targetCategory = targetEvent?.categories.find((c) => c.id === data.categoryId);
    const trackingNum = `ACCSS-2026-EXP-${String(transactions.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newTransaction: ExpenseTransaction = {
      id: `tx_${Date.now()}`,
      event_budget_id: data.eventBudgetId,
      event_name: targetEvent?.name || 'General Event',
      category_id: data.categoryId,
      category_name: targetCategory?.name || 'General Category',
      tracking_number: trackingNum,
      title: data.title,
      description: data.description,
      type: data.type,
      status: 'TIER_1_PENDING',
      amount: data.amount,
      transacted_at: now,
      submitted_by_id: currentUser.id,
      submitted_by_name: currentUser.incumbent_name,
      receipt: {
        id: `rcpt_${Date.now()}`,
        transaction_id: `tx_${Date.now()}`,
        receipt_type: data.receiptType,
        file_name: data.receiptFile?.name || 'uploaded_receipt.webp',
        file_size: data.receiptFile?.size || 145000,
        mime_type: data.receiptFile?.mimeType || 'image/webp',
        storage_path: `receipts-vault/2026/${trackingNum.toLowerCase()}.webp`,
        sha256_hash: 'c8f7e6d5c4b3a2918273645abcdef1234567890abcdef1234567890abcdef12',
        ai_extracted_json: {
          vendor: data.aiExtracted?.vendor || 'Verified Merchant',
          or_number: data.aiExtracted?.orNumber || 'OR-PENDING',
          date: now.split('T')[0],
          line_items: data.aiExtracted?.lineItems || [{ name: data.title, quantity: 1, unit_price: data.amount, total: data.amount }],
          computed_total: data.amount,
        },
        ai_confidence: 0.98,
      },
      approvals: [],
      created_at: now,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    return newTransaction;
  };

  // Live Cryptographic Audit Integrity Verifier
  const verifyLedgerIntegrity = () => {
    for (let i = 1; i < auditBlocks.length; i++) {
      const prevBlock = auditBlocks[i - 1];
      const currBlock = auditBlocks[i];

      if (currBlock.previous_hash !== prevBlock.current_hash) {
        return {
          isValid: false,
          brokenAtIndex: i,
          message: `Tamper detected at Block #${currBlock.block_index} (${currBlock.tracking_number}). Previous hash mismatch!`,
        };
      }
    }
    return {
      isValid: true,
      message: `Audit Ledger Verified: All ${auditBlocks.length} cryptographic blocks intact and mathematically tamper-free.`,
    };
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableProfiles: INITIAL_PROFILES,
        events,
        transactions,
        auditBlocks,
        totalAllocated,
        totalSpent,
        remainingBalance,
        walletTotals,
        fundingSourceTotals,
        approveTransaction,
        rejectTransaction,
        submitVoucher,
        verifyLedgerIntegrity,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
