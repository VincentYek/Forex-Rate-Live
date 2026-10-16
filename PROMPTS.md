# SingaForex - Conversation & Prompt History

This document records the prompt sequence and engineering steps taken during the development of the **SingaForex** application.

---

## Prompt 1: Initial Frontend Implementation

### User Request
> Build a Singapore-based exchange rate tool that provides real-time currency conversions for the SGD against global currencies
> 1. Build just the front end for now

### Summary of Actions Taken
- Established application architecture, typography (Plus Jakarta Sans display + JetBrains Mono tabular numbers), and financial dark-theme aesthetic (`#020617` / Slate 950 canvas).
- Built **SingaForex** frontend with modular, reactive components:
  1. **Top Bar Header (`src/components/Header.tsx`)**: Strict 3-zone contract with brand wordmark, single-line navigation links, Singapore Standard Time (SGT) timestamp, and a manual rate refresh action.
  2. **Bidirectional Currency Converter (`src/components/Converter.tsx`)**: Real-time two-way conversion between SGD and 36+ global and ASEAN currencies, quick Singapore amount presets (`S$50`, `S$100`, `S$500`, `S$1,000`, `S$5,000`, `S$10,000`), searchable currency modal, inverse rate calculation, and bank markup savings comparisons.
  3. **High-Density Live Rates Matrix (`src/components/RatesTable.tsx`)**: Bid/ask quotes, cost per 1 unit in SGD, 24h change %, intraday range bars, 7-day sparkline trend lines, sorting, and persistent custom watchlist pinning.
  4. **Interactive Historical Chart (`src/components/HistoricalChart.tsx`)**: Timeframe toggles (`24H`, `7D`, `1M`, `3M`, `1Y`, `5Y`), SVG area curve, interactive hover crosshair with date/rate tooltip, and Monetary Authority of Singapore (MAS) S$NEER monetary policy framework explanation.
  5. **Singapore Spreads Comparison (`src/components/SingaporeSpreads.tsx`)**: Wholesale interbank spot rate vs. Singapore cash money changers (**The Arcade @ Raffles Place**, **Mustafa Centre**), multi-currency cards (**YouTrip**, **Revolut**), and Singapore retail banks (**DBS/POSB**, **OCBC**, **UOB**).
  6. **Travel Cash & Customs GST Relief Planner (`src/components/TravelPlanner.tsx`)**: Budget calculator for frequent Singapore travel destinations (JB, Tokyo, Bangkok, Bali, London, etc.), cash vs. card allocation recommendations, and Singapore Customs GST import relief rules (`S$100` for <48h vs. `S$500` for ≥48h).
  7. **Target Rate Alerts (`src/components/RateAlertModal.tsx`)**: User-configured rate alerts with trigger detection and local storage persistence.
  8. **Footer (`src/components/Footer.tsx`)**: Regulatory disclosures, data freshness notice, and SGT timezone reference.

---

## Prompt 2: GitHub Repository Setup & Push

### User Request
> git push
> `<GITHUB_TOKEN>`

### Summary of Actions Taken
- Initialized local Git repository on the `main` branch.
- Configured user metadata (`Vincent Yek` / `vincent.yek@gmail.com`).
- Identified destination repository via GitHub API: `VincentYek/Forex-Rate-Live`.
- Committed all initial codebase files (commit `c1a3539`).
- Pushed commit to remote repository at `https://github.com/VincentYek/Forex-Rate-Live.git`.
- Sanitized local Git remote URL so credentials are not stored in plaintext on disk.

---

## Prompt 3: Serverless MAS API Integration

### User Request
> 1. Add a serverless API connection that pulls live data from MAS API catalogie using the following endpoint:
> GET https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily?end_of_day=2026-10-14
> KeyId: <MAS_KEY_ID>
>
> 2. Store this in /api folder at the project root level not the src folder
> 3. Include a /health.ts and /exchangerates.ts within the same subfolder
> 4. Do not hardcode any API key

### Summary of Actions Taken
- Created `/api` directory at the project root level (outside `/src`).
- Implemented `/api/exchangerates.ts`:
  - Connects to the MAS API Catalogue endpoint: `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily`.
  - Injects `KeyId: process.env.MAS_KEY_ID || process.env.MAS_API_KEY_ID` into headers without hardcoding any keys.
  - Supports query parameter `?end_of_day=YYYY-MM-DD` (auto-computing latest Singapore business day when omitted).
  - Normalizes MAS statistical bulletin currency units (converting per-unit and per-100-unit quotations into standard rates per 1 SGD).
  - Handles diagnostic 401 error responses gracefully if `MAS_KEY_ID` is unconfigured.
- Implemented `/api/health.ts`:
  - Returns service status, uptime, Singapore time, and MAS configuration flag.
- Created `server.ts` entry point running Express with `/api` routes and mounting Vite middlewares in development.
- Updated `package.json` scripts (`"dev": "tsx server.ts"`, `"start": "tsx server.ts"`).
- Updated `.env.example` to document `MAS_KEY_ID="YOUR_MAS_KEY_ID_HERE"`.
- Connected frontend `src/services/exchangeRateService.ts` to query `/api/exchangerates` first, with graceful fallback.
- Verified endpoints locally (`/api/health` and `/api/exchangerates`).
- Committed and pushed changes to GitHub (commit `73cf9d1`).

---

## Prompt 4: Export Chat History

### User Request
> export this chat as .md file as PROMPTS.md

### Summary of Actions Taken
- Created `PROMPTS.md` containing the complete record of requests, technical designs, architecture decisions, and implementation summaries.
