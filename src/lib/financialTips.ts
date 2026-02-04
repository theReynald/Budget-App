import { FinancialTip } from '../types';

// Storage key used by TipOfDay component
export const DAILY_TIP_STORAGE_KEY = 'daily_tip_v1';

// Static dataset of financial tips. Keep ids stable.
const TIPS: FinancialTip[] = [
    {
        id: 'tip-budget-50-30-20',
        category: 'budgeting',
        title: 'Use the 50/30/20 Rule',
        description: 'Allocate 50% needs, 30% wants, 20% saving/debt to keep spending balanced.',
        content: 'Allocate 50% of net income to needs, 30% to wants, and 20% to saving or debt payoff.',
        actionable: 'List last month’s net income, apply percentages, and adjust categories today.',
        difficulty: 'easy'
    },
    {
        id: 'tip-track-small',
        category: 'budgeting',
        title: 'Track Small Purchases',
        description: 'Small daily expenses add up—log them to curb impulse spending.',
        content: 'Minor daily expenses (coffee, snacks) can add up. Logging them raises awareness and curbs impulse spending.',
        actionable: 'Track every sub-$10 spend for one week in a note.',
        difficulty: 'easy'
    },
    {
        id: 'tip-emergency-fund',
        category: 'saving',
        title: 'Build an Emergency Fund',
        description: 'Target 3–6 months essential expenses in a high-yield account.',
        content: 'Aim for 3–6 months of essential expenses in a separate high-yield savings account for resilience.',
        actionable: 'Open a high-yield savings account and set an automatic weekly transfer.',
        difficulty: 'moderate'
    },
    {
        id: 'tip-round-up',
        category: 'saving',
        title: 'Automate Round-Ups',
        description: 'Round transactions and save the difference—micro-savings add up.',
        content: 'Use a tool that rounds transactions and saves the difference—effortless micro-savings accumulate.',
        actionable: 'Enable round-up feature in your banking or fintech app today.',
        difficulty: 'easy'
    },
    {
        id: 'tip-debt-snowball',
        category: 'debt',
        title: 'Try the Debt Snowball',
        description: 'Attack smallest balance debts first for momentum.',
        content: 'Pay smallest balances first for motivational wins while making minimums on others, then roll payments forward.',
        actionable: 'List debts by balance; pay the smallest aggressively this month.',
        difficulty: 'moderate'
    },
    {
        id: 'tip-debt-avalanche',
        category: 'debt',
        title: 'Or Use Debt Avalanche',
        description: 'Pay highest interest rate debt first to reduce interest cost.',
        content: 'Target the highest interest rate debt first to minimize total interest paid over time.',
        actionable: 'Sort debts by APR; increase payment to top APR account.',
        difficulty: 'advanced'
    },
    {
        id: 'tip-invest-index',
        category: 'investing',
        title: 'Favor Broad Index Funds',
        description: 'Low-cost diversified index funds beat most active strategies net of fees.',
        content: 'Low-cost diversified index funds often outperform frequent stock picking after fees.',
        actionable: 'Compare total expense ratios; shift one holding to a broad index fund.',
        difficulty: 'moderate'
    },
    {
        id: 'tip-invest-auto',
        category: 'investing',
        title: 'Automate Contributions',
        description: 'Recurring transfers enforce discipline and dollar-cost averaging.',
        content: 'Set recurring transfers to investment accounts to enforce consistency and dollar-cost averaging.',
        actionable: 'Schedule an automatic monthly transfer after next payday.',
        difficulty: 'easy'
    },
    {
        id: 'tip-mindset-delay',
        category: 'mindset',
        title: 'Delay Gratification',
        description: 'A 24h pause before wants kills impulse buys.',
        content: 'Waiting 24 hours before non-essential purchases filters out emotional spending.',
        actionable: 'Add desired item to a list and revisit tomorrow.',
        difficulty: 'easy'
    },
    {
        id: 'tip-mindset-incremental',
        category: 'mindset',
        title: 'Think Incrementally',
        description: 'Small 1% improvements compound heavily over time.',
        content: 'Small, repeatable improvements (1% gains) compound into large financial progress over time.',
        actionable: 'Pick one recurring bill and reduce it by a few percent.',
        difficulty: 'easy'
    }
];

// Deterministic daily pick based on date string.
export function pickTipForDate(date: Date = new Date()): FinancialTip {
    const key = date.toISOString().substring(0, 10); // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const index = hash % TIPS.length;
    return TIPS[index];
}

// Random tip excluding given ids.
export function randomTip(excludeIds: string[] = []): FinancialTip {
    const pool = TIPS.filter(t => !excludeIds.includes(t.id));
    if (pool.length === 0) {
        // fallback if all excluded
        return TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
}

export function getTipById(id: string): FinancialTip | undefined {
    return TIPS.find(t => t.id === id);
}

export function allTips(): FinancialTip[] {
    return [...TIPS];
}
