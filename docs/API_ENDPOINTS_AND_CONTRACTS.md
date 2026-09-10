# PUP ACCESS Vault — API Endpoints & Server Action Contracts

This document specifies the internal server actions, API endpoints, context state contracts, and Supabase RPC functions used for backend integration.

---

## 1. Authentication & Session Contracts

### `POST /api/auth/login` (Or Client Action `login()`)

- **Input:** `{ email: string, password?: string, tab: 'OFFICER' | 'MEMBER' }`
- **Output:** `{ success: boolean, message: string, user?: UserProfile }`
- **Rules:**
  - `OFFICER` tab: Email must match position accounts (`president@pupaccess.org`, `treasurer@pupaccess.org`, `projecthead.hardhatting@pupaccess.org`). Password must match handover password (`access2026!`).
  - `MEMBER` tab: Email must end with `@pup.edu.ph`.

---

## 2. Expense Voucher & Approval API Contracts

### `submitVoucher(data)`

- **Input:**
  ```typescript
  {
    eventBudgetId: string;
    categoryId: string;
    title: string;
    description: string;
    amount: number;
    type: TransactionType;
    receiptType: ReceiptType;
    wallet?: 'GCASH' | 'GOTYME' | 'CASH_ON_HAND' | 'LANDBANK';
    fundingSource?: 'QUOTA' | 'PARTNERSHIP_SPONSOR' | 'ACCESS_GENERAL_FUNDS';
    receiptFile?: { name: string; size: number; mimeType: string };
    aiExtracted?: { vendor?: string; orNumber?: string; lineItems?: Array<{ name: string; quantity: number; unit_price: number; total: number }> };
    payeeName: string;
    accountType: 'GCASH' | 'LANDBANK' | 'BDO' | 'OTHER_BANK' | 'CASH';
    accountNumber: string;
    phoneNumber?: string;
  }
  ```
- **Backend Behavior:**
  1. Compresses receipt to `.webp`.
  2. Encrypts `accountNumber` and `phoneNumber` via AES-256-GCM (`encryptDisbursementData`).
  3. Inserts record into `expense_transactions` with status `TIER_1_PENDING`.

### `approveTransaction(txId, tier, comments?)`

- **Input:** `txId: string`, `tier: ApprovalTier`, `comments?: string`
- **State Progression:**
  - `TIER_1_PROJECT_HEAD` $\rightarrow$ transitions status to `TIER_2_PENDING`.
  - `TIER_2_FINANCE_OFFICER` $\rightarrow$ transitions status to `TIER_3_PENDING`.
  - `TIER_3_PRESIDENT` $\rightarrow$ transitions status to `CERTIFIED_DISBURSED`, deducts category balance, and appends a new SHA-256 audit block to `audit_ledger_blocks`.

---

## 3. Cryptographic Verification API

### `verifyLedgerIntegrity()`

- **Output:** `{ isValid: boolean, brokenAtIndex?: number, message: string }`
- **Backend Behavior:** Scans the linked hash chain across `audit_ledger_blocks` to verify `currBlock.previous_hash === prevBlock.current_hash`.
