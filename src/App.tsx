/**
 * App.tsx
 * ---------------------------------------------
 * Main UI surface for the budget prototype. This file intentionally
 * keeps state local (no global store yet) and demonstrates how the
 * calculation utilities are consumed. It renders:
 *  - Summary stat cards (starting, income, expenses, ending balance)
 *  - A lightweight form to add income / expense transactions
 *  - A simple table listing transactions
 *
 * Future expansion ideas (not implemented here):
 *  - Persist to localStorage
 *  - Category management & validation
 *  - Chart visualizations (pie / line) using chart.js
 *  - Month switching & historical views
 *  - Dedicated state store (Zustand) & derived selectors
 *  - Input validation + accessibility improvements
 */
import React, { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Transaction, TransactionType } from './types';
import { computeTotals, computeEndingBalance, formatCurrency } from './lib/calculations';
import TipOfDay from './components/TipOfDay';

ChartJS.register(ArcElement, Tooltip, Legend);

// Vibrant color palette for spending categories
const CATEGORY_COLORS = [
    '#F4D03F', // Yellow (Investments)
    '#58D68D', // Green (Mortgage)
    '#45B7AA', // Teal (Savings)
    '#E97451', // Coral (Discretionary)
    '#A569BD', // Purple (Food)
    '#5DADE2', // Blue (Transport)
    '#CD6155', // Brown (Insurance)
    '#76D7C4', // Cyan (Phone)
    '#F1948A', // Pink (Subscriptions)
    '#85929E', // Gray
];

/**
 * Seed demo data shown on initial load. In a production scenario this
 * would likely come from persistence (localStorage / API) or be empty.
 */
const demoTransactions: Transaction[] = [
    {
        id: nanoid(),
        type: 'income',
        date: new Date().toISOString(),
        periodTag: '1st-7th',
        amount: 3200,
        description: 'Salary',
        category: 'Job'
    },
    {
        id: nanoid(),
        type: 'expense',
        date: new Date().toISOString(),
        periodTag: '1st-7th',
        amount: 1200,
        description: 'Rent',
        category: 'Housing'
    },
    {
        id: nanoid(),
        type: 'expense',
        date: new Date().toISOString(),
        periodTag: '1st-7th',
        amount: 150,
        description: 'Groceries',
        category: 'Food'
    }
];

/**
 * Top-level application component.
 *
 * State managed here:
 *  - startingBalance: User-provided number representing funds at month start.
 *  - transactions: List of income + expense entries.
 *  - form: Controlled inputs for creating a new transaction.
 *
 * Derived (memoized) values:
 *  - incomeTotal, expenseTotal via computeTotals
 *  - endingBalance via computeEndingBalance
 */
