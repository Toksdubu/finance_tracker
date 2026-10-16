import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: {
        totalAllocated?: number;
        totalSpent?: number;
        remainingBalance?: number;
        totalMoneyIn?: number;
        totalMoneyOut?: number;
        netTrackerBalance?: number;
        walletTotals?: Record<string, { in: number; out: number; balance: number }>;
        fundingSourceTotals?: Record<string, { in: number; out: number; balance: number }>;
        events?: Array<{
          name: string;
          total_allocated: number;
          spent_amount: number;
          contingency_buffer: number;
          categories: Array<{ name: string; allocated_amount: number; spent_amount: number }>;
        }>;
        pendingTransactions?: Array<{
          tracking_number: string;
          title: string;
          amount: number;
          status: string;
          submitted_by_name: string;
          category_name: string;
        }>;
        currentUser?: {
          incumbent_name: string;
          position_title: string;
          role: string;
          incumbent_term: string;
        };
      };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not configured.' },
        { status: 500 }
      );
    }

    // Format financial context into a rich, structured prompt
    const ctxString = context
      ? `
REAL-TIME PUP ACCESS TREASURY FINANCIAL CONTEXT:
- Organization: PUP Association of Concerned Computer Engineering Students for Service (PUP ACCESS)
- Headquarters: Room 424 CEA Bldg., Polytechnic University of the Philippines, Sta. Mesa, Manila
- Active Academic Term: ${context.currentUser?.incumbent_term || 'A.Y. 2025-2026'}
- Current Reviewing Officer: ${context.currentUser?.incumbent_name || 'Executive Officer'} (${context.currentUser?.position_title || 'Officer'})

OFFICIAL FINANCIAL TRACKER SUMMARY (13-Column Central Ledger):
- Total Money In: ₱${(context.totalMoneyIn ?? 17458.98).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Total Money Out: ₱${(context.totalMoneyOut ?? 12229.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Net Tracker Balance: ₱${(context.netTrackerBalance ?? 5229.98).toLocaleString('en-US', { minimumFractionDigits: 2 })}

CUSTODY WALLETS (Reconciliation):
- GCash Mobile: In ₱${(context.walletTotals?.gcash?.in ?? 39760.43).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Out ₱${(context.walletTotals?.gcash?.out ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Net ₱${(context.walletTotals?.gcash?.balance ?? 39760.43).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- GoTyme Bank (Reserves): In ₱${(context.walletTotals?.gotyme?.in ?? 8401.73).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Out ₱${(context.walletTotals?.gotyme?.out ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Net ₱${(context.walletTotals?.gotyme?.balance ?? 8401.73).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Cash on Hand: In ₱${(context.walletTotals?.cash?.in ?? 500.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Out ₱${(context.walletTotals?.cash?.out ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}, Net ₱${(context.walletTotals?.cash?.balance ?? 500.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}

FUNDING SOURCES:
- QUOTA (Sports / Collections): Net ₱${(context.fundingSourceTotals?.quota?.balance ?? 36760.43).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- PARTNERSHIPS / SPONSORS (Bettermind, etc.): Net ₱${(context.fundingSourceTotals?.partnerships?.balance ?? 11401.73).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- ACCESS GENERAL FUNDS: Net ₱${(context.fundingSourceTotals?.accessGeneral?.balance ?? 50000.00).toLocaleString('en-US', { minimumFractionDigits: 2 })}

ACTIVE DEPARTMENTAL EVENTS & BUDGET ENVELOPES:
${(context.events || [])
  .map(
    (e) =>
      `• ${e.name}: Total Allocated ₱${e.total_allocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Spent ₱${e.spent_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Remaining ₱${(e.total_allocated - e.spent_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}, 10% Earmarked Contingency Buffer: ₱${e.contingency_buffer.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Categories: ${e.categories.map((c) => `${c.name} (Cap: ₱${c.allocated_amount}, Spent: ₱${c.spent_amount})`).join(', ')}`
  )
  .join('\n')}

PENDING VOUCHERS AWAITING APPROVAL:
${(context.pendingTransactions || [])
  .map(
    (t) =>
      `• [${t.tracking_number}] "${t.title}" — ₱${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${t.category_name}), Submitted by ${t.submitted_by_name}, Status: ${t.status}`
  )
  .join('\n')}
`
      : 'PUP ACCESS Computer Engineering Department Treasury Ledger';

    const systemPrompt = `You are the PUP ACCESS Chief Financial Strategist & Intelligence AI for the Association of Concerned Computer Engineering Students for Service at Polytechnic University of the Philippines (Room 424 CEA Bldg).
You have real-time live access to the organization's treasury ledger, custody wallets, event budget envelopes, and voucher approval pipeline.

${ctxString}

CORE RESPONSIBILITIES:
1. Provide accurate, real-time financial analysis based directly on the actual ledger numbers above. Never fabricate data or say you lack access when the data is provided in context.
2. Master Budgeting Methodologies:
   - Activity-Based Budgeting (ABB): Itemize costs per head (meals, lanyard, shirts, technical gear) and calculate total project caps.
   - Zero-Based Budgeting (ZBB): Justify every item from ₱0, identify existing inventory from Room 424 CEA Bldg to avoid duplicate spending.
   - 70/20/10 Rule: 70% Core Event Execution, 20% Participant Experience, 10% Earmarked Contingency Buffer.
3. Anomaly & Audit Checks:
   - Identify pending vouchers requiring signatures (Stage 1 Project Head -> Stage 2 Treasurer -> Stage 3 President).
   - Detect category envelope overruns or low liquidity warnings.
4. Tone & Formatting:
   - Highly professional, clear, encouraging, executive-ready, and collegiate.
   - Use Markdown with bold numbers, bullet lists, tables where relevant, and Philippine Peso currency format (e.g. ₱1,250.00).
   - Keep answers direct, insightful, and actionable.`;

    // Map conversation into Gemini's multi-turn format
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Call Gemini API with gemini-3.5-flash (with automatic fallback to gemini-3.5-flash-lite)
    const callModel = async (modelName: string) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );
      return response;
    };

    let geminiRes = await callModel('gemini-3.5-flash');

    // If 503 or 404, fallback to gemini-3.5-flash-lite
    if (!geminiRes.ok) {
      console.warn(`gemini-3.5-flash failed with ${geminiRes.status}, falling back to gemini-3.5-flash-lite...`);
      geminiRes = await callModel('gemini-3.5-flash-lite');
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API Error:', geminiRes.status, errText);
      return NextResponse.json(
        { error: `Gemini API returned status ${geminiRes.status}: ${errText}` },
        { status: geminiRes.status }
      );
    }

    const data = await geminiRes.json();
    const candidate = data.candidates?.[0];
    const replyText =
      candidate?.content?.parts?.[0]?.text ||
      'I have reviewed your financial query, but received an empty response. Please try rephrasing your question.';

    return NextResponse.json({
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: data.modelVersion || 'gemini-3.5-flash',
    });
  } catch (error: any) {
    console.error('AI Strategist Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing AI strategy request.' },
      { status: 500 }
    );
  }
}
