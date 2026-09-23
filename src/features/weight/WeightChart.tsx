import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { WeightLog } from './hooks/useWeightLogs'

interface WeightChartProps {
  logs: WeightLog[]
}

function movingAverage(data: { weight_kg: number }[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += data[j].weight_kg
    return Math.round((sum / window) * 10) / 10
  })
}

export function WeightChart({ logs }: WeightChartProps) {
  const chartData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 84)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const recent = logs.filter(l => l.log_date >= cutoffStr)
    if (recent.length === 0) return []

    const trend = movingAverage(recent, 3)
    return recent.map((l, i) => ({
      date: l.log_date,
      label: formatDate(l.log_date),
      weight: l.weight_kg,
      trend: trend[i],
      waist: l.waist_cm,
    }))
  }, [logs])

  const hasWaist = chartData.some(d => d.waist != null)

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-700">
        <p className="text-sm text-slate-500">No weight data yet. Log your first entry above.</p>
      </div>
    )
  }

  const weights = chartData.map(d => d.weight)
  const minW = Math.floor(Math.min(...weights) - 1)
  const maxW = Math.ceil(Math.max(...weights) + 1)

  return (
    <div className="rounded-xl bg-card p-3">
      <h3 className="mb-2 text-sm font-semibold text-slate-300">Last 12 Weeks</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={v => `${v}`}
            yAxisId="weight"
          />
          {hasWaist && (
            <YAxis
              yAxisId="waist"
              orientation="right"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `${v}`}
            />
          )}
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value, name) => {
              const unit = name === 'waist' ? ' cm' : ' kg'
              return [`${value}${unit}`, name === 'trend' ? 'Trend' : name === 'waist' ? 'Waist' : 'Weight']
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: '#10b981' }}
            name="Weight"
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="trend"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            connectNulls
            name="Trend"
          />
          {hasWaist && (
            <Line
              yAxisId="waist"
              type="monotone"
              dataKey="waist"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: '#f59e0b' }}
              connectNulls
              name="Waist"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
