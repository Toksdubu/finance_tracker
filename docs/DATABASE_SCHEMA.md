# PUP ACCESS Vault — Database Schema & SQL Specifications

This document defines the complete PostgreSQL database structure, data types, relationships, Row Level Security (RLS) policies, and SQL migrations used by the ACCESS Vault backend.

---

## 1. Custom Types & Enumerations

```sql
CREATE TYPE user_role AS ENUM (
  'STUDENT_MEMBER', 
  'PROJECT_HEAD', 
  'FINANCE_OFFICER', 
  'PRESIDENT', 
  'ADMIN'
);

CREATE TYPE transaction_type AS ENUM (
  'DISBURSEMENT', 
  'REIMBURSEMENT', 
  'CASH_ADVANCE', 
  'RETURN_OF_EXCESS', 
  'COLLECTION', 
  'SPONSORSHIP', 
  'REALLOCATION'
);

CREATE TYPE receipt_type AS ENUM (
  'OFFICIAL_RECEIPT_SI', 
  'ACKNOWLEDGMENT_RECEIPT', 
  'CENRR_PETTY_CASH'
);

CREATE TYPE approval_tier AS ENUM (
  'TIER_1_PROJECT_HEAD', 
  'TIER_2_FINANCE_OFFICER', 
  'TIER_3_PRESIDENT'
);

CREATE TYPE transaction_status AS ENUM (
  'DRAFT', 
  'TIER_1_PENDING', 
  'TIER_2_PENDING', 
  'TIER_3_PENDING', 
  'CERTIFIED_DISBURSED', 
  'LIQUIDATED', 
  'REJECTED'
);
```

---

## 2. Core Tables Overview

### `member_whitelist`
Ensures that only verified PUP Computer Engineering students active in ACCESS can authenticate.
- `id` (UUID, PK)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `student_number` (TEXT, UNIQUE)
- `is_active` (BOOLEAN)

### `profiles`
Extends Supabase `auth.users` with incumbent role attribution.
- `id` (UUID, PK, FK to `auth.users.id`)
- `email` (TEXT, UNIQUE)
- `position_title` (TEXT)
- `role` (user_role)
- `incumbent_name` (TEXT)
- `incumbent_student_no` (TEXT)
- `incumbent_term` (TEXT)

### `event_budgets`
Tracks overall event budgets (e.g., Hardhatting Ceremony, CpE Month).
- `id` (UUID, PK)
- `name` (TEXT)
- `slug` (TEXT, UNIQUE)
- `purpose` (TEXT)
- `technique` (TEXT)
- `total_allocated` (NUMERIC)
- `contingency_buffer` (NUMERIC)
- `status` (TEXT)
- `project_head_id` (UUID, FK to `profiles.id`)

### `budget_categories`
Specific expense envelopes within an event.
- `id` (UUID, PK)
- `event_budget_id` (UUID, FK to `event_budgets.id`)
- `name` (TEXT)
- `allocated_amount` (NUMERIC)

### `expense_transactions`
Core financial ledger storing expenses and AES-256-GCM encrypted payment details.
- `id` (UUID, PK)
- `event_budget_id` (UUID, FK to `event_budgets.id`)
- `category_id` (UUID, FK to `budget_categories.id`)
- `tracking_number` (TEXT, UNIQUE)
- `title` (TEXT)
- `description` (TEXT)
- `type` (transaction_type)
- `status` (transaction_status)
- `amount` (NUMERIC)
- `submitted_by` (UUID, FK to `profiles.id`)
- `encrypted_payee_info` (TEXT) — AES-256-GCM
- `encrypted_disbursement_acct` (TEXT) — AES-256-GCM

### `transaction_approvals`
Detailed signatures for each of the 3 approval tiers.
- `id` (UUID, PK)
- `transaction_id` (UUID, FK to `expense_transactions.id`)
- `tier` (approval_tier)
- `approver_id` (UUID, FK to `profiles.id`)
- `approver_position` (TEXT)
- `approver_incumbent_name` (TEXT)
- `approver_term` (TEXT)
- `action` (TEXT)
- `comments` (TEXT)
- `signature_hash` (TEXT)
- `signed_at` (TIMESTAMPTZ)

### `audit_ledger_blocks`
Immutable cryptographic SHA-256 block ledger.
- `id` (UUID, PK)
- `transaction_id` (UUID, FK to `expense_transactions.id`)
- `tracking_number` (TEXT)
- `block_index` (INT)
- `previous_hash` (TEXT)
- `current_hash` (TEXT)
- `title` (TEXT)
- `amount` (NUMERIC)
- `certified_by_name` (TEXT)

---

## 3. SQL Migration File Reference
The primary PostgreSQL deployment script is maintained at:
[`supabase/migrations/20260910000000_init_access_finance.sql`](file:///d:/finance_tracker/supabase/migrations/20260910000000_init_access_finance.sql).
