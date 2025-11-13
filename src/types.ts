export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    type: TransactionType;
    date: string; // ISO
    periodTag: string;
    amount: number;
    description: string;
    category: string;
}

export interface MonthData {
    startingBalance: number;
    transactions: Transaction[];
    version?: number;
}

export interface CategoryStore {
    income: string[];
    expense: string[];
}

export interface Totals {
    incomeTotal: number;
    expenseTotal: number;
}

// === Financial Tips & AI Expansion Types ===
export type TipCategory = 'budgeting' | 'saving' | 'investing' | 'debt' | 'mindset';

export interface FinancialTip {
    id: string;
    category: TipCategory;
    title: string;
    description: string;
    // Optional richer metadata used by UI (legacy fields kept for compatibility)
    content?: string; // duplicate/alternate description text
    actionable?: string; // a concrete action suggestion
    difficulty?: string; // e.g., 'easy', 'moderate', 'advanced'
}

export interface StoredDailyTip {
    date: string; // YYYY-MM-DD
    tipId: string;
    revealed?: boolean; // optional to allow legacy saves without this field
}

export interface AIExpandedTip {
    tipId: string;
    // Legacy alias fields for UI that may refer to baseTipId/createdAt
    baseTipId?: string;
    summary: string;
    deeperDive: string;
    keyPoints: string[];
    actionPlan: string[];
    sources: { title: string; url?: string }[]; // richer source objects
    generatedAt: string; // ISO date-time
    createdAt?: string; // optional alias to generatedAt for compatibility
    model: string; // model identifier used
    /** Indicates origin of expansion content */
    source?: 'openrouter' | 'fallback';
    /** Optional machine-readable reason for fallback or status e.g. 'missing-key', 'network-error', 'parse-error', 'success' */
    reason?: string;
}

export interface AIExpandResponse {
    expansion: AIExpandedTip;
    cached?: boolean;
}

export interface AIErrorResponse {
    error: string;
}

// === Smart Budget Recommendations & AI Financial Advisor Types ===

export interface CategorySpending {
    category: string;
    amount: number;
    percentage: number;
}

export interface BudgetAnalysis {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    categoryBreakdown: CategorySpending[];
    recommendations: string[];
    insights: string[];
    alerts: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatRequest {
    message: string;
    context?: {
        startingBalance: number;
        transactions: Transaction[];
    };
}

export interface ChatResponse {
    message: string;
    model: string;
    timestamp: string;
}

export interface MonthlyReport {
    month: string;
    summary: string;
    financialHealth: 'excellent' | 'good' | 'fair' | 'needs-attention';
    keyMetrics: {
        income: number;
        expenses: number;
        savings: number;
        savingsRate: number;
    };
    categoryInsights: {
        category: string;
        spent: number;
        trend: 'up' | 'down' | 'stable';
        recommendation: string;
    }[];
    actionItems: string[];
    goalsProgress?: {
        goal: string;
        progress: number;
    }[];
    generatedAt: string;
    model: string;
}

export interface AnalyzeBudgetRequest {
    startingBalance: number;
    transactions: Transaction[];
}

export interface AnalyzeBudgetResponse {
    analysis: BudgetAnalysis;
    cached?: boolean;
}
