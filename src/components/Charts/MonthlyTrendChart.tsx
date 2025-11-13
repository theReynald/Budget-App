/**
 * MonthlyTrendChart.tsx
 * ---------------------------------------------
 * Line chart component showing income and expense trends over time
 */

import React, { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CHART_COLORS, getCommonChartOptions, exportChartAsImage } from '../../lib/chartUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MonthlyTrendChartProps {
    labels: string[];
    income: number[];
    expenses: number[];
    title?: string;
}

export function MonthlyTrendChart({
    labels,
    income,
    expenses,
    title = 'Monthly Income vs Expenses'
}: MonthlyTrendChartProps) {
    const chartRef = useRef<ChartJS<'line'>>(null);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Income',
                data: income,
                borderColor: CHART_COLORS.success,
                backgroundColor: CHART_COLORS.success + '20',
                tension: 0.3,
                fill: false
            },
            {
                label: 'Expenses',
                data: expenses,
                borderColor: CHART_COLORS.danger,
                backgroundColor: CHART_COLORS.danger + '20',
                tension: 0.3,
                fill: false
            }
        ]
    };

    const options: ChartOptions<'line'> = {
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
            <Line ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