export default function App() {
    // ----------------------------
    // Local state
    // ----------------------------
    const [startingBalance, setStartingBalance] = useState(500); // Editable baseline number
    const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions); // Mutable list of entries
    const [form, setForm] = useState({
        type: 'expense' as TransactionType,
        description: '',
        category: '',
        amount: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ description: '', category: '', amount: '' });

    function deleteTransaction(id: string) {
        setTransactions(t => t.filter(tx => tx.id !== id));
    }

    function startEdit(t: Transaction) {
        setEditingId(t.id);
        setEditForm({ description: t.description, category: t.category, amount: String(t.amount) });
    }

    function saveEdit(id: string) {
        const amountNum = Number(editForm.amount);
        if (!amountNum || amountNum <= 0) return;
        setTransactions(txs => txs.map(t => 
            t.id === id ? { ...t, description: editForm.description, category: editForm.category, amount: amountNum } : t
        ));
        setEditingId(null);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    // ----------------------------
    // Derived computations (memoized for cheap re-renders)
    // ----------------------------
    const { incomeTotal, expenseTotal } = useMemo(() => computeTotals(transactions), [transactions]);
    const endingBalance = useMemo(
        () => computeEndingBalance(startingBalance, incomeTotal, expenseTotal),
        [startingBalance, incomeTotal, expenseTotal]
    );

    /**
     * Form submit handler – validates numeric amount then appends a new
     * transaction to state. For now we:
     *  - Derive periodTag statically ("1st-7th") – could be dynamic based on date
     *  - Fallback description/category if user leaves them blank
     */
    function addTransaction(e: React.FormEvent) {
        e.preventDefault();
        const amountNum = Number(form.amount);
        if (!amountNum || amountNum <= 0) return;
        setTransactions(t => [
            ...t,
            {
                id: nanoid(),
                type: form.type,
                amount: amountNum,
                description: form.description || 'Entry',
                category: form.category || (form.type === 'income' ? 'General Income' : 'General Expense'),
                periodTag: '1st-7th',
                date: new Date().toISOString()
            }
        ]);
        setForm(f => ({ ...f, description: '', category: '', amount: '' }));
    }

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Monthly Budget</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Starter interface – add income & expenses to see totals update. Replace this with your real UI.
                </p>
            </header>

            {/* Tip of the Day educational panel */}
            <TipOfDay />

            {/* Summary statistic cards - all on one line */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Starting" value={formatCurrency(startingBalance)} />
                <StatCard label="Income" value={formatCurrency(incomeTotal)} positive />
                <StatCard label="Expenses" value={formatCurrency(expenseTotal)} negative />
                <StatCard label="Ending Balance" value={formatCurrency(endingBalance)} highlight />
            </section>

            {/* Monthly Spending Donut Chart */}
            <SpendingDonutChart transactions={transactions} />

            {/* Transaction entry form */}
            <form onSubmit={addTransaction} className="bg-white shadow rounded-md p-4 space-y-4 border border-gray-100">
                <h2 className="font-semibold text-lg">Add Transaction</h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium mb-1">Type</label>
                        <select
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value as TransactionType }))}
                            className="w-full rounded border-gray-300 text-sm"
                        >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Description</label>
                        <input
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full rounded border-gray-300 text-sm"
                            placeholder="e.g. Rent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Category</label>
                        <input
                            value={form.category}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full rounded border-gray-300 text-sm"
                            placeholder="e.g. Housing"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            className="w-full rounded border-gray-300 text-sm"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:brightness-110 transition"
                    >
                        Add
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Starting Balance:</span>
                        <input
                            type="number"
                            value={startingBalance}
                            onChange={e => setStartingBalance(Number(e.target.value) || 0)}
                            className="w-24 rounded border-gray-300"
                        />
                    </div>
                </div>
            </form>

            {/* Transactions table */}
            <section className="bg-white shadow rounded-md border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                            <th className="text-left px-3 py-2">Type</th>
                            <th className="text-left px-3 py-2">Description</th>
                            <th className="text-left px-3 py-2">Category</th>
                            <th className="text-right px-3 py-2">Amount</th>
                            <th className="text-center px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium">
                                    {t.type === 'income' ? (
                                        <span className="text-green-600">Income</span>
                                    ) : (
                                        <span className="text-red-600">Expense</span>
                                    )}
                                </td>
                                {editingId === t.id ? (
                                    <>
                                        <td className="px-3 py-2">
                                            <input
                                                value={editForm.description}
                                                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                                className="w-full rounded border-gray-300 text-sm px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                value={editForm.category}
                                                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                                className="w-full rounded border-gray-300 text-sm px-2 py-1"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                value={editForm.amount}
                                                onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                                                className="w-full rounded border-gray-300 text-sm px-2 py-1 text-right"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => saveEdit(t.id)}
                                                className="text-green-600 hover:text-green-800 text-xs font-medium mr-2"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-3 py-2">{t.description}</td>
                                        <td className="px-3 py-2 text-xs text-gray-500">{t.category}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {t.type === 'expense' ? '-' : ''}
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => startEdit(t)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTransaction(t.id)}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Footer notes */}
            <footer className="pt-4 text-xs text-center text-gray-400">
                <p>
                    Placeholder demo. Customize this UI, add persistence (localStorage / backend), charts, and category
                    management next.
                </p>
            </footer>
        </main>
    );
}

