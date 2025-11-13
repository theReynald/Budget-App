import React, { useState, useMemo, useEffect } from 'react';
import { BudgetGoal, BudgetProgress, Transaction } from '../types';
import { calculateBudgetProgress, getCurrentMonth, formatCurrency } from '../lib/calculations';

const BUDGET_GOALS_STORAGE_KEY = 'budget-goals';

// Default categories for quick setup
const DEFAULT_CATEGORIES = ['Food', 'Housing', 'Entertainment', 'Transportation', 'Utilities', 'Shopping'];

interface BudgetGoalsProps {
    transactions: Transaction[];
}

/**
 * BudgetGoals Component
 * Allows users to set monthly budget goals for different categories
 * and track their progress with visual indicators
 */
export default function BudgetGoals({ transactions }: BudgetGoalsProps) {
    const [goals, setGoals] = useState<BudgetGoal[]>([]);
    const [showSetup, setShowSetup] = useState(false);
    const [newGoal, setNewGoal] = useState({ category: '', limit: '' });
    const currentMonth = getCurrentMonth();

    // Load goals from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(BUDGET_GOALS_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as BudgetGoal[];
                setGoals(parsed);
            }
        } catch (error) {
            console.error('Failed to load budget goals:', error);
        }
    }, []);

    // Save goals to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(BUDGET_GOALS_STORAGE_KEY, JSON.stringify(goals));
        } catch (error) {
            console.error('Failed to save budget goals:', error);
        }
    }, [goals]);

    // Calculate progress for current month
    const progress = useMemo(
        () => calculateBudgetProgress(transactions, goals, currentMonth),
        [transactions, goals, currentMonth]
    );

    // Get alert count
    const alerts = useMemo(() => {
        return progress.filter(p => p.status === 'warning' || p.status === 'exceeded');
    }, [progress]);

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        const limitNum = Number(newGoal.limit);
        if (!newGoal.category || !limitNum || limitNum <= 0) return;

        // Check if goal already exists for this category and month
        const existingIndex = goals.findIndex(
            g => g.category === newGoal.category && g.month === currentMonth
        );

        if (existingIndex >= 0) {
            // Update existing goal
            const updated = [...goals];
            updated[existingIndex] = {
                category: newGoal.category,
                monthlyLimit: limitNum,
                month: currentMonth
            };
            setGoals(updated);
        } else {
            // Add new goal
            setGoals([
                ...goals,
                {
                    category: newGoal.category,
                    monthlyLimit: limitNum,
                    month: currentMonth
                }
            ]);
        }

        setNewGoal({ category: '', limit: '' });
    };

    const handleRemoveGoal = (category: string) => {
        setGoals(goals.filter(g => !(g.category === category && g.month === currentMonth)));
    };

    const handleResetMonthlyGoals = () => {
        if (confirm('Reset all goals for next month? Current month goals will be preserved.')) {
            // Create new goals for next month based on current ones
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const nextMonthStr = nextMonth.toISOString().slice(0, 7);

            const currentMonthGoals = goals.filter(g => g.month === currentMonth);
            const newMonthGoals = currentMonthGoals.map(g => ({
                ...g,
                month: nextMonthStr
            }));

            setGoals([...goals, ...newMonthGoals]);
        }
    };

    if (progress.length === 0 && !showSetup) {
        return (
            <section className="bg-white shadow rounded-md p-6 border border-gray-100">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Budget Goals</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Set monthly spending limits for different categories to track your progress
                    </p>
                    <button
                        onClick={() => setShowSetup(true)}
                        className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:brightness-110 transition"
                    >
                        Set Budget Goals
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white shadow rounded-md border border-gray-100">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Budget Goals</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Track your spending against monthly limits
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {alerts.length > 0 && (
                            <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                {alerts.length} alert{alerts.length > 1 ? 's' : ''}
                            </div>
                        )}
                        <button
                            onClick={() => setShowSetup(!showSetup)}
                            className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                        >
                            {showSetup ? 'Hide Setup' : 'Manage Goals'}
                        </button>
                    </div>
                </div>
            </div>

            {showSetup && (
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <form onSubmit={handleAddGoal} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1">Category</label>
                                <input
                                    type="text"
                                    list="category-suggestions"
                                    value={newGoal.category}
                                    onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                                    className="w-full rounded border-gray-300 text-sm"
                                    placeholder="e.g. Food"
                                />
                                <datalist id="category-suggestions">
                                    {DEFAULT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1">Monthly Limit</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newGoal.limit}
                                    onChange={e => setNewGoal({ ...newGoal, limit: e.target.value })}
                                    className="w-full rounded border-gray-300 text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:brightness-110 transition"
                                >
                                    Add Goal
                                </button>
                            </div>
                        </div>
                    </form>
                    {goals.filter(g => g.month === currentMonth).length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleResetMonthlyGoals}
                                className="px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition"
                            >
                                Copy Goals to Next Month
                            </button>
                        </div>
                    )}
                </div>
            )}

            {progress.length > 0 && (
                <div className="p-6 space-y-4">
                    {progress.map(p => (
                        <ProgressBar key={p.category} progress={p} onRemove={handleRemoveGoal} />
                    ))}
                </div>
            )}

            {progress.length > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <BudgetSummary progress={progress} />
                </div>
            )}
        </section>
    );
}

