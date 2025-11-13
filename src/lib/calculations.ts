import { Transaction, Totals, TransactionType, BudgetGoal, BudgetProgress } from '../types';

export function computeTotals(transactions: Transaction[]): Totals {
    return transactions.reduce(
        (acc, t) => {
            if (t.type === 'income') acc.incomeTotal += t.amount;
            else acc.expenseTotal += t.amount;
            return acc;
        },
        { incomeTotal: 0, expenseTotal: 0 }
    );
}

export function groupByCategory(
    transactions: Transaction[],
    type: TransactionType
): { category: string; total: number }[] {
    const map = new Map<string, number>();
    for (const t of transactions) {
        if (t.type !== type) continue;
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }));
}

export function computeEndingBalance(
    startingBalance: number,
    incomeTotal: number,
    expenseTotal: number
): number {
    return startingBalance + incomeTotal - expenseTotal;
}

export function computeSavingsPercent(startingBalance: number, netSavings: number): number | null {
    if (startingBalance <= 0) return null;
    return (netSavings / startingBalance) * 100;
}

export function normalizePeriod(dateISO: string): string {
    const d = new Date(dateISO);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    if (day <= 7) return '1st-7th';
    if (day <= 14) return '8th-14th';
    if (day <= 21) return '15th-21st';
    return '22nd-31st';
}

export function formatCurrency(n: number): string {
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

export function round1(n: number): number {
    return Math.round(n * 10) / 10;
}

/**
 * Calculate budget progress for all categories with goals
 */
export function calculateBudgetProgress(
    transactions: Transaction[],
    goals: BudgetGoal[],
    currentMonth: string
): BudgetProgress[] {
    // Filter transactions for current month and expenses only
    const monthExpenses = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const txMonth = t.date.slice(0, 7); // Extract YYYY-MM
        return txMonth === currentMonth;
    });

    // Group expenses by category
    const categorySpending = groupByCategory(monthExpenses, 'expense');
    const spendingMap = new Map(categorySpending.map(c => [c.category, c.total]));

    // Calculate progress for each goal
    return goals
        .filter(g => g.month === currentMonth)
        .map(goal => {
            const spent = spendingMap.get(goal.category) || 0;
            const percentage = goal.monthlyLimit > 0 ? (spent / goal.monthlyLimit) * 100 : 0;
            const remaining = goal.monthlyLimit - spent;
            
            let status: 'safe' | 'warning' | 'exceeded' = 'safe';
            if (spent > goal.monthlyLimit) {
                status = 'exceeded';
            } else if (percentage >= 80) {
                status = 'warning';
            }

            return {
                category: goal.category,
                spent,
                limit: goal.monthlyLimit,
                percentage,
                remaining,
                status
            };
        });
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
}
