'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { INITIAL_PROFILES } from '@/lib/mock-data';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'OFFICER' | 'MEMBER'>('OFFICER');
  const [email, setEmail] = useState('president@pupaccess.org');
  const [password, setPassword] = useState('access2026!');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Identify profile or default to selected
    let selectedProfile = INITIAL_PROFILES.president;
    if (email.includes('treasurer')) selectedProfile = INITIAL_PROFILES.treasurer;
    else if (email.includes('projecthead')) selectedProfile = INITIAL_PROFILES.projectHead;
    else if (email.includes('pup.edu.ph') || tab === 'MEMBER') selectedProfile = INITIAL_PROFILES.studentMember;

    localStorage.setItem('access_user', JSON.stringify(selectedProfile));

    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 600);
  };

  const handleQuickLogin = (roleKey: 'president' | 'treasurer' | 'projectHead' | 'studentMember') => {
    const profile = INITIAL_PROFILES[roleKey];
    localStorage.setItem('access_user', JSON.stringify(profile));
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 py-12 relative overflow-hidden">
      {/* Subtle ACCSS Orange Gradient Glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#f26223]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#f26223]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Organization Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f26223] to-[#ff6b35] text-white shadow-xl shadow-[#f26223]/20 mb-4">
            <span className="font-mono text-3xl font-black">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2 font-mono">
            ACCESS <span className="text-[#f26223]">VAULT</span>
          </h1>
          <p className="text-xs text-[#a1a1aa] mt-1 font-sans">
            PUP Association of Concerned Computer Engineering Students for Service
          </p>

          {/* Internal-Only Scope Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#121212] px-3 py-1 text-[11px] text-[#71717a]">
            <Lock className="h-3 w-3 text-[#f26223]" />
            <span>Strictly Internal Organization-Only Platform</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-6 shadow-2xl backdrop-blur-xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#0c0c0c] p-1 border border-[#222] mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('OFFICER');
                setEmail('president@pupaccess.org');
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                tab === 'OFFICER'
                  ? 'bg-[#1e1e1e] text-white shadow border border-[#333]'
                  : 'text-[#71717a] hover:text-[#a1a1aa]'
              }`}
            >
              Executive & Officers
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('MEMBER');
                setEmail('student.member@pup.edu.ph');
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                tab === 'MEMBER'
                  ? 'bg-[#1e1e1e] text-white shadow border border-[#333]'
                  : 'text-[#71717a] hover:text-[#a1a1aa]'
              }`}
            >
              ACCSS Member SSO
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                {tab === 'OFFICER' ? 'Position Account Email' : 'PUP Institutional Email (@pup.edu.ph)'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#71717a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={tab === 'OFFICER' ? 'e.g. treasurer@pupaccess.org' : 'username@pup.edu.ph'}
                  className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-10 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-mono"
                />
              </div>
            </div>

            {tab === 'OFFICER' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#a1a1aa]">Position Password</label>
                  <span className="text-[10px] text-[#71717a]">Annual handover rotation</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#71717a]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#262626] bg-[#0c0c0c] px-10 py-2.5 text-xs text-white placeholder-[#555] focus:border-[#f26223] focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f26223] to-[#ff6b35] py-2.5 text-xs font-bold text-white shadow-lg shadow-[#f26223]/25 transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Session...</span>
              ) : (
                <>
                  <span>{tab === 'OFFICER' ? 'Sign In to Officer Console' : 'Verify & Enter Member Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher for Testing */}
          <div className="mt-6 pt-5 border-t border-[#222]">
            <p className="text-[11px] font-semibold text-[#a1a1aa] mb-2 text-center uppercase tracking-wider">
              Quick Role Test Switcher
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('president')}
                className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-2.5 py-2 text-[11px] text-left text-white hover:border-[#f26223]/50 transition"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#f26223]" />
                <span className="truncate">President (Tier 3)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('treasurer')}
                className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-2.5 py-2 text-[11px] text-left text-white hover:border-[#f26223]/50 transition"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#00bb7f]" />
                <span className="truncate">Treasurer (Tier 2)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('projectHead')}
                className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-2.5 py-2 text-[11px] text-left text-white hover:border-[#f26223]/50 transition"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#3080ff]" />
                <span className="truncate">Project Head (Tier 1)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('studentMember')}
                className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-2.5 py-2 text-[11px] text-left text-white hover:border-[#f26223]/50 transition"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#a1a1aa]" />
                <span className="truncate">Member (Read-only)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-[11px] text-[#555] flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00bb7f]" />
          <span>Protected by AES-256-GCM Field Encryption & SHA-256 Ledger</span>
        </div>
      </div>
    </div>
  );
}
