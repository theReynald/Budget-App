import { AIExpandedTip } from '../src/types.js';
import { getTipById } from '../src/lib/financialTips.js';

// Expand a financial tip using OpenRouter API. Requires OPENROUTER_API_KEY env variable.
// Attempts to coerce model output to the AIExpandedTip structure, with graceful fallback.
export async function expandTipViaOpenRouter(tipId: string, model: string): Promise<AIExpandedTip> {
    const tip = getTipById(tipId);
    if (!tip) {
        throw new Error('Unknown tip id');
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not set in environment');
    }

    // Build a JSON-instruction prompt. We request strict JSON; if the model returns text, we will attempt to parse.
    const system = 'You are a concise, factual financial literacy assistant. Output educational guidance only. No personal financial advice.';
    const user = `Return STRICT JSON with keys: summary, deeperDive, keyPoints (array), actionPlan (array), sources (array of {title,url}). No markdown. If unsure about sources, return an empty array.\nBase Tip:\nTitle: ${tip.title}\nCategory: ${tip.category}\nContent: ${tip.content || tip.description}\nActionable: ${tip.actionable || ''}`;

    const body = {
        model,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
        ],
        max_tokens: 600,
    } as const;

    let raw: any;
    try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                // Optional metadata headers recommended by OpenRouter
                'HTTP-Referer': 'http://localhost',
                'X-Title': 'Budget AI Tip Expansion'
            },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`OpenRouter request failed (${resp.status}): ${text.slice(0, 180)}`);
        }
        raw = await resp.json();
    } catch (e: any) {
        // Surface fetch / network errors
        throw new Error(e.message || 'Network error contacting OpenRouter');
    }

    const choice = raw?.choices?.[0]?.message?.content?.trim();
    let parsed: any;
    if (choice) {
        // Try to extract JSON (strip possible fences)
        const jsonCandidate = choice
            .replace(/^```json\n?/i, '')
            .replace(/```$/i, '')
            .trim();
        try {
            parsed = JSON.parse(jsonCandidate);
        } catch {
            // If parsing fails, treat entire text as deeperDive fallback
            parsed = {
                summary: tip.description,
                deeperDive: choice,
                keyPoints: [],
                actionPlan: tip.actionable ? [tip.actionable] : [],
                sources: []
            };
        }
    }

    // Final coercion with defaults
    const now = new Date().toISOString();
    const expansion: AIExpandedTip = {
        tipId,
        baseTipId: tipId,
        summary: parsed?.summary || tip.description,
        deeperDive: parsed?.deeperDive || parsed?.details || parsed?.content || tip.content || tip.description,
        keyPoints: Array.isArray(parsed?.keyPoints) ? parsed.keyPoints.slice(0, 12) : [],
        actionPlan: Array.isArray(parsed?.actionPlan) ? parsed.actionPlan.slice(0, 12) : (tip.actionable ? [tip.actionable] : []),
        sources: Array.isArray(parsed?.sources) ? parsed.sources.filter((s: any) => s && s.title).map((s: any) => ({ title: String(s.title), url: s.url ? String(s.url) : undefined })).slice(0, 8) : [],
        model: raw?.model || model,
        generatedAt: now,
        createdAt: now,
        source: 'openrouter'
    };

    return expansion;
}

// Fallback expansion if OpenRouter fails catastrophically (minimal content)
export async function expandTipFallback(tipId: string, reason: string = 'fallback'): Promise<AIExpandedTip> {
    const tip = getTipById(tipId);
    if (!tip) throw new Error('Unknown tip id');
    const now = new Date().toISOString();
    return {
        tipId,
        baseTipId: tipId,
        summary: tip.description,
        deeperDive: tip.content || tip.description,
        keyPoints: ['Review base concept', 'Apply actionable step', 'Track impact over time'],
        actionPlan: tip.actionable ? [tip.actionable] : [],
        sources: [],
        model: 'fallback-local',
        generatedAt: now,
        createdAt: now,
        source: 'fallback',
        reason
    };
}
