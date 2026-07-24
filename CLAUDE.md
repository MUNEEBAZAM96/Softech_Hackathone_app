# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BudgetIQ AI** — an AI-powered personal finance app built with React Native (Expo). It tracks income/expenses locally in SQLite, analyzes spending with an AI copilot (Google Gemini / OpenRouter via a local Node.js proxy), and provides smart budget alerts, savings goals, and daily financial tips.

## Commands

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Start the AI proxy server (required for Copilot, daily tips, receipt scan)
npm run server
```

There are no lint or test scripts configured. Both the Expo client and the proxy server must run simultaneously for full functionality.

## Environment Setup

Copy `.env.example` to `.env` and fill in:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth public key |
| `EXPO_PUBLIC_COPILOT_API_URL` | URL to the proxy server (`http://localhost:3001` for iOS sim; `http://10.0.2.2:3001` for Android emulator; `http://<LAN-IP>:3001` for physical device) |
| `COPILOT_PORT` | Port for the Express proxy (default `3001`) |
| `OPENROUTER_API_KEY` | AI API key (server-side only, never exposed to client) |

## Architecture

### Data Flow

All finance data lives **on-device in SQLite** (`budgetiq.db`). There is no remote finance backend.

1. Clerk authenticates the user and provides a `userId`.
2. `FinanceDataProvider` (`src/providers/FinanceDataProvider.tsx`) opens the DB, runs migrations, seeds default categories for new users, then loads all entities into a React Context.
3. Screens consume data via `useFinanceData()` hook.
4. On sign-out, the in-memory context is cleared; the next sign-in loads a fresh snapshot for that user.

### State Management

- **Finance data** (transactions, categories, goals, budgets): React Context via `FinanceDataProvider`. The `refresh()` function re-runs the full snapshot load from SQLite.
- **UI preferences** (theme, notification toggles, copilot chat history, receipt draft): Jotai atoms in `src/atoms.ts`, persisted to AsyncStorage.

### Database Layer (`src/db/`)

- `client.ts` — singleton DB connection
- `migrations.ts` — schema versioning (currently v3); always edit this when changing the schema
- `financeRepository.ts` — orchestrates all repo loads into one `FinanceSnapshot`
- Individual repos: `usersRepo`, `categoriesRepo`, `transactionsRepo`, `budgetsRepo`, `goalsRepo`
- All queries are scoped to `user_id`. Foreign keys are enforced (`PRAGMA foreign_keys = ON`). Category deletion is `RESTRICT` (transactions must be deleted first).

### AI Proxy Server (`server/index.js`)

Express server that keeps API keys server-side. Three endpoints:

- `POST /api/copilot` — Chat-based financial advice
- `POST /api/daily-tip` — Single daily tip
- `POST /api/receipt-parse` — OCR receipt image → transaction draft

The client builds a `copilotContextSnapshot` (a serialized summary of the user's finance data) in `src/services/copilotContextService.ts` and sends it with each request so the AI has full context without storing anything remotely.

### Navigation (Expo Router v6)

```
app/
├── (auth)/          # Public: signIn, signUp
└── (protected)/     # Clerk-guarded
    ├── (tabs)/      # Bottom tab navigator (custom animated tab bar)
    │   ├── index.tsx          # Dashboard
    │   ├── history.tsx
    │   ├── add.tsx
    │   ├── insights.tsx       # Copilot chat
    │   └── profile.tsx
    ├── budgets/
    ├── goals/
    ├── transaction/[id].tsx
    └── scan/review.tsx
```

The center tab button opens `QuickAddSheet` (a bottom sheet) instead of navigating.

### Services (`src/services/`)

Business logic is separated from UI here. Key services:

- `transactionService.ts` — summaries, sorting, month-over-month comparisons
- `budgetAlertService.ts` / `insightsService.ts` — generate local alerts/insights without AI
- `copilotApiService.ts` — calls the proxy server
- `savingsGoalService.ts` — pace tracking, deadline analysis

### Theme System

Design tokens live in `src/constants/theme.ts`. The `ThemeProvider` (`src/providers/ThemeProvider.tsx`) exposes `useTheme()` returning the resolved color palette based on light/dark/system preference stored in the `themeModeAtom`.
