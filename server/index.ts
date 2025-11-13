import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { expandTipViaOpenRouter, expandTipFallback } from './openrouter';
import { getTipById } from '../src/lib/financialTips.js';

const PORT = Number(process.env.PORT || 5055);
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Simple health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'budget-app-api', time: new Date().toISOString() });
});

// In-memory cache for expansions (per server run)
const expansionCache: Record<string, any> = {};

app.post('/api/tips/expand', async (req, res) => {
    // Reload .env each request to reflect key changes during dev (harmless in dev, remove for prod perf if desired)
    dotenv.config({ override: true });
    const { tipId } = req.body || {};
    if (!tipId || typeof tipId !== 'string') {
        return res.status(400).json({ ok: false, error: 'Missing tipId' });
    }
    if (!getTipById(tipId)) {
        return res.status(404).json({ ok: false, error: 'Unknown tip id' });
    }
    try {
        const keyPresent = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
        if (expansionCache[tipId]) {
            const cachedExpansion = expansionCache[tipId];
            // If key is now missing but cached answer came from openrouter, annotate reason.
            if (!keyPresent && cachedExpansion?.source === 'openrouter' && !cachedExpansion.reason) {
                cachedExpansion.reason = 'cached-without-key';
            }
            return res.json({ ok: true, data: cachedExpansion, cached: true });
        }
        const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
        let expansion;
        try {
            if (!keyPresent) {
                expansion = await expandTipFallback(tipId, 'missing-key');
            } else {
                expansion = await expandTipViaOpenRouter(tipId, model);
                if (!expansion.source) expansion.source = 'openrouter';
                expansion.reason = 'success';
            }
        } catch (e: any) {
            const reason = !keyPresent ? 'missing-key' : 'error';
            expansion = await expandTipFallback(tipId, reason);
            if (e?.message) expansion.deeperDive += `\n(Original error: ${e.message})`;
        }
        expansionCache[tipId] = expansion;
        return res.json({ ok: true, data: expansion, cached: false });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err?.message || 'Expansion failed' });
    }
});

// Status endpoint to inspect key presence without leaking the actual key
app.get('/api/status', (_req, res) => {
    const keyPresent = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
    res.json({ ok: true, keyPresent, model: process.env.AI_MODEL || 'openai/gpt-4o-mini' });
});

// Smart Budget Recommendations & AI Financial Advisor endpoints
const analysisCache: Record<string, any> = {};
const chatRateLimiter = new Map<string, number[]>();

// Rate limiting helper (5 requests per minute per session)
function checkRateLimit(sessionId: string): boolean {
    const now = Date.now();
    const requests = chatRateLimiter.get(sessionId) || [];
    const recentRequests = requests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 5) {
        return false;
    }
    
    recentRequests.push(now);
    chatRateLimiter.set(sessionId, recentRequests);
    return true;
}

app.post('/api/analyze-budget', async (req, res) => {
    dotenv.config({ override: true });
    const { startingBalance, transactions } = req.body || {};
    
    if (typeof startingBalance !== 'number' || !Array.isArray(transactions)) {
        return res.status(400).json({ ok: false, error: 'Invalid request body' });
    }
    
    try {
        const keyPresent = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
        const cacheKey = JSON.stringify({ startingBalance, transactions });
        
        if (analysisCache[cacheKey]) {
            return res.json({ ok: true, data: analysisCache[cacheKey], cached: true });
        }
        
        // Import analysis utilities dynamically
        const { performFullAnalysis, prepareBudgetDataForAI } = await import('../src/lib/budgetAnalysis.js');
        const baseAnalysis = performFullAnalysis(startingBalance, transactions);
        
        if (!keyPresent) {
            // Return local analysis without AI enhancement
            analysisCache[cacheKey] = baseAnalysis;
            return res.json({ ok: true, data: baseAnalysis, cached: false });
        }
        
        // Enhance with AI recommendations
        const budgetData = prepareBudgetDataForAI(startingBalance, transactions);
        const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        const system = 'You are a professional financial advisor. Provide specific, actionable budget advice based on the data provided. Be concise and practical.';
        const user = `Analyze this budget data and provide 3-5 personalized recommendations:\n\n${budgetData}\n\nReturn a JSON array of recommendation strings.`;
        
        try {
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost',
                    'X-Title': 'Budget Analysis'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    max_tokens: 400
                })
            });
            
            if (resp.ok) {
                const data = await resp.json();
                const content = data?.choices?.[0]?.message?.content?.trim();
                if (content) {
                    try {
                        const aiRecommendations = JSON.parse(content.replace(/^```json\n?/i, '').replace(/```$/i, '').trim());
                        if (Array.isArray(aiRecommendations)) {
                            baseAnalysis.recommendations = [...baseAnalysis.recommendations, ...aiRecommendations];
                        }
                    } catch {
                        // Keep base recommendations if parsing fails
                    }
                }
            }
        } catch {
            // Fallback to base analysis if AI call fails
        }
        
        analysisCache[cacheKey] = baseAnalysis;
        return res.json({ ok: true, data: baseAnalysis, cached: false });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err?.message || 'Analysis failed' });
    }
});

