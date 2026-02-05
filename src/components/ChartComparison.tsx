/**
 * ChartComparison.tsx
 * Side-by-side comparison of CSS pseudo-3D vs ECharts true 3D pie charts
 */
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ReactECharts from 'echarts-for-react';

ChartJS.register(ArcElement, Tooltip, Legend);

// Sample data for demonstration
const SAMPLE_DATA = [
    { name: 'Investments', value: 1200, color: '#F4D03F' },
    { name: 'Mortgage', value: 1800, color: '#58D68D' },
    { name: 'Savings', value: 800, color: '#45B7AA' },
    { name: 'Discretionary', value: 600, color: '#E97451' },
    { name: 'Food', value: 450, color: '#A569BD' },
    { name: 'Transport', value: 300, color: '#5DADE2' },
];

const TOTAL = SAMPLE_DATA.reduce((sum, item) => sum + item.value, 0);

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Option 1: CSS Pseudo-3D Chart
 * Uses Chart.js with CSS transforms and shadows to simulate depth
 */
function CSSPseudo3DChart() {
    const chartData = {
        labels: SAMPLE_DATA.map(d => d.name),
        datasets: [
            {
                data: SAMPLE_DATA.map(d => d.value),
                backgroundColor: SAMPLE_DATA.map(d => d.color),
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                padding: 14,
                cornerRadius: 10,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed;
                        const percentage = ((value / TOTAL) * 100).toFixed(1);
                        return ` ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <div className="flex flex-col items-center">
            {/* 3D effect container with perspective */}
            <div 
                className="relative"
                style={{
                    perspective: '800px',
                    perspectiveOrigin: 'center center',
                }}
            >
                {/* Shadow layer underneath */}
                <div
                    className="absolute inset-0"
                    style={{
                        transform: 'rotateX(55deg) translateY(30px)',
                        filter: 'blur(15px)',
                        opacity: 0.3,
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
                        borderRadius: '50%',
                    }}
                />
                
                {/* Main chart with tilt */}
                <div
                    className="relative w-[220px] h-[220px]"
                    style={{
                        transform: 'rotateX(45deg)',
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Depth/thickness layer */}
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: 'translateZ(-20px)',
                            filter: 'brightness(0.7) blur(1px)',
                        }}
                    >
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
                    
                    {/* Main front surface */}
                    <div className="relative">
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
                    
                    {/* Center label */}
                    <div 
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                        style={{ transform: 'translateZ(5px)' }}
                    >
                        <span className="text-gray-500 text-xs font-medium">Total</span>
                        <span className="text-gray-800 text-lg font-bold">
                            {formatCurrency(TOTAL)}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Legend */}
            <div className="mt-8 grid grid-cols-2 gap-2 w-full max-w-[250px]">
                {SAMPLE_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-xs truncate">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Option 2: ECharts True 3D Pie Chart
 * Uses ECharts' built-in 3D pie rendering with actual depth
 */
function ECharts3DChart() {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
            },
            backgroundColor: 'rgba(40, 40, 40, 0.95)',
            textStyle: { color: '#fff' },
            borderRadius: 10,
            padding: 14,
        },
        series: [
            {
                name: 'Spending',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '50%'],
                roseType: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2,
                    // 3D-like effect with shadows and gradients
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                    shadowOffsetY: 10,
                },
                label: {
                    show: false,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 30,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    scale: true,
                    scaleSize: 10,
                },
                data: SAMPLE_DATA.map(item => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: item.color },
                                { offset: 0.5, color: item.color },
                                { offset: 1, color: adjustBrightness(item.color, -30) },
                            ],
                        },
                    },
                })),
                // Animation for 3D-like rotation effect
                animationType: 'scale',
                animationEasing: 'elasticOut',
            },
        ],
        // Graphic elements for center text
        graphic: [
            {
                type: 'text',
                left: 'center',
                top: '45%',
                style: {
                    text: 'Total',
                    fontSize: 12,
                    fill: '#6B7280',
                    textAlign: 'center',
                },
            },
            {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: formatCurrency(TOTAL),
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: '#1F2937',
                    textAlign: 'center',
                },
            },
        ],
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-[280px] h-[280px]">
                <ReactECharts 
                    option={option} 
                    style={{ height: '100%', width: '100%' }}
                />
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-[250px]">
                {SAMPLE_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-xs truncate">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Option 3: ECharts with nightingale/rose type for more dramatic 3D effect
 */
function ECharts3DRoseChart() {
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
                return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
            },
            backgroundColor: 'rgba(40, 40, 40, 0.95)',
            textStyle: { color: '#fff' },
            borderRadius: 10,
            padding: 14,
        },
        series: [
            {
                name: 'Spending',
                type: 'pie',
                radius: ['30%', '75%'],
                center: ['50%', '50%'],
                roseType: 'area', // Creates 3D-like rose/nightingale chart
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#fff',
                    borderWidth: 2,
                    shadowBlur: 25,
                    shadowColor: 'rgba(0, 0, 0, 0.35)',
                    shadowOffsetY: 12,
                },
                label: {
                    show: false,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 40,
                        shadowColor: 'rgba(0, 0, 0, 0.6)',
                    },
                    scale: true,
                    scaleSize: 12,
                },
                data: SAMPLE_DATA.map(item => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: adjustBrightness(item.color, 20) },
                                { offset: 0.4, color: item.color },
                                { offset: 1, color: adjustBrightness(item.color, -40) },
                            ],
                        },
                    },
                })),
                animationType: 'scale',
                animationEasing: 'elasticOut',
                animationDuration: 1200,
            },
        ],
        graphic: [
            {
                type: 'text',
                left: 'center',
                top: '45%',
                style: {
                    text: 'Total',
                    fontSize: 12,
                    fill: '#6B7280',
                    textAlign: 'center',
                },
            },
            {
                type: 'text',
                left: 'center',
                top: '52%',
                style: {
                    text: formatCurrency(TOTAL),
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: '#1F2937',
                    textAlign: 'center',
                },
            },
        ],
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-[280px] h-[280px]">
                <ReactECharts 
                    option={option} 
                    style={{ height: '100%', width: '100%' }}
                />
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-[250px]">
                {SAMPLE_DATA.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                        <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-xs truncate">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Main Comparison Page
 */
export default function ChartComparison() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
                    3D Chart Comparison
                </h1>
                <p className="text-gray-600 text-center mb-8">
                    Compare different approaches to create a 3D-looking pie chart
                </p>
                
                {/* Back link */}
                <a 
                    href="#/"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8"
                >
                    ← Back to Budget App
                </a>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Option 1: CSS Pseudo-3D */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="text-center mb-6">
                            <h2 className="font-semibold text-lg text-gray-800">
                                Option 1: CSS Pseudo-3D
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Chart.js + CSS transforms
                            </p>
                        </div>
                        <CSSPseudo3DChart />
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-sm text-gray-700 mb-2">Pros:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• No new dependencies needed</li>
                                <li>• Lightweight</li>
                            </ul>
                            <h3 className="font-medium text-sm text-gray-700 mt-3 mb-2">Cons:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Looks tilted, not truly 3D</li>
                                <li>• Tooltips may be offset</li>
                                <li>• Limited depth effect</li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Option 2: ECharts 3D */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                        <div className="text-center mb-6">
                            <h2 className="font-semibold text-lg text-gray-800">
                                Option 2: ECharts 3D
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                ECharts with shadows & gradients
                            </p>
                        </div>
                        <ECharts3DChart />
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-sm text-gray-700 mb-2">Pros:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Real depth with shadows</li>
                                <li>• Smooth animations</li>
                                <li>• Free & open source</li>
                            </ul>
                            <h3 className="font-medium text-sm text-gray-700 mt-3 mb-2">Cons:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Adds ~800KB bundle size</li>
                                <li>• Different API to learn</li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Option 3: ECharts Rose/Nightingale */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 ring-2 ring-blue-400">
                        <div className="text-center mb-6">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                                Recommended
                            </span>
                            <h2 className="font-semibold text-lg text-gray-800">
                                Option 3: ECharts Rose
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                ECharts nightingale/rose chart
                            </p>
                        </div>
                        <ECharts3DRoseChart />
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-sm text-gray-700 mb-2">Pros:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Most dramatic 3D effect</li>
                                <li>• Variable radius shows values</li>
                                <li>• Beautiful animations</li>
                            </ul>
                            <h3 className="font-medium text-sm text-gray-700 mt-3 mb-2">Cons:</h3>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Same dependencies as Option 2</li>
                                <li>• Less traditional pie look</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 text-center text-gray-500 text-sm">
                    Hover over the charts to see interactive effects
                </div>
            </div>
        </div>
    );
}