/**
 * Progress bar component for individual category
 */
function ProgressBar({ progress, onRemove }: { progress: BudgetProgress; onRemove: (category: string) => void }) {
    const { category, spent, limit, percentage, remaining, status } = progress;

    const barColor =
        status === 'exceeded' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500';

    const textColor =
        status === 'exceeded' ? 'text-red-700' : status === 'warning' ? 'text-yellow-700' : 'text-green-700';

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{category}</span>
                    {status === 'exceeded' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            Over budget
                        </span>
                    )}
                    {status === 'warning' && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                            Approaching limit
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onRemove(category)}
                    className="text-gray-400 hover:text-red-600 text-xs"
                    title="Remove goal"
                >
                    ✕
                </button>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                </div>
                <span className={`text-xs font-medium tabular-nums ${textColor}`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                    Spent: <span className="font-medium">{formatCurrency(spent)}</span>
                </span>
                <span>
                    Limit: <span className="font-medium">{formatCurrency(limit)}</span>
                </span>
                <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {remaining >= 0 ? 'Remaining' : 'Over'}: <span className="font-medium">{formatCurrency(Math.abs(remaining))}</span>
                </span>
            </div>
        </div>
    );
}

/**
 * Summary card showing budget performance overview
 */
function BudgetSummary({ progress }: { progress: BudgetProgress[] }) {
    const withinBudget = progress.filter(p => p.status === 'safe').length;
    const warnings = progress.filter(p => p.status === 'warning').length;
    const exceeded = progress.filter(p => p.status === 'exceeded').length;
    const total = progress.length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-md p-3 border border-gray-200">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Goals</div>
                <div className="text-xl font-semibold mt-1">{total}</div>
            </div>
            <div className="bg-white rounded-md p-3 border border-green-200">
                <div className="text-xs text-green-600 uppercase tracking-wide">On Track</div>
                <div className="text-xl font-semibold text-green-600 mt-1">{withinBudget}</div>
            </div>
            <div className="bg-white rounded-md p-3 border border-yellow-200">
                <div className="text-xs text-yellow-600 uppercase tracking-wide">Warning</div>
                <div className="text-xl font-semibold text-yellow-600 mt-1">{warnings}</div>
            </div>
            <div className="bg-white rounded-md p-3 border border-red-200">
                <div className="text-xs text-red-600 uppercase tracking-wide">Exceeded</div>
                <div className="text-xl font-semibold text-red-600 mt-1">{exceeded}</div>
            </div>
        </div>
    );
}
