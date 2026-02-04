import React, { useCallback, useEffect, useState } from 'react';
import { FinancialTip, StoredDailyTip, AIExpandedTip } from '../types';
import { DAILY_TIP_STORAGE_KEY, pickTipForDate, randomTip } from '../lib/financialTips';

// Basic localStorage helpers (guarded for SSR / tests)
function loadStored(): StoredDailyTip | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(DAILY_TIP_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredDailyTip) : null;
    } catch {
        return null;
    }
}

function saveStored(obj: StoredDailyTip) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(obj));
    } catch {
        /* ignore persistence errors */
    }
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

interface TipState {
    daily: FinancialTip | null;
    current: FinancialTip | null; // could be daily or an alternate random one
    revealed: boolean; // whether user clicked to show
}

/**
 * TipOfDay component
 * - User clicks a button to reveal today's deterministic tip.
 * - Can request another (random) tip for more learning.
 * - Persists the chosen daily tip id in localStorage so the same tip shows again today.
 */
export function TipOfDay() {
    const [state, setState] = useState<TipState>({ daily: null, current: null, revealed: false });
    const [altCount, setAltCount] = useState(0); // track how many alternate tips requested
    const [expanding, setExpanding] = useState(false);
    const [expansion, setExpansion] = useState<AIExpandedTip | null>(null);
    const [expansionError, setExpansionError] = useState<string | null>(null);
    const expansionCacheRef = React.useRef<Record<string, AIExpandedTip>>({});

    // On mount: attempt to load stored daily tip; if date mismatch, compute new.
    useEffect(() => {
        const stored = loadStored();
        const today = todayISO();
        if (stored && stored.date === today) {
            const dailyTip = pickTipForDate(new Date(today)); // recompute to ensure dataset still valid
            if (dailyTip.id === stored.tipId) {
                setState(s => ({ ...s, daily: dailyTip }));
                return;
            }
        }
        // compute fresh daily tip
        const dailyTip = pickTipForDate();
        saveStored({ date: today, tipId: dailyTip.id });
        setState(s => ({ ...s, daily: dailyTip }));
    }, []);

    const reveal = useCallback(() => {
        setState(s => ({ ...s, revealed: true, current: s.daily }));
    }, []);

    const another = useCallback(() => {
        setState(s => {
            const exclude = [s.daily?.id, s.current?.id].filter(Boolean) as string[];
            const alt = randomTip(exclude);
            return { ...s, current: alt, revealed: true };
        });
        setAltCount(c => c + 1);
        setExpansion(null);
        setExpansionError(null);
    }, []);

    // Safely read Vite environment variable for API base
    const API_BASE = ((import.meta as unknown) as { env?: Record<string, string> }).env?.VITE_API_BASE || '';

    const expandMore = useCallback(async () => {
        if (!state.current) return;
        const id = state.current.id;
        if (expansionCacheRef.current[id]) {
            setExpansion(expansionCacheRef.current[id]);
            return;
        }
        setExpanding(true);
        setExpansionError(null);
        try {
            const resp = await fetch(`${API_BASE}/api/tips/expand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipId: id })
            });

            // Defensive parsing: handle empty body, wrong content-type, or invalid JSON
            const ct = resp.headers.get('content-type') || '';
            let payload: { ok?: boolean; error?: string; data?: AIExpandedTip } | null = null;
            if (ct.includes('application/json')) {
                try {
                    payload = await resp.json();
                } catch {
                    // Attempt to read any residual text for diagnostics
                    let text = '';
                    try { text = await resp.text(); } catch { /* ignore – best effort */ }
                    throw new Error(`Invalid or empty JSON (status ${resp.status}). ${text ? 'Body: ' + text.slice(0, 120) : ''}`);
                }
            } else {
                // Not JSON at all
                let text = '';
                try { text = await resp.text(); } catch { /* ignore – best effort */ }
                throw new Error(`Expected JSON but received '${ct || 'no content-type'}' (status ${resp.status}). ${text.slice(0, 120)}`);
            }

            if (!resp.ok || !payload?.ok) {
                throw new Error(payload?.error || `Request failed (${resp.status})`);
            }

            if (payload.data) {
                expansionCacheRef.current[id] = payload.data;
            }
            setExpansion(payload.data || null);
            try {
                if (payload.data) {
                    localStorage.setItem(`budgetApp.expansion.${id}`, JSON.stringify(payload.data));
                }
            } catch { /* ignore persistence errors */ }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setExpansionError(msg);
        } finally {
            setExpanding(false);
        }
    }, [state.current, API_BASE]);

    // hydrate expansion cache if user revisits same tip
    useEffect(() => {
        if (!state.current) return;
        try {
            const raw = localStorage.getItem(`budgetApp.expansion.${state.current.id}`);
            if (raw) {
                const parsed = JSON.parse(raw) as AIExpandedTip;
                expansionCacheRef.current[state.current.id] = parsed;
            }
        } catch { /* ignore cache hydration errors */ }
    }, [state.current]);

    return (
        <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4 space-y-3">
            <header className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-lg font-semibold">Tip of the Day</h2>
                    <p className="text-xs text-gray-500">Build financial literacy one small concept at a time.</p>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    {!state.revealed && (
                        <button
                            onClick={reveal}
                            className="px-3 py-1.5 rounded bg-accent text-white text-xs font-medium hover:brightness-110 transition"
                        >
                            Show Today&apos;s Tip
                        </button>
                    )}
                    {state.revealed && (
                        <>
                            <button
                                onClick={another}
                                className="px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:bg-opacity-90 transition"
                            >
                                Another Tip
                            </button>
                            <button
                                onClick={expandMore}
                                disabled={expanding || !state.current}
                                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-medium disabled:opacity-50 hover:bg-indigo-500 transition"
                            >
                                {expanding ? 'Loading…' : 'More'}
                            </button>
                        </>
                    )}
                </div>
            </header>

            {state.revealed && state.current && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block bg-accent/10 text-accent text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded">
                            {state.current.category}
                        </span>
                        {state.current.difficulty && (
                            <span className="inline-block bg-primary/5 text-primary text-[10px] font-medium uppercase px-2 py-1 rounded">
                                {state.current.difficulty}
                            </span>
                        )}
                        {altCount > 0 && (
                            <span className="text-[10px] text-gray-400">+{altCount} extra</span>
                        )}
                    </div>
                    <h3 className="font-semibold text-sm text-primary">{state.current.title}</h3>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{state.current.content}</p>
                    {state.current.actionable && (
                        <div className="text-xs bg-white border border-accent/30 rounded p-3 space-y-1">
                            <p className="font-medium text-accent">Action Step</p>
                            <p className="text-gray-700">{state.current.actionable}</p>
                        </div>
                    )}
                    {expansionError && (
                        <div className="text-[11px] text-red-600">{expansionError}</div>
                    )}
                    {expansion && expansion.baseTipId === state.current.id && (
                        <div className="mt-2 border border-indigo-200 bg-white rounded p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                                Deeper Dive
                                <span className="text-[10px] font-normal text-indigo-400 px-1 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                                    {expansion.source === 'fallback' || expansion.model === 'fallback-local'
                                        ? expansion.reason === 'cached-without-key'
                                            ? 'Cached (prior OpenRouter answer)'
                                            : 'Hard coded Answer'
                                        : expansion.reason === 'cached-without-key'
                                            ? 'Cached (prior OpenRouter answer)'
                                            : `Model: ${expansion.model}`}
                                </span>
                            </h4>
                            {expansion.reason === 'cached-without-key' && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                    API key removed after previous generation – showing cached earlier model output.
                                </div>
                            )}
                            {expansion.source === 'fallback' && expansion.reason === 'missing-key' && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                    No OpenRouter API key configured – using stub fallback.
                                </div>
                            )}
                            {expansion.source === 'fallback' && expansion.reason === 'error' && (
                                <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
                                    OpenRouter request failed – showing fallback guidance.
                                </div>
                            )}
                            <p className="text-xs text-gray-700">{expansion.summary}</p>
                            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                                {expansion.deeperDive}
                            </p>
                            {expansion.keyPoints.length > 0 && (
                                <ul className="list-disc pl-4 space-y-1">
                                    {expansion.keyPoints.map(k => (
                                        <li key={k} className="text-[11px] text-gray-700">
                                            {k}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {expansion.actionPlan && expansion.actionPlan.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                                    <p className="text-[11px] font-semibold text-indigo-700 mb-1">Action Plan</p>
                                    <ol className="list-decimal pl-4 space-y-1">
                                        {expansion.actionPlan.map(step => (
                                            <li key={step} className="text-[11px] text-gray-700">
                                                {step}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {expansion.sources && expansion.sources.length > 0 && (
                                <div className="pt-1">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Sources</p>
                                    <ul className="mt-1 space-y-0.5">
                                        {expansion.sources.map((s, i) => (
                                            <li key={i} className="text-[11px] text-gray-600">
                                                {s.url ? (
                                                    <a
                                                        href={s.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="underline decoration-dotted hover:text-indigo-700"
                                                    >
                                                        {s.title}
                                                    </a>
                                                ) : (
                                                    s.title
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="text-[10px] text-gray-400">
                                Generated {(() => {
                                    const ts = expansion.createdAt || expansion.generatedAt;
                                    try { return new Date(ts).toLocaleTimeString(); } catch { return '—'; }
                                })()}
                            </div>
                            <p className="text-[10px] text-gray-400 italic">Educational content only – not personalized financial advice.</p>
                        </div>
                    )}
                </div>
            )}

            {!state.revealed && (
                <p className="text-[11px] text-gray-400 italic">Click the button to reveal today\'s curated learning bite.</p>
            )}
        </section>
    );
}

export default TipOfDay;
