'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PieChart,
  PlusCircle,
  ArrowLeftRight,
  History,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Sparkles,
  Layers,
  Edit3,
  X,
  Info,
  DollarSign,
  ArrowRight,
  Sliders,
  FileText,
} from 'lucide-react';
import { BudgetTechnique, EventBudget } from '@/types/finance';

export default function MasterBudgetPage() {
  const {
    currentUser,
    events,
    transactions,
    fiscalYear,
    reallocations,
    masterBudgetCap,
    totalAllocated,
    unallocatedReserve,
    totalContingencyBuffer,
    totalSpent,
    remainingBalance,
    updateFiscalYearCap,
    createEventBudget,
    reallocateEnvelopeFunds,
  } = useFinance();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reallocateModalOpen, setReallocateModalOpen] = useState(false);
  const [reallocHistoryModalOpen, setReallocHistoryModalOpen] = useState(false);
  const [editCapModalOpen, setEditCapModalOpen] = useState(false);

  // Form states: Create Event
  const [newEventName, setNewEventName] = useState('');
  const [newEventPurpose, setNewEventPurpose] = useState('');
  const [newEventTechnique, setNewEventTechnique] = useState<BudgetTechnique>('ACTIVITY_BASED');
  const [newEventTotal, setNewEventTotal] = useState('');
  const [newEventContingencyPct, setNewEventContingencyPct] = useState('10');
  const [newEventProjectHead, setNewEventProjectHead] = useState('');
  const [newEventCategories, setNewEventCategories] = useState<Array<{ name: string; amount: string }>>([
    { name: 'Core Logistics & Venue', amount: '' },
    { name: 'Collaterals & Materials', amount: '' },
    { name: 'Food & Refreshments', amount: '' },
  ]);

  // Form states: Reallocation
  const [reallocEventId, setReallocEventId] = useState<string>(events[0]?.id || '');
  const [reallocSourceId, setReallocSourceId] = useState<string>('CONTINGENCY');
  const [reallocTargetId, setReallocTargetId] = useState<string>('');
  const [reallocAmount, setReallocAmount] = useState('');
  const [reallocReason, setReallocReason] = useState('');
  const [reallocError, setReallocError] = useState('');
  const [reallocSuccess, setReallocSuccess] = useState('');

  // Form states: Edit Cap
  const [newCapInput, setNewCapInput] = useState(masterBudgetCap.toString());

  // Calculations for Macro Visual Progress Bar
  const cap = masterBudgetCap > 0 ? masterBudgetCap : 1;
  const spentPct = Math.min(100, Math.round((totalSpent / cap) * 100));
  const allocatedUnspent = Math.max(0, totalAllocated - totalSpent);
  const allocatedUnspentPct = Math.min(100 - spentPct, Math.round((allocatedUnspent / cap) * 100));
  const reservePct = Math.max(0, 100 - spentPct - allocatedUnspentPct);

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.project_head_name && evt.project_head_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTechnique = selectedTechnique === 'ALL' || evt.technique === selectedTechnique;
    const matchesStatus = selectedStatus === 'ALL' || evt.status === selectedStatus;

    return matchesSearch && matchesTechnique && matchesStatus;
  });

  // Selected event for reallocation modal
  const activeReallocEvent = events.find((e) => e.id === reallocEventId) || events[0];

  // Helper to open reallocation modal targeting specific event
  const openReallocationForEvent = (eventId: string, targetCatId?: string) => {
    setReallocEventId(eventId);
    const targetEvt = events.find((e) => e.id === eventId);
    if (targetEvt && targetEvt.categories.length > 0) {
      setReallocTargetId(targetCatId || targetEvt.categories[0].id);
    }
    setReallocSourceId('CONTINGENCY');
    setReallocAmount('');
    setReallocReason('');
    setReallocError('');
    setReallocSuccess('');
    setReallocateModalOpen(true);
  };

  // Handle Event Creation
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(newEventTotal);
    if (isNaN(totalAmount) || totalAmount <= 0) return;

    const contingencyPct = parseFloat(newEventContingencyPct) || 0;
    const contingencyAmount = (totalAmount * contingencyPct) / 100;

    const categories = newEventCategories
      .filter((c) => c.name.trim() && parseFloat(c.amount) > 0)
      .map((c) => ({
        name: c.name.trim(),
        allocated_amount: parseFloat(c.amount),
      }));

    createEventBudget({
      name: newEventName,
      purpose: newEventPurpose,
      technique: newEventTechnique,
      total_allocated: totalAmount,
      contingency_buffer: contingencyAmount,
      project_head_name: newEventProjectHead.trim() || undefined,
      categories,
    });

    setCreateModalOpen(false);
    // Reset form
    setNewEventName('');
    setNewEventPurpose('');
    setNewEventTotal('');
    setNewEventProjectHead('');
    setNewEventCategories([
      { name: 'Core Logistics & Venue', amount: '' },
      { name: 'Collaterals & Materials', amount: '' },
      { name: 'Food & Refreshments', amount: '' },
    ]);
  };

  // Handle Reallocation
  const handleExecuteReallocation = (e: React.FormEvent) => {
    e.preventDefault();
    setReallocError('');
    setReallocSuccess('');

    const amt = parseFloat(reallocAmount);
    if (isNaN(amt) || amt <= 0) {
      setReallocError('Please enter a valid amount to reallocate.');
      return;
    }

    if (!reallocTargetId) {
      setReallocError('Please select a destination envelope.');
      return;
    }

    if (!reallocReason.trim()) {
      setReallocError('Please state the justification or reason for this reallocation.');
      return;
    }

    const res = reallocateEnvelopeFunds(
      reallocEventId,
      reallocSourceId,
      reallocTargetId,
      amt,
      reallocReason
    );

    if (!res.success) {
      setReallocError(res.error || 'Reallocation failed.');
    } else {
      setReallocSuccess('Reallocation completed successfully and recorded into audit ledger!');
      setTimeout(() => {
        setReallocateModalOpen(false);
        setReallocSuccess('');
      }, 1000);
    }
  };

  // Handle Cap Update
  const handleSaveCap = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newCapInput);
    if (!isNaN(val) && val > 0) {
      updateFiscalYearCap(val);
      setEditCapModalOpen(false);
    }
  };

  // Helper for Category Builder
  const handleAddCategoryRow = () => {
    setNewEventCategories([...newEventCategories, { name: '', amount: '' }]);
  };

  const handleUpdateCategoryRow = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...newEventCategories];
    updated[index][field] = value;
    setNewEventCategories(updated);
  };

  const handleRemoveCategoryRow = (index: number) => {
    setNewEventCategories(newEventCategories.filter((_, i) => i !== index));
  };

  // Category Total Validation in New Event Modal
  const categoriesSum = newEventCategories.reduce(
    (sum, c) => sum + (parseFloat(c.amount) || 0),
    0
  );
  const targetTotal = parseFloat(newEventTotal) || 0;
  const contingencyVal = (targetTotal * (parseFloat(newEventContingencyPct) || 0)) / 100;
  const totalAllocatedPlan = categoriesSum + contingencyVal;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#f26223]" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#f26223]">
              Fiscal Governance & Budget Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
            <PieChart className="h-7 w-7 text-[#f26223]" />
            Master Budget & Event Envelopes
          </h1>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 font-sans">
            Centralized fiscal cap monitoring, activity-based envelope tracking, locked contingency buffers, and audit-logged reallocations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff6b35] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#f26223]/25 transition hover:brightness-110"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Event Budget</span>
          </button>

          <button
            onClick={() => {
              if (events.length > 0) openReallocationForEvent(events[0].id);
            }}
            className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-white transition hover:border-[#f26223]/50"
          >
            <ArrowLeftRight className="h-4 w-4 text-[#f26223]" />
            <span>Reallocate Funds</span>
          </button>

          <button
            onClick={() => setReallocHistoryModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-[#333] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-white transition hover:border-[#f26223]/50"
          >
            <History className="h-4 w-4 text-[#71717a]" />
            <span>Reallocation Log ({reallocations.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: MASTER FISCAL YEAR OVERVIEW */}
      <div className="rounded-2xl border border-[#262626] bg-[#121212] p-6 space-y-6">
        {/* Fiscal Year Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f26223]/15 text-[#f26223] border border-[#f26223]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">{fiscalYear.label} Master Fiscal Plan</h2>
                <span className="rounded-full bg-[#00bb7f]/15 px-2 py-0.5 text-[10px] font-semibold text-[#00bb7f] border border-[#00bb7f]/30">
                  Active Term
                </span>
              </div>
              <p className="text-xs text-[#71717a] font-sans">
                Official Fiscal Cycle: {formatDate(fiscalYear.start_date)} &mdash; {formatDate(fiscalYear.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setNewCapInput(masterBudgetCap.toString());
                setEditCapModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-mono text-[#a1a1aa] hover:text-white hover:border-[#555] transition"
            >
              <Edit3 className="h-3 w-3 text-[#f26223]" />
              <span>Adjust Fiscal Cap</span>
            </button>
          </div>
        </div>

        {/* 4 Macro KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Master Annual Cap */}
          <div className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-1 font-mono relative overflow-hidden">
            <div className="flex items-center justify-between text-[#71717a] text-xs">
              <span>Master Budget Ceiling</span>
              <DollarSign className="h-4 w-4 text-[#f26223]" />
            </div>
            <div className="text-2xl font-bold text-white pt-1">
              {formatCurrency(masterBudgetCap)}
            </div>
            <p className="text-[11px] text-[#71717a] font-sans">
              Executive Board approved annual ceiling
            </p>
          </div>

          {/* Card 2: Committed to Events */}
          <div className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[#71717a] text-xs">
              <span>Committed to Events</span>
              <Layers className="h-4 w-4 text-[#3080ff]" />
            </div>
            <div className="text-2xl font-bold text-[#3080ff] pt-1">
              {formatCurrency(totalAllocated)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#a1a1aa] font-sans">{events.length} Department Initiatives</span>
              <span className="font-bold text-[#3080ff]">{Math.round((totalAllocated / cap) * 100)}% of Cap</span>
            </div>
          </div>

          {/* Card 3: Unallocated Strategic Org Reserve */}
          <div className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[#71717a] text-xs">
              <span>Unallocated Org Reserve</span>
              <ShieldCheck className="h-4 w-4 text-[#00bb7f]" />
            </div>
            <div className="text-2xl font-bold text-[#00bb7f] pt-1">
              {formatCurrency(unallocatedReserve)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#a1a1aa] font-sans">Available for new events</span>
              <span className="font-bold text-[#00bb7f]">{Math.round((unallocatedReserve / cap) * 100)}% Reserve</span>
            </div>
          </div>

          {/* Card 4: Total Disbursed / Spent */}
          <div className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-1 font-mono">
            <div className="flex items-center justify-between text-[#71717a] text-xs">
              <span>Actual Disbursed & Spent</span>
              <TrendingUp className="h-4 w-4 text-[#fb2c36]" />
            </div>
            <div className="text-2xl font-bold text-[#fb2c36] pt-1">
              {formatCurrency(totalSpent)}
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#a1a1aa] font-sans">Liquid Runway:</span>
              <span className="font-bold text-white">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Macro Progress Visualization Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#a1a1aa] font-sans">Macro Capital Distribution:</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#fb2c36]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#fb2c36]" />
                Spent ({spentPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#3080ff]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3080ff]" />
                Committed Active ({allocatedUnspentPct}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#00bb7f]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00bb7f]" />
                Unallocated Reserve ({reservePct}%)
              </span>
            </div>
          </div>

          {/* Segmented Bar */}
          <div className="h-3 w-full rounded-full bg-[#222] overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${spentPct}%` }}
              className="bg-gradient-to-r from-[#fb2c36] to-[#f26223] transition-all duration-500"
              title={`Disbursed: ${formatCurrency(totalSpent)} (${spentPct}%)`}
            />
            <div
              style={{ width: `${allocatedUnspentPct}%` }}
              className="bg-gradient-to-r from-[#3080ff] to-[#5099ff] transition-all duration-500"
              title={`Allocated Unspent: ${formatCurrency(allocatedUnspent)} (${allocatedUnspentPct}%)`}
            />
            <div
              style={{ width: `${reservePct}%` }}
              className="bg-gradient-to-r from-[#00bb7f] to-[#20df9e] transition-all duration-500"
              title={`Org Reserve: ${formatCurrency(unallocatedReserve)} (${reservePct}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono pt-1">
            <span>Locked Total Event Contingency Buffers: <strong className="text-white font-bold">{formatCurrency(totalContingencyBuffer)}</strong></span>
            <span>Total Org Capital: <strong className="text-white font-bold">{formatCurrency(masterBudgetCap)}</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 2: EVENT BUDGETS & ENVELOPE TRACKER */}
      <div className="space-y-4">
        {/* Controls, Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#f26223]" />
              Event Envelopes & Activity Tracking ({filteredEvents.length})
            </h2>
            <p className="text-xs text-[#a1a1aa] font-sans">
              Detailed category envelope allocations, burn rates, and threshold alerts for each event.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#71717a]" />
              <input
                type="text"
                placeholder="Search events or leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border border-[#2a2a2a] bg-[#141414] pl-8 pr-3 text-xs text-white placeholder-[#71717a] focus:border-[#f26223] focus:outline-none"
              />
            </div>

            {/* Technique Filter */}
            <div className="rounded-lg border border-[#2a2a2a] bg-[#141414] p-0.5 flex text-[11px] font-mono">
              {['ALL', 'ACTIVITY_BASED', 'ZERO_BASED', 'ENVELOPE_70_20_10'].map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTechnique(tech)}
                  className={`rounded px-2 py-1 transition ${
                    selectedTechnique === tech
                      ? 'bg-[#222] text-[#f26223] font-bold'
                      : 'text-[#71717a] hover:text-white'
                  }`}
                >
                  {tech === 'ALL' ? 'All Techniques' : tech === 'ACTIVITY_BASED' ? 'ABB' : tech === 'ZERO_BASED' ? 'ZBB' : '70/20/10'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-[#2a2a2a] bg-[#141414] px-2 text-xs text-[#a1a1aa] font-mono focus:border-[#f26223] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNING">Planning</option>
            </select>
          </div>
        </div>

        {/* Event List Cards */}
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-12 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-[#f26223] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-white font-mono">No matching event budgets found</h3>
            <p className="text-xs text-[#71717a] max-w-sm mx-auto font-sans">
              Try adjusting your search query or filter tags, or create a new event budget using the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt) => {
              const burnPct = evt.total_allocated > 0 ? Math.round((evt.spent_amount / evt.total_allocated) * 100) : 0;
              const remaining = evt.total_allocated - evt.spent_amount;
              const isExpanded = expandedEventId === evt.id || expandedEventId === null;

              // Health Status Color
              let healthColor = 'text-[#00bb7f]';
              let healthBg = 'bg-[#00bb7f]/10 border-[#00bb7f]/30';
              let healthLabel = 'Healthy Burn';
              if (burnPct >= 100) {
                healthColor = 'text-[#fb2c36]';
                healthBg = 'bg-[#fb2c36]/10 border-[#fb2c36]/30';
                healthLabel = 'Budget Cap Exceeded';
              } else if (burnPct >= 90) {
                healthColor = 'text-[#fb2c36]';
                healthBg = 'bg-[#fb2c36]/10 border-[#fb2c36]/30';
                healthLabel = 'Critical Burn (>90%)';
              } else if (burnPct >= 70) {
                healthColor = 'text-[#f59e0b]';
                healthBg = 'bg-[#f59e0b]/10 border-[#f59e0b]/30';
                healthLabel = 'Caution (70-90%)';
              }

              return (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-[#262626] bg-[#141414] transition hover:border-[#383838] overflow-hidden"
                >
                  {/* Event Card Header */}
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Status Badge */}
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono border ${
                              evt.status === 'ACTIVE'
                                ? 'bg-[#00bb7f]/15 text-[#00bb7f] border-[#00bb7f]/30'
                                : evt.status === 'COMPLETED'
                                ? 'bg-[#71717a]/15 text-[#a1a1aa] border-[#71717a]/30'
                                : 'bg-[#3080ff]/15 text-[#3080ff] border-[#3080ff]/30'
                            }`}
                          >
                            {evt.status}
                          </span>

                          {/* Technique Badge */}
                          <span className="rounded bg-[#1e1e1e] px-2 py-0.5 text-[10px] font-mono text-[#a1a1aa] border border-[#2a2a2a]">
                            Technique: {evt.technique.replace(/_/g, ' ')}
                          </span>

                          {/* Health status badge */}
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono border ${healthBg} ${healthColor}`}>
                            {healthLabel} ({burnPct}%)
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white font-mono">{evt.name}</h3>
                        <p className="text-xs text-[#a1a1aa] font-sans mt-0.5 max-w-2xl">{evt.purpose}</p>
                      </div>

                      {/* Quick Actions for this event */}
                      <div className="flex items-center gap-2 pt-2 lg:pt-0">
                        <button
                          onClick={() => openReallocationForEvent(evt.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1c1c1c] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#f26223]/50 transition"
                          title="Reallocate between envelopes of this event"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5 text-[#f26223]" />
                          <span>Reallocate</span>
                        </button>

                        <Link
                          href={`/dashboard/expenses/new`}
                          className="flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#1c1c1c] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#f26223]/50 transition"
                        >
                          <PlusCircle className="h-3.5 w-3.5 text-[#00bb7f]" />
                          <span>New Voucher</span>
                        </Link>

                        <button
                          onClick={() => setExpandedEventId(expandedEventId === evt.id ? '' : evt.id)}
                          className="flex items-center gap-1 rounded-xl border border-[#262626] bg-[#181818] px-2.5 py-1.5 text-xs text-[#a1a1aa] hover:text-white transition"
                        >
                          {expandedEventId === evt.id ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              <span className="text-[11px] font-mono">Hide Envelopes</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              <span className="text-[11px] font-mono">Envelopes ({evt.categories.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-1">
                      <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3">
                        <span className="text-[#71717a] text-[10px] uppercase tracking-wider block">Total Allocation</span>
                        <span className="text-base font-bold text-white mt-0.5 block">{formatCurrency(evt.total_allocated)}</span>
                        <span className="text-[10px] text-[#71717a] font-sans">
                          Lead: {evt.project_head_name || 'Assigned Lead'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3">
                        <span className="text-[#71717a] text-[10px] uppercase tracking-wider block">Total Spent / Burned</span>
                        <span className="text-base font-bold text-[#fb2c36] mt-0.5 block">{formatCurrency(evt.spent_amount)}</span>
                        <span className="text-[10px] text-[#71717a] font-sans">
                          {burnPct}% of Event Budget
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3">
                        <span className="text-[#71717a] text-[10px] uppercase tracking-wider block">Remaining Balance</span>
                        <span className={`text-base font-bold mt-0.5 block ${remaining >= 0 ? 'text-[#00bb7f]' : 'text-[#fb2c36]'}`}>
                          {formatCurrency(remaining)}
                        </span>
                        <span className="text-[10px] text-[#71717a] font-sans">
                          Available Liquid Runway
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3">
                        <span className="text-[#71717a] text-[10px] uppercase tracking-wider block">Locked Contingency</span>
                        <span className="text-base font-bold text-[#f26223] mt-0.5 block">{formatCurrency(evt.contingency_buffer)}</span>
                        <span className="text-[10px] text-[#71717a] font-sans">
                          Safety margin buffer
                        </span>
                      </div>
                    </div>

                    {/* Visual Burn Meter */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-[#71717a]">Budget Burn Rate Progress:</span>
                        <span className={`font-bold ${healthColor}`}>
                          {formatCurrency(evt.spent_amount)} / {formatCurrency(evt.total_allocated)} ({burnPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#222] overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, burnPct)}%` }}
                          className={`h-full transition-all duration-500 ${
                            burnPct > 90
                              ? 'bg-[#fb2c36]'
                              : burnPct > 70
                              ? 'bg-[#f59e0b]'
                              : 'bg-[#00bb7f]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expandable Category Envelopes Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-[#222] bg-[#0f0f0f] p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-[#f26223]" />
                          Individual Category Envelopes ({evt.categories.length})
                        </h4>
                        <span className="text-[11px] text-[#71717a] font-mono">
                          Locked contingency reserve: <strong>{formatCurrency(evt.contingency_buffer)}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {evt.categories.map((cat) => {
                          const catBurn = cat.allocated_amount > 0 ? Math.round((cat.spent_amount / cat.allocated_amount) * 100) : 0;
                          const catRem = cat.allocated_amount - cat.spent_amount;
                          const isCatOver = catRem < 0;

                          return (
                            <div
                              key={cat.id}
                              className={`rounded-xl border p-3.5 space-y-2.5 transition ${
                                isCatOver
                                  ? 'border-[#fb2c36]/40 bg-[#fb2c36]/5'
                                  : catBurn >= 90
                                  ? 'border-[#f59e0b]/40 bg-[#f59e0b]/5'
                                  : 'border-[#262626] bg-[#141414]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="text-xs font-bold text-white font-mono">{cat.name}</h5>
                                  <span className="text-[10px] text-[#71717a] font-mono">
                                    Envelope ID: {cat.id}
                                  </span>
                                </div>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${
                                    isCatOver
                                      ? 'bg-[#fb2c36]/20 text-[#fb2c36] border-[#fb2c36]/30'
                                      : catBurn >= 90
                                      ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                                      : 'bg-[#1e1e1e] text-[#a1a1aa] border-[#333]'
                                  }`}
                                >
                                  {catBurn}% Spent
                                </span>
                              </div>

                              {/* Numbers */}
                              <div className="flex items-center justify-between text-xs font-mono pt-1">
                                <div>
                                  <span className="text-[10px] text-[#71717a] block">Allocated</span>
                                  <span className="font-semibold text-white">{formatCurrency(cat.allocated_amount)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#71717a] block">Spent</span>
                                  <span className="font-semibold text-[#fb2c36]">{formatCurrency(cat.spent_amount)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-[#71717a] block">Remaining</span>
                                  <span className={`font-bold ${isCatOver ? 'text-[#fb2c36]' : 'text-[#00bb7f]'}`}>
                                    {formatCurrency(catRem)}
                                  </span>
                                </div>
                              </div>

                              {/* Progress */}
                              <div className="h-1.5 w-full rounded-full bg-[#222] overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(100, catBurn)}%` }}
                                  className={`h-full ${
                                    isCatOver
                                      ? 'bg-[#fb2c36]'
                                      : catBurn >= 90
                                      ? 'bg-[#f59e0b]'
                                      : 'bg-[#00bb7f]'
                                  }`}
                                />
                              </div>

                              {/* Reallocate Quick Button */}
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => openReallocationForEvent(evt.id, cat.id)}
                                  className="text-[10px] font-mono text-[#f26223] hover:underline flex items-center gap-1"
                                >
                                  <ArrowLeftRight className="h-3 w-3" />
                                  <span>Adjust / Reallocate</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW EVENT BUDGET                                          */}
      {/* ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#333] bg-[#121212] p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f26223]/20 text-[#f26223]">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Create New Event Budget Plan</h3>
                  <p className="text-xs text-[#71717a] font-sans">
                    Register a new activity-based or zero-based event budget under {fiscalYear.label}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-[#71717a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {/* Event Name & Lead */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CpE General Assembly 2026"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">Committee Lead / Director</label>
                  <input
                    type="text"
                    placeholder="e.g. Maria Santos (A.Y. 2025-2026)"
                    value={newEventProjectHead}
                    onChange={(e) => setNewEventProjectHead(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-[#ededed]">Event Purpose & Scope *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the objective, expected attendees, and departmental justification..."
                  value={newEventPurpose}
                  onChange={(e) => setNewEventPurpose(e.target.value)}
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                />
              </div>

              {/* Technique & Total Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">Budget Technique</label>
                  <select
                    value={newEventTechnique}
                    onChange={(e) => setNewEventTechnique(e.target.value as BudgetTechnique)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3 py-2.5 text-xs text-white focus:border-[#f26223] focus:outline-none font-mono"
                  >
                    <option value="ACTIVITY_BASED">Activity-Based (ABB)</option>
                    <option value="ZERO_BASED">Zero-Based (ZBB)</option>
                    <option value="ENVELOPE_70_20_10">70/20/10 Rule</option>
                    <option value="HISTORICAL_BENCHMARK">Historical Benchmark</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">Total Allocated Cap (₱) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={newEventTotal}
                    onChange={(e) => setNewEventTotal(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">Contingency Buffer (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="10"
                    value={newEventContingencyPct}
                    onChange={(e) => setNewEventContingencyPct(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Envelopes Builder */}
              <div className="rounded-xl border border-[#262626] bg-[#0c0c0c] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-[#f26223]" />
                    Initial Category Envelopes Breakdown
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCategoryRow}
                    className="text-[11px] font-mono text-[#f26223] hover:underline"
                  >
                    + Add Envelope
                  </button>
                </div>

                <div className="space-y-2">
                  {newEventCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Category Name (e.g. Sound & Lighting)"
                        value={cat.name}
                        onChange={(e) => handleUpdateCategoryRow(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Amount (₱)"
                        value={cat.amount}
                        onChange={(e) => handleUpdateCategoryRow(idx, 'amount', e.target.value)}
                        className="w-28 rounded-lg border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs text-white font-mono placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                      />
                      {newEventCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategoryRow(idx)}
                          className="rounded p-1 text-[#71717a] hover:text-[#fb2c36]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Live Balance Checker */}
                <div className="pt-2 border-t border-[#1e1e1e] flex flex-wrap items-center justify-between text-[11px] font-mono">
                  <span className="text-[#71717a]">
                    Envelopes (₱{categoriesSum.toLocaleString()}) + Contingency (₱{contingencyVal.toLocaleString()}) =
                  </span>
                  <span className={totalAllocatedPlan > targetTotal && targetTotal > 0 ? 'text-[#fb2c36] font-bold' : 'text-[#00bb7f] font-bold'}>
                    Total Planned: {formatCurrency(totalAllocatedPlan)} / {formatCurrency(targetTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-[#333] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff6b35] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#f26223]/20 hover:brightness-110"
                >
                  Create & Activate Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REALLOCATE ENVELOPE FUNDS                                        */}
      {/* ========================================================================= */}
      {reallocateModalOpen && activeReallocEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#333] bg-[#121212] p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f26223]/20 text-[#f26223]">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Reallocate Envelope Funds</h3>
                  <p className="text-xs text-[#71717a] font-sans">
                    Shift funds between envelopes or release emergency contingency with an immutable audit justification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReallocateModalOpen(false)}
                className="rounded-lg p-1 text-[#71717a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReallocation} className="space-y-4">
              {/* Event Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-[#ededed]">Target Event</label>
                <select
                  value={reallocEventId}
                  onChange={(e) => {
                    setReallocEventId(e.target.value);
                    const selected = events.find((ev) => ev.id === e.target.value);
                    if (selected && selected.categories.length > 0) {
                      setReallocTargetId(selected.categories[0].id);
                    }
                  }}
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white focus:border-[#f26223] focus:outline-none font-mono"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} (Allocated: {formatCurrency(ev.total_allocated)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source & Target Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">From (Source Fund) *</label>
                  <select
                    value={reallocSourceId}
                    onChange={(e) => setReallocSourceId(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3 py-2.5 text-xs text-white focus:border-[#f26223] focus:outline-none font-mono"
                  >
                    <option value="CONTINGENCY">
                      [Locked Contingency Buffer] &mdash; {formatCurrency(activeReallocEvent.contingency_buffer)}
                    </option>
                    <option value="RESERVE">
                      [Master Org Reserve] &mdash; {formatCurrency(unallocatedReserve)}
                    </option>
                    {activeReallocEvent.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} (Avail: {formatCurrency(cat.allocated_amount - cat.spent_amount)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-[#ededed]">To (Recipient Envelope) *</label>
                  <select
                    value={reallocTargetId}
                    onChange={(e) => setReallocTargetId(e.target.value)}
                    className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3 py-2.5 text-xs text-white focus:border-[#f26223] focus:outline-none font-mono"
                  >
                    {activeReallocEvent.categories
                      .filter((c) => c.id !== reallocSourceId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} (Current: {formatCurrency(cat.allocated_amount)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Amount to Reallocate */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-[#ededed]">Reallocation Amount (₱) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="e.g. 2500"
                  value={reallocAmount}
                  onChange={(e) => setReallocAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                />
              </div>

              {/* Resolution / Justification Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-[#ededed]">Executive Resolution / Justification *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the reason (e.g. Additional AV equipment needed for Bulwagang Balagtas venue)..."
                  value={reallocReason}
                  onChange={(e) => setReallocReason(e.target.value)}
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                />
              </div>

              {/* Alerts */}
              {reallocError && (
                <div className="rounded-xl border border-[#fb2c36]/40 bg-[#fb2c36]/10 p-3 text-xs text-[#fb2c36] font-mono">
                  {reallocError}
                </div>
              )}
              {reallocSuccess && (
                <div className="rounded-xl border border-[#00bb7f]/40 bg-[#00bb7f]/10 p-3 text-xs text-[#00bb7f] font-mono">
                  {reallocSuccess}
                </div>
              )}

              {/* Officer Signature Meta */}
              <div className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3 text-[11px] font-mono text-[#71717a]">
                <span>Authorizing Officer: <strong className="text-white">{currentUser.incumbent_name}</strong> ({currentUser.position_title})</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setReallocateModalOpen(false)}
                  className="rounded-xl border border-[#333] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff6b35] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-[#f26223]/20 hover:brightness-110"
                >
                  Execute Reallocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADJUST MASTER FISCAL CAP                                         */}
      {/* ========================================================================= */}
      {editCapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#333] bg-[#121212] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-bold text-white font-mono">Adjust Master Budget Cap</h3>
              <button
                onClick={() => setEditCapModalOpen(false)}
                className="rounded-lg p-1 text-[#71717a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCap} className="space-y-4">
              <p className="text-xs text-[#a1a1aa] font-sans">
                Set the annual fiscal ceiling for <strong className="text-white">{fiscalYear.label}</strong>. Currently committed: <strong className="text-white">{formatCurrency(totalAllocated)}</strong> across {events.length} events.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-medium text-[#ededed]">New Fiscal Year Cap (₱)</label>
                <input
                  type="number"
                  required
                  min={totalAllocated}
                  step="1000"
                  value={newCapInput}
                  onChange={(e) => setNewCapInput(e.target.value)}
                  className="w-full rounded-xl border border-[#262626] bg-[#171717] px-3.5 py-2.5 text-xs text-white font-mono placeholder-[#555] focus:border-[#f26223] focus:outline-none"
                />
                <span className="text-[10px] text-[#71717a] font-mono block">
                  Must be at least ₱{totalAllocated.toLocaleString()} to cover active event commitments.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditCapModalOpen(false)}
                  className="rounded-xl border border-[#333] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#f26223] px-4 py-2 text-xs font-bold text-white hover:bg-[#ff6b35]"
                >
                  Save New Cap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REALLOCATION AUDIT LOG                                           */}
      {/* ========================================================================= */}
      {reallocHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-[#333] bg-[#121212] p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f26223]/20 text-[#f26223]">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">Inter-Envelope Reallocation Ledger</h3>
                  <p className="text-xs text-[#71717a] font-sans">
                    Complete historical record of all budget adjustments, contingency unlocks, and category shifts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReallocHistoryModalOpen(false)}
                className="rounded-lg p-1 text-[#71717a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reallocations.length === 0 ? (
              <div className="rounded-xl border border-[#262626] bg-[#141414] p-8 text-center text-xs text-[#71717a] font-mono">
                No budget reallocations recorded yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {reallocations.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#f26223] font-bold">{r.event_name}</span>
                      <span className="text-[#71717a] text-[11px]">{formatDate(r.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-white font-semibold">
                      <span className="text-[#fb2c36]">{r.source_category_name}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#71717a]" />
                      <span className="text-[#00bb7f]">{r.target_category_name}</span>
                      <span className="ml-auto text-base font-bold text-[#f26223]">
                        {formatCurrency(r.amount)}
                      </span>
                    </div>

                    <p className="text-[#a1a1aa] font-sans text-xs bg-[#111] p-2 rounded-lg border border-[#222]">
                      &ldquo;{r.reason}&rdquo;
                    </p>

                    <div className="flex justify-between text-[11px] text-[#71717a] pt-1">
                      <span>Authorized By: <strong className="text-white">{r.authorized_by_name}</strong> ({r.authorized_by_position})</span>
                      <span>Audit Ref: {r.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#262626]">
              <button
                onClick={() => setReallocHistoryModalOpen(false)}
                className="rounded-xl border border-[#333] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a1a1a]"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
