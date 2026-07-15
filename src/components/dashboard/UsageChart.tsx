'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DailyUsageStat } from '@/types'

interface Props { data: DailyUsageStat[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <p className="font-bold text-slate-700 mb-2 text-xs">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function UsageChart({ data }: Props) {
  const totalReserves = data.reduce((s, d) => s + d.reserves, 0)
  const totalAttended = data.reduce((s, d) => s + d.attended, 0)
  const totalNot = data.reduce((s, d) => s + d.not_attended, 0)

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} formatter={(v) => <span style={{ color: '#64748b' }}>{v}</span>} />
          <Bar dataKey="reserves" name="จอง (reserves)" fill="#bfdbfe" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="attended" name="ขึ้นรถ (attended)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="not_attended" name="ไม่ขึ้นรถ" fill="#fca5a5" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
        {[
          { label: 'รวมการจอง', value: totalReserves, color: '#bfdbfe', text: 'text-blue-600' },
          { label: 'ขึ้นรถจริง', value: totalAttended, color: '#3b82f6', text: 'text-blue-700' },
          { label: 'ไม่ขึ้นรถ', value: totalNot, color: '#fca5a5', text: 'text-red-600' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
            <div>
              <p className="text-[10px] text-slate-500">{item.label}</p>
              <p className={`text-sm font-bold ${item.text}`}>{item.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
