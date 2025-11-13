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
import { Transaction, TransactionType } from './types';
import { computeTotals, computeEndingBalance, formatCurrency } from './lib/calculations';
import TipOfDay from './components/TipOfDay';

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

            {/* Summary statistic cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Starting" value={formatCurrency(startingBalance)} />
                <StatCard label="Income" value={formatCurrency(incomeTotal)} positive />
                <StatCard label="Expenses" value={formatCurrency(expenseTotal)} negative />
            </section>

            {/* Centered ending balance highlight */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1" />
                <StatCard label="Ending Balance" value={formatCurrency(endingBalance)} highlight />
                <div className="sm:col-span-1" />
            </section>

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
                                <td className="px-3 py-2">{t.description}</td>
                                <td className="px-3 py-2 text-xs text-gray-500">{t.category}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {t.type === 'expense' ? '-' : ''}
                                    {formatCurrency(t.amount)}
                                </td>
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
