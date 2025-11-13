import React, { useState } from 'react';
import { Transaction, MonthlyReport as MonthlyReportType } from '../types';

interface MonthlyReportProps {
    startingBalance: number;
    transactions: Transaction[];
}

export function MonthlyReport({ startingBalance, transactions }: MonthlyReportProps) {
    const [report, setReport] = useState<MonthlyReportType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const API_BASE = ((import.meta as unknown) as { env?: Record<string, string> }).env?.VITE_API_BASE || '';

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch(`${API_BASE}/api/monthly-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startingBalance, transactions })
            });

            if (!resp.ok) {
                throw new Error(`Report generation failed (${resp.status})`);
            }

            const data = await resp.json();
            if (!data.ok) {
                throw new Error(data.error || 'Report generation failed');
            }

            setReport(data.data);
            setExpanded(true);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const getHealthColor = (health: MonthlyReportType['financialHealth']) => {
        switch (health) {
            case 'excellent':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'good':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'fair':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'needs-attention':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    if (!expanded && !report) {
        return (
            <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">📊 Monthly Financial Report</h2>
                        <p className="text-xs text-gray-500">Generate an AI-powered financial health summary</p>
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading || transactions.length === 0}
                        className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4 space-y-4">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">📊 Monthly Financial Report</h2>
                    <p className="text-xs text-gray-500">AI-generated financial health summary</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                    >
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:bg-opacity-90 transition disabled:opacity-50"
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

            {expanded && report && (
                <div className="space-y-4">
                    {/* Month & Health Status */}
                    <div className="text-center py-4 border-b border-gray-200">
                        <h3 className="text-2xl font-bold text-gray-800">{report.month}</h3>
                        <div
                            className={`inline-block mt-2 px-4 py-1 rounded-full border text-sm font-medium ${getHealthColor(report.financialHealth)}`}
                        >
                            {report.financialHealth.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">📝 Summary</h4>
                        <p className="text-sm text-blue-700">{report.summary}</p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <MetricBox
                            label="Total Income"
                            value={`$${report.keyMetrics.income.toFixed(2)}`}
                            icon="💵"
                        />
                        <MetricBox
                            label="Total Expenses"
                            value={`$${report.keyMetrics.expenses.toFixed(2)}`}
                            icon="💸"
                        />
                        <MetricBox
                            label="Net Savings"
                            value={`$${report.keyMetrics.savings.toFixed(2)}`}
                            icon="💰"
                            positive={report.keyMetrics.savings >= 0}
                            negative={report.keyMetrics.savings < 0}
                        />
                        <MetricBox
                            label="Savings Rate"
                            value={`${report.keyMetrics.savingsRate.toFixed(1)}%`}
                            icon="📈"
                            positive={report.keyMetrics.savingsRate >= 20}
                            negative={report.keyMetrics.savingsRate < 0}
                        />
                    </div>

                    {/* Category Insights */}
                    {report.categoryInsights && report.categoryInsights.length > 0 && (
                        <div className="border border-gray-200 rounded p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800">📊 Category Insights</h4>
                            {report.categoryInsights.map((insight, i) => (
                                <div key={i} className="bg-gray-50 rounded p-3 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-800">
                                            {insight.category}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">
                                                ${insight.spent.toFixed(2)}
                                            </span>
                                            <TrendBadge trend={insight.trend} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600">{insight.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Items */}
                    {report.actionItems && report.actionItems.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-4 space-y-2">
                            <h4 className="text-sm font-semibold text-green-800">✅ Action Items for Next Month</h4>
                            <ul className="space-y-1">
                                {report.actionItems.map((item, i) => (
                                    <li key={i} className="text-xs text-green-700 flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">▸</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="text-center pt-2 border-t border-gray-200">
                        <p className="text-[10px] text-gray-400">
                            Generated {new Date(report.generatedAt).toLocaleString()} · Model: {report.model}
                        </p>
                        <p className="text-[10px] text-gray-400 italic mt-1">
                            Educational content only. Not personalized financial advice.
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function MetricBox({
    label,
    value,
    icon,
    positive,
    negative
}: {
    label: string;
    value: string;
    icon: string;
    positive?: boolean;
    negative?: boolean;
}) {
    return (
        <div className="border border-gray-200 rounded p-3 bg-gray-50">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
            <div
                className={
                    'text-base font-semibold mt-0.5 ' +
                    (positive ? 'text-green-600' : '') +
                    (negative ? 'text-red-600' : '')
                }
            >
                {value}
            </div>
        </div>
    );
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
    const config = {
        up: { icon: '↗', color: 'text-red-600 bg-red-50' },
        down: { icon: '↘', color: 'text-green-600 bg-green-50' },
        stable: { icon: '→', color: 'text-gray-600 bg-gray-50' }
    };

    const { icon, color } = config[trend];

    return (
        <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
            {icon}
        </span>
    );
}

export default MonthlyReport;
