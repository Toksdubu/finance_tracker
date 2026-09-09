'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileCode,
  Key,
} from 'lucide-react';

export default function AuditLedgerPage() {
  const { auditBlocks, verifyLedgerIntegrity } = useFinance();
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    message: string;
  }>({
    tested: false,
    isValid: true,
    message: '',
  });
  const [verifying, setVerifying] = useState(false);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      const res = verifyLedgerIntegrity();
      setVerificationResult({
        tested: true,
        isValid: res.isValid,
        message: res.message,
      });
      setVerifying(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#262626] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#3080ff]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#3080ff]">
              Cryptographic Immutability
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
            SHA-256 Transaction Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
            Every approved voucher is mathematically chained to the previous transaction, preventing retroactive edits.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3080ff] to-[#0055ff] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#3080ff]/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'Recalculating Hashes...' : 'Verify Cryptographic Integrity'}</span>
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult.tested && (
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 text-xs font-mono ${
            verificationResult.isValid
              ? 'border-[#00bb7f]/40 bg-[#00bb7f]/10 text-[#00bb7f]'
              : 'border-[#fb2c36]/40 bg-[#fb2c36]/10 text-[#fb2c36]'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#00bb7f]" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#fb2c36]" />
          )}
          <div>
            <p className="font-bold">{verificationResult.isValid ? 'CRYPTOGRAPHIC PROOF VERIFIED' : 'TAMPER DETECTED'}</p>
            <p className="text-[11px] text-[#a1a1aa] mt-0.5">{verificationResult.message}</p>
          </div>
        </div>
      )}

      {/* Audit Blocks Chain */}
      <div className="space-y-4">
        {auditBlocks.map((block, idx) => {
          const isGenesis = block.block_index === 0;

          return (
            <div
              key={block.id}
              className="relative rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-sm space-y-3 font-mono"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#222] text-xs font-bold text-[#f26223] border border-[#333]">
                    #{block.block_index}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">{block.title}</h3>
                    <p className="text-[11px] text-[#71717a] font-sans">{block.event_name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-white">{formatCurrency(block.amount)}</span>
                  <p className="text-[10px] text-[#71717a]">{formatDate(block.timestamp)}</p>
                </div>
              </div>

              {/* Hash Chain Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#71717a] flex items-center gap-1.5">
                    <LinkIcon className="h-3 w-3 text-[#a1a1aa]" />
                    Previous Block Hash
                  </span>
                  <p className="text-[11px] text-[#a1a1aa] truncate font-mono">{block.previous_hash}</p>
                </div>

                <div className="rounded-xl border border-[#3080ff]/30 bg-[#3080ff]/5 p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#3080ff] flex items-center gap-1.5">
                    <Key className="h-3 w-3 text-[#3080ff]" />
                    Current Block Hash
                  </span>
                  <p className="text-[11px] text-white truncate font-mono">{block.current_hash}</p>
                </div>
              </div>

              {/* Signer Footprint */}
              <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1">
                <span>
                  Tracking Ref: <strong className="text-[#f26223]">{block.tracking_number}</strong>
                </span>
                <span>
                  Certified by: <strong className="text-white">{block.certified_by_name}</strong> ({block.certified_by_position})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
