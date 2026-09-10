# PUP ACCESS Vault — Backend Integration & Workflow Guide

This document outlines the step-by-step technical workflow for integrating backend services (Supabase PostgreSQL, Auth, Storage, AES-256-GCM encryption, SHA-256 audit ledger, and Google AI Studio OCR) into the **ACCSS Internal Finance Platform**.

---

## 1. Environment Setup & Secret Key Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### Key Inventory:
| Environment Variable | Description | Source / Generation |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | [Supabase Dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | Supabase Settings $\rightarrow$ API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key | Supabase Settings $\rightarrow$ API (Keep private) |
| `FINANCE_ENCRYPTION_KEY` | 32-byte Master Key (64 hex chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | Google AI Studio Free Tier Key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_APP_URL` | Base Application URL | Default: `http://localhost:3000` |

---

## 2. Database Migration & Schema Deployment

Run PostgreSQL migrations against your Supabase instance:

```bash
npx supabase db push
# Or apply directly via Supabase SQL Editor using:
# file://d:/finance_tracker/supabase/migrations/20260910000000_init_access_finance.sql
```

### Migration Checkpoints:
1. **Enums Created:** `user_role`, `transaction_type`, `receipt_type`, `approval_tier`, `transaction_status`, `budget_technique`.
2. **Whitelist Active:** `member_whitelist` table enforces institutional access controls for student members.
3. **Row-Level Security (RLS):** All tables have RLS policies restricting read access to authenticated members and write access to designated officers.

---

## 3. Cryptographic Security Integration

### Zero-Knowledge PII Encryption (AES-256-GCM)
Reimbursement banking and GCash account numbers are encrypted in Node.js server actions using `src/lib/security/crypto.ts` before writing to the database:

```typescript
import { encryptDisbursementData, decryptDisbursementData } from '@/lib/security/crypto';

// Server-side encryption before DB write
const encryptedPayload = encryptDisbursementData({
  payeeName: 'Daniel Bithao',
  accountType: 'GCASH',
  accountNumber: '09171234567',
  phoneNumber: '09171234567',
});
```

### Immutable Audit Ledger Chaining (SHA-256)
When the Organization President grants **Tier 3 Executive Certification**, an immutable audit block is generated:

$$\text{CurrentHash} = \text{SHA256}(\text{PreviousHash} + \text{TrackingNumber} + \text{Amount} + \text{Timestamp} + \text{PresidentID})$$

```typescript
import { generateAuditHash } from '@/lib/security/crypto';

const blockHash = generateAuditHash(
  previousBlockHash,
  transaction.tracking_number,
  transaction.amount,
  isoTimestamp,
  presidentUserId
);
```

---

## 4. Receipt Storage & AI Processing Workflow

1. **Client Compression:** Receipts uploaded in voucher submission are compressed to `.webp` via `src/lib/storage/image-compressor.ts`.
2. **Storage Bucket:** Compressed files are stored in Supabase private bucket `receipts-vault`.
3. **AI Optical OCR Scan:** Image contents are analyzed via `GEMINI_API_KEY` to extract merchant vendor, receipt OR number, line items, and computed total.

---

## 5. Development & Deployment Checklist

- [x] Run type check: `npx tsc --noEmit`
- [x] Test auth gate: Navigate to `/dashboard` while unauthenticated (verify redirect to `/login`)
- [x] Verify position account logins (`president@pupaccess.org`, `treasurer@pupaccess.org`, `projecthead.hardhatting@pupaccess.org`) with password `access2026!`
- [x] Verify student member SSO with `@pup.edu.ph` institutional emails
