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
