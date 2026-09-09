export type UserRole =
  | 'STUDENT_MEMBER'
  | 'PROJECT_HEAD'
  | 'FINANCE_OFFICER'
  | 'PRESIDENT'
  | 'ADMIN';

export type ApprovalTier =
  | 'TIER_1_PROJECT_HEAD'
  | 'TIER_2_FINANCE_OFFICER'
  | 'TIER_3_PRESIDENT';

export type TransactionStatus =
  | 'DRAFT'
  | 'TIER_1_PENDING'
  | 'TIER_2_PENDING'
  | 'TIER_3_PENDING'
  | 'CERTIFIED_DISBURSED'
  | 'LIQUIDATED'
  | 'REJECTED';

export type WalletType = 'GCASH' | 'GOTYME' | 'CASH_ON_HAND' | 'LANDBANK';

export type FundingSource = 'QUOTA' | 'PARTNERSHIP_SPONSOR' | 'ACCESS_GENERAL_FUNDS';

export type TransactionType =
  | 'DISBURSEMENT'
  | 'REIMBURSEMENT'
  | 'CASH_ADVANCE'
  | 'RETURN_OF_EXCESS'
  | 'COLLECTION'
  | 'SPONSORSHIP'
  | 'REALLOCATION';

export type ReceiptType =
  | 'OFFICIAL_RECEIPT_SI'
  | 'ACKNOWLEDGMENT_RECEIPT'
  | 'CENRR_PETTY_CASH';

export type BudgetTechnique =
  | 'ZERO_BASED'
  | 'ACTIVITY_BASED'
  | 'ENVELOPE_70_20_10'
  | 'HISTORICAL_BENCHMARK';

export interface UserProfile {
  id: string;
  email: string;
  position_title: string;
  role: UserRole;
  incumbent_name: string;
  incumbent_student_no?: string;
  incumbent_term: string;
}

export interface BudgetCategory {
  id: string;
  event_budget_id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

export interface EventBudget {
  id: string;
  fiscal_year_id: string;
  name: string;
  slug: string;
  purpose: string;
  technique: BudgetTechnique;
  total_allocated: number;
  contingency_buffer: number;
  spent_amount: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  project_head_id?: string;
  project_head_name?: string;
  categories: BudgetCategory[];
  created_at: string;
}

export interface TransactionApproval {
  id: string;
  transaction_id: string;
  tier: ApprovalTier;
  approver_id: string;
  approver_position: string;
  approver_incumbent_name: string;
  approver_term: string;
  action: 'APPROVED' | 'REJECTED';
  comments?: string;
  signature_hash: string;
  signed_at: string;
}

export interface ReceiptAttachment {
  id: string;
  transaction_id: string;
  receipt_type: ReceiptType;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  sha256_hash: string;
  ai_extracted_json?: {
    vendor?: string;
    or_number?: string;
    date?: string;
    line_items?: Array<{ name: string; quantity: number; unit_price: number; total: number }>;
    computed_total?: number;
    tax?: number;
  };
  ai_confidence?: number;
}

export interface ExpenseTransaction {
  id: string;
  event_budget_id: string;
  event_name: string;
  category_id: string;
  category_name: string;
  tracking_number: string;
  title: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  transacted_at: string;
  submitted_by_id: string;
  submitted_by_name: string;
  
  // Spreadsheet-Aligned Practical Fields
  wallet?: WalletType;
  funding_source?: FundingSource;
  cash_in?: number;
  remarks?: string;
  reimbursement_notes?: string;

  // Sensitive Encrypted Fields
  encrypted_payee_info?: string;
  encrypted_disbursement_acct?: string;
  
  receipt?: ReceiptAttachment;
  approvals: TransactionApproval[];
  created_at: string;
}

export interface AuditBlock {
  id: string;
  transaction_id: string;
  tracking_number: string;
  block_index: number;
  previous_hash: string;
  current_hash: string;
  title: string;
  amount: number;
  event_name: string;
  certified_by_name: string;
  certified_by_position: string;
  timestamp: string;
}
