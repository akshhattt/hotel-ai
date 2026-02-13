'use client';

import React from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Mock Data (replace with API calls in production) ────────

const meetingsData = [
    { week: 'W1', meetings: 12, target: 15 },
    { week: 'W2', meetings: 18, target: 15 },
    { week: 'W3', meetings: 14, target: 15 },
    { week: 'W4', meetings: 22, target: 15 },
    { week: 'W5', meetings: 19, target: 15 },
    { week: 'W6', meetings: 25, target: 15 },
    { week: 'W7', meetings: 21, target: 15 },
    { week: 'W8', meetings: 28, target: 15 },
];

const raiseVelocityData = [
    { week: 'Jan W1', raised: 250000, cumulative: 250000 },
    { week: 'Jan W2', raised: 500000, cumulative: 750000 },
    { week: 'Jan W3', raised: 350000, cumulative: 1100000 },
    { week: 'Jan W4', raised: 800000, cumulative: 1900000 },
    { week: 'Feb W1', raised: 1200000, cumulative: 3100000 },
    { week: 'Feb W2', raised: 950000, cumulative: 4050000 },
    { week: 'Feb W3', raised: 1500000, cumulative: 5550000 },
    { week: 'Feb W4', raised: 1100000, cumulative: 6650000 },
];

const funnelData = [
    { stage: 'Contacted', count: 312, color: '#4c6ef5' },
    { stage: 'Engaged', count: 187, color: '#748ffc' },
    { stage: 'Qualified', count: 94, color: '#06b6d4' },
    { stage: 'Meeting', count: 61, color: '#10b981' },
    { stage: 'Soft Commit', count: 28, color: '#f59e0b' },
    { stage: 'Hard Commit', count: 18, color: '#f97316' },
    { stage: 'Funded', count: 12, color: '#ef4444' },
];

const dealPipelines = [
    {
        name: 'Hampton Inn & Suites — Kahului, HI',
        totalRaise: 8500000,
        raised: 6630000,
        progress: 78,
        investors: 45,
        meetings: 12,
        daysToClose: 12,
        status: 'RAISING',
    },
    {
        name: 'Hilton Garden Inn — Phoenix, AZ',
        totalRaise: 12000000,
        raised: 5040000,
        progress: 42,
        investors: 67,
        meetings: 8,
        daysToClose: 34,
        status: 'RAISING',
    },
    {
        name: 'Home2 Suites — Sacramento, CA',
        totalRaise: 6000000,
        raised: 1080000,
        progress: 18,
        investors: 31,
        meetings: 4,
        daysToClose: 52,
        status: 'RAISING',
    },
];

const channelPerformance = [
    { name: 'Email', sent: 2400, opened: 960, replied: 192, meetings: 48 },
    { name: 'Voice AI', calls: 340, completed: 238, qualified: 95, meetings: 38 },
];

const investorTiers = [
    { name: 'A+ (Hot)', value: 18, color: '#10b981' },
    { name: 'A (Warm)', value: 47, color: '#06b6d4' },
    { name: 'B (Interest)', value: 94, color: '#f59e0b' },
    { name: 'C (Passive)', value: 112, color: '#6b7280' },
    { name: 'D (Cold)', value: 41, color: '#374151' },
];

// ─── Component ──────────────────────────────────────────────

