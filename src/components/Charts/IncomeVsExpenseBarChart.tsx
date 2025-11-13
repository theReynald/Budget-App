/**
 * IncomeVsExpenseBarChart.tsx
 * ---------------------------------------------
 * Bar chart component comparing monthly income vs expenses
 */

import React, { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, getCommonChartOptions, exportChartAsImage } from '../../lib/chartUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IncomeVsExpenseBarChartProps {
    labels: string[];
    income: number[];
    expenses: number[];
    title?: string;
}

export function IncomeVsExpenseBarChart({
    labels,
    income,
    expenses,
    title = 'Income vs Expenses Comparison'
}: IncomeVsExpenseBarChartProps) {
    const chartRef = useRef<ChartJS<'bar'>>(null);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Income',
                data: income,
                backgroundColor: CHART_COLORS.success,
                borderColor: CHART_COLORS.success,
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: expenses,
                backgroundColor: CHART_COLORS.danger,
                borderColor: CHART_COLORS.danger,
                borderWidth: 1
            }
        ]
    };

    const options: ChartOptions<'bar'> = {
        ...getCommonChartOptions(),
        plugins: {
            ...getCommonChartOptions().plugins,
            title: {
                display: true,
                text: title,
                color: CHART_COLORS.primary,
                font: {
                    size: 16,
                    weight: 'bold' as const
                },
                padding: 20
            },
            tooltip: {
                ...getCommonChartOptions().plugins.tooltip,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const value = context.parsed.y;
                        if (value !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(value);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value: string | number) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };

    const handleExport = () => {
        if (chartRef.current) {
            exportChartAsImage(chartRef.current, `${title.replace(/\s+/g, '-').toLowerCase()}.png`);
        }
    };

    if (labels.length === 0) {
        return (
            <div className="bg-white rounded-md shadow border border-gray-100 p-8 text-center">
                <p className="text-gray-500 text-sm">No data available for this chart</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-md shadow border border-gray-100 p-6">
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleExport}
                    className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition"
                    title="Export chart as PNG"
                >
                    📥 Export
                </button>
            </div>
            <Bar ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
