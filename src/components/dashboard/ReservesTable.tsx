import type { Reserve } from '@/types'
import { Table, Th, Td, Badge } from '@/components/ui'
import { getReserveStatusLabel, getReserveStatusVariant, formatDatetime, getPlatformIcon, getDeviceIcon } from '@/lib/utils'

interface Props { reserves: Reserve[] }

export default function ReservesTable({ reserves }: Props) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>พนักงาน</Th>
          <Th>กะ (shift)</Th>
          <Th>จุดจอด (point)</Th>
          <Th>โซน</Th>
          <Th>แพลตฟอร์ม</Th>
          <Th>สถานะ (is_state)</Th>
          <Th>วันที่จอง</Th>
        </tr>
      </thead>
      <tbody>
        {reserves.map(r => (
          <tr key={r.id} className="table-row-hover cursor-pointer transition-colors">
            <Td>
              <div>
                <p className="text-xs font-semibold text-slate-700">{r.employee?.first_name_th} {r.employee?.last_name_th}</p>
                <p className="text-[10px] font-mono text-slate-400">{r.employee?.code}</p>
              </div>
            </Td>
            <Td>
              <div>
                <p className="text-xs text-slate-600">{r.shift?.name_th}</p>
                <p className="text-[10px] text-slate-400">{r.shift?.default_time} น.</p>
              </div>
            </Td>
            <Td>
              <div>
                <p className="text-xs text-slate-600">{r.point?.name_th}</p>
                <p className="text-[10px] font-mono text-slate-400">{r.point?.code}</p>
              </div>
            </Td>
            <Td><span className="text-xs text-slate-500">{r.plant_company_zone?.zone?.name_th ?? '-'}</span></Td>
            <Td>
              <span className="text-sm">{getPlatformIcon(r.platform)}</span>
              <span className="text-sm ml-1">{getDeviceIcon(r.device)}</span>
            </Td>
            <Td>
              <Badge variant={getReserveStatusVariant(r.is_state)}>
                {getReserveStatusLabel(r.is_state)}
              </Badge>
            </Td>
            <Td><span className="text-[10px] text-slate-400">{formatDatetime(r.created_at)}</span></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
