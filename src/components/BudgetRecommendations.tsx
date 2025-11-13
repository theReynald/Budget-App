import React, { useState, useEffect } from 'react';
import { Transaction, BudgetAnalysis } from '../types';

interface BudgetRecommendationsProps {
    startingBalance: number;
    transactions: Transaction[];
}

export function BudgetRecommendations({ startingBalance, transactions }: BudgetRecommendationsProps) {
    const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const API_BASE = ((import.meta as unknown) as { env?: Record<string, string> }).env?.VITE_API_BASE || '';

    const analyzeNow = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch(`${API_BASE}/api/analyze-budget`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startingBalance, transactions })
            });

            if (!resp.ok) {
                throw new Error(`Analysis failed (${resp.status})`);
            }

            const data = await resp.json();
            if (!data.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setAnalysis(data.data);
            setExpanded(true);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-analyze when transactions change (with debounce)
        const timer = setTimeout(() => {
            if (transactions.length > 0 && !analysis) {
                analyzeNow();
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactions.length]);

    if (!expanded && !analysis) {
        return (
            <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">💡 Smart Budget Insights</h2>
                        <p className="text-xs text-gray-500">Get AI-powered recommendations for your budget</p>
                    </div>
                    <button
                        onClick={analyzeNow}
                        disabled={loading || transactions.length === 0}
                        className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Analyzing...' : 'Analyze Budget'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4 space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">💡 Smart Budget Insights</h2>
                    <p className="text-xs text-gray-500">AI-powered analysis of your spending patterns</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                    >
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                        onClick={analyzeNow}
                        disabled={loading}
                        className="px-3 py-1.5 rounded bg-accent text-white text-xs font-medium hover:brightness-110 transition disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Refresh'}
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {expanded && analysis && (
                <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <MetricCard
                            label="Income"
                            value={`$${analysis.totalIncome.toFixed(2)}`}
                            positive
                        />
                        <MetricCard
                            label="Expenses"
                            value={`$${analysis.totalExpenses.toFixed(2)}`}
                            negative
                        />
                        <MetricCard
                            label="Net Savings"
                            value={`$${analysis.netSavings.toFixed(2)}`}
                            positive={analysis.netSavings >= 0}
                            negative={analysis.netSavings < 0}
                        />
                        <MetricCard
                            label="Savings Rate"
                            value={`${analysis.savingsRate.toFixed(1)}%`}
                            positive={analysis.savingsRate >= 20}
                            negative={analysis.savingsRate < 0}
                        />
                    </div>

                    {/* Alerts */}
                    {analysis.alerts && analysis.alerts.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-amber-800">⚠️ Alerts</h3>
                            <ul className="space-y-1">
                                {analysis.alerts.map((alert, i) => (
                                    <li key={i} className="text-xs text-amber-700">
                                        {alert}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Insights */}
                    {analysis.insights && analysis.insights.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-blue-800">📊 Insights</h3>
                            <ul className="space-y-1">
                                {analysis.insights.map((insight, i) => (
                                    <li key={i} className="text-xs text-blue-700">
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-green-800">💡 Recommendations</h3>
                            <ul className="space-y-1">
                                {analysis.recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs text-green-700">
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Category Breakdown */}
                    {analysis.categoryBreakdown && analysis.categoryBreakdown.length > 0 && (
                        <div className="border border-gray-200 rounded p-3 space-y-2">
                            <h3 className="text-sm font-semibold text-gray-800">📈 Spending by Category</h3>
                            <div className="space-y-1">
                                {analysis.categoryBreakdown.slice(0, 5).map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-700">{cat.category}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">${cat.amount.toFixed(2)}</span>
                                            <span className="text-gray-400">({cat.percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-[10px] text-gray-400 italic text-center">
                        AI-powered analysis for educational purposes only. Not personalized financial advice.
                    </p>
                </div>
            )}
        </section>
    );
}

function MetricCard({
    label,
    value,
    positive,
    negative
}: {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
}) {
    return (
        <div className="border border-gray-200 rounded p-2 bg-gray-50">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
            <div
                className={
                    'text-sm font-semibold mt-0.5 ' +
                    (positive ? 'text-green-600' : '') +
                    (negative ? 'text-red-600' : '')
                }
            >
                {value}
            </div>
        </div>
    );
}

export default BudgetRecommendations;
