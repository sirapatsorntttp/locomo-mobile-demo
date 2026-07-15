import type { DailyVehicleStat } from '@/types'
import { Table, Th, Td } from '@/components/ui'

interface Props { data: DailyVehicleStat[] }

export default function VehicleTable({ data }: Props) {
  const types = data.length > 0 ? Object.keys(data[0].by_type) : []
  const grandTotal = data.reduce((s, d) => s + d.total, 0)
  const typeTotals = types.reduce((acc, t) => {
    acc[t] = data.reduce((s, d) => s + (d.by_type[t] ?? 0), 0)
    return acc
  }, {} as Record<string, number>)

  const typeColors: Record<string, string> = {
    'รถตู้': 'text-blue-600',
    'มินิบัส': 'text-violet-600',
    'รถบัส': 'text-emerald-600',
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>วันที่</Th>
          <Th>รวม</Th>
          {types.map(t => <Th key={t}>{t}</Th>)}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.date} className="table-row-hover transition-colors">
            <Td><span className="text-xs font-medium text-slate-600">{row.date}</span></Td>
            <Td><span className="text-xs font-bold text-slate-800">{row.total}</span></Td>
            {types.map(t => (
              <Td key={t}><span className={`text-xs font-semibold ${typeColors[t] ?? 'text-slate-600'}`}>{row.by_type[t] ?? 0}</span></Td>
            ))}
          </tr>
        ))}
        <tr className="bg-slate-50 border-t-2 border-slate-200">
          <Td><span className="text-xs font-bold text-slate-700 uppercase tracking-wide">รวม</span></Td>
          <Td><span className="text-xs font-bold text-slate-900">{grandTotal}</span></Td>
          {types.map(t => (
            <Td key={t}><span className={`text-xs font-bold ${typeColors[t] ?? 'text-slate-600'}`}>{typeTotals[t]}</span></Td>
          ))}
        </tr>
      </tbody>
    </Table>
  )
}
