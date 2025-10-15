<div align="center">
	<h1>Budget AI</h1>
	<p><strong>Monthly budgeting prototype with an AI-augmented Financial "Tip of the Day" expansion.</strong></p>
	<sub>Vite + React + TypeScript + Tailwind + Express (API) + MCP-ready AI expansion stub</sub>
</div>

---

## ✨ Features

- Add income & expense transactions with live running totals
- Derived ending balance (starting + income − expenses)
- Deterministic daily financial tip (locally computed)
- "Another Tip" randomizer (no duplicates in-session)
- AI "More" button: expands current tip into deeper structured guidance (summary, deeper dive, key points, action plan, sources)
- Local caching of expansions per tip to avoid redundant calls
- MCP (Model Context Protocol) integration **stub** ready: currently simulated; swap with real model/tool invocation
- Clean, component-driven Tailwind styling

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Front-end | React 18, TypeScript, Tailwind CSS, Vite |
| State | Local component state (future: Zustand) |
| Utilities | Custom calculation helpers (totals, ending balance) |
| AI Integration | Express API + MCP-ready stub (`server/mcpClient.ts`) |

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Configure Environment
Create a `.env` from the provided `.env.example` if you plan to swap the AI stub with a real model via MCP or vendor SDK:

```bash
cp .env.example .env
```

Variables you may use:

```
AI_MODEL=gpt-4o-mini
PORT=5055
```

### 3. Run Dev Servers

Front-end + API together:

```bash
npm run dev:full
```

Or separately:

```bash
npm run dev:api   # starts Express on :5055
npm run dev       # starts Vite on :5173 (proxy /api → :5055)
```

Open: http://localhost:5173

### 4. Use the AI Expansion
1. Reveal the daily tip
2. Enter an API key placeholder (any string for the stub)
3. Click "More" to fetch expanded structured content

## 🔌 MCP / Real Model Integration

The current implementation in `server/mcpClient.ts` returns a deterministic simulated expansion. To integrate a real model:

1. Connect to an MCP host (stdio / socket) and call a tool like `text.generate`.
2. Replace `expandTipViaMCP` logic to forward the prompt and parse structured JSON.
3. Ensure you sanitize and validate JSON output to match `AIExpandedTip`.
4. Optionally persist expansions (Redis / file / DB) to reduce inference cost.

### Example Prompt Structure (Simplified)
```
You are a concise financial educator.
Base Tip: <title>
Category: <category>
Content: <content>
Actionable: <optional actionable>
Return JSON: { summary, deeperDive, keyPoints[], actionPlan[], estimatedTime, sources[] }
Constraints: No personal financial advice; educational tone.
```

## 🗂 Project Structure

```
src/
	App.tsx                # Main UI
	components/TipOfDay.tsx # Daily tip + AI expansion UI
	lib/calculations.ts     # Totals & formatting helpers
	lib/financialTips.ts    # Static tips dataset + selection helpers
	types.ts                # Shared TypeScript types
	styles/tokens.css       # Tailwind + design tokens
server/
	index.ts                # Express API (expand endpoint)
	mcpClient.ts            # MCP expansion stub (replace with real integration)
```

## 🧪 Testing (Future)
Vitest & Testing Library already included—add tests under `tests/`:

```bash
npm run test
```

Potential test areas:
- Tip selection determinism by date
- Expansion endpoint shape
- UI state transitions (reveal → another → more)

## 🔐 Security Notes
- API key entered in UI is forwarded to backend per request (no persistence) — replace with a secure auth pattern for production.
- Add input validation & rate limiting before exposing publicly.
- Always label AI output as educational (done in UI).

## 🛣 Roadmap Ideas
- Local persistence (localStorage) for transactions
- Category management & filtering
- Charts (spending breakdown, trends)
- Streak tracking for daily tips viewed
- Follow-up question freeform AI chat referencing current budget context
- Streaming responses for expansion panel

## 📝 License
Add a license of your choice (e.g., MIT) — currently none included.

## 🙋 Support / Feedback
Open an issue or create a discussion in the repository. Contributions welcome once initial MVP stabilizes.

---
Happy budgeting & learning! 💰📈
