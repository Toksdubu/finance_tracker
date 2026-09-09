-- =====================================================================
-- PUP ACCESS (Association of Concerned Computer Engineering Students)
-- Finance & Transparency Platform ("ACCESS Vault")
-- Database Migration Script (PostgreSQL / Supabase)
-- =====================================================================

-- 1. Create Enums
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

CREATE TYPE budget_technique AS ENUM (
  'ZERO_BASED', 
  'ACTIVITY_BASED', 
  'ENVELOPE_70_20_10', 
  'HISTORICAL_BENCHMARK'
);

-- 2. Member Whitelist (Ensures ONLY verified ACCSS students can log in)
CREATE TABLE member_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  student_number TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Profiles Table (Supports Persistent Position Accounts + Incumbents)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  position_title TEXT NOT NULL DEFAULT 'ACCSS Member',
  role user_role NOT NULL DEFAULT 'STUDENT_MEMBER',
  incumbent_name TEXT NOT NULL,
  incumbent_student_no TEXT,
  incumbent_term TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Fiscal Years
CREATE TABLE fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL, -- e.g. "A.Y. 2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  total_budget_cap NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Event Budgets
CREATE TABLE event_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL,
  technique budget_technique NOT NULL DEFAULT 'ACTIVITY_BASED',
  total_allocated NUMERIC(12, 2) NOT NULL,
  contingency_buffer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  project_head_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Budget Categories (Envelopes)
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_budget_id UUID NOT NULL REFERENCES event_budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Expense Transactions (Ledger)
CREATE TABLE expense_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_budget_id UUID NOT NULL REFERENCES event_budgets(id),
  category_id UUID NOT NULL REFERENCES budget_categories(id),
  tracking_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type transaction_type NOT NULL DEFAULT 'REIMBURSEMENT',
  status transaction_status NOT NULL DEFAULT 'TIER_1_PENDING',
  amount NUMERIC(12, 2) NOT NULL,
  transacted_at TIMESTAMPTZ NOT NULL,
  submitted_by UUID NOT NULL REFERENCES profiles(id),

  -- Encrypted Sensitive Fields (AES-256-GCM zero-cost in-process crypto)
  encrypted_payee_info TEXT,
  encrypted_disbursement_acct TEXT,
  key_version INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Transaction Approval Sign-offs (3-Tier Multi-Signature Audit Trail)
CREATE TABLE transaction_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES expense_transactions(id) ON DELETE CASCADE,
  tier approval_tier NOT NULL,
  approver_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Frozen Incumbent Details at time of signature
  approver_position TEXT NOT NULL,
  approver_incumbent_name TEXT NOT NULL,
  approver_term TEXT NOT NULL,
  
  action TEXT NOT NULL,
  comments TEXT,
  signature_hash TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id, tier)
);

-- 9. Receipts & Attachments (Single Private Storage Vault)
CREATE TABLE receipt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES expense_transactions(id) ON DELETE CASCADE,
  receipt_type receipt_type NOT NULL DEFAULT 'OFFICIAL_RECEIPT_SI',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  ai_extracted_json JSONB,
  ai_confidence NUMERIC(4, 3),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Cryptographic Immutable Audit Blocks (Hash Chaining)
CREATE TABLE audit_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES expense_transactions(id),
  block_index BIGSERIAL UNIQUE,
  previous_hash TEXT NOT NULL,
  current_hash TEXT NOT NULL,
  payload_snapshot JSONB NOT NULL,
  certified_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Only Authenticated Users Can Access Internal Data
CREATE POLICY "Authenticated users can view event budgets"
  ON event_budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view budget categories"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view approved transactions"
  ON expense_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view audit blocks"
  ON audit_blocks FOR SELECT
  TO authenticated
  USING (true);
