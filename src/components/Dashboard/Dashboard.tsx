/**
 * Dashboard.tsx
 * ---------------------------------------------
 * Main dashboard component combining all chart visualizations with filtering
 */

import React from 'react';
import { Transaction } from '../../types';
import { useChartData } from '../../hooks/useChartData';
import { CategoryPieChart } from '../Charts/CategoryPieChart';
import { MonthlyTrendChart } from '../Charts/MonthlyTrendChart';
import { IncomeVsExpenseBarChart } from '../Charts/IncomeVsExpenseBarChart';
import { RunningBalanceChart } from '../Charts/RunningBalanceChart';

interface DashboardProps {
    transactions: Transaction[];
    startingBalance: number;
}

export function Dashboard({ transactions, startingBalance }: DashboardProps) {
    const {
        categorySpendingData,
        categoryIncomeData,
        monthlyTrendData,
        runningBalanceData,
        filters,
        setDateRange,
        resetFilters
    } = useChartData(transactions, startingBalance);

    const hasFilters = filters.dateRange.start !== null || filters.dateRange.end !== null || filters.categories.length > 0;

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Financial Dashboard</h2>
                    <p className="text-sm text-gray-500 mt-1">Visualize your spending patterns and financial trends</p>
                </div>
                {hasFilters && (
                    <button
                        onClick={resetFilters}
                        className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-md shadow border border-gray-100 p-4">
                <h3 className="text-sm font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium mb-1">Start Date</label>
                        <input
                            type="date"
                            onChange={e => setDateRange(e.target.value ? new Date(e.target.value) : null, filters.dateRange.end)}
                            className="w-full rounded border-gray-300 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">End Date</label>
                        <input
                            type="date"
                            onChange={e => setDateRange(filters.dateRange.start, e.target.value ? new Date(e.target.value) : null)}
                            className="w-full rounded border-gray-300 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Spending Pie Chart */}
                <CategoryPieChart
                    labels={categorySpendingData.labels}
                    data={categorySpendingData.data}
                    colors={categorySpendingData.colors}
                    title="Expense Breakdown by Category"
                />

                {/* Category Income Pie Chart */}
                <CategoryPieChart
                    labels={categoryIncomeData.labels}
                    data={categoryIncomeData.data}
                    colors={categoryIncomeData.colors}
                    title="Income Breakdown by Category"
                />
            </div>

            {/* Monthly Trend Line Chart - Full Width */}
            <MonthlyTrendChart
                labels={monthlyTrendData.labels}
                income={monthlyTrendData.income}
                expenses={monthlyTrendData.expenses}
                title="Monthly Income vs Expenses Trend"
            />

            {/* Bottom Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expense Bar Chart */}
                <IncomeVsExpenseBarChart
                    labels={monthlyTrendData.labels}
                    income={monthlyTrendData.income}
                    expenses={monthlyTrendData.expenses}
                    title="Monthly Comparison"
                />

                {/* Running Balance Area Chart */}
                <RunningBalanceChart
                    labels={runningBalanceData.labels}
                    data={runningBalanceData.data}
                    title="Balance Over Time"
                />
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-md shadow border border-gray-100 p-4">
                <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Categories</p>
                        <p className="text-lg font-semibold text-primary">
                            {new Set(transactions.map(t => t.category)).size}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
                        <p className="text-lg font-semibold text-primary">{transactions.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Transaction</p>
                        <p className="text-lg font-semibold text-primary">
                            ${transactions.length > 0 
                                ? (transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(2)
                                : '0.00'
                            }
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                        <p className="text-lg font-semibold text-accent">
                            ${runningBalanceData.data[runningBalanceData.data.length - 1]?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
