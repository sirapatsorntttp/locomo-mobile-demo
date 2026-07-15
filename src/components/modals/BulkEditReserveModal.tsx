'use client'
import { useState, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Select } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { Clock, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useReserveStore } from '@/lib/stores/reserve.store'

export function BulkEditReserveModal() {
  const { modal, closeModal } = useStore()
  const { reserves, bulkEditReserveShift} = useReserveStore()
  const {shifts} = useShiftStore()
  const open = modal.type === 'bulk-edit-reserve'
  const selectedIds: string[] = modal.data?.ids ?? []

  const [shiftId, setShiftId] = useState('')

  // Reset on open
  useMemo(() => {
    if (open) setShiftId('')
  }, [open])

  const selectedReserves = useMemo(
    () => reserves.filter(r => selectedIds.includes(r.id)),
    [reserves, selectedIds]
  )

  const activeShifts = useMemo(
    () => shifts.filter(s => s.is_status === 'active'),
    [shifts]
  )

  const targetShift = activeShifts.find(s => s.id === shiftId)

  // Stats about selected: how many are cancellable vs locked
  const lockedCount  = selectedReserves.filter(r => r.is_state === 'finished' || r.is_state === 'canceled').length
  const editableCount = selectedReserves.length - lockedCount

  const handleConfirm = () => {
    if (!shiftId) return
    const editableIds = selectedReserves
      .filter(r => r.is_state !== 'finished' && r.is_state !== 'canceled')
      .map(r => r.id)
    bulkEditReserveShift(editableIds, shiftId)
  }

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขกะ (Bulk Edit)" size="sm">
      <div className="space-y-4">

        {/* Summary */}
        <div className="rounded-xl bg-sky-50 border border-sky-100 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
            <Users size={13} />
            รายการที่เลือก: {selectedReserves.length} รายการ
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
              <CheckCircle2 size={9} className="inline mr-0.5" />
              แก้ไขได้ {editableCount} รายการ
            </span>
            {lockedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold border border-slate-200">
                <AlertTriangle size={9} className="inline mr-0.5" />
                ข้าม {lockedCount} รายการ (เสร็จสิ้น/ยกเลิก)
              </span>
            )}
          </div>
        </div>

        {/* Employee chips (up to 5) */}
        {selectedReserves.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">พนักงานที่เลือก</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedReserves.slice(0, 8).map(r => (
                <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {r.employee?.first_name_th} {r.employee?.last_name_th}
                </span>
              ))}
              {selectedReserves.length > 8 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                  +{selectedReserves.length - 8} คน
                </span>
              )}
            </div>
          </div>
        )}

        {/* Shift selector */}
        <Field label="กะใหม่ที่ต้องการเปลี่ยน" required>
          <Select value={shiftId} onChange={e => setShiftId(e.target.value)}>
            <option value="">— เลือกกะ —</option>
            {activeShifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name_th} · {s.default_time} น. ({s.type === 'overtime' ? 'OT' : 'ปกติ'})
              </option>
            ))}
          </Select>
        </Field>

        {/* Preview */}
        {targetShift && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 flex items-center gap-2 text-xs">
            <Clock size={13} className="text-emerald-600" />
            <span className="text-emerald-700">
              จะเปลี่ยนเป็น <span className="font-bold">{targetShift.name_th}</span>
              {' '}· เวลา {targetShift.default_time} น.
              {' '}สำหรับ <span className="font-bold">{editableCount} รายการ</span>
            </span>
          </div>
        )}

        {/* Warning if no editable */}
        {editableCount === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle size={13} />
            รายการที่เลือกทั้งหมดไม่สามารถแก้ไขได้ (เสร็จสิ้นหรือยกเลิกแล้ว)
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={closeModal} className="flex-1">ยกเลิก</Button>
          <Button
            variant="primary" size="sm"
            onClick={handleConfirm}
            disabled={!shiftId || editableCount === 0}
            className="flex-1"
          >
            ยืนยันเปลี่ยนกะ {editableCount > 0 ? `(${editableCount})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
