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
