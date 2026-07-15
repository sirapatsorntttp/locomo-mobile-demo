import type { Attendance } from '@/types'
import { Table, Th, Td, Badge } from '@/components/ui'
import { getAttendanceStatusLabel, getAttendanceTypeLabel, formatDatetime } from '@/lib/utils'

interface Props { attendances: Attendance[] }

const stateColors = {
  reserved: 'success' as const,
  not_reserved: 'warning' as const,
  not_found: 'gray' as const,
}

export default function AttendanceTable({ attendances }: Props) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>RFID</Th>
          <Th>พนักงาน</Th>
          <Th>จุดจอด (point)</Th>
          <Th>ประเภทสแกน</Th>
          <Th>สถานะ (is_state)</Th>
          <Th>เวลาสแกน</Th>
        </tr>
      </thead>
      <tbody>
        {attendances.map(a => (
          <tr key={a.id} className="table-row-hover cursor-pointer transition-colors">
            <Td><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{a.rfid}</span></Td>
            <Td>
              <div>
                <p className="text-xs font-semibold text-slate-700">{a.employee?.first_name_th} {a.employee?.last_name_th}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.employee?.code}</p>
              </div>
            </Td>
            <Td>
              <div>
                <p className="text-xs text-slate-600">{a.point?.name_th}</p>
                <p className="text-[10px] font-mono text-slate-400">{a.point?.code}</p>
              </div>
            </Td>
            <Td>
              <Badge variant={a.type === 'rfid' ? 'info' : 'default'}>
                {a.type === 'rfid' ? '🪪 RFID' : '📱 QR Code'}
              </Badge>
            </Td>
            <Td>
              <Badge variant={stateColors[a.is_state]}>
                {getAttendanceStatusLabel(a.is_state)}
              </Badge>
            </Td>
            <Td><span className="text-[10px] text-slate-400">{formatDatetime(a.created_at)}</span></Td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
