<div align="center">
	<h1>Budget AI</h1>
	<p><strong>Monthly budgeting prototype with an AI-augmented Financial "Tip of the Day" expansion.</strong></p>
	<sub>Vite + React + TypeScript + Tailwind + Express (API) + OpenRouter-powered AI expansion</sub>
</div>

---

## ✨ Features

- Add income & expense transactions with live running totals
- Derived ending balance (starting + income − expenses)
- Deterministic daily financial tip (locally computed)
- "Another Tip" randomizer (no duplicates in-session)
- AI "More" button: expands current tip into deeper structured guidance (summary, deeper dive, key points, action plan, sources)
- Local caching of expansions per tip to avoid redundant calls
- Secure server-side OpenRouter integration (no API key in the UI)
- Clean, component-driven Tailwind styling

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Front-end | React 18, TypeScript, Tailwind CSS, Vite |
| State | Local component state (future: Zustand) |
| Utilities | Custom calculation helpers (totals, ending balance) |
| AI Integration | Express API + OpenRouter (`server/openrouter.ts`) |

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment
Create a `.env` from the provided `.env.example` and add your OpenRouter API key:

```bash
cp .env.example .env
```

Variables you may use:

```
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-...your key...
PORT=5055
```

The frontend no longer asks for an API key. The backend reads `OPENROUTER_API_KEY` from the environment and uses it when you click **More**.

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
2. Click **More** – the server calls OpenRouter with your secret key (never exposed to the browser)

## 🔌 AI Prompting Notes

`server/openrouter.ts` sends a structured JSON instruction to OpenRouter asking for: `summary`, `deeperDive`, `keyPoints[]`, `actionPlan[]`, and `sources[]`. If the model does not return valid JSON, the server gracefully falls back to a minimal expansion.

To adjust the model or prompt, edit `AI_MODEL` in `.env` and tweak the messages inside `openrouter.ts`.

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
	openrouter.ts           # OpenRouter integration (expansion logic)
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
- API key is stored only in your local `.env`; never exposed client-side.
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
