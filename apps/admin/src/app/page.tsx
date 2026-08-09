'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  Globe2,
  Percent,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@stellar-pay/ui';
import { adminApi } from '@/lib/api';
import type { DashboardMetrics } from '@stellar-pay/types';

// ------------------------------------------------------------------ Color palette
const ASSET_COLORS = [
  '#818cf8', // indigo
  '#c084fc', // purple
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#38bdf8', // sky
  '#fb923c', // orange
  '#a78bfa', // violet
];

const CHART_THEME = {
  grid: '#26263a',
  axis: '#9b9bb0',
  tooltip: { bg: '#16161f', border: '#26263a' },
};

// ------------------------------------------------------------------ Helpers

function formatCurrency(value: string | undefined): string {
  if (!value || value === '0') return '$0.00';
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function formatInt(value: number | undefined): string {
  if (value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

// ------------------------------------------------------------------ Animated counter

function AnimatedCounter({ value, duration = 800 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const num = Number(value);
    if (isNaN(num)) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const step = Math.max(1, Math.ceil(num / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) {
        setDisplay(num);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ------------------------------------------------------------------ Success rate gauge

function SuccessGauge({ rate }: { rate: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - rate / 100);
  const color = rate >= 95 ? '#34d399' : rate >= 85 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={120} height={120} className="-rotate-90">
          <circle cx={60} cy={60} r={radius} stroke="#26263a" strokeWidth={8} fill="none" />
          <circle
            cx={60}
            cy={60}
            r={radius}
            stroke={color}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {rate}%
          </span>
          <span className="text-[10px] text-muted-foreground">success</span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Main component

const RANGE_OPTIONS = ['7d', '30d', '90d'] as const;

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [volume, setVolume] = useState<
    Array<{ date: string; volume: string; transactions: number }>
  >([]);
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [volumeLoading, setVolumeLoading] = useState(true);

  // Fetch dashboard metrics.
  const fetchMetrics = useCallback(() => {
    setLoading(true);
    void adminApi.admin
      .dashboard()
      .then(setMetrics)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  // Fetch volume data.
  const fetchVolume = useCallback((r: '7d' | '30d' | '90d') => {
    setVolumeLoading(true);
    void adminApi.admin
      .volume({ range: r })
      .then(setVolume)
      .catch(() => undefined)
      .finally(() => setVolumeLoading(false));
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchVolume(range);
  }, [fetchMetrics, fetchVolume, range]);

  // Derived data.
  const assetPieData = useMemo(() => {
    if (!metrics?.assetUsage) return [];
    return Object.entries(metrics.assetUsage)
      .map(([name, count]) => ({ name, value: Number(count) }))
      .sort((a, b) => b.value - a.value);
  }, [metrics]);

  const volumeTrend = useMemo(() => {
    if (volume.length < 2) return 0;
    const first = Number(volume[0].volume);
    const last = Number(volume[volume.length - 1].volume);
    if (first === 0) return 100;
    return Math.round(((last - first) / first) * 100);
  }, [volume]);

  // KPI cards config.
  const kpiCards = useMemo(
    () => [
      {
        label: 'Daily volume',
        value: metrics?.dailyVolume ?? '0',
        icon: CircleDollarSign,
        tint: 'text-indigo-400',
        bg: 'bg-indigo-500/10',
        format: (v: string) => formatCurrency(v),
      },
      {
        label: 'Monthly volume',
        value: metrics?.monthlyVolume ?? '0',
        icon: TrendingUp,
        tint: 'text-fuchsia-400',
        bg: 'bg-fuchsia-500/10',
        format: (v: string) => formatCurrency(v),
      },
      {
        label: 'Total revenue',
        value: metrics?.revenue ?? '0',
        icon: Wallet,
        tint: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        format: (v: string) => formatCurrency(v),
      },
      {
        label: 'Active users',
        value: String(metrics?.activeUsers ?? 0),
        icon: Users,
        tint: 'text-sky-400',
        bg: 'bg-sky-500/10',
        format: (v: string) => formatInt(Number(v)),
      },
      {
        label: 'Active merchants',
        value: String(metrics?.activeMerchants ?? 0),
        icon: Store,
        tint: 'text-amber-400',
        bg: 'bg-amber-500/10',
        format: (v: string) => formatInt(Number(v)),
      },
      {
        label: 'Failed txs',
        value: String(metrics?.failedTransactions ?? 0),
        icon: ShieldAlert,
        tint: 'text-rose-400',
        bg: 'bg-rose-500/10',
        format: (v: string) => String(Number(v)),
      },
    ],
    [metrics],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time platform metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          {metrics && (
            <Badge
              variant={metrics.paymentSuccessRate >= 95 ? 'success' : 'warning'}
              className="gap-1.5"
            >
              <Zap className="h-3 w-3" />
              {metrics.paymentSuccessRate}% success
            </Badge>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <Card
            key={card.label}
            className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:border-indigo-500/30"
          >
            <div
              className={`absolute -right-3 -top-3 h-16 w-16 rounded-full ${card.bg} blur-xl transition-transform group-hover:scale-125`}
            />
            <CardContent className="relative space-y-2 p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <card.icon className={`h-3.5 w-3.5 ${card.tint}`} />
                {card.label}
              </div>
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="font-mono text-lg font-bold tracking-tight">
                  {card.format(card.value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Volume area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-indigo-400" />
              Transaction volume
            </CardTitle>
            <div className="flex items-center gap-2">
              {volume.length > 0 && (
                <span
                  className={`flex items-center gap-0.5 text-xs ${
                    volumeTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {volumeTrend >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(volumeTrend)}%
                </span>
              )}
              <Tabs value={range} onValueChange={(v) => setRange(v as '7d' | '30d' | '90d')}>
                <TabsList className="h-7">
                  {RANGE_OPTIONS.map((r) => (
                    <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                      {r}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : volume.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <Activity className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                  No transaction data yet
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={volume} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={CHART_THEME.axis}
                    fontSize={11}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis stroke={CHART_THEME.axis} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: CHART_THEME.tooltip.bg,
                      border: `1px solid ${CHART_THEME.tooltip.border}`,
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: '#f4f4f8', fontWeight: 600 }}
                    formatter={(val: any) => [`$${Number(val ?? 0).toLocaleString()}`, 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#818cf8"
                    fill="url(#volumeGrad)"
                    strokeWidth={2}
                    name="Volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    stroke="#34d399"
                    fill="url(#countGrad)"
                    strokeWidth={2}
                    name="Transactions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right column: success gauge + cross-border */}
        <div className="space-y-4">
          {/* Success rate gauge */}
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-center gap-2 text-sm">
                <Percent className="h-4 w-4 text-emerald-400" />
                Payment success rate
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
              {loading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <SuccessGauge rate={metrics?.paymentSuccessRate ?? 100} />
              )}
            </CardContent>
          </Card>

          {/* Cross-border card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe2 className="h-4 w-4 text-sky-400" />
                Cross-border
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Volume</span>
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(metrics?.crossBorder.volume)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Transactions</span>
                    <span className="font-mono text-sm font-semibold">
                      {formatInt(metrics?.crossBorder.transactions)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Countries</span>
                    <span className="font-mono text-sm font-semibold">
                      {metrics?.crossBorder.countries ?? '—'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row: pie chart + top merchants */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Asset distribution pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Asset distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : assetPieData.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No asset data available
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie
                      data={assetPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {assetPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={ASSET_COLORS[i % ASSET_COLORS.length]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: CHART_THEME.tooltip.bg,
                        border: `1px solid ${CHART_THEME.tooltip.border}`,
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val ?? 0)} txs`,
                        String(name ?? ''),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex-1 space-y-1.5">
                  {assetPieData.slice(0, 8).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: ASSET_COLORS[i % ASSET_COLORS.length],
                          }}
                        />
                        <span className="font-mono font-medium">{item.name}</span>
                      </div>
                      <span className="tabular-nums text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top merchants + recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-purple-400" />
              Top merchants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : !metrics?.topMerchants?.length ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No active merchants yet
              </div>
            ) : (
              <div className="space-y-1">
                {metrics.topMerchants.map((merchant, i) => (
                  <div
                    key={merchant.merchantId}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent/50"
                  >
                    {/* Rank */}
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : i === 1
                            ? 'bg-slate-400/20 text-slate-300'
                            : i === 2
                              ? 'bg-orange-700/20 text-orange-400'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>

                    {/* Name + details */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{merchant.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {merchant.merchantId.slice(0, 12)}…
                      </p>
                    </div>

                    {/* Volume */}
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(merchant.volume)}
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="hidden w-16 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                          style={{
                            width: `${Math.max(5, 100 - i * 20 - Math.random() * 15)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats bar */}
      <Card className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-fuchsia-500/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Platform is running</p>
              <p className="text-xs text-muted-foreground">
                v0.1.0 · mainnet-ready scaffolding · {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-6">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total volume</p>
                  <p className="font-mono text-sm font-semibold">
                    <AnimatedCounter value={metrics?.revenue ?? '0'} />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Success</p>
                  <p className="font-mono text-sm font-semibold text-emerald-400">
                    {metrics?.paymentSuccessRate ?? 100}%
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
