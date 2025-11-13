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

app.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
});

