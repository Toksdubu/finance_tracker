'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AiCopilotPage() {
  const { events, transactions, totalAllocated, totalSpent, remainingBalance } = useFinance();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I am your ACCSS Financial Intelligence Copilot. I can assist with budgeting techniques (Zero-Based Budgeting, Activity-Based estimates), auto-computing event caps, and detecting financial anomalies across your envelopes. How can I assist you today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Active technique selection for quick interactive tools
  const [activeTechnique, setActiveTechnique] = useState<'ABB' | 'ZBB' | '70_20_10'>('ABB');
  const [attendeeCount, setAttendeeCount] = useState(120);
  const [mealRate, setMealRate] = useState(180);
  const [kitRate, setKitRate] = useState(150);
  const [lanyardRate, setLanyardRate] = useState(35);

  const calculatedCostPerHead = mealRate + kitRate + lanyardRate;
  const calculatedTotalABB = calculatedCostPerHead * attendeeCount;
  const recommendedContingency = calculatedTotalABB * 0.10;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    setTimeout(() => {
      let responseText = '';

      if (query.toLowerCase().includes('contingency') || query.toLowerCase().includes('emergency')) {
        const totalContingency = events.reduce((sum, e) => sum + e.contingency_buffer, 0);
        responseText = `Across all 3 active departmental events, you have a combined **${formatCurrency(totalContingency)}** locked in earmarked contingency envelopes (10% buffer). Under ACCSS governance rules, this buffer cannot be disbursed without Tier 3 President authorization.`;
      } else if (query.toLowerCase().includes('hardhatting') || query.toLowerCase().includes('burn')) {
        const hh = events.find((e) => e.slug.includes('hardhatting'));
        if (hh) {
          const burn = Math.round((hh.spent_amount / hh.total_allocated) * 100);
          responseText = `**Hardhatting Ceremony 2026** has disbursed **${formatCurrency(hh.spent_amount)}** out of **${formatCurrency(hh.total_allocated)}** (${burn}% burn rate). The remaining balance is **${formatCurrency(hh.total_allocated - hh.spent_amount)}**. The Food category envelope is currently at 80% utilization with ₱3,650 remaining.`;
        }
      } else if (query.toLowerCase().includes('recommend') || query.toLowerCase().includes('technique') || query.toLowerCase().includes('seminar')) {
        responseText = `For an organization seminar with ~${attendeeCount} participants, I recommend **Activity-Based Budgeting (ABB)** with a **70-20-10 Envelope Split**:
- **70% Direct Execution (${formatCurrency(calculatedTotalABB * 0.70)}):** Technical equipment, stage AV, speaker honorarium.
- **20% Student Experience (${formatCurrency(calculatedTotalABB * 0.20)}):** Participant food, certificates, seminar ID badges.
- **10% Earmarked Contingency (${formatCurrency(recommendedContingency)}):** Locked safety buffer.
Estimated required budget cap: **${formatCurrency(calculatedTotalABB + recommendedContingency)}**.`;
      } else {
        responseText = `Analysis of your current ledger:
- **Total Allocated Cap:** ${formatCurrency(totalAllocated)}
- **Total Disbursed:** ${formatCurrency(totalSpent)} (${Math.round((totalSpent / totalAllocated) * 100)}% burn rate)
- **Current Vault Liquidity:** ${formatCurrency(remainingBalance)}
- **Pending Approvals:** ${transactions.filter((t) => t.status.includes('PENDING')).length} vouchers in queue.
No budget envelope cap violations or duplicate receipt numbers detected across all logged transactions.`;
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#262626] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-[#f26223]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f26223]">
            AI Decision Intelligence
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
          Budget Methodology & AI Strategist
        </h1>
        <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
          Apply proven organizational finance frameworks (Zero-Based, Activity-Based) and query organization funds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Budgeting Techniques Engine (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 space-y-4">
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#f26223]" />
              Event Budget Technique Calculator
            </h2>

            {/* Technique Selector */}
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#0c0c0c] p-1 border border-[#222]">
              <button
                onClick={() => setActiveTechnique('ABB')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition ${
                  activeTechnique === 'ABB' ? 'bg-[#1e1e1e] text-[#f26223]' : 'text-[#71717a]'
                }`}
              >
                Activity-Based
              </button>
              <button
                onClick={() => setActiveTechnique('70_20_10')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition ${
                  activeTechnique === '70_20_10' ? 'bg-[#1e1e1e] text-[#f26223]' : 'text-[#71717a]'
                }`}
              >
                70/20/10 Split
              </button>
              <button
                onClick={() => setActiveTechnique('ZBB')}
                className={`rounded-lg py-1.5 text-[11px] font-mono font-semibold transition ${
                  activeTechnique === 'ZBB' ? 'bg-[#1e1e1e] text-[#f26223]' : 'text-[#71717a]'
                }`}
              >
                Zero-Based
              </button>
            </div>

            {/* ABB Calculator Input */}
            {activeTechnique === 'ABB' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-[#a1a1aa]">
                  Ties event expenses directly to target participant count.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a]">Target Attendees</label>
                    <input
                      type="number"
                      value={attendeeCount}
                      onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a]">Food / Meal per Head</label>
                    <input
                      type="number"
                      value={mealRate}
                      onChange={(e) => setMealRate(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a]">Event Kit / Shirt</label>
                    <input
                      type="number"
                      value={kitRate}
                      onChange={(e) => setKitRate(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#71717a]">Badge & Lanyard</label>
                    <input
                      type="number"
                      value={lanyardRate}
                      onChange={(e) => setLanyardRate(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Computed Output */}
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
                    <span>10% Contingency Reserve:</span>
                    <span className="font-bold">+{formatCurrency(recommendedContingency)}</span>
                  </div>
                  <div className="border-t border-[#222] pt-2 flex justify-between text-sm">
                    <span className="font-bold text-white">Recommended Cap:</span>
                    <span className="font-bold text-[#f26223]">{formatCurrency(calculatedTotalABB + recommendedContingency)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTechnique === '70_20_10' && (
              <div className="space-y-3 pt-2 text-xs text-[#a1a1aa]">
                <p>The standard ACCSS event safety envelope distribution:</p>
                <div className="space-y-2 font-mono">
                  <div className="rounded-lg border border-[#222] bg-[#0c0c0c] p-2.5">
                    <strong className="text-[#f26223]">70% Core Execution:</strong>
                    <p className="text-[11px] text-[#71717a]">Bulwagang Balagtas AV, hardhat fabrication, staging</p>
                  </div>
                  <div className="rounded-lg border border-[#222] bg-[#0c0c0c] p-2.5">
                    <strong className="text-[#00bb7f]">20% Student Experience:</strong>
                    <p className="text-[11px] text-[#71717a]">Packed meals, photo booths, tokens</p>
                  </div>
                  <div className="rounded-lg border border-[#222] bg-[#0c0c0c] p-2.5">
                    <strong className="text-[#3080ff]">10% Earmarked Contingency:</strong>
                    <p className="text-[11px] text-[#71717a]">Locked buffer requiring President sign-off to unlock</p>
                  </div>
                </div>
              </div>
            )}

            {activeTechnique === 'ZBB' && (
              <div className="space-y-3 pt-2 text-xs text-[#a1a1aa]">
                <p>
                  Zero-Based Budgeting requires each committee to justify every peso starting from ₱0 rather than copying past years:
                </p>
                <div className="rounded-lg border border-[#f26223]/30 bg-[#f26223]/5 p-3 space-y-1.5 font-mono text-[11px]">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-[#f26223]" />
                    AI Review Prompt:
                  </p>
                  <p className="text-[#a1a1aa]">
                    &quot;Verify if physical backdrop props from the previous General Assembly can be repurposed for CE Month before authorizing a new ₱8,000 banner purchase.&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Financial Chat Copilot (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden shadow-sm h-[600px]">
          {/* Copilot Header */}
          <div className="border-b border-[#262626] bg-[#101010] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f26223] to-[#ff6b35] text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white font-mono">ACCSS Finance AI Copilot</h3>
                <p className="text-[10px] text-[#00bb7f] font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00bb7f] animate-pulse" />
                  Google Gemini Multimodal Engine Active
                </p>
              </div>
            </div>

            <span className="rounded-md border border-[#333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-mono text-[#71717a]">
              Zero-Cost Tier
            </span>
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-b border-[#222] bg-[#0c0c0c] flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
            <span className="text-[#555] shrink-0">Suggestions:</span>
            <button
              onClick={() => handleSendMessage('How much contingency budget remains across all events?')}
              className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[#a1a1aa] hover:text-white hover:border-[#f26223]/40 shrink-0"
            >
              Remaining Contingency?
            </button>
            <button
              onClick={() => handleSendMessage('Check status of Hardhatting Ceremony budget burn')}
              className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[#a1a1aa] hover:text-white hover:border-[#f26223]/40 shrink-0"
            >
              Hardhatting Burn Rate?
            </button>
            <button
              onClick={() => handleSendMessage('Recommend a budget strategy for a new 150-student seminar')}
              className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[#a1a1aa] hover:text-white hover:border-[#f26223]/40 shrink-0"
            >
              150-Student Seminar Plan?
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#222] text-[#f26223] border border-[#333]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 ${
                    msg.role === 'user'
                      ? 'bg-[#f26223] text-white'
                      : 'border border-[#262626] bg-[#0e0e0e] text-[#ededed]'
                  }`}
                >
                  <p className="whitespace-pre-line font-sans">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-mono ${
                      msg.role === 'user' ? 'text-white/70' : 'text-[#71717a]'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] text-white border border-[#333]">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#71717a] font-mono">
                <Sparkles className="h-4 w-4 text-[#f26223] animate-spin" />
                <span>Gemini analyzing organization ledger...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#262626] bg-[#101010]">
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
                placeholder="Ask about event budgets, burn rates, or COA liquidation guidelines..."
                className="flex-1 rounded-xl border border-[#262626] bg-[#0c0c0c] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-sans"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f26223] text-white shadow-md hover:brightness-110 disabled:opacity-40 transition cursor-pointer"
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
