/**
 * chartUtils.ts
 * ---------------------------------------------
 * Utility functions for preparing and formatting data for Chart.js visualizations.
 * Includes data aggregation, color generation, and chart configuration helpers.
 */

import { Transaction, TransactionType } from '../types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';

/**
 * Chart color palette matching the Tailwind design system
 */
export const CHART_COLORS = {
    primary: '#1F2D3D',
    accent: '#F26522',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    indigo: '#6366F1',
    gray: '#6B7280'
};

/**
 * Default category colors - expandable palette for unlimited categories
 */
export const CATEGORY_COLORS = [
    CHART_COLORS.accent,
    CHART_COLORS.info,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.purple,
    CHART_COLORS.pink,
    CHART_COLORS.teal,
    CHART_COLORS.cyan,
    CHART_COLORS.indigo,
    CHART_COLORS.danger
];

/**
 * Get category spending data for pie/donut charts
 */
export function getCategorySpendingData(transactions: Transaction[], type: TransactionType = 'expense') {
    const categoryMap = new Map<string, number>();
    
    transactions
        .filter(t => t.type === type)
        .forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + t.amount);
        });
    
    const labels = Array.from(categoryMap.keys());
    const data = Array.from(categoryMap.values());
    const colors = labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
    
    return { labels, data, colors };
}

/**
 * Get monthly trend data for line/area charts
 */
export function getMonthlyTrendData(transactions: Transaction[], months: number = 6) {
    // Get the last N months
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const monthList = eachMonthOfInterval({ start: startDate, end: now });
    
    const monthlyData = monthList.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthTransactions = transactions.filter(t => {
            const tDate = parseISO(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });
        
        const income = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            month: format(month, 'MMM yyyy'),
            income,
            expenses,
            net: income - expenses
        };
    });
    
    return {
        labels: monthlyData.map(d => d.month),
        income: monthlyData.map(d => d.income),
        expenses: monthlyData.map(d => d.expenses),
        net: monthlyData.map(d => d.net)
    };
}

/**
 * Get running balance data for area chart
 */
export function getRunningBalanceData(
    transactions: Transaction[],
    startingBalance: number,
    months: number = 6
) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const monthList = eachMonthOfInterval({ start: startDate, end: now });
    
    let balance = startingBalance;
    const balanceData = [];
    
    for (const month of monthList) {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthTransactions = transactions.filter(t => {
            const tDate = parseISO(t.date);
            return tDate >= monthStart && tDate <= monthEnd;
        });
        
        const monthChange = monthTransactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);
        
        balance += monthChange;
        balanceData.push({
            month: format(month, 'MMM yyyy'),
            balance
        });
    }
    
    return {
        labels: balanceData.map(d => d.month),
        data: balanceData.map(d => d.balance)
    };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
    transactions: Transaction[],
    startDate: Date | null,
    endDate: Date | null
): Transaction[] {
    return transactions.filter(t => {
        const tDate = parseISO(t.date);
        if (startDate && tDate < startDate) return false;
        if (endDate && tDate > endDate) return false;
        return true;
    });
}

/**
 * Filter transactions by category
 */
export function filterTransactionsByCategory(
    transactions: Transaction[],
    categories: string[]
): Transaction[] {
    if (categories.length === 0) return transactions;
    return transactions.filter(t => categories.includes(t.category));
}

/**
 * Common chart options following the design system
 */
export function getCommonChartOptions(responsive: boolean = true) {
    return {
        responsive,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: CHART_COLORS.primary,
                    font: {
                        size: 12
                    },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: CHART_COLORS.primary,
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: CHART_COLORS.accent,
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        }
    };
}

/**
 * Export chart as image
 */
export function exportChartAsImage(chartRef: { canvas?: HTMLCanvasElement } | null, filename: string = 'chart.png') {
    if (!chartRef) return;
    
    const canvas = chartRef.canvas;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
}
