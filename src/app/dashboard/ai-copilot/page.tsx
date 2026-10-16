'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
  Layers,
  Calculator,
  ShieldAlert,
  Send,
  Bot,
  User,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ArrowRight,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Zap,
  Download,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

// Simple, elegant Markdown renderer for AI responses
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const renderInline = (text: string) => {
    // Process bold, inline code, and links
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="rounded bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-[11px] text-[#ff7900] border border-[#333]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const header = tableRows[0];
    const dataRows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^:?-+:?$/)));

    const tableElem = (
      <div key={`tbl-${key}`} className="my-3 overflow-x-auto rounded-xl border border-[#262626] bg-[#0c0c0c]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#181818] border-b border-[#262626] text-[#a1a1aa]">
            <tr>
              {header.map((col, idx) => (
                <th key={idx} className="p-2.5 font-bold uppercase tracking-wider text-[10px]">
                  {renderInline(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#141414] transition">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2.5 text-[#ededed]">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return tableElem;
  };

  const flushCodeBlock = (key: number) => {
    const codeElem = (
      <div key={`code-${key}`} className="my-2.5 rounded-xl border border-[#262626] bg-[#0a0a0a] p-3 font-mono text-[11px] text-[#a1a1aa] overflow-x-auto">
        <pre>{codeBlockLines.join('\n')}</pre>
      </div>
    );
    codeBlockLines = [];
    inCodeBlock = false;
    return codeElem;
  };

  lines.forEach((line, idx) => {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(flushCodeBlock(idx));
      } else {
        if (inTable) elements.push(flushTable(idx));
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cols = line
        .trim()
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cols);
      return;
    } else if (inTable) {
      elements.push(flushTable(idx));
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="mt-3.5 mb-1.5 text-sm font-bold text-white font-mono flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff7900]" />
          {renderInline(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={idx} className="mt-4 mb-2 text-base font-bold text-white font-mono border-b border-[#222] pb-1">
          {renderInline(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={idx} className="mt-4 mb-2 text-lg font-extrabold text-white font-mono">
          {renderInline(line.slice(2))}
        </h2>
      );
      return;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={idx} className="my-3 border-[#262626]" />);
      return;
    }

    // Bullet points
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 text-xs text-[#d4d4d8] leading-relaxed my-1">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#ff7900] flex-shrink-0" />
          <div className="flex-1">{renderInline(line.trim().slice(2))}</div>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 text-xs text-[#d4d4d8] leading-relaxed my-1">
          <span className="font-mono font-bold text-[#ff7900] text-[11px] min-w-[18px]">
            {numMatch[1]}.
          </span>
          <div className="flex-1">{renderInline(numMatch[2])}</div>
        </div>
      );
      return;
    }

    // Standard paragraph or blank line
    if (line.trim() === '') {
      elements.push(<div key={idx} className="h-1.5" />);
    } else {
      elements.push(
        <p key={idx} className="text-xs text-[#d4d4d8] leading-relaxed my-1">
          {renderInline(line)}
        </p>
      );
    }
  });

  if (inTable) elements.push(flushTable(lines.length));
  if (inCodeBlock) elements.push(flushCodeBlock(lines.length));

  return <div className="space-y-0.5">{elements}</div>;
}

export default function AiCopilotPage() {
  const {
    currentUser,
    events,
    transactions,
    totalAllocated,
    totalSpent,
    remainingBalance,
    walletTotals,
    fundingSourceTotals,
    totalMoneyIn,
    totalMoneyOut,
    netTrackerBalance,
  } = useFinance();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi **${currentUser?.incumbent_name ? currentUser.incumbent_name.split(' ')[0] : 'there'}**! 👋 I'm your ACCESS Financial AI Strategist.

I'm connected live to your organization's treasury ledger and custody wallets. What would you like to explore today?`,
      timestamp: 'Just now',
      model: 'gemini-3.5-flash',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Active technique selection for quick interactive tools
  const [activeTechnique, setActiveTechnique] = useState<'ABB' | 'ZBB' | '70_20_10'>('ABB');
  const [attendeeCount, setAttendeeCount] = useState(120);
  const [mealRate, setMealRate] = useState(180);
  const [kitRate, setKitRate] = useState(150);
  const [lanyardRate, setLanyardRate] = useState(35);

  const calculatedCostPerHead = mealRate + kitRate + lanyardRate;
  const calculatedTotalABB = calculatedCostPerHead * attendeeCount;
  const recommendedContingency = calculatedTotalABB * 0.1;

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear the conversation history?')) {
      const name = currentUser?.incumbent_name ? currentUser.incumbent_name.split(' ')[0] : 'there';
      setMessages([
        {
          role: 'assistant',
          content: `Hi **${name}**! 👋 Conversation reset.

I'm ready whenever you are. What would you like to explore or audit next?`,
          timestamp: 'Just now',
          model: 'gemini-3.5-flash',
        },
      ]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update messages locally
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setLoading(true);

    try {
      // Package live financial context
      const pendingTx = transactions
        .filter((t) => t.status.includes('PENDING'))
        .map((t) => ({
          tracking_number: t.tracking_number || t.transaction_id || '',
          title: t.title,
          amount: t.amount,
          status: t.status,
          submitted_by_name: t.person_responsible || t.submitted_by_name,
          category_name: t.category_name || t.spreadsheet_category || '',
        }));

      const contextPayload = {
        totalAllocated,
        totalSpent,
        remainingBalance,
        totalMoneyIn,
        totalMoneyOut,
        netTrackerBalance,
        walletTotals,
        fundingSourceTotals,
        events: events.map((e) => ({
          name: e.name,
          total_allocated: e.total_allocated,
          spent_amount: e.spent_amount,
          contingency_buffer: e.contingency_buffer,
          categories: e.categories.map((c) => ({
            name: c.name,
            allocated_amount: c.allocated_amount,
            spent_amount: c.spent_amount,
          })),
        })),
        pendingTransactions: pendingTx,
        currentUser: {
          incumbent_name: currentUser.incumbent_name,
          position_title: currentUser.position_title,
          role: currentUser.role,
          incumbent_term: currentUser.incumbent_term,
        },
      };

      const res = await fetch('/api/ai-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: contextPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Server returned ${res.status}: ${res.statusText}`);
      }

      const botReply: ChatMessage = await res.json();
      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      console.error('AI Strategist Request Failed:', err);
      setErrorMessage(err.message || 'Failed to connect to AI Strategist.');
      // Add a helpful failure fallback message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Notice:** Unable to reach Google Gemini live service (${err.message}).\n\n**Quick Ledger Snapshot (Offline Computation):**\n* Net Tracker Balance: **${formatCurrency(netTrackerBalance)}**\n* Total Money In: **${formatCurrency(totalMoneyIn)}** | Money Out: **${formatCurrency(totalMoneyOut)}**\n* Active Wallets: GCash (**${formatCurrency(walletTotals.gcash.balance)}**), GoTyme (**${formatCurrency(walletTotals.gotyme.balance)}**)\n* Pending Vouchers: **${transactions.filter((t) => t.status.includes('PENDING')).length} vouchers** awaiting sign-off.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Preset prompts for common officer queries
  const quickPrompts = [
    {
      label: 'Cash Flow & Burn Rate',
      query: 'Analyze our current liquidity, burn rate across active events, and remaining vault funds in detail.',
    },
    {
      label: 'Audit Pending Vouchers',
      query: 'Check all pending vouchers awaiting approval. Are there any anomalies, budget overruns, or missing receipts?',
    },
    {
      label: 'ZBB Justification Check',
      query: 'How can our committee apply Zero-Based Budgeting (ZBB) to justify equipment and collaterals procurement for Room 424?',
    },
    {
      label: 'Executive Board Summary',
      query: 'Draft a formal Executive Board Treasury Summary for President Sophia Lim and Treasurer Daniel Bithao.',
    },
  ];

  // Starter prompt cards displayed cleanly when conversation is on welcome state
  const starterCards = [
    {
      title: 'Cash Flow & Liquidity',
      description: 'Review net balance across GCash, GoTyme & custody vaults',
      query: 'Analyze our current liquidity, burn rate across active events, and remaining vault funds in detail.',
      icon: <TrendingUp className="h-4 w-4 text-[#00bb7f]" />,
      badge: 'Ledger Audit',
    },
    {
      title: 'Audit Pending Vouchers',
      description: 'Inspect vouchers awaiting sign-offs and verify documentation',
      query: 'Check all pending vouchers awaiting approval. Are there any anomalies, budget overruns, or missing receipts?',
      icon: <ShieldAlert className="h-4 w-4 text-[#ff7900]" />,
      badge: 'Compliance',
    },
    {
      title: 'Plan Event Budget',
      description: 'Calculate 70/20/10 split, activity lines, & cost-per-head',
      query: 'How should we structure the budget allocation for upcoming events using Activity-Based Costing and 70/20/10 envelope splits?',
      icon: <PieChart className="h-4 w-4 text-[#38bdf8]" />,
      badge: 'Planning',
    },
    {
      title: 'Executive Board Report',
      description: 'Draft a formal treasury summary for leadership review',
      query: 'Draft a formal Executive Board Treasury Summary for President Sophia Lim and Treasurer Daniel Bithao.',
      icon: <Zap className="h-4 w-4 text-[#a855f7]" />,
      badge: 'Summary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-b border-[#262626] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-[#ff7900] shadow-xl shadow-[#ff7900]/25 flex-shrink-0 bg-[#161616] group">
            <img
              src="/ai-avatar.png"
              alt="PUP ACCESS Chief Financial AI Strategist"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#00bb7f] border-2 border-[#0a0a0a]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff7900] animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ff7900]">
                Real-Time Decision Intelligence
              </span>
              <span className="rounded-full bg-[#00bb7f]/15 text-[#00bb7f] border border-[#00bb7f]/30 px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00bb7f]" />
                Live Gemini 3.5 Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-3">
              Financial AI Strategist
            </h1>
            <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 font-sans max-w-2xl">
              Live conversational treasury intelligence powered by Google Gemini. Query real ledger balances, audit pending disbursements, and calculate Activity-Based & Zero-Based budget models.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#141414] hover:bg-[#1a1a1a] px-3.5 py-2 text-xs font-semibold text-[#a1a1aa] hover:text-white transition cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left interactive tools (5 cols) + Right Chat (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Budgeting Methodology Tools */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#ff7900]" />
                Event Budget Frameworks
              </h2>
              <span className="text-[10px] font-mono text-[#71717a]">Interactive Modeling</span>
            </div>

            {/* Technique Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0c0c0c] p-1 border border-[#222]">
              <button
                onClick={() => setActiveTechnique('ABB')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition cursor-pointer ${
                  activeTechnique === 'ABB'
                    ? 'bg-[#1e1e1e] text-[#ff7900] shadow-sm'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                Activity-Based
              </button>
              <button
                onClick={() => setActiveTechnique('70_20_10')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition cursor-pointer ${
                  activeTechnique === '70_20_10'
                    ? 'bg-[#1e1e1e] text-[#ff7900] shadow-sm'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                70/20/10 Split
              </button>
              <button
                onClick={() => setActiveTechnique('ZBB')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition cursor-pointer ${
                  activeTechnique === 'ZBB'
                    ? 'bg-[#1e1e1e] text-[#ff7900] shadow-sm'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                Zero-Based
              </button>
            </div>

            {/* Technique 1: Activity-Based Budgeting (ABB) */}
            {activeTechnique === 'ABB' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Calculates event budget cap by multiplying individual cost drivers by expected attendee count.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">Target Attendees (pax)</label>
                    <input
                      type="number"
                      value={attendeeCount}
                      onChange={(e) => setAttendeeCount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono focus:border-[#ff7900] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">Food / Meal per Head (₱)</label>
                    <input
                      type="number"
                      value={mealRate}
                      onChange={(e) => setMealRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono focus:border-[#ff7900] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">Event Kit / Shirt (₱)</label>
                    <input
                      type="number"
                      value={kitRate}
                      onChange={(e) => setKitRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono focus:border-[#ff7900] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a] mb-1">Badge & Lanyard (₱)</label>
                    <input
                      type="number"
                      value={lanyardRate}
                      onChange={(e) => setLanyardRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono focus:border-[#ff7900] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Computed Box */}
                <div className="rounded-xl border border-[#222] bg-[#0c0c0c] p-3 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[#a1a1aa]">
                    <span>Cost per Head:</span>
                    <span className="font-bold text-white">{formatCurrency(calculatedCostPerHead)}</span>
                  </div>
                  <div className="flex justify-between text-[#a1a1aa]">
                    <span>Core Deliverables ({attendeeCount} pax):</span>
                    <span className="font-bold text-white">{formatCurrency(calculatedTotalABB)}</span>
                  </div>
                  <div className="flex justify-between text-[#00bb7f]">
                    <span>10% Earmarked Contingency:</span>
                    <span className="font-bold">+{formatCurrency(recommendedContingency)}</span>
                  </div>
                  <div className="border-t border-[#222] pt-2 flex justify-between text-sm">
                    <span className="font-bold text-white">Recommended Cap:</span>
                    <span className="font-bold text-[#ff7900]">
                      {formatCurrency(calculatedTotalABB + recommendedContingency)}
                    </span>
                  </div>
                </div>

                {/* Connected AI Action Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      `Please evaluate my Activity-Based Budget (ABB) model for ${attendeeCount} attendees with a cost-per-head of ₱${calculatedCostPerHead} (Meal ₱${mealRate}, Kit ₱${kitRate}, Lanyard ₱${lanyardRate}). Total proposed cap is ${formatCurrency(
                        calculatedTotalABB + recommendedContingency
                      )} including a 10% contingency buffer. Is this cost-effective for a PUP engineering event, and what savings can we implement?`
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7900]/20 to-[#ff7900]/10 border border-[#ff7900]/40 py-2.5 text-xs font-bold text-[#ff7900] hover:bg-[#ff7900]/25 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Ask AI to Analyze this ABB Budget</span>
                </button>
              </div>
            )}

            {/* Technique 2: 70/20/10 Split */}
            {activeTechnique === '70_20_10' && (
              <div className="space-y-3 pt-1 text-xs text-[#a1a1aa]">
                <p className="leading-relaxed">
                  The standard PUP ACCESS safety envelope distribution for all major departmental events:
                </p>
                <div className="space-y-2 font-mono">
                  <div className="rounded-xl border border-[#ff7900]/30 bg-[#ff7900]/5 p-3">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span className="text-[#ff7900]">70% Core Event Execution</span>
                      <span>₱{(55000 * 0.7).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[11px] text-[#71717a]">
                      Bulwagang Balagtas AV, hardhat fabrication, stage lighting, speaker honoraria
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#00bb7f]/30 bg-[#00bb7f]/5 p-3">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span className="text-[#00bb7f]">20% Student Experience</span>
                      <span>₱{(55000 * 0.2).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[11px] text-[#71717a]">
                      Participant packed lunch, ID badges, souvenir tokens, photo coverage
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#3080ff]/30 bg-[#3080ff]/5 p-3">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span className="text-[#3080ff]">10% Earmarked Contingency</span>
                      <span>₱{(55000 * 0.1).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[11px] text-[#71717a]">
                      Locked emergency envelope requiring President final sign-off to disburse
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      'How does our active Hardhatting Ceremony and CE Month budget compare to the recommended 70-20-10 safety split? Which categories are currently at risk of overspending?'
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00bb7f]/20 to-[#00bb7f]/10 border border-[#00bb7f]/40 py-2.5 text-xs font-bold text-[#00bb7f] hover:bg-[#00bb7f]/25 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analyze 70-20-10 Split for Active Events</span>
                </button>
              </div>
            )}

            {/* Technique 3: Zero-Based Budgeting (ZBB) */}
            {activeTechnique === 'ZBB' && (
              <div className="space-y-3 pt-1 text-xs text-[#a1a1aa]">
                <p className="leading-relaxed">
                  Zero-Based Budgeting mandates that every expenditure line starts from ₱0 rather than carrying over past semester figures:
                </p>
                <div className="rounded-xl border border-[#333] bg-[#0c0c0c] p-3 space-y-2 font-mono text-[11px]">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-[#ff7900]" />
                    Room 424 CEA Asset Checklist:
                  </p>
                  <ul className="space-y-1 text-[#71717a] list-disc list-inside">
                    <li>Check existing CEA Room 424 inventory before procuring new whiteboard markers</li>
                    <li>Repurpose stage backdrops and tarpaulin stands from previous General Assembly</li>
                    <li>Audit university-provided microphones at Bulwagang Balagtas before renting audio</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      'Conduct a Zero-Based Budgeting (ZBB) audit on our recent expense vouchers (e.g. TXN-0016 Whiteboard markers and TXN-0017 Audio cables). Could any of these items have been sourced from Room 424 inventory?'
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7900]/20 to-[#ff7900]/10 border border-[#ff7900]/40 py-2.5 text-xs font-bold text-[#ff7900] hover:bg-[#ff7900]/25 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Run ZBB Inventory & Justification Audit</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Treasury Stats Card */}
          <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 text-xs font-mono space-y-2.5">
            <div className="flex items-center justify-between text-[#71717a]">
              <span>Active Ledger Balance:</span>
              <span className="font-bold text-[#00bb7f] text-sm">{formatCurrency(netTrackerBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-[#71717a]">
              <span>GCash Mobile Custody:</span>
              <span className="font-bold text-white">{formatCurrency(walletTotals.gcash.balance)}</span>
            </div>
            <div className="flex items-center justify-between text-[#71717a]">
              <span>GoTyme Bank Reserves:</span>
              <span className="font-bold text-white">{formatCurrency(walletTotals.gotyme.balance)}</span>
            </div>
            <div className="flex items-center justify-between text-[#71717a] border-t border-[#222] pt-2">
              <span>Pending Vouchers:</span>
              <span className="font-bold text-[#ff7900]">
                {transactions.filter((t) => t.status.includes('PENDING')).length} vouchers
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Financial Chat Interface (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden shadow-2xl h-[680px]">
          {/* Header */}
          <div className="border-b border-[#262626] bg-[#101010] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-xl overflow-hidden border-2 border-[#ff7900] shadow-md shadow-[#ff7900]/25 flex-shrink-0 bg-[#161616]">
                <img
                  src="/ai-avatar.png"
                  alt="PUP ACCESS Financial AI Strategist"
                  className="h-full w-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00bb7f] border-2 border-[#101010]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>PUP ACCESS Finance Intelligence AI</span>
                  <span className="rounded bg-[#00bb7f]/15 text-[#00bb7f] border border-[#00bb7f]/30 px-1.5 py-0.2 text-[9px]">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-[#71717a] font-sans">
                  Active Context: {currentUser.incumbent_name} &bull; {currentUser.position_title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block rounded-md border border-[#333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-mono text-[#a1a1aa]">
                Gemini 3.5 Active
              </span>
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#161616] hover:bg-[#202020] px-2.5 py-1 text-[10px] font-mono text-[#a1a1aa] hover:text-white transition cursor-pointer"
                  title="Start a new chat session"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Prompt Chips (shown when actively chatting) */}
          {messages.length > 1 && (
            <div className="px-3.5 py-2 border-b border-[#222] bg-[#0c0c0c] flex items-center gap-2 overflow-x-auto text-[11px] font-mono scrollbar-none">
              <span className="text-[#555] shrink-0 flex items-center gap-1">
                <Zap className="h-3 w-3 text-[#ff7900]" />
                Quick:
              </span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p.query)}
                  disabled={loading}
                  className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[#a1a1aa] hover:text-white hover:border-[#ff7900]/50 shrink-0 transition cursor-pointer disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages Body */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="relative h-8 w-8 rounded-xl overflow-hidden border border-[#ff7900]/40 flex-shrink-0 shadow-sm mt-0.5 bg-[#161616]">
                      <img
                        src="/ai-avatar.png"
                        alt="AI Strategist"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-[#ff7900] to-[#f26223] text-white'
                        : 'border border-[#262626] bg-[#0e0e0e] text-[#ededed]'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-line font-sans text-xs">{msg.content}</p>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-white/10 text-[10px] font-mono">
                      <span className={isUser ? 'text-white/70' : 'text-[#71717a]'}>
                        {msg.timestamp}
                        {msg.model && ` &bull; ${msg.model}`}
                      </span>

                      {!isUser && (
                        <button
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          title="Copy response to clipboard"
                          className="text-[#71717a] hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedIdx === idx ? (
                            <>
                              <Check className="h-3 w-3 text-[#00bb7f]" />
                              <span className="text-[#00bb7f]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e1e1e] text-white border border-[#333] mt-1">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Starter Suggestion Cards shown only on welcome state */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 pb-1 space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717a] px-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                  <span>Suggested queries & audits:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {starterCards.map((card, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(card.query)}
                      className="group flex flex-col justify-between p-3.5 rounded-xl border border-[#262626] bg-[#0f0f0f] hover:bg-[#181818] hover:border-[#ff7900]/50 transition duration-200 text-left cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 w-full">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#ff7900]/40 transition">
                            {card.icon}
                          </div>
                          <span className="text-xs font-bold text-white group-hover:text-[#ff7900] transition">
                            {card.title}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#888] border border-[#2a2a2a]">
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888] group-hover:text-[#aaa] transition leading-relaxed">
                        {card.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1 text-[10px] font-mono text-[#555] group-hover:text-[#ff7900] transition">
                        <span>Run prompt</span>
                        <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-3 text-xs text-[#a1a1aa] font-mono bg-[#0c0c0c] p-3.5 rounded-xl border border-[#222] w-fit animate-pulse">
                <div className="h-6 w-6 rounded-lg overflow-hidden border border-[#ff7900]/50 flex-shrink-0">
                  <img
                    src="/ai-avatar.png"
                    alt="AI Thinking"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span>Google Gemini 3.5 is analyzing PUP ACCESS ledger records and calculating strategy...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3.5 border-t border-[#262626] bg-[#101010]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about burn rates, 70-20-10 splits, pending vouchers, or COA liquidation guidelines..."
                disabled={loading}
                className="flex-1 rounded-xl border border-[#262626] bg-[#0c0c0c] px-4 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#ff7900] focus:outline-none transition font-sans disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff7900] to-[#f26223] text-white shadow-lg shadow-[#ff7900]/25 hover:brightness-110 disabled:opacity-40 transition cursor-pointer"
                title="Send query to Gemini Strategist"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