app.post('/api/chat', async (req, res) => {
    dotenv.config({ override: true });
    const { message, context } = req.body || {};
    const sessionId = req.headers['x-session-id'] as string || 'default';
    
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ ok: false, error: 'Missing message' });
    }
    
    if (!checkRateLimit(sessionId)) {
        return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Please wait before sending more messages.' });
    }
    
    const keyPresent = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
    
    if (!keyPresent) {
        return res.json({
            ok: true,
            data: {
                message: 'AI chat requires an OpenRouter API key. Please configure OPENROUTER_API_KEY in your environment.',
                model: 'fallback',
                timestamp: new Date().toISOString()
            }
        });
    }
    
    try {
        let contextString = '';
        if (context && context.transactions) {
            const { prepareBudgetDataForAI } = await import('../src/lib/budgetAnalysis.js');
            contextString = `\n\nUser's current budget data:\n${prepareBudgetDataForAI(context.startingBalance || 0, context.transactions)}`;
        }
        
        const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        const system = 'You are a helpful financial advisor. Answer questions about budgeting, saving, and personal finance. Be specific and reference the user\'s budget data when available. Keep responses concise (under 200 words).';
        const user = message + contextString;
        
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'Budget Chat'
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user }
                ],
                max_tokens: 300
            })
        });
        
        if (!resp.ok) {
            throw new Error(`OpenRouter request failed (${resp.status})`);
        }
        
        const data = await resp.json();
        const responseMessage = data?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';
        
        return res.json({
            ok: true,
            data: {
                message: responseMessage,
                model: data?.model || model,
                timestamp: new Date().toISOString()
            }
        });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err?.message || 'Chat failed' });
    }
});

app.post('/api/monthly-report', async (req, res) => {
    dotenv.config({ override: true });
    const { startingBalance, transactions } = req.body || {};
    
    if (typeof startingBalance !== 'number' || !Array.isArray(transactions)) {
        return res.status(400).json({ ok: false, error: 'Invalid request body' });
    }
    
    try {
        const keyPresent = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
        
        const { performFullAnalysis, prepareBudgetDataForAI } = await import('../src/lib/budgetAnalysis.js');
        const analysis = performFullAnalysis(startingBalance, transactions);
        
        // Create basic report structure
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        let financialHealth: 'excellent' | 'good' | 'fair' | 'needs-attention' = 'fair';
        if (analysis.savingsRate >= 20) financialHealth = 'excellent';
        else if (analysis.savingsRate >= 10) financialHealth = 'good';
        else if (analysis.savingsRate < 0) financialHealth = 'needs-attention';
        
        const baseReport = {
            month,
            summary: `You earned $${analysis.totalIncome.toFixed(2)} and spent $${analysis.totalExpenses.toFixed(2)}, with a savings rate of ${analysis.savingsRate.toFixed(1)}%.`,
            financialHealth,
            keyMetrics: {
                income: analysis.totalIncome,
                expenses: analysis.totalExpenses,
                savings: analysis.netSavings,
                savingsRate: analysis.savingsRate
            },
            categoryInsights: analysis.categoryBreakdown.slice(0, 5).map(c => ({
                category: c.category,
                spent: c.amount,
                trend: 'stable' as const,
                recommendation: c.percentage > 30 ? `Consider reducing ${c.category} spending` : 'Keep up the good work'
            })),
            actionItems: analysis.recommendations.slice(0, 5),
            generatedAt: now.toISOString(),
            model: 'local-analysis'
        };
        
        if (!keyPresent) {
            return res.json({ ok: true, data: baseReport });
        }
        
        // Enhance with AI-generated summary
        const budgetData = prepareBudgetDataForAI(startingBalance, transactions);
        const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        const system = 'You are a financial advisor creating a monthly report. Be encouraging but honest about financial health.';
        const user = `Create a brief monthly financial summary (2-3 sentences) based on this data:\n\n${budgetData}`;
        
        try {
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost',
                    'X-Title': 'Monthly Report'
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    max_tokens: 200
                })
            });
            
            if (resp.ok) {
                const data = await resp.json();
                const aiSummary = data?.choices?.[0]?.message?.content?.trim();
                if (aiSummary) {
                    baseReport.summary = aiSummary;
                    baseReport.model = data?.model || model;
                }
            }
        } catch {
            // Keep base summary if AI call fails
        }
        
        return res.json({ ok: true, data: baseReport });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err?.message || 'Report generation failed' });
    }
});

app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
});

