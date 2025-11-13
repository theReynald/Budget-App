import { Transaction, CategorySpending, BudgetAnalysis } from '../types';
import { computeTotals, groupByCategory } from './calculations';

/**
 * Analyzes spending patterns and generates insights based on financial best practices
 * Uses the 50/30/20 rule as a baseline: 50% needs, 30% wants, 20% savings
 */
export function analyzeBudget(
    startingBalance: number,
    transactions: Transaction[]
): Omit<BudgetAnalysis, 'recommendations' | 'insights' | 'alerts'> {
    const { incomeTotal, expenseTotal } = computeTotals(transactions);
    const netSavings = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? (netSavings / incomeTotal) * 100 : 0;

    // Get category breakdown
    const expenseCategories = groupByCategory(transactions, 'expense');
    const categoryBreakdown: CategorySpending[] = expenseCategories.map(cat => ({
        category: cat.category,
        amount: cat.total,
        percentage: expenseTotal > 0 ? (cat.total / expenseTotal) * 100 : 0
    }));

    return {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        netSavings,
        savingsRate,
        categoryBreakdown
    };
}

/**
 * Generates budget recommendations based on analysis
 */
export function generateRecommendations(
    analysis: Omit<BudgetAnalysis, 'recommendations' | 'insights' | 'alerts'>
): string[] {
    const recommendations: string[] = [];

    // Savings rate recommendations
    if (analysis.savingsRate < 0) {
        recommendations.push('⚠️ You are spending more than you earn. Reduce expenses or increase income urgently.');
    } else if (analysis.savingsRate < 10) {
        recommendations.push('💡 Your savings rate is below 10%. Try to save at least 10-20% of your income.');
    } else if (analysis.savingsRate >= 20) {
        recommendations.push('✅ Great job! You are saving 20% or more of your income.');
    }

    // Category-specific recommendations
    const housingCat = analysis.categoryBreakdown.find(c => 
        c.category.toLowerCase().includes('housing') || c.category.toLowerCase().includes('rent')
    );
    if (housingCat && housingCat.percentage > 35) {
        recommendations.push(`🏠 Housing costs (${housingCat.percentage.toFixed(1)}%) exceed the recommended 30%. Consider housing alternatives.`);
    }

    const foodCat = analysis.categoryBreakdown.find(c =>
        c.category.toLowerCase().includes('food') || c.category.toLowerCase().includes('groceries')
    );
    if (foodCat && foodCat.percentage > 15) {
        recommendations.push(`🍽️ Food spending (${foodCat.percentage.toFixed(1)}%) is high. Meal planning could help reduce costs.`);
    }

    // Diversification check
    const topCategory = analysis.categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 50) {
        recommendations.push(`📊 ${topCategory.category} represents ${topCategory.percentage.toFixed(1)}% of spending. Consider diversifying expenses.`);
    }

    return recommendations;
}

/**
 * Generates financial insights based on spending patterns
 */
export function generateInsights(
    analysis: Omit<BudgetAnalysis, 'recommendations' | 'insights' | 'alerts'>
): string[] {
    const insights: string[] = [];

    // Income vs expenses insight
    if (analysis.totalIncome > 0) {
        insights.push(`📈 Monthly income: $${analysis.totalIncome.toFixed(2)}, Expenses: $${analysis.totalExpenses.toFixed(2)}`);
    }

    // Savings insight
    if (analysis.netSavings > 0) {
        insights.push(`💰 Net savings this month: $${analysis.netSavings.toFixed(2)} (${analysis.savingsRate.toFixed(1)}%)`);
    } else if (analysis.netSavings < 0) {
        insights.push(`⚠️ Deficit this month: $${Math.abs(analysis.netSavings).toFixed(2)}`);
    }

    // Top spending categories
    if (analysis.categoryBreakdown.length > 0) {
        const top3 = analysis.categoryBreakdown.slice(0, 3);
        insights.push(`📊 Top spending categories: ${top3.map(c => `${c.category} (${c.percentage.toFixed(1)}%)`).join(', ')}`);
    }

    return insights;
}

/**
 * Generates alerts for unusual spending patterns
 */
export function generateAlerts(
    analysis: Omit<BudgetAnalysis, 'recommendations' | 'insights' | 'alerts'>,
    transactions: Transaction[]
): string[] {
    const alerts: string[] = [];

    // Check for large transactions (>20% of total expenses)
    if (analysis.totalExpenses > 0) {
        const largeTransactions = transactions.filter(
            t => t.type === 'expense' && t.amount > analysis.totalExpenses * 0.2
        );
        if (largeTransactions.length > 0) {
            alerts.push(`🔔 ${largeTransactions.length} large transaction(s) detected (>${(analysis.totalExpenses * 0.2).toFixed(2)})`);
        }
    }

    // Check for negative balance
    if (analysis.netSavings < 0) {
        alerts.push('⚠️ Warning: Spending exceeds income this period');
    }

    // Check number of expense categories
    if (analysis.categoryBreakdown.length > 10) {
        alerts.push('📝 Consider consolidating categories - you have many expense categories');
    }

    return alerts;
}

/**
 * Complete budget analysis with all components
 */
export function performFullAnalysis(
    startingBalance: number,
    transactions: Transaction[]
): BudgetAnalysis {
    const baseAnalysis = analyzeBudget(startingBalance, transactions);
    
    return {
        ...baseAnalysis,
        recommendations: generateRecommendations(baseAnalysis),
        insights: generateInsights(baseAnalysis),
        alerts: generateAlerts(baseAnalysis, transactions)
    };
}

/**
 * Prepare budget data for AI analysis - anonymizes sensitive info
 */
export function prepareBudgetDataForAI(
    startingBalance: number,
    transactions: Transaction[]
): string {
    const analysis = performFullAnalysis(startingBalance, transactions);
    
    // Create a structured summary without personal identifiers
    const summary = {
        income: analysis.totalIncome,
        expenses: analysis.totalExpenses,
        savings: analysis.netSavings,
        savingsRate: analysis.savingsRate,
        categories: analysis.categoryBreakdown.map(c => ({
            category: c.category,
            amount: c.amount,
            percentage: c.percentage
        })),
        transactionCount: transactions.length
    };

    return JSON.stringify(summary, null, 2);
}
