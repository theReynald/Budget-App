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

### 🤖 AI Financial Advisor Features

- **Smart Budget Analysis**: Automatic analysis of spending patterns with category breakdowns, savings rate calculations, and personalized recommendations
- **Interactive Financial Chat**: Ask questions about your budget and receive AI-powered advice with context awareness of your actual transaction data
- **Monthly Financial Reports**: AI-generated health summaries with financial health ratings, category insights, and actionable items for improvement
- **Smart Alerts & Insights**: Detection of unusual spending patterns, large transactions, and category-specific recommendations
- **Privacy-First Design**: Transaction data anonymized before AI processing, with graceful fallbacks when API key is not configured
- **Cost Management**: Rate limiting (5 messages/minute), response caching, and reasonable token limits to control API costs

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

### 4. Use the AI Features

#### Financial Tip Expansion
1. Reveal the daily tip
2. Click **More** – the server calls OpenRouter with your secret key (never exposed to the browser)

#### Smart Budget Analysis
- The Budget Recommendations panel automatically analyzes your transactions
- Click **Refresh** to update the analysis after adding new transactions
- View insights, alerts, and personalized recommendations

#### AI Financial Advisor Chat
1. Click **Start Chat** to open the interactive advisor
2. Ask questions about your budget using natural language
3. Use quick question shortcuts or type your own questions
4. Rate limited to 5 messages per minute to manage costs

#### Monthly Financial Report
1. Click **Generate Report** to create a comprehensive financial health summary
2. View your financial health rating (Excellent, Good, Fair, Needs Attention)
3. Review category insights and action items for improvement

## 🔌 AI Integration & API Endpoints

### Tip Expansion
`server/openrouter.ts` sends a structured JSON instruction to OpenRouter asking for: `summary`, `deeperDive`, `keyPoints[]`, `actionPlan[]`, and `sources[]`. If the model does not return valid JSON, the server gracefully falls back to a minimal expansion.

### New AI Endpoints
- **POST /api/analyze-budget**: Analyzes spending patterns and provides recommendations
- **POST /api/chat**: Interactive financial advisor with context-aware responses
- **POST /api/monthly-report**: Generates comprehensive monthly financial health reports

All endpoints:
- Include local fallback analysis when API key is not configured
- Cache results to minimize API costs
- Anonymize transaction data before sending to AI
- Include rate limiting for cost management

To adjust the model or prompt, edit `AI_MODEL` in `.env` and tweak the messages inside `server/index.ts`.

## 🗂 Project Structure

```
src/
	App.tsx                          # Main UI with all components
	components/
		TipOfDay.tsx                   # Daily tip + AI expansion UI
		BudgetRecommendations.tsx      # Smart budget analysis & insights
		FinancialAdvisorChat.tsx       # Interactive AI chat interface
		MonthlyReport.tsx              # Monthly financial health reports
	lib/
		calculations.ts                # Totals & formatting helpers
		financialTips.ts               # Static tips dataset + selection helpers
		budgetAnalysis.ts              # Budget analysis & recommendation logic
	types.ts                         # Shared TypeScript types
	styles/tokens.css                # Tailwind + design tokens
server/
	index.ts                         # Express API (all endpoints)
	openrouter.ts                    # OpenRouter integration (expansion logic)
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
- Budget analysis calculations
- Chat rate limiting
- Report generation

## 🔐 Security & Privacy

### Implemented Safeguards
- **API Key Security**: Stored only in server `.env`; never exposed client-side
- **Data Anonymization**: Transaction descriptions and personal details removed before AI processing
- **Rate Limiting**: Chat endpoint limited to 5 requests/minute per session
- **Cost Management**: Response caching and token limits on all AI calls
- **Educational Labeling**: All AI outputs clearly marked as educational, not personalized advice
- **Graceful Fallbacks**: All features work with local analysis when API key unavailable

### Before Production
- Add comprehensive input validation
- Implement user authentication
- Set up proper environment-based configuration
- Add monitoring and logging for AI API usage
- Review and update privacy policy
- Consider additional rate limiting strategies

## 🛣 Roadmap Ideas
- ~~Smart Budget Recommendations~~ ✅
- ~~AI Financial Advisor Chat~~ ✅
- ~~Monthly Financial Reports~~ ✅
- Local persistence (localStorage) for transactions
- Category management & filtering
- Charts (spending breakdown, trends)
- Streak tracking for daily tips viewed
- Budget goals and progress tracking
- Spending trends and predictions
- Export reports to PDF/CSV
- Multi-currency support
- Mobile-responsive optimizations

## 📝 License
Add a license of your choice (e.g., MIT) — currently none included.

## 🙋 Support / Feedback
Open an issue or create a discussion in the repository. Contributions welcome once initial MVP stabilizes.

---
Happy budgeting & learning! 💰📈