export default function DashboardPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Peachtree Capital Velocity</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time investor acquisition & raise performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge-emerald">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                        Live
                    </span>
                    <select className="bg-surface-3 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                        <option>All Deals</option>
                        <option>Hampton Inn & Suites — Kahului, HI</option>
                        <option>Hilton Garden Inn — Phoenix, AZ</option>
                        <option>Home2 Suites — Sacramento, CA</option>
                    </select>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Meetings This Week"
                    value="28"
                    change="+33%"
                    trend="up"
                    subtext="Target: 15/week"
                />
                <MetricCard
                    label="Cost Per Qualified"
                    value="$38"
                    change="-12%"
                    trend="up"
                    subtext="Below $50 target"
                />
                <MetricCard
                    label="Active Pipeline"
                    value="$18.2M"
                    change="+8%"
                    trend="up"
                    subtext="312 investors"
                />
                <MetricCard
                    label="Avg Days to Close"
                    value="32"
                    change="-47%"
                    trend="up"
                    subtext="Target: <60 days"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meetings Per Week */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Meetings Per Week</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={meetingsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #2a3246', borderRadius: '12px' }}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <Bar dataKey="meetings" fill="url(#meetingGradient)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="target" fill="#374151" radius={[6, 6, 0, 0]} opacity={0.4} />
                            <defs>
                                <linearGradient id="meetingGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4c6ef5" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Raise Velocity */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Raise Velocity — Cumulative Capital</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={raiseVelocityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <YAxis
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #2a3246', borderRadius: '12px' }}
                                formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']}
                                labelStyle={{ color: '#9ca3af' }}
                            />
                            <defs>
                                <linearGradient id="raiseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#raiseGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Deal Pipeline Cards */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Active Deal Pipelines</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {dealPipelines.map((deal) => (
                        <DealCard key={deal.name} deal={deal} />
                    ))}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversion Funnel */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Investor Conversion Funnel</h3>
                    <div className="space-y-3">
                        {funnelData.map((stage, i) => {
                            const maxCount = funnelData[0].count;
                            const width = (stage.count / maxCount) * 100;
                            const convRate = i > 0 ? ((stage.count / funnelData[i - 1].count) * 100).toFixed(0) : '100';
                            return (
                                <div key={stage.stage} className="funnel-step">
                                    <div className="flex items-center gap-3 z-10">
                                        <span className="text-sm font-medium text-gray-300 w-24">{stage.stage}</span>
                                        <div className="w-48 h-6 rounded-lg bg-surface-4 overflow-hidden">
                                            <div
                                                className="h-full rounded-lg transition-all duration-1000 ease-out"
                                                style={{ width: `${width}%`, backgroundColor: stage.color }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 z-10">
                                        <span className="text-lg font-bold text-white">{stage.count}</span>
                                        {i > 0 && (
                                            <span className="text-xs text-gray-500">{convRate}% conv.</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Investor Quality Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Investor Tiers</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={investorTiers}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {investorTiers.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #2a3246', borderRadius: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                        {investorTiers.map((tier) => (
                            <div key={tier.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                                    <span className="text-gray-400">{tier.name}</span>
                                </div>
                                <span className="font-mono text-gray-300">{tier.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Channel Performance Table */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Channel Performance (30 Days)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="bg-surface-3/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center">
                                <MailSvg className="w-4 h-4 text-brand-400" />
                            </div>
                            <h4 className="text-sm font-semibold text-white">Email Outreach</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Sent" value="2,400" />
                            <MiniStat label="Opened" value="960" subtext="40%" />
                            <MiniStat label="Replied" value="192" subtext="8%" />
                            <MiniStat label="→ Meetings" value="48" subtext="2%" />
                        </div>
                    </div>

                    {/* Voice */}
                    <div className="bg-surface-3/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
                                <PhoneSvg className="w-4 h-4 text-accent-cyan" />
                            </div>
                            <h4 className="text-sm font-semibold text-white">Voice AI</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Calls Made" value="340" />
                            <MiniStat label="Completed" value="238" subtext="70%" />
                            <MiniStat label="Qualified" value="95" subtext="40%" />
                            <MiniStat label="→ Meetings" value="38" subtext="16%" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Status */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">Compliance Status</h3>
                    <span className="badge-emerald">All Clear</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <ComplianceStat label="Opt-Outs Processed" value="23" status="ok" />
                    <ComplianceStat label="Audit Events (30d)" value="4,812" status="ok" />
                    <ComplianceStat label="Compliance Violations" value="0" status="ok" />
                    <ComplianceStat label="506(b) Checks" value="312 pass" status="ok" />
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Components ─────────────────────────────────────────

function MetricCard({
    label, value, change, trend, subtext,
}: {
    label: string; value: string; change: string; trend: 'up' | 'down'; subtext: string;
}) {
    return (
        <div className="metric-card animate-slide-up">
            <p className="stat-label mb-2">{label}</p>
            <div className="flex items-end gap-2 mb-1">
                <p className="stat-value">{value}</p>
                <span className={`text-xs font-medium pb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {change}
                </span>
            </div>
            <p className="text-xs text-gray-500">{subtext}</p>
        </div>
    );
}

function DealCard({ deal }: { deal: typeof dealPipelines[0] }) {
    const progressColor = deal.progress >= 75 ? '#10b981' : deal.progress >= 40 ? '#f59e0b' : '#4c6ef5';

    return (
        <div className="glass-card-hover p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-white">{deal.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                        ${(deal.totalRaise / 1000000).toFixed(1)}M raise
                    </p>
                </div>
                <span className="badge-brand">{deal.daysToClose}d to close</span>
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">${(deal.raised / 1000000).toFixed(1)}M raised</span>
                    <span className="font-mono text-white">{deal.progress}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${deal.progress}%`, backgroundColor: progressColor }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-3/50 rounded-lg px-3 py-2">
                    <span className="text-gray-500 block">Investors</span>
                    <span className="text-white font-semibold">{deal.investors}</span>
                </div>
                <div className="bg-surface-3/50 rounded-lg px-3 py-2">
                    <span className="text-gray-500 block">Meetings</span>
                    <span className="text-white font-semibold">{deal.meetings}</span>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
    return (
        <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-white">{value}</span>
                {subtext && <span className="text-xs text-gray-500">{subtext}</span>}
            </div>
        </div>
    );
}

function ComplianceStat({ label, value, status }: { label: string; value: string; status: 'ok' | 'warning' | 'error' }) {
    const colors = {
        ok: 'text-emerald-400',
        warning: 'text-amber-400',
        error: 'text-rose-400',
    };

    return (
        <div className="bg-surface-3/50 rounded-xl px-4 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold ${colors[status]}`}>{value}</p>
        </div>
    );
}

function MailSvg({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    );
}

function PhoneSvg({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    );
}
