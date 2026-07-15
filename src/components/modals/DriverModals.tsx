'use client'
import { useEffect, useState, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, FormGrid } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import type { Driver, Route, DriverRouteDefault } from '@/types'
import { X, Plus, MapPin } from 'lucide-react'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';

// ─── helpers ────────────────────────────────────────────────────────────────

const DIRECTION_LABELS: Record<string, string> = {
  inbound: 'ขาเข้า', outbound: 'ขาออก', unknown: 'ทั้งสอง',
}
const DIRECTION_COLOR: Record<string, string> = {
  inbound: 'bg-sky-100 text-sky-700 border-sky-200',
  outbound: 'bg-amber-100 text-amber-700 border-amber-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
}

function DriverForm({
  form, errors,
  onChange,
}: {
  form: { code: string; first_name_th: string; last_name_th: string; first_name_en: string; last_name_en: string; tel: string }
  errors: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="รหัสพนักงานขับรถ" required error={errors.code}>
        <Input placeholder="เช่น DRV-001" value={form.code} onChange={e => onChange('code', e.target.value)} error={!!errors.code} />
      </Field>
      <FormGrid cols={2}>
        <Field label="ชื่อ (ไทย)" required error={errors.first_name_th}>
          <Input placeholder="สมชาย" value={form.first_name_th} onChange={e => onChange('first_name_th', e.target.value)} error={!!errors.first_name_th} />
        </Field>
        <Field label="นามสกุล (ไทย)" required error={errors.last_name_th}>
          <Input placeholder="ใจดี" value={form.last_name_th} onChange={e => onChange('last_name_th', e.target.value)} error={!!errors.last_name_th} />
        </Field>
        <Field label="ชื่อ (อังกฤษ)" error={errors.first_name_en}>
          <Input placeholder="Somchai" value={form.first_name_en} onChange={e => onChange('first_name_en', e.target.value)} error={!!errors.first_name_en} />
        </Field>
        <Field label="นามสกุล (อังกฤษ)" error={errors.last_name_en}>
          <Input placeholder="Jaidee" value={form.last_name_en} onChange={e => onChange('last_name_en', e.target.value)} error={!!errors.last_name_en} />
        </Field>
      </FormGrid>
      <Field label="เบอร์โทร">
        <Input placeholder="0812345678" value={form.tel} onChange={e => onChange('tel', e.target.value)} maxLength={10} />
      </Field>
      <p className="text-[10px] text-slate-400 -mt-2">* ชื่อภาษาไทยใช้ได้เฉพาะอักษรไทย / ชื่อภาษาอังกฤษใช้ได้เฉพาะอักษรละติน ไม่มีเว้นวรรค</p>
    </div>
  )
}

// ─── Add Driver ──────────────────────────────────────────────────────────────

export function AddDriverModal() {
  const { modal, closeModal } = useStore()
  const {addDriver} = useDriverStore()
  const open = modal.type === 'add-driver'
  const blank = { code: '', first_name_th: '', last_name_th: '', first_name_en: '', last_name_en: '', tel: '' }
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!open) { setForm(blank); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.first_name_th.trim()) e.first_name_th = 'จำเป็น'
    if (!form.last_name_th.trim()) e.last_name_th = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    await addDriver({ ...form, tel: form.tel || null })
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มพนักงานขับรถ" subtitle="สร้างข้อมูลคนขับก่อน แล้วค่อยสร้าง User ในหน้าผู้ใช้งาน" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกคนขับ'}
        </Button>
      </>}
    >
      <DriverForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
    </Modal>
  )
}

// ─── Edit Driver ─────────────────────────────────────────────────────────────

