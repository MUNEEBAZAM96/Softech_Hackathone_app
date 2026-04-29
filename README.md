# Softech_Hackathone_app
# 💰 BudgetIQ AI – Smart Finance Tracker (Hackathon Project)

# link Demo Vidio : https://lnkd.in/dVWRZ8d2

## Environment variables

Do **not** commit real API keys or tokens. Copy `.env.example` to `.env` and fill in values locally:

- **`GEMINI_API_KEY`** — Google Gemini API key (for the optional Copilot proxy server). Leave empty in `.env.example`; set only in your private `.env`.
- **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`** — from your Clerk dashboard (Expo public key).
- **`EXPO_PUBLIC_COPILOT_API_URL`** — base URL of the proxy (see comments in `.env.example` for simulator vs device).

### Local data (SQLite)

Finance data is stored on-device with **expo-sqlite** (local-first, survives app restarts):

- **DB file:** `budgetiq.db` — opened in `src/db/client.ts` with `PRAGMA foreign_keys = ON`.
- **Migrations:** `src/db/migrations.ts` — version via `PRAGMA user_version` (schema v3: same tables plus optional unique index on budgets per `user_id` + `month_key` + category).
- **Repositories:** `src/db/*Repo.ts` — all reads/writes go through these modules, not UI components. Every query is scoped with `WHERE user_id = ?` to the signed-in Clerk user.
- **Snapshot loader:** `src/db/financeRepository.ts` — `loadFinanceSnapshot(userId, options?)` opens the DB, migrates, optionally reassigns legacy `"local"` rows to the Clerk user once, ensures a `users` row exists, then loads categories, transactions, goals, and budgets.
- **Auth isolation:** Clerk `useAuth().userId` is the canonical SQLite `users.id`. Switching accounts on one device loads only that user’s rows; a brand-new Clerk user starts with an empty finance dataset (no seed categories).
- **App wiring:** `src/providers/FinanceDataProvider.tsx` loads after Clerk session is ready, clears state on user switch, and exposes `useFinanceData()` (including `userId`) and `refresh()`. Jotai is used only for UI prefs (theme, copilot draft, notification toggles, etc.), not for canonical finance rows.
- **First launch:** strict blank-slate mode — no categories, transactions, goals, or budgets are preloaded.
- **How to start:** create your first category from the category selector, then add your first transaction.
- **Dev reset:** uninstall the app, clear app storage, or use a fresh simulator/emulator to test first-launch behavior.
- **Optional privacy wipe on sign-out:** `src/db/privacyRepo.ts` — set `WIPE_LOCAL_FINANCE_DATA_ON_SIGNOUT` to `true` to delete the current user’s SQLite rows when signing out (default `false` so data remains for normal account switching).
- **Manual multi-user check:** Sign in as user A → add category/transaction → sign out → sign in as user B → lists should be empty → sign in as A again → prior data should return. Dev-only: `PRAGMA integrity_check` runs on DB open when `__DEV__` is true (`src/db/client.ts`).

---

**I am Ussing SDK 52 and all the Dependencies are according to the SDK 52**


## 🚀 Introduction

Welcome to **BudgetIQ AI**, an upgraded AI-powered personal finance application built using **React Native (Expo Router)** and **SQLite**.

This project transforms a traditional expense tracker into a **smart financial assistant** that not only stores transactions but also analyzes spending behavior using AI.

It combines:
- Local-first architecture (fast & offline)
- Real-time financial data processing
- AI-powered insights using Gemini
- Clean and modern mobile UI

---

## 💡 About the App

**BudgetIQ AI** helps users take control of their finances in a smarter way.

Unlike basic budget apps, BudgetIQ AI:

- Tracks income and expenses locally (SQLite)
- Provides real-time financial summaries
- Generates AI-based spending insights
- Helps users build better saving habits

👉 Instead of just showing numbers, the app explains your financial behavior.

---

## 🤖 AI-Powered Feature

The core enhancement of this project is AI integration using **Google Gemini API**.

The app analyzes user spending and generates insights like:

- “You are overspending on food this week.”
- “You can save 2000 PKR by reducing transport expenses.”
- “Your spending is 15% higher than last month.”

👉 This turns the app into a **personal financial advisor**

---

## ✨ Features

- 📊 Income & Expense Tracking (CRUD operations)
- 🗂️ Category-based transaction system
- 📈 Smart dashboard with summaries
- 🤖 AI-powered financial insights (Gemini API)
- 🎯 Savings goal tracking
- 🔔 Smart budget alerts
- ⚡ Offline-first performance with SQLite
- 📱 Clean and minimal UI design

---

## 🧠 Tech Stack

- **Frontend:** React Native (Expo Router)
- **Language:** TypeScript
- **Database:** SQLite (Local Storage)
- **AI Engine:** Google Gemini API
- **Architecture:** Local-first mobile app
- **UI:** React Native Components + Charts

---

## 🏗️ Architecture
    UI (Expo Router Screens)
↓
Data Processing Logic
↓
SQLite Database (Local Storage)
↓
AI Layer (Gemini API)
↓
UI Display (Dashboard + Insights)




---

## 📱 App Screens

### 🏠 Dashboard Screen
- Total balance
- Monthly income & expenses
- Category breakdown
- AI insight preview

---

### ➕ Add Transaction Screen
- Add income or expense
- Select category
- Save to SQLite instantly

---

### 🤖 AI Insights Screen
- Personalized financial insights
- Saving suggestions
- Spending analysis

---

### 📜 History Screen
- List of all transactions
- Filter by category/date

---

## ⚙️ How It Works

1. User adds income/expense  
2. Data is stored in SQLite  
3. Data is processed for analytics  
4. Financial summary is generated  
5. Data is sent to Gemini API  
6. AI returns insights  
7. Insights are displayed in UI  

---

## 🎯 Key Innovation

> Transforming a simple expense tracker into an intelligent AI-powered financial assistant.

BudgetIQ AI does not just track money—it helps users **understand and improve their financial habits**.

---

## 📦 Getting Started

Clone the repository:

```bash
git clone https://github.com/MUNEEBAZAM96/Softech_Hackathone_app


