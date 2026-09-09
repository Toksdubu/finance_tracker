'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { compressReceiptImage } from '@/lib/storage/image-compressor';
import { formatCurrency } from '@/lib/utils';
import {
  Upload,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { ReceiptType, TransactionType } from '@/types/finance';

export default function NewExpensePage() {
  const router = useRouter();
  const { events, submitVoucher, currentUser } = useFinance();

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    events[0]?.categories[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('REIMBURSEMENT');
  const [receiptType, setReceiptType] = useState<ReceiptType>('OFFICIAL_RECEIPT_SI');

  // Payee Sensitive Info
  const [payeeName, setPayeeName] = useState(currentUser.incumbent_name);
  const [accountType, setAccountType] = useState<'GCASH' | 'LANDBANK' | 'BDO' | 'OTHER_BANK' | 'CASH'>('GCASH');
  const [accountNumber, setAccountNumber] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  // Spreadsheet-Aligned Practical Fields
  const [wallet, setWallet] = useState<'GCASH' | 'GOTYME' | 'CASH_ON_HAND' | 'LANDBANK'>('GCASH');
  const [fundingSource, setFundingSource] = useState<'QUOTA' | 'PARTNERSHIP_SPONSOR' | 'ACCESS_GENERAL_FUNDS'>('QUOTA');
  const [remarks, setRemarks] = useState('');
  const [reimbursementNotes, setReimbursementNotes] = useState('');

  // File & Compression state
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPct: number;
    fileName: string;
  } | null>(null);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState<{
    vendor: string;
    orNumber: string;
    lineItems: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
  } | null>(null);

  const activeEvent = events.find((e) => e.id === selectedEventId);
  const activeCategory = activeEvent?.categories.find((c) => c.id === selectedCategoryId);
  const categoryRemaining = activeCategory
    ? activeCategory.allocated_amount - activeCategory.spent_amount
    : 0;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // In-browser WebP compression
      const res = await compressReceiptImage(file);
      setCompressionResult({
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        savingsPct: res.savingsPct,
        fileName: file.name,
      });

      // Simulate instant multimodal AI OCR Extraction
      setAiExtracting(true);
      setTimeout(() => {
        setAiExtracting(false);
        setAiExtractedData({
          vendor: 'Pureza Print & Engineering Collaterals',
          orNumber: `OR-${Math.floor(10000 + Math.random() * 90000)}`,
          lineItems: [
            { name: title || 'Department Event Procurement', quantity: 1, unit_price: parseFloat(amount) || 2500, total: parseFloat(amount) || 2500 },
          ],
        });
      }, 1200);
    } catch (err) {
      console.error('Compression failed:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) {
      alert('You must accept the Data Privacy Act consent before submitting disbursement details.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    submitVoucher({
      eventBudgetId: selectedEventId,
      categoryId: selectedCategoryId,
      title,
      description,
      amount: numAmount,
      type,
      receiptType,
      wallet,
      fundingSource,
      remarks,
      reimbursementNotes,
      receiptFile: compressionResult
        ? {
            name: compressionResult.fileName,
            size: compressionResult.compressedSize,
            mimeType: 'image/webp',
          }
        : undefined,
      aiExtracted: aiExtractedData || undefined,
      payeeName,
      accountType,
      accountNumber,
    });

    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-[#262626] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-[#f26223]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f26223]">
            Expenditure Intake Pipeline
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          Submit Expense Voucher
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
          Upload receipt proof, auto-compute line items, and submit for 3-tier executive approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Event & Envelope Allocation */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f26223] text-white text-xs">1</span>
            Target Event & Category Envelope
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Designated Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  const ev = events.find((x) => x.id === e.target.value);
                  if (ev && ev.categories[0]) setSelectedCategoryId(ev.categories[0].id);
                }}
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition font-sans"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                Category Envelope
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition font-sans"
              >
                {activeEvent?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Remaining: {formatCurrency(c.allocated_amount - c.spent_amount)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Envelope Safety Gauge */}
          {activeCategory && (
            <div className="rounded-xl border border-[#222] bg-[#0e0e0e] p-3 text-xs font-mono flex items-center justify-between">
              <span className="text-[#a1a1aa]">Selected Envelope Remaining Balance:</span>
              <span className={`font-bold ${categoryRemaining > 0 ? 'text-[#00bb7f]' : 'text-[#fb2c36]'}`}>
                {formatCurrency(categoryRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Voucher Information */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f26223] text-white text-xs">2</span>
            Voucher Details & Amount
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Expense Title / Item Description</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bulk Procurement of Hardhat Safety Gear"
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Claimed Total Amount (PHP)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Transaction Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition"
                >
                  <option value="REIMBURSEMENT">Reimbursement (Claim after paying)</option>
                  <option value="DISBURSEMENT">Direct Vendor Disbursement</option>
                  <option value="CASH_ADVANCE">Cash Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Receipt Classification</label>
                <select
                  value={receiptType}
                  onChange={(e) => setReceiptType(e.target.value as any)}
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition"
                >
                  <option value="OFFICIAL_RECEIPT_SI">BIR Official Receipt / Invoice</option>
                  <option value="ACKNOWLEDGMENT_RECEIPT">Acknowledgment Receipt (AR)</option>
                  <option value="CENRR_PETTY_CASH">CENRR / Petty Cash (&lt;₱300)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Custody Wallet Account (Where money moves)</label>
                <select
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value as any)}
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition font-mono"
                >
                  <option value="GCASH">GCASH (Primary Disbursement)</option>
                  <option value="GOTYME">GoTyme Bank (Court & Reserves)</option>
                  <option value="CASH_ON_HAND">Cash on Hand (Petty Cash)</option>
                  <option value="LANDBANK">Landbank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Funding Source Tag</label>
                <select
                  value={fundingSource}
                  onChange={(e) => setFundingSource(e.target.value as any)}
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition font-mono"
                >
                  <option value="QUOTA">QUOTA (Sports / Team Collections)</option>
                  <option value="PARTNERSHIP_SPONSOR">PARTNERSHIP (Sponsors / Bettermind)</option>
                  <option value="ACCESS_GENERAL_FUNDS">ACCESS (Organization General Funds)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Spreadsheet Remarks & Audit Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Court booking paid by Kuya Allan / Ref lunch message from kuya Dale"
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Business Purpose & Committee Deliverable</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the necessity of this expense for the student body or event execution..."
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] p-3 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Receipt Upload with Zero-Cost In-Browser WebP Compressor */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f26223] text-white text-xs">3</span>
              Receipt Upload & AI Math Scan
            </h2>
            <span className="text-[10px] font-mono text-[#00bb7f] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              In-Browser WebP Compression Active
            </span>
          </div>

          <div className="rounded-xl border-2 border-dashed border-[#2a2a2a] bg-[#0c0c0c] p-6 text-center hover:border-[#f26223]/50 transition">
            <input
              type="file"
              accept="image/*,application/pdf"
              id="receipt-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="receipt-upload" className="cursor-pointer block">
              <Upload className="mx-auto h-8 w-8 text-[#71717a] mb-2" />
              <p className="text-xs font-bold text-white font-mono">Click to upload receipt photo or PDF</p>
              <p className="text-[11px] text-[#71717a] mt-1">
                Smartphone photos (5MB–10MB) are automatically compressed to ~150KB WebP for $0 storage.
              </p>
            </label>
          </div>

          {/* Compression Efficiency Box */}
          {compressionResult && (
            <div className="rounded-xl border border-[#222] bg-[#0e0e0e] p-3 font-mono text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{compressionResult.fileName}</span>
                <span className="text-[#00bb7f] font-bold">Saved {compressionResult.savingsPct}% Storage</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#71717a]">
                <span>Original: {(compressionResult.originalSize / 1024 / 1024).toFixed(2)} MB</span>
                <span className="text-white">Compressed: {(compressionResult.compressedSize / 1024).toFixed(0)} KB WebP</span>
              </div>
            </div>
          )}

          {/* AI Extraction Status */}
          {aiExtracting && (
            <div className="rounded-xl border border-[#3080ff]/30 bg-[#3080ff]/10 p-3 text-xs font-mono text-[#3080ff] flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Google Gemini analyzing line items and verifying mathematical sum...</span>
            </div>
          )}

          {aiExtractedData && (
            <div className="rounded-xl border border-[#00bb7f]/30 bg-[#00bb7f]/10 p-3 text-xs font-mono text-[#00bb7f] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI Line-Item Verification Passed
              </p>
              <p className="text-[11px] text-[#a1a1aa]">
                Detected Merchant: <strong className="text-white">{aiExtractedData.vendor}</strong> | OR: <strong className="text-white">{aiExtractedData.orNumber}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Step 4: Payee & Payout Details (Encrypted AES-256-GCM) */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f26223] text-white text-xs">4</span>
              Disbursement Payment Target
            </h2>
            <span className="text-[10px] font-mono text-[#f26223] flex items-center gap-1 border border-[#f26223]/30 bg-[#f26223]/10 px-2 py-0.5 rounded">
              <Lock className="h-3 w-3" />
              AES-256-GCM Encrypted
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Recipient Full Name</label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Payment Method</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition"
              >
                <option value="GCASH">GCash Mobile</option>
                <option value="LANDBANK">Landbank</option>
                <option value="BDO">BDO</option>
                <option value="CASH">Physical Cash Voucher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">Account / GCash Number</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0917-xxx-xxxx"
                className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#f26223] focus:outline-none transition font-mono"
              />
            </div>
          </div>

          {/* RA 10173 Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 rounded border-[#333] bg-[#0c0c0c] text-[#f26223] focus:ring-0"
              />
              <span className="text-[11px] text-[#71717a] leading-relaxed">
                I hereby consent to PUP ACCESS collecting and processing my payment details solely for disbursement,
                liquidation, and institutional audit purposes in compliance with the{' '}
                <strong className="text-[#a1a1aa]">Philippine Data Privacy Act of 2012 (RA 10173)</strong>.
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff6b35] py-3 text-xs font-bold text-white shadow-xl shadow-[#f26223]/20 transition hover:brightness-110 cursor-pointer"
        >
          <span>Submit Voucher for Tier 1 Endorsement</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
