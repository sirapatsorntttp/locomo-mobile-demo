'use client'
import { useState } from 'react'
import type { EmployeeFull } from '@/types'
import { Table, Th, Td, Badge } from '@/components/ui'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { Search } from 'lucide-react'

interface Props { employees: EmployeeFull[] }

export default function EmployeeTable({ employees }: Props) {
  const [search, setSearch] = useState('')

  const filtered = employees.filter(e =>
    `${e.first_name_th} ${e.last_name_th} ${e.code} ${e.rfid} ${e.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input className="text-xs bg-transparent outline-none text-slate-600 placeholder:text-slate-400 w-full" placeholder="ค้นหาชื่อ, รหัส, RFID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>รหัส</Th>
            <Th>RFID</Th>
            <Th>ชื่อ-นามสกุล</Th>
            <Th>อีเมล</Th>
            <Th>แผนก (dept)</Th>
            <Th>สาย (route)</Th>
            <Th>จุดจอด (point)</Th>
            <Th>สถานะ</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(emp => (
            <tr key={emp.id} className="table-row-hover cursor-pointer transition-colors">
              <Td><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{emp.code}</span></Td>
              <Td><span className="font-mono text-[10px] text-slate-400">{emp.rfid}</span></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">{emp.first_name_th.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{emp.first_name_th} {emp.last_name_th}</p>
                    <p className="text-[10px] text-slate-400">{emp.first_name_en} {emp.last_name_en}</p>
                  </div>
                </div>
              </Td>
              <Td><span className="text-xs text-sky-600 truncate block max-w-[160px]">{emp.email ?? '-'}</span></Td>
              <Td>
                <div>
                  <p className="text-xs text-slate-600 truncate max-w-[100px]">{emp.defaults?.organizationUnit?.nameTh ?? '-'}</p>
                  <p className="text-[10px] text-slate-400">{emp.defaults?.organizationUnit?.levelNameTh ?? ''}</p>
                </div>
              </Td>
              <Td><span className="text-xs text-slate-600 truncate block max-w-[100px]">{emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.route?.name_th ?? '-'}</span></Td>
              <Td><span className="text-xs text-slate-600">{emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.point?.name_th ?? '-'}</span></Td>
              <Td>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(emp.is_status)}`}>
                  {getStatusLabel(emp.is_status)}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-xs text-slate-400">แสดง {filtered.length} จาก {employees.length} รายการ</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(n => (
            <button key={n} className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${n === 1 ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
