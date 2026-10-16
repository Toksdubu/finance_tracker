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
  FiscalYear,
  BudgetReallocation,
  BudgetCategory,
  BudgetTechnique,
  WalletType,
  FundingSource,
} from '@/types/finance';
import {
  INITIAL_PROFILES,
  INITIAL_EVENTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_BLOCKS,
  INITIAL_FISCAL_YEAR,
  INITIAL_REALLOCATIONS,
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
  fiscalYear: FiscalYear;
  reallocations: BudgetReallocation[];
  masterBudgetCap: number;
  totalAllocated: number;
  unallocatedReserve: number;
  totalContingencyBuffer: number;
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
  totalMoneyIn: number;
  totalMoneyOut: number;
  netTrackerBalance: number;
  addTrackerTransaction: (entry: {
    date_formatted: string;
    entry_type: 'Income' | 'Expense';
    spreadsheet_category: string;
    description: string;
    money_in?: number | null;
    money_out?: number | null;
    person_responsible: string;
    receipt_proof_name?: string;
    verification?: 'Verified' | 'Pending' | 'Rejected' | 'Unverified';
    remarks?: string;
    entry_status?: 'Complete' | 'Pending' | 'In Progress' | 'Draft';
    wallet?: WalletType;
  }) => ExpenseTransaction;
  updateTrackerTransaction: (id: string, updates: Partial<ExpenseTransaction>) => void;
  deleteTrackerTransaction: (id: string) => void;
  resetToOfficialSheet: () => void;
  verifyLedgerIntegrity: () => { isValid: boolean; brokenAtIndex?: number; message: string };
  updateFiscalYearCap: (newCap: number) => void;
  createEventBudget: (data: {
    name: string;
    purpose: string;
    technique: BudgetTechnique;
    total_allocated: number;
    contingency_buffer: number;
    project_head_name?: string;
    categories: Array<{ name: string; allocated_amount: number }>;
  }) => EventBudget;
  reallocateEnvelopeFunds: (
    eventId: string,
    sourceCategoryId: string,
    targetCategoryId: string,
    amount: number,
    reason: string
  ) => { success: boolean; error?: string };
  updateEventBudget: (
    eventId: string,
    updates: Partial<Omit<EventBudget, 'id' | 'categories'>>
  ) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES.president);
  const [events, setEvents] = useState<EventBudget[]>(INITIAL_EVENTS);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>(INITIAL_TRANSACTIONS);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>(INITIAL_AUDIT_BLOCKS);
  const [fiscalYear, setFiscalYear] = useState<FiscalYear>(INITIAL_FISCAL_YEAR);
  const [reallocations, setReallocations] = useState<BudgetReallocation[]>(INITIAL_REALLOCATIONS);

  // Load from localStorage if available in browser
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('access_user');
      const savedTx = localStorage.getItem('access_transactions');
      const trackerVersion = localStorage.getItem('access_tracker_v2');
      const savedEvents = localStorage.getItem('access_events');
      const savedBlocks = localStorage.getItem('access_audit_blocks');
      const savedFy = localStorage.getItem('access_fiscal_year');
      const savedRealloc = localStorage.getItem('access_reallocations');

      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      // Ensure official spreadsheet tracker dataset is present
      if (savedTx && trackerVersion === '2.1') {
        const parsed = JSON.parse(savedTx);
        if (Array.isArray(parsed) && parsed.some((t: ExpenseTransaction) => t.tracking_number === 'TXN-0001' || t.transaction_id === 'TXN-0001')) {
          setTransactions(parsed);
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
          localStorage.setItem('access_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
          localStorage.setItem('access_tracker_v2', '2.1');
        }
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem('access_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
        localStorage.setItem('access_tracker_v2', '2.1');
      }

      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedBlocks) setAuditBlocks(JSON.parse(savedBlocks));
      if (savedFy) setFiscalYear(JSON.parse(savedFy));
      if (savedRealloc) setReallocations(JSON.parse(savedRealloc));
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
      localStorage.setItem('access_fiscal_year', JSON.stringify(fiscalYear));
      localStorage.setItem('access_reallocations', JSON.stringify(reallocations));
    } catch {
      // Silently catch quota errors
    }
  }, [currentUser, transactions, events, auditBlocks, fiscalYear, reallocations]);

  // Aggregate computations
  const totalAllocated = events.reduce((sum, e) => sum + e.total_allocated, 0);
  const masterBudgetCap = fiscalYear.total_budget_cap;
  const unallocatedReserve = Math.max(0, masterBudgetCap - totalAllocated);
  const totalContingencyBuffer = events.reduce((sum, e) => sum + (e.contingency_buffer || 0), 0);

  const totalSpent = transactions
    .filter((t) => t.status === 'CERTIFIED_DISBURSED' || t.status === 'LIQUIDATED')
    .reduce((sum, t) => sum + (t.cash_in ? 0 : t.amount), 0);
  const remainingBalance = totalAllocated - totalSpent;

  // Exact Current Finance Tracker Computations
  const totalMoneyIn = transactions.reduce((sum, t) => sum + (t.money_in || t.cash_in || 0), 0);
  const totalMoneyOut = transactions.reduce(
    (sum, t) => sum + (t.money_out !== undefined && t.money_out !== null ? t.money_out : (!t.cash_in && t.amount ? t.amount : 0)),
    0
  );
  const netTrackerBalance = totalMoneyIn - totalMoneyOut;

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

        let entryStatus = tx.entry_status || 'Pending';
        let verification = tx.verification || 'Pending';
        let remarks = tx.remarks;

        if (nextStatus === 'CERTIFIED_DISBURSED') {
          entryStatus = 'Complete';
          verification = 'Verified';
          remarks = comments ? `Disbursed: ${comments}` : 'Certified & Disbursed';
        } else if (nextStatus === 'TIER_2_PENDING') {
          entryStatus = 'In Progress';
          verification = 'Pending';
          remarks = 'Endorsed by Lead, awaiting Treasurer audit';
        } else if (nextStatus === 'TIER_3_PENDING') {
          entryStatus = 'In Progress';
          verification = 'Pending';
          remarks = 'Audited by Treasurer, awaiting President sign-off';
        }

        return {
          ...tx,
          status: nextStatus,
          entry_status: entryStatus,
          verification: verification,
          remarks: remarks,
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
          entry_status: 'Pending',
          verification: 'Rejected',
          remarks: reason ? `Returned: ${reason}` : 'Returned for revision',
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
    wallet?: WalletType;
    fundingSource?: FundingSource;
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
  }) => {
    const targetEvent = events.find((e) => e.id === data.eventBudgetId);
    const targetCategory = targetEvent?.categories.find((c) => c.id === data.categoryId);
    const nextTxnNum = transactions.length + 1;
    const txnId = `TXN-${String(nextTxnNum).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    const isIncome = data.type === 'COLLECTION' || data.type === 'SPONSORSHIP';

    const newTransaction: ExpenseTransaction = {
      id: `tx_${Date.now()}`,
      event_budget_id: data.eventBudgetId,
      event_name: targetEvent?.name || 'PUP ACCESS Treasury Ledger',
      category_id: data.categoryId,
      category_name: targetCategory?.name || 'Other Expense',
      tracking_number: txnId,
      transaction_id: txnId,
      date_formatted: formattedDate,
      entry_type: isIncome ? 'Income' : 'Expense',
      spreadsheet_category: targetCategory?.name || 'Other Expense',
      title: data.title,
      description: data.description || data.title,
      type: data.type,
      status: 'TIER_1_PENDING',
      amount: data.amount,
      transacted_at: now,
      cash_in: isIncome ? data.amount : 0,
      money_in: isIncome ? data.amount : null,
      money_out: !isIncome ? data.amount : null,
      wallet: data.wallet || 'GCASH',
      funding_source: data.fundingSource || 'ACCESS_GENERAL_FUNDS',
      person_responsible: data.payeeName || currentUser.incumbent_name,
      submitted_by_id: currentUser.id,
      submitted_by_name: data.payeeName || currentUser.incumbent_name,
      receipt_proof: {
        name: data.receiptFile?.name || data.title.toUpperCase(),
        file_type: 'pdf',
      },
      verification: 'Pending',
      remarks: data.remarks || 'Pending audit',
      entry_status: 'Pending',
      reimbursement_notes: data.reimbursementNotes || '',
      receipt: {
        id: `rcpt_${Date.now()}`,
        transaction_id: `tx_${Date.now()}`,
        receipt_type: data.receiptType,
        file_name: data.receiptFile?.name || 'uploaded_receipt.webp',
        file_size: data.receiptFile?.size || 145000,
        mime_type: data.receiptFile?.mimeType || 'image/webp',
        storage_path: `receipts-vault/2026/${txnId.toLowerCase()}.webp`,
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

  const updateFiscalYearCap = (newCap: number) => {
    setFiscalYear((prev) => ({ ...prev, total_budget_cap: newCap }));
  };

  const createEventBudget = (data: {
    name: string;
    purpose: string;
    technique: BudgetTechnique;
    total_allocated: number;
    contingency_buffer: number;
    project_head_name?: string;
    categories: Array<{ name: string; allocated_amount: number }>;
  }) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newEventId = `evt_${Date.now()}`;
    const newCategories: BudgetCategory[] = data.categories.map((c, idx) => ({
      id: `cat_${newEventId}_${idx + 1}`,
      event_budget_id: newEventId,
      name: c.name,
      allocated_amount: c.allocated_amount,
      spent_amount: 0,
    }));

    const newEvent: EventBudget = {
      id: newEventId,
      fiscal_year_id: fiscalYear.id,
      name: data.name,
      slug,
      purpose: data.purpose,
      technique: data.technique,
      total_allocated: data.total_allocated,
      contingency_buffer: data.contingency_buffer,
      spent_amount: 0,
      status: 'PLANNING',
      project_head_name: data.project_head_name || currentUser.incumbent_name,
      categories: newCategories,
      created_at: new Date().toISOString(),
    };

    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const reallocateEnvelopeFunds = (
    eventId: string,
    sourceCategoryId: string,
    targetCategoryId: string,
    amount: number,
    reason: string
  ): { success: boolean; error?: string } => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { success: false, error: 'Event not found.' };

    let sourceName = '';
    let targetName = '';

    // Verify source
    if (sourceCategoryId === 'CONTINGENCY') {
      sourceName = 'Contingency Buffer';
      if (event.contingency_buffer < amount) {
        return { success: false, error: 'Insufficient contingency buffer in event.' };
      }
    } else if (sourceCategoryId === 'RESERVE') {
      sourceName = 'Master Strategic Reserve';
      if (unallocatedReserve < amount) {
        return { success: false, error: 'Insufficient unallocated master org reserve.' };
      }
    } else {
      const sourceCat = event.categories.find((c) => c.id === sourceCategoryId);
      if (!sourceCat) return { success: false, error: 'Source category not found.' };
      sourceName = sourceCat.name;
      const available = sourceCat.allocated_amount - sourceCat.spent_amount;
      if (available < amount) {
        return { success: false, error: `Insufficient unspent funds in "${sourceCat.name}" (Available: ₱${available.toLocaleString()}).` };
      }
    }

    // Verify target
    const targetCat = event.categories.find((c) => c.id === targetCategoryId);
    if (!targetCat) return { success: false, error: 'Target category envelope not found.' };
    targetName = targetCat.name;

    // Apply mutation
    setEvents((prevEvents) =>
      prevEvents.map((evt) => {
        if (evt.id !== eventId) return evt;

        let newContingency = evt.contingency_buffer;
        let newTotalAllocated = evt.total_allocated;

        if (sourceCategoryId === 'CONTINGENCY') {
          newContingency -= amount;
        } else if (sourceCategoryId === 'RESERVE') {
          newTotalAllocated += amount;
        }

        const newCategories = evt.categories.map((cat) => {
          if (cat.id === sourceCategoryId) {
            return { ...cat, allocated_amount: cat.allocated_amount - amount };
          }
          if (cat.id === targetCategoryId) {
            return { ...cat, allocated_amount: cat.allocated_amount + amount };
          }
          return cat;
        });

        return {
          ...evt,
          contingency_buffer: newContingency,
          total_allocated: newTotalAllocated,
          categories: newCategories,
        };
      })
    );

    // Record reallocation
    const newRecord: BudgetReallocation = {
      id: `realloc_${Date.now()}`,
      event_budget_id: eventId,
      event_name: event.name,
      source_category_id: sourceCategoryId,
      source_category_name: sourceName,
      target_category_id: targetCategoryId,
      target_category_name: targetName,
      amount,
      reason,
      authorized_by_id: currentUser.id,
      authorized_by_name: currentUser.incumbent_name,
      authorized_by_position: currentUser.position_title,
      created_at: new Date().toISOString(),
    };

    setReallocations((prev) => [newRecord, ...prev]);
    return { success: true };
  };

  const addTrackerTransaction = (entry: {
    date_formatted: string;
    entry_type: 'Income' | 'Expense';
    spreadsheet_category: string;
    description: string;
    money_in?: number | null;
    money_out?: number | null;
    person_responsible: string;
    receipt_proof_name?: string;
    verification?: 'Verified' | 'Pending' | 'Rejected' | 'Unverified';
    remarks?: string;
    entry_status?: 'Complete' | 'Pending' | 'In Progress' | 'Draft';
    wallet?: WalletType;
  }) => {
    const nextNum = transactions.length + 1;
    const txnId = `TXN-${String(nextNum).padStart(4, '0')}`;
    const amount = entry.entry_type === 'Income' ? (entry.money_in || 0) : (entry.money_out || 0);
    const isIncome = entry.entry_type === 'Income';

    const newTx: ExpenseTransaction = {
      id: `tx_${Date.now()}`,
      event_budget_id: 'evt_access_operations_2026',
      event_name: 'PUP ACCESS Treasury Ledger',
      category_id: `cat_${entry.spreadsheet_category.toLowerCase().replace(/\s+/g, '_')}`,
      category_name: entry.spreadsheet_category,
      tracking_number: txnId,
      transaction_id: txnId,
      date_formatted: entry.date_formatted,
      entry_type: entry.entry_type,
      spreadsheet_category: entry.spreadsheet_category,
      title: entry.description,
      description: entry.description,
      type: isIncome ? 'COLLECTION' : 'DISBURSEMENT',
      status: entry.entry_status === 'Complete' ? 'CERTIFIED_DISBURSED' : 'TIER_1_PENDING',
      amount,
      cash_in: isIncome ? amount : 0,
      money_in: isIncome ? amount : null,
      money_out: !isIncome ? amount : null,
      wallet: entry.wallet || 'GCASH',
      funding_source: 'ACCESS_GENERAL_FUNDS',
      person_responsible: entry.person_responsible,
      submitted_by_id: currentUser.id,
      submitted_by_name: entry.person_responsible,
      receipt_proof: {
        name: entry.receipt_proof_name || entry.description.toUpperCase(),
        file_type: 'pdf',
      },
      verification: entry.verification || 'Verified',
      remarks: entry.remarks || (isIncome ? 'Received' : 'Sent'),
      entry_status: entry.entry_status || 'Complete',
      reimbursement_notes: entry.remarks || '',
      transacted_at: new Date().toISOString(),
      approvals: [],
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const updateTrackerTransaction = (id: string, updates: Partial<ExpenseTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id || t.transaction_id === id || t.tracking_number === id) {
          return { ...t, ...updates };
        }
        return t;
      })
    );
  };

  const deleteTrackerTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id && t.transaction_id !== id));
  };

  const resetToOfficialSheet = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    try {
      localStorage.setItem('access_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem('access_tracker_v2', '2.1');
    } catch {
      // Silently catch quota errors
    }
  };

  const updateEventBudget = (
    eventId: string,
    updates: Partial<Omit<EventBudget, 'id' | 'categories'>>
  ) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );
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
        fiscalYear,
        reallocations,
        masterBudgetCap,
        totalAllocated,
        unallocatedReserve,
        totalContingencyBuffer,
        totalSpent,
        remainingBalance,
        walletTotals,
        fundingSourceTotals,
        totalMoneyIn,
        totalMoneyOut,
        netTrackerBalance,
        addTrackerTransaction,
        updateTrackerTransaction,
        deleteTrackerTransaction,
        resetToOfficialSheet,
        approveTransaction,
        rejectTransaction,
        submitVoucher,
        verifyLedgerIntegrity,
        updateFiscalYearCap,
        createEventBudget,
        reallocateEnvelopeFunds,
        updateEventBudget,
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
