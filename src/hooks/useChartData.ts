/**
 * useChartData.ts
 * ---------------------------------------------
 * Custom hook for managing chart data with filtering capabilities.
 * Provides memoized chart data based on transactions and filter settings.
 */

import { useMemo, useState } from 'react';
import { Transaction } from '../types';
import {
    getCategorySpendingData,
    getMonthlyTrendData,
    getRunningBalanceData,
    filterTransactionsByDateRange,
    filterTransactionsByCategory
} from '../lib/chartUtils';

export interface ChartFilters {
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    categories: string[];
}

export interface ChartDataHook {
    filters: ChartFilters;
    setDateRange: (start: Date | null, end: Date | null) => void;
    setCategories: (categories: string[]) => void;
    resetFilters: () => void;
    categorySpendingData: ReturnType<typeof getCategorySpendingData>;
    categoryIncomeData: ReturnType<typeof getCategorySpendingData>;
    monthlyTrendData: ReturnType<typeof getMonthlyTrendData>;
    runningBalanceData: ReturnType<typeof getRunningBalanceData>;
    filteredTransactions: Transaction[];
}

const initialFilters: ChartFilters = {
    dateRange: { start: null, end: null },
    categories: []
};

export function useChartData(
    transactions: Transaction[],
    startingBalance: number
): ChartDataHook {
    const [filters, setFilters] = useState<ChartFilters>(initialFilters);

    // Apply filters to transactions
    const filteredTransactions = useMemo(() => {
        let filtered = transactions;
        
        // Apply date range filter
        filtered = filterTransactionsByDateRange(
            filtered,
            filters.dateRange.start,
            filters.dateRange.end
        );
        
        // Apply category filter
        filtered = filterTransactionsByCategory(filtered, filters.categories);
        
        return filtered;
    }, [transactions, filters]);

    // Memoized chart data calculations
    const categorySpendingData = useMemo(
        () => getCategorySpendingData(filteredTransactions, 'expense'),
        [filteredTransactions]
    );

    const categoryIncomeData = useMemo(
        () => getCategorySpendingData(filteredTransactions, 'income'),
        [filteredTransactions]
    );

    const monthlyTrendData = useMemo(
        () => getMonthlyTrendData(filteredTransactions),
        [filteredTransactions]
    );

    const runningBalanceData = useMemo(
        () => getRunningBalanceData(filteredTransactions, startingBalance),
        [filteredTransactions, startingBalance]
    );

    // Filter setters
    const setDateRange = (start: Date | null, end: Date | null) => {
        setFilters(prev => ({
            ...prev,
            dateRange: { start, end }
        }));
    };

    const setCategories = (categories: string[]) => {
        setFilters(prev => ({
            ...prev,
            categories
        }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    return {
        filters,
        setDateRange,
        setCategories,
        resetFilters,
        categorySpendingData,
        categoryIncomeData,
        monthlyTrendData,
        runningBalanceData,
        filteredTransactions
    };
}