/**
 * Reusable stat display card.
 *
 * Props:
 *  - label: Descriptor text
 *  - value: Already formatted string (e.g., currency)
 *  - positive / negative: Optional semantic color hints
 *  - highlight: Accent styling for emphasis
 */
function StatCard({
    label,
    value,
    positive,
    negative,
    highlight
}: {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
    highlight?: boolean;
}) {
    return (
        <div
            className={
                'rounded-md border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-1 ' +
                (highlight ? 'ring-2 ring-accent/20' : '')
            }
        >
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
            <span
                className={
                    'text-lg font-semibold tabular-nums ' +
                    (positive ? 'text-green-600' : '') +
                    (negative ? 'text-red-600' : '') +
                    (highlight ? 'text-accent' : '')
                }
            >
                {value}
            </span>
        </div>
    );
}

/**
 * Spending Donut Chart Component
 * Shows expense breakdown by category in a donut chart with center total
 */
function SpendingDonutChart({ transactions }: { transactions: Transaction[] }) {
    // Group expenses by category
    const categoryData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryMap = new Map<string, number>();
        
        expenses.forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + t.amount);
        });
        
        // Sort by amount descending
        const sorted = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1]);
        
        return {
            labels: sorted.map(([cat]) => cat),
            amounts: sorted.map(([, amt]) => amt),
            total: sorted.reduce((sum, [, amt]) => sum + amt, 0)
        };
    }, [transactions]);

    const chartData = {
        labels: categoryData.labels,
        datasets: [
            {
                data: categoryData.amounts,
                backgroundColor: CATEGORY_COLORS.slice(0, categoryData.labels.length),
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                padding: 14,
                titleFont: {
                    size: 14,
                    weight: 'bold' as const,
                },
                bodyFont: {
                    size: 13,
                },
                cornerRadius: 10,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed;
                        const percentage = ((value / categoryData.total) * 100).toFixed(1);
                        return ` ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <section className="rounded-2xl p-6 bg-white shadow-lg border border-gray-100">
            <h2 className="font-semibold text-lg mb-4 text-center text-gray-800">Monthly Spending</h2>
            <div className="flex flex-col items-center">
                {/* 3D effect container with perspective */}
                <div 
                    className="relative"
                    style={{
                        perspective: '800px',
                        perspectiveOrigin: 'center center',
                    }}
                >
                    {/* Shadow layer underneath */}
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: 'rotateX(55deg) translateY(30px)',
                            filter: 'blur(15px)',
                            opacity: 0.3,
                            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
                            borderRadius: '50%',
                        }}
                    />
                    
                    {/* Main chart with tilt */}
                    <div
                        className="relative w-[220px] h-[220px]"
                        style={{
                            transform: 'rotateX(45deg)',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        {/* Depth/thickness layer */}
                        <div
                            className="absolute inset-0"
                            style={{
                                transform: 'translateZ(-20px)',
                                filter: 'brightness(0.7) blur(1px)',
                            }}
                        >
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                        
                        {/* Main front surface */}
                        <div className="relative">
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                        
                        {/* Center label */}
                        <div 
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                            style={{ transform: 'translateZ(5px)' }}
                        >
                            <span className="text-gray-500 text-xs font-medium">Total</span>
                            <span className="text-gray-800 text-lg font-bold">
                                {formatCurrency(categoryData.total)}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Category Labels */}
                <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-[250px]">
                    {categoryData.labels.map((label, index) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: CATEGORY_COLORS[index] }}
                            />
                            <span className="text-gray-700 text-xs truncate">{label}:</span>
                            <span className="text-gray-900 text-xs font-semibold ml-auto">
                                {formatCurrency(categoryData.amounts[index])}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
