# ACCESS Vault 🛡️

**Internal Finance & Budget Intelligence Platform**  
*PUP Association of Concerned Computer Engineering Students for Service (PUP ACCESS)*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/Access-Internal--Only-f26223?style=flat-square)](#)

---

## 📌 Project Overview

**ACCESS Vault** is a closed-loop internal finance management and budget tracking platform engineered specifically for **PUP ACCESS**. It automates expense tracking, multi-tier executive approval workflows, receipt verification, and audit logging while maintaining 100% internal transparency for active organization members.

### 🛡️ Closed-Loop Perimeter & Access Control
* **Zero Public Access**: The application operates behind an authentication gate. Unauthenticated visitors are automatically redirected to `/login`.
* **Search Engine Shielding**: Uses `X-Robots-Tag: noindex, nofollow` headers and anti-crawler policies (`robots.ts`) so financial figures are never indexed.
* **Verified Member Whitelist**: Login is restricted to active PUP ACCESS members and verified `@pup.edu.ph` institutional accounts.

---

## ✨ Key Features

* 🏛️ **3-Tier Executive Approval State Machine**:
  * **Tier 1 (Project Head)**: Event budget allocation & initial voucher endorsement.
  * **Tier 2 (Finance Officer / Treasurer)**: Math auditing, budget envelope checks & payout encryption.
  * **Tier 3 (President)**: Executive certification & final disbursement sign-off.
* 🔐 **Zero-Knowledge Field Encryption**:
  * Payee personal data, bank account details, and GCash numbers are encrypted at rest using native **AES-256-GCM**.
* 🔗 **Cryptographic SHA-256 Audit Ledger**:
  * President-certified transactions generate immutable SHA-256 block hashes chained to previous audit records.
* 🤖 **AI Receipt OCR & Anomaly Shield**:
  * Powered by Google Gemini to parse official receipts, auto-fill amounts, and prevent duplicate reimbursement claims.
* 📊 **Internal Transparency Portal**:
  * Active members can track real-time event budget allocations, category burn rates, and financial reports.
* 💸 **₱0 Lifetime Infrastructure**:
  * Engineered to run 100% free on Vercel Hobby, Supabase Free Tier, and Google AI Studio.

---

## 🛠️ Tech Stack

* **Frontend Framework**: Next.js 16 (App Router), React 19, TypeScript
* **Styling & UI**: Tailwind CSS v4, Lucide Icons, ACCSS Visual Identity (`#f26223` Vibrant Orange, `#0a0a0a` Deep Slate)
* **Backend & Database**: Supabase PostgreSQL, Supabase Auth, Row-Level Security (RLS), Supabase Storage
* **Security & Cryptography**: Native Node.js `crypto` (AES-256-GCM & SHA-256)
* **Validation & Types**: Zod schema validation

---

## 📁 Repository Structure

```
finance_tracker/
├── docs/                        # Backend integration & architectural documentation
│   ├── BACKEND_INTEGRATION_WORKFLOW.md  # Supabase setup, encryption & step-by-step workflow
│   ├── DATABASE_SCHEMA.md               # PostgreSQL schema, enums & table definitions
│   └── API_ENDPOINTS_AND_CONTRACTS.md   # Server Actions, API contracts & cryptographic verifier
├── supabase/                    # Supabase backend migrations & RLS policies
│   └── migrations/              # PostgreSQL SQL migration scripts
├── ARCHITECTURE.md              # Full architectural & technical design document
├── README.md                    # Project documentation
├── src/
│   ├── lib/                 # Security, storage, & Supabase utilities
│   │   ├── security/        # AES-256-GCM encryption & SHA-256 hashing
│   │   ├── storage/         # WebP receipt compressor
│   │   └── supabase/        # Server & Client Supabase instances
│   └── types/               # TypeScript interfaces & database schemas
└── supabase/
    └── migrations/          # SQL database schema & RLS policies
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.x or higher
* **Package Manager**: `npm`, `pnpm`, or `bun`
* **Supabase Account**: Free Tier project

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cryptography (AES-256-GCM 32-byte secret key)
FIELD_ENCRYPTION_SECRET=your-32-character-secret-key-here

# Google AI Studio (Free Tier Gemini API)
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Database Migration
Apply the database schema and RLS policies located in [`supabase/migrations/20260910000000_init_access_finance.sql`](file:///d:/finance_tracker/supabase/migrations/20260910000000_init_access_finance.sql) to your Supabase project SQL Editor.

### 4. Install Dependencies & Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Documentation

For full architectural details, ER diagrams, approval state machine specifications, and database schema, see [ARCHITECTURE.md](file:///d:/finance_tracker/ARCHITECTURE.md).

---

## 🔒 Governance & License

Strictly internal platform for **PUP Association of Concerned Computer Engineering Students for Service (PUP ACCESS)**. Unauthorized copying, distribution, or external deployment is prohibited.
