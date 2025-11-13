/**
 * CategoryPieChart.tsx
 * ---------------------------------------------
 * Pie chart component showing spending breakdown by category
 */

import React, { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { getCommonChartOptions, exportChartAsImage } from '../../lib/chartUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryPieChartProps {
    labels: string[];
    data: number[];
    colors: string[];
    title?: string;
}

export function CategoryPieChart({ labels, data, colors, title = 'Spending by Category' }: CategoryPieChartProps) {
    const chartRef = useRef<ChartJS<'pie'>>(null);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Amount',
                data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }
        ]
    };

    const options: ChartOptions<'pie'> = {
        ...getCommonChartOptions(),
        plugins: {
            ...getCommonChartOptions().plugins,
            title: {
                display: true,
                text: title,
                color: '#1F2D3D',
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
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        const value = context.parsed;
                        label += new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(value);
                        return label;
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

    if (data.length === 0) {
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
            <Pie ref={chartRef} data={chartData} options={options} />
        </div>
    );
}