export function EditDriverModal() {
  const { modal, closeModal } = useStore()
  const {updateDriver, addDriverRouteDefault, removeDriverRouteDefault} = useDriverStore()
  const { routes, loadRoutesPoints } = useRoutePointStore()
  const open = modal.type === 'edit-driver'
  const driver = modal.data as Driver | undefined

  const [form, setForm] = useState({ code: '', first_name_th: '', last_name_th: '', first_name_en: '', last_name_en: '', tel: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [selectedDirection, setSelectedDirection] = useState('unknown')

  useEffect(() => {
    if (open && driver) {
      setForm({
        code: driver.code,
        first_name_th: driver.first_name_th,
        last_name_th: driver.last_name_th,
        first_name_en: driver.first_name_en,
        last_name_en: driver.last_name_en,
        tel: driver.tel ?? '',
      })
      loadRoutesPoints()
    }
  }, [open, driver?.id])

  // vendor's company routes filter
  const vendorId = driver?.drivers_vehicles?.vendors_drivers_vehicles?.vendor_id
  const availableRoutes = useMemo(() => {
    if (!routes.length) return []
    return routes.filter(r => r.is_status === 'active')
  }, [routes])

  const defaultedRouteIds = new Set((driver?.driver_route_defaults ?? []).map(r => `${r.route_id}__${r.trip_direction}`))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.first_name_th.trim()) e.first_name_th = 'จำเป็น'
    if (!form.last_name_th.trim()) e.last_name_th = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    await updateDriver(driver!.id, { ...form, tel: form.tel || null })
    setLoading(false)
  }

  const handleAddRoute = async () => {
    if (!selectedRouteId || !driver) return
    await addDriverRouteDefault(driver.id, selectedRouteId, selectedDirection)
    setSelectedRouteId('')
  }

  if (!driver || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไขคนขับ · ${driver.first_name_th} ${driver.last_name_th}`} size="lg"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ปิด</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </Button>
      </>}
    >
      <div className="space-y-6">
        <DriverForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />

        {/* ── Route Defaults ──────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-700">สายรถ Default</h3>
            <span className="text-[10px] text-slate-400">— สายที่คนขับมักรับผิดชอบ</span>
          </div>

          {/* current defaults */}
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
            {(driver.driver_route_defaults ?? []).length === 0 && (
              <p className="text-xs text-slate-400 italic">ยังไม่มีสายรถ default</p>
            )}
            {(driver.driver_route_defaults ?? []).map(rd => (
              <span key={rd.id} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DIRECTION_COLOR[rd.trip_direction] ?? DIRECTION_COLOR.unknown}`}>
                <MapPin size={9} />
                {rd.routes?.code ?? rd.route_id}
                <span className="opacity-60">({DIRECTION_LABELS[rd.trip_direction] ?? rd.trip_direction})</span>
                <button
                  onClick={() => removeDriverRouteDefault(driver.id, rd.id)}
                  className="ml-0.5 hover:opacity-100 opacity-50 transition-opacity"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>

          {/* add route */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">-- เลือกสายรถ --</option>
              {availableRoutes.map(r => (
                <option key={r.id} value={r.id}>{r.code} · {r.name_th}</option>
              ))}
            </select>
            <select
              value={selectedDirection}
              onChange={e => setSelectedDirection(e.target.value)}
              className="w-28 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="unknown">ทั้งสอง</option>
              <option value="inbound">ขาเข้า</option>
              <option value="outbound">ขาออก</option>
            </select>
            <button
              onClick={handleAddRoute}
              disabled={!selectedRouteId}
              className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-40 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ─── Delete Driver ────────────────────────────────────────────────────────────

export function DeleteDriverModal() {
  const { modal, closeModal} = useStore()
  const {deleteDriver} = useDriverStore()
  const open = modal.type === 'delete-driver'
  const driver = modal.data as Driver | undefined
  if (!driver || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบคนขับ" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteDriver(driver.id)}>ลบคนขับ</Button>
      </>}
    >
      <p className="text-sm text-slate-600">
        ต้องการลบ <span className="font-semibold text-slate-800">{driver.first_name_th} {driver.last_name_th}</span> ({driver.code}) ออกจากระบบ?
      </p>
      <p className="text-xs text-slate-400 mt-1">สถานะจะถูกเปลี่ยนเป็น inactive (ไม่ได้ลบจริง)</p>
    </Modal>
  )
}
