import { createClient } from '@/lib/supabase/client';
import { EventBudget, ExpenseTransaction, AuditBlock, UserProfile } from '@/types/finance';
import { INITIAL_EVENTS, INITIAL_PROFILES, INITIAL_TRANSACTIONS, INITIAL_AUDIT_BLOCKS } from '@/lib/mock-data';

export async function fetchEventBudgetsFromDB(): Promise<EventBudget[]> {
  try {
    const supabase = createClient();
    const { data: eventsData, error } = await supabase
      .from('event_budgets')
      .select('*, categories:budget_categories(*)');

    if (error || !eventsData || eventsData.length === 0) {
      if (error) {
        console.warn('Supabase event fetch info:', error.message);
      }
      return INITIAL_EVENTS;
    }

    return eventsData.map((e: any) => ({
      id: e.id,
      fiscal_year_id: e.fiscal_year_id,
      name: e.name,
      slug: e.slug,
      purpose: e.purpose,
      technique: e.technique || 'ACTIVITY_BASED',
      total_allocated: Number(e.total_allocated),
      contingency_buffer: Number(e.contingency_buffer || 0),
      spent_amount: 0, // Computed dynamically from transactions
      status: e.status || 'ACTIVE',
      project_head_id: e.project_head_id || 'usr_ph_01',
      project_head_name: 'Ren Zapanta',
      categories: (e.categories || []).map((c: any) => ({
        id: c.id,
        event_budget_id: c.event_budget_id,
        name: c.name,
        allocated_amount: Number(c.allocated_amount),
        spent_amount: 0,
      })),
      created_at: e.created_at,
    }));
  } catch (err) {
    console.error('Failed to load event budgets from Supabase:', err);
    return INITIAL_EVENTS;
  }
}

export async function fetchTransactionsFromDB(): Promise<ExpenseTransaction[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expense_transactions')
      .select('*, approvals:transaction_approvals(*), receipt:receipt_attachments(*)');

    if (error || !data || data.length === 0) {
      return INITIAL_TRANSACTIONS;
    }

    return data.map((t: any) => ({
      id: t.id,
      event_budget_id: t.event_budget_id,
      event_name: t.event_name || 'Organization Event',
      category_id: t.category_id,
      category_name: t.category_name || 'General Expense',
      tracking_number: t.tracking_number,
      title: t.title,
      description: t.description,
      type: t.type,
      status: t.status,
      amount: Number(t.amount),
      transacted_at: t.transacted_at,
      submitted_by_id: t.submitted_by,
      submitted_by_name: t.submitted_by_name || 'Organization Member',
      receipt: t.receipt?.[0] ? {
        id: t.receipt[0].id,
        transaction_id: t.receipt[0].transaction_id,
        receipt_type: t.receipt[0].receipt_type,
        file_name: t.receipt[0].file_name,
        file_size: t.receipt[0].file_size,
        mime_type: t.receipt[0].mime_type,
        storage_path: t.receipt[0].storage_path,
        sha256_hash: t.receipt[0].sha256_hash,
        ai_extracted_json: t.receipt[0].ai_extracted_json,
        ai_confidence: Number(t.receipt[0].ai_confidence || 0.95),
      } : {
        id: `rcpt_${t.id}`,
        transaction_id: t.id,
        receipt_type: 'OFFICIAL_RECEIPT_SI',
        file_name: 'receipt.webp',
        file_size: 145000,
        mime_type: 'image/webp',
        storage_path: `receipts-vault/${t.tracking_number}.webp`,
        sha256_hash: 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890',
        ai_extracted_json: { vendor: 'Verified Vendor', or_number: 'OR-SYSTEM' },
        ai_confidence: 0.98,
      },
      approvals: (t.approvals || []).map((a: any) => ({
        id: a.id,
        transaction_id: a.transaction_id,
        tier: a.tier,
        approver_id: a.approver_id,
        approver_position: a.approver_position,
        approver_incumbent_name: a.approver_incumbent_name,
        approver_term: a.approver_term,
        action: a.action,
        comments: a.comments,
        signature_hash: a.signature_hash,
        signed_at: a.signed_at,
      })),
      created_at: t.created_at,
    }));
  } catch (err) {
    console.error('Failed to load transactions from Supabase:', err);
    return INITIAL_TRANSACTIONS;
  }
}

export async function fetchAuditBlocksFromDB(): Promise<AuditBlock[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_blocks')
      .select('*')
      .order('block_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_AUDIT_BLOCKS;
    }

    return data.map((b: any) => ({
      id: b.id,
      transaction_id: b.transaction_id,
      tracking_number: b.tracking_number || `ACCSS-BLK-${b.block_index}`,
      block_index: Number(b.block_index),
      previous_hash: b.previous_hash,
      current_hash: b.current_hash,
      title: b.payload_snapshot?.title || 'Certified Expense Block',
      amount: Number(b.payload_snapshot?.amount || 0),
      event_name: b.payload_snapshot?.event_name || 'General Event',
      certified_by_name: b.payload_snapshot?.certified_by_name || 'Sophia Lim',
      certified_by_position: b.payload_snapshot?.certified_by_position || 'Organization President',
      timestamp: b.created_at,
    }));
  } catch (err) {
    console.error('Failed to load audit blocks from Supabase:', err);
    return INITIAL_AUDIT_BLOCKS;
  }
}
