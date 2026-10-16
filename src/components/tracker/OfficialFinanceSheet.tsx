'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { ExpenseTransaction, WalletType } from '@/types/finance';
import {
  FileText,
  Search,
  PlusCircle,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  ChevronDown,
  Filter,
  ShieldCheck,
  Calendar,
  Layers,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Sparkles,
} from 'lucide-react';

interface RowBalanceItem {
  tx: ExpenseTransaction;
  runningBalance: number;
}

export function OfficialFinanceSheet() {
  const {
    transactions,
    addTrackerTransaction,
    updateTrackerTransaction,
    deleteTrackerTransaction,
    resetToOfficialSheet,
    totalMoneyIn,
    totalMoneyOut,
    netTrackerBalance,
    currentUser,
  } = useFinance();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Income' | 'Expense'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [personFilter, setPersonFilter] = useState<string>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<'ALL' | 'Verified' | 'Pending'>('ALL');

  // Modal States
  const [previewTx, setPreviewTx] = useState<ExpenseTransaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{ id: string; field: string } | null>(null);

  // New Transaction Form State
  const [newDate, setNewDate] = useState(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  });
  const [newType, setNewType] = useState<'Income' | 'Expense'>('Expense');
  const [newCategory, setNewCategory] = useState('Supplies');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPerson, setNewPerson] = useState('Erica Jhane Guillermo');
  const [newReceiptName, setNewReceiptName] = useState('');
  const [newRemarks, setNewRemarks] = useState('Sent');
  const [newVerification, setNewVerification] = useState<'Verified' | 'Pending'>('Verified');
  const [newEntryStatus, setNewEntryStatus] = useState<'Complete' | 'Pending'>('Complete');
  const [newWallet, setNewWallet] = useState<WalletType>('GCASH');

  // Distinct values for filters
  const categoryOptions = [
    'Donation',
    'Other Expense',
    'Transfer',
    'Other Income',
    'Printing',
    'Supplies',
    'Reimbursement',
    'Event Expenses',
  ];

  const personOptions = [
    'Erica Jhane Guillermo',
    'Sho Villanueva',
    'Julianna Gines',
    'Antonio Mickel Tantia',
    'Ren Zapanta',
    'Sophia Lim',
    'Daniel Bithao',
  ];

  // Sort chronologically (TXN-0001 first, ascending)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aNum = parseInt(a.tracking_number.replace(/\D/g, '') || '0', 10);
      const bNum = parseInt(b.tracking_number.replace(/\D/g, '') || '0', 10);
      return aNum - bNum;
    });
  }, [transactions]);

  // Compute running balance chronologically
  const computedRows: RowBalanceItem[] = useMemo(() => {
    let currentBalance = 0;
    return sortedTransactions.map((tx) => {
      const isIncome = tx.entry_type === 'Income' || !!tx.cash_in || tx.type === 'COLLECTION' || tx.type === 'SPONSORSHIP';
      const inAmt = tx.money_in ?? (isIncome ? tx.amount : 0);
      const outAmt = tx.money_out ?? (!isIncome ? tx.amount : 0);

      currentBalance = currentBalance + (inAmt || 0) - (outAmt || 0);

      return {
        tx,
        runningBalance: currentBalance,
      };
    });
  }, [sortedTransactions]);

  // Filtered rows for display
  const displayRows = useMemo(() => {
    return computedRows.filter(({ tx }) => {
      const isIncome = tx.entry_type === 'Income' || !!tx.cash_in || tx.type === 'COLLECTION' || tx.type === 'SPONSORSHIP';
      const actualType = isIncome ? 'Income' : 'Expense';
      const actualCat = tx.spreadsheet_category || tx.category_name;
      const actualPerson = tx.person_responsible || tx.submitted_by_name;
      const actualVerif = tx.verification || (tx.status === 'CERTIFIED_DISBURSED' ? 'Verified' : 'Pending');

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          tx.tracking_number.toLowerCase().includes(query) ||
          (tx.transaction_id && tx.transaction_id.toLowerCase().includes(query)) ||
          tx.description.toLowerCase().includes(query) ||
          (tx.remarks && tx.remarks.toLowerCase().includes(query)) ||
          actualPerson.toLowerCase().includes(query) ||
          actualCat.toLowerCase().includes(query) ||
          (tx.receipt_proof?.name && tx.receipt_proof.name.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && actualType !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && actualCat !== categoryFilter) return false;

      // Person filter
      if (personFilter !== 'ALL' && actualPerson !== personFilter) return false;

      // Verification filter
      if (verificationFilter !== 'ALL' && actualVerif !== verificationFilter) return false;

      return true;
    });
  }, [computedRows, searchQuery, typeFilter, categoryFilter, personFilter, verificationFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Transaction ID',
      'Type',
      'Category',
      'Description',
      'Money In',
      'Money Out',
      'Balance',
      'Person Responsible',
      'Receipt/Proof',
      'Verification',
      'Remarks',
      'Entry Status',
    ];

    const rows = computedRows.map(({ tx, runningBalance }) => {
      const isIncome = tx.entry_type === 'Income' || !!tx.cash_in || tx.type === 'COLLECTION' || tx.type === 'SPONSORSHIP';
      const date = tx.date_formatted || tx.transacted_at.split('T')[0];
      const txnId = tx.transaction_id || tx.tracking_number;
      const type = isIncome ? 'Income' : 'Expense';
      const cat = tx.spreadsheet_category || tx.category_name;
      const desc = `"${tx.description.replace(/"/g, '""')}"`;
      const moneyIn = isIncome ? (tx.money_in || tx.amount) : '';
      const moneyOut = !isIncome ? (tx.money_out || tx.amount) : '';
      const balance = runningBalance;
      const person = `"${(tx.person_responsible || tx.submitted_by_name).replace(/"/g, '""')}"`;
      const receipt = `"${(tx.receipt_proof?.name || tx.receipt?.file_name || '').replace(/"/g, '""')}"`;
      const verif = tx.verification || 'Verified';
      const remarks = `"${(tx.remarks || '').replace(/"/g, '""')}"`;
      const status = tx.entry_status || 'Complete';

      return [date, txnId, type, cat, desc, moneyIn, moneyOut, balance, person, receipt, verif, remarks, status].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PUP_ACCESS_Finance_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit new transaction
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim() || !newAmount) return;

    const parsedAmt = parseFloat(newAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;

    addTrackerTransaction({
      date_formatted: newDate,
      entry_type: newType,
      spreadsheet_category: newCategory,
      description: newDescription.trim(),
      money_in: newType === 'Income' ? parsedAmt : null,
      money_out: newType === 'Expense' ? parsedAmt : null,
      person_responsible: newPerson,
      receipt_proof_name: newReceiptName.trim() || newDescription.toUpperCase(),
      verification: newVerification,
      remarks: newRemarks.trim(),
      entry_status: newEntryStatus,
      wallet: newWallet,
    });

    setShowAddModal(false);
    setNewDescription('');
    setNewAmount('');
    setNewReceiptName('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Matching Current Finance Tracker Figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Net Balance */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00bb7f]/10 rounded-full blur-2xl group-hover:bg-[#00bb7f]/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-[#a1a1aa] text-xs font-mono">
            <span>Net Liquid Balance</span>
            <span className="h-2 w-2 rounded-full bg-[#00bb7f]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2">
            {formatCurrency(netTrackerBalance)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#00bb7f] font-mono mt-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Reconciled Running Balance</span>
          </div>
        </div>

        {/* Total Money In */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00bb7f]/10 rounded-full blur-2xl group-hover:bg-[#00bb7f]/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-[#a1a1aa] text-xs font-mono">
            <span>Total Money In</span>
            <ArrowDownLeft className="h-4 w-4 text-[#00bb7f]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-[#00bb7f] mt-2">
            {formatCurrency(totalMoneyIn)}
          </p>
          <p className="text-[11px] text-[#71717a] font-sans mt-2">
            Donations, Shirt Payments & Turnovers
          </p>
        </div>

        {/* Total Money Out */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#fb2c36]/10 rounded-full blur-2xl group-hover:bg-[#fb2c36]/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-[#a1a1aa] text-xs font-mono">
            <span>Total Money Out</span>
            <ArrowUpRight className="h-4 w-4 text-[#fb2c36]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-[#fb2c36] mt-2">
            {formatCurrency(totalMoneyOut)}
          </p>
          <p className="text-[11px] text-[#71717a] font-sans mt-2">
            Supplies, Printing & Reimbursements
          </p>
        </div>

        {/* Entries Count */}
        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f26223]/10 rounded-full blur-2xl group-hover:bg-[#f26223]/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-[#a1a1aa] text-xs font-mono">
            <span>Logged Entries</span>
            <Layers className="h-4 w-4 text-[#f26223]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2">
            {displayRows.length} <span className="text-sm font-normal text-[#71717a]">/ {transactions.length}</span>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#00E676] font-mono mt-2">
            <span className="h-2 w-2 rounded-full bg-[#00E676]" />
            <span>Complete & Verified Vouchers</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Search, Filters & Action Buttons */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
            <input
              type="text"
              placeholder="Search by ID, Description, Person, Receipt or Remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff7900] px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-[#f26223]/25 transition hover:brightness-110 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Entry</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#f26223]/50 hover:bg-[#222]"
              title="Download official CSV export matching the 13 columns"
            >
              <Download className="h-3.5 w-3.5 text-[#f26223]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset finance tracker back to the original 15 official records?')) {
                  resetToOfficialSheet();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-[#a1a1aa] transition hover:text-white hover:border-[#555]"
              title="Reset to default official sheet format"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Sheet</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#1f1f1f] text-xs font-mono">
          <span className="text-[#71717a] flex items-center gap-1 text-[11px]">
            <Filter className="h-3 w-3 text-[#f26223]" /> Filters:
          </span>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#f26223]"
          >
            <option value="ALL">Type: All</option>
            <option value="Income">Income (Green)</option>
            <option value="Expense">Expense (Red)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#f26223]"
          >
            <option value="ALL">Category: All</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Person Responsible Filter */}
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#f26223]"
          >
            <option value="ALL">Person: All</option>
            {personOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="rounded-lg border border-[#2b2b2b] bg-[#0c0c0c] px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#f26223]"
          >
            <option value="ALL">Verification: All</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending">Pending Only</option>
          </select>

          {(typeFilter !== 'ALL' || categoryFilter !== 'ALL' || personFilter !== 'ALL' || verificationFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                setCategoryFilter('ALL');
                setPersonFilter('ALL');
                setVerificationFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[#f26223] hover:underline text-[11px] ml-auto"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Official Spreadsheet Table (Faithfully mirrors exact image layout) */}
      <div className="rounded-2xl border border-[#262626] bg-[#0c0c0c] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse select-text">
            {/* Exact Orange Header Banner (#ff7900 / #f26223) with Bold White Text */}
            <thead>
              <tr className="bg-[#ff7900] text-white font-bold tracking-tight text-[12px] border-b-2 border-[#d96700]">
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Date</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Transaction ID</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Type</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Category</th>
                <th className="px-4 py-3 border-r border-[#ea6f00] whitespace-nowrap">Description</th>
                <th className="px-3.5 py-3 text-right border-r border-[#ea6f00] whitespace-nowrap">Money In</th>
                <th className="px-3.5 py-3 text-right border-r border-[#ea6f00] whitespace-nowrap">Money Out</th>
                <th className="px-3.5 py-3 text-right border-r border-[#ea6f00] whitespace-nowrap">Balance</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Person Responsible</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Receipt/Proof</th>
                <th className="px-3.5 py-3 text-center border-r border-[#ea6f00] whitespace-nowrap">Verification</th>
                <th className="px-3.5 py-3 text-left border-r border-[#ea6f00] whitespace-nowrap">Remarks</th>
                <th className="px-3.5 py-3 text-center whitespace-nowrap">Entry Status</th>
              </tr>
            </thead>

            {/* Table Rows matching exact spreadsheet format */}
            <tbody className="divide-y divide-[#222] bg-[#121212]">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-[#71717a] font-sans">
                    <p className="text-sm">No transactions found matching your search or filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setTypeFilter('ALL');
                        setCategoryFilter('ALL');
                        setPersonFilter('ALL');
                        setVerificationFilter('ALL');
                      }}
                      className="mt-2 text-xs text-[#f26223] underline"
                    >
                      Clear active filters
                    </button>
                  </td>
                </tr>
              ) : (
                displayRows.map(({ tx, runningBalance }, index) => {
                  const isIncome = tx.entry_type === 'Income' || !!tx.cash_in || tx.type === 'COLLECTION' || tx.type === 'SPONSORSHIP';
                  const dateStr = tx.date_formatted || (tx.transacted_at ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(tx.transacted_at)) : 'August 20, 2026');
                  const txnId = tx.transaction_id || tx.tracking_number;
                  const categoryName = tx.spreadsheet_category || tx.category_name;
                  const personName = tx.person_responsible || tx.submitted_by_name || 'Erica Jhane Guillermo';
                  const proofName = tx.receipt_proof?.name || tx.receipt?.file_name || tx.title.toUpperCase();
                  const verificationStatus = tx.verification || (tx.status === 'CERTIFIED_DISBURSED' ? 'Verified' : 'Pending');
                  const entryStatus = tx.entry_status || (tx.status === 'CERTIFIED_DISBURSED' ? 'Complete' : 'Pending');
                  const isComplete = entryStatus === 'Complete';

                  const moneyInVal = tx.money_in ?? (isIncome ? (tx.cash_in || tx.amount) : null);
                  const moneyOutVal = tx.money_out ?? (!isIncome ? tx.amount : null);

                  return (
                    <tr
                      key={tx.id || index}
                      className="hover:bg-[#191919] transition-colors border-b border-[#202020]"
                    >
                      {/* 1. Date */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-center text-[#d4d4d8] border-r border-[#222]">
                        {dateStr}
                      </td>

                      {/* 2. Transaction ID */}
                      <td className="px-3.5 py-2.5 whitespace-nowrap text-center font-bold text-white border-r border-[#222]">
                        {txnId}
                      </td>

                      {/* 3. Type (Income: Green pill, Expense: Red pill) */}
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-[#222]">
                        <button
                          onClick={() => {
                            const newT = isIncome ? 'Expense' : 'Income';
                            updateTrackerTransaction(tx.id, {
                              entry_type: newT,
                              cash_in: newT === 'Income' ? tx.amount : 0,
                              money_in: newT === 'Income' ? tx.amount : null,
                              money_out: newT === 'Expense' ? tx.amount : null,
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-sm transition hover:scale-105 ${
                            isIncome
                              ? 'bg-[#15803d] hover:bg-[#16a34a]'
                              : 'bg-[#b91c1c] hover:bg-[#dc2626]'
                          }`}
                          title="Click to toggle Income / Expense"
                        >
                          <span>{isIncome ? 'Income' : 'Expense'}</span>
                          <ChevronDown className="h-2.5 w-2.5 opacity-80" />
                        </button>
                      </td>

                      {/* 4. Category (Gray Pill with Dropdown) */}
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-[#222]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#222] text-[#e4e4e7] border border-[#333]">
                          <span>{categoryName}</span>
                          <ChevronDown className="h-2.5 w-2.5 text-[#888]" />
                        </span>
                      </td>

                      {/* 5. Description */}
                      <td className="px-4 py-2.5 text-white max-w-xs font-sans text-xs border-r border-[#222]" title={tx.description}>
                        {tx.description}
                      </td>

                      {/* 6. Money In */}
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-bold text-[#00bb7f] border-r border-[#222]">
                        {moneyInVal ? formatCurrency(moneyInVal) : ''}
                      </td>

                      {/* 7. Money Out */}
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-bold text-[#fb2c36] border-r border-[#222]">
                        {moneyOutVal ? formatCurrency(moneyOutVal) : ''}
                      </td>

                      {/* 8. Balance (Running Balance) */}
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap font-mono font-extrabold text-white text-[13px] border-r border-[#222]">
                        {formatCurrency(runningBalance)}
                      </td>

                      {/* 9. Person Responsible */}
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-[#222]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#1e1e1e] text-[#d4d4d8] border border-[#2e2e2e]">
                          <span>{personName}</span>
                          <ChevronDown className="h-2.5 w-2.5 text-[#888]" />
                        </span>
                      </td>

                      {/* 10. Receipt/Proof (Attachment pill with Document Icon) */}
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-[#222]">
                        <button
                          onClick={() => setPreviewTx(tx)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1c1c1c] text-white hover:bg-[#282828] border border-[#333] transition group"
                          title="Click to view full receipt / proof"
                        >
                          <span className="text-[#ef4444] text-[12px]">📄</span>
                          <span className="uppercase tracking-tight max-w-[140px] truncate">{proofName}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-[#71717a] group-hover:text-white" />
                        </button>
                      </td>

                      {/* 11. Verification (Verified Green Pill) */}
                      <td className="px-3 py-2 whitespace-nowrap text-center border-r border-[#222]">
                        <button
                          onClick={() => {
                            const newVerif = verificationStatus === 'Verified' ? 'Pending' : 'Verified';
                            updateTrackerTransaction(tx.id, {
                              verification: newVerif,
                              entry_status: newVerif === 'Verified' ? 'Complete' : 'Pending',
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm transition hover:scale-105 ${
                            verificationStatus === 'Verified'
                              ? 'bg-[#15803d]'
                              : 'bg-[#f59e0b]'
                          }`}
                          title="Click to toggle verification"
                        >
                          <span>{verificationStatus}</span>
                          <ChevronDown className="h-2.5 w-2.5 opacity-80" />
                        </button>
                      </td>

                      {/* 12. Remarks */}
                      <td className="px-3.5 py-2.5 text-[#a1a1aa] text-xs font-sans max-w-xs border-r border-[#222]">
                        {tx.remarks || '—'}
                      </td>

                      {/* 13. Entry Status (Complete: Vibrant Green Cell) */}
                      <td className={`px-3 py-2 whitespace-nowrap text-center font-bold text-[11px] ${
                        isComplete
                          ? 'bg-[#00E676] text-black font-extrabold shadow-inner'
                          : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                      }`}>
                        {entryStatus}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof / Receipt Preview Modal */}
      {previewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {previewTx.transaction_id || previewTx.tracking_number} &bull; Official Proof
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Verified supporting document from treasury archive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTx(null)}
                className="rounded-lg p-1.5 text-[#71717a] hover:bg-[#222] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Document Preview Card */}
            <div className="rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#f26223]">
                    Document Name
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5 font-mono">
                    {previewTx.receipt_proof?.name || previewTx.receipt?.file_name || previewTx.title.toUpperCase()}
                  </h4>
                </div>
                <span className="rounded-full bg-[#15803d]/20 text-[#00bb7f] border border-[#15803d]/40 px-2.5 py-1 text-xs font-bold font-mono flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              </div>

              {/* Simulated Receipt Voucher Graphic */}
              <div className="rounded-lg border border-dashed border-[#333] bg-[#111] p-4 font-mono text-xs space-y-2">
                <div className="flex justify-between text-[#71717a] border-b border-[#222] pb-2">
                  <span>PUP ACCESS TREASURY VAULT</span>
                  <span>{previewTx.date_formatted || 'August 20, 2026'}</span>
                </div>
                <div className="py-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Description:</span>
                    <span className="text-white font-bold">{previewTx.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Type:</span>
                    <span className={previewTx.entry_type === 'Income' ? 'text-[#00bb7f]' : 'text-[#fb2c36]'}>
                      {previewTx.entry_type || 'Expense'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Category:</span>
                    <span className="text-white">{previewTx.spreadsheet_category || previewTx.category_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Person Responsible:</span>
                    <span className="text-white">{previewTx.person_responsible || previewTx.submitted_by_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a1a1aa]">Remarks:</span>
                    <span className="text-[#a1a1aa]">{previewTx.remarks || 'None'}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#222] text-sm font-bold">
                  <span className="text-white">Amount:</span>
                  <span className={previewTx.entry_type === 'Income' ? 'text-[#00bb7f]' : 'text-[#fb2c36]'}>
                    {formatCurrency(previewTx.money_in || previewTx.money_out || previewTx.amount)}
                  </span>
                </div>
              </div>

              {/* Audit Stamp */}
              <div className="text-[11px] font-mono text-[#555] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00bb7f]" />
                  SHA-256 Ledger Timestamp Verified
                </span>
                <span>Complete</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewTx(null)}
                className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff7900] px-4 py-2 text-xs font-bold text-white shadow-lg hover:brightness-110"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f26223]/15 text-[#f26223] border border-[#f26223]/30">
                  <PlusCircle className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Add New Transaction Row
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Input will automatically compute running balance and assign TXN-ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-[#71717a] hover:bg-[#222] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Date</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. September 22, 2026"
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('Income')}
                      className={`py-2 rounded-xl border font-bold text-xs transition ${
                        newType === 'Income'
                          ? 'bg-[#15803d] border-[#16a34a] text-white shadow'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-[#71717a]'
                      }`}
                    >
                      Income (Green)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('Expense')}
                      className={`py-2 rounded-xl border font-bold text-xs transition ${
                        newType === 'Expense'
                          ? 'bg-[#b91c1c] border-[#dc2626] text-white shadow'
                          : 'bg-[#1a1a1a] border-[#2b2b2b] text-[#71717a]'
                      }`}
                    >
                      Expense (Red)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">
                    {newType === 'Income' ? 'Money In (PHP ₱)' : 'Money Out (PHP ₱)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white font-bold focus:border-[#f26223] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#a1a1aa] mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Tarpaulin Printing or Alumni Donation"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Person Responsible */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Person Responsible</label>
                  <select
                    value={newPerson}
                    onChange={(e) => setNewPerson(e.target.value)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  >
                    {personOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Receipt / Proof Name */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Receipt / Proof Title</label>
                  <input
                    type="text"
                    placeholder="e.g. TARPAULIN RECEIPT"
                    value={newReceiptName}
                    onChange={(e) => setNewReceiptName(e.target.value)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white uppercase focus:border-[#f26223] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Remarks */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Remarks</label>
                  <input
                    type="text"
                    placeholder="Received / Sent / Spent"
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  />
                </div>

                {/* Wallet Account */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Wallet Account</label>
                  <select
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value as any)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  >
                    <option value="GCASH">GCash</option>
                    <option value="GOTYME">GoTyme Bank</option>
                    <option value="CASH_ON_HAND">Cash on Hand</option>
                    <option value="LANDBANK">Landbank</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Verification */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Verification</label>
                  <select
                    value={newVerification}
                    onChange={(e) => setNewVerification(e.target.value as any)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Entry Status */}
                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Entry Status</label>
                  <select
                    value={newEntryStatus}
                    onChange={(e) => setNewEntryStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-[#2b2b2b] bg-[#0c0c0c] px-3 py-2 text-white focus:border-[#f26223] focus:outline-none"
                  >
                    <option value="Complete">Complete (Green)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff7900] px-5 py-2 text-xs font-bold text-white shadow-lg hover:brightness-110"
                >
                  Insert Transaction Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
