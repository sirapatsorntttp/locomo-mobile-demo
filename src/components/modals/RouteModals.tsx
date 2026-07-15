'use client'
import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, FormGrid, FormSection } from '@/components/ui/FormFields'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store'
import type { Route, Point, TripDirection } from '@/types'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore'

// generic GUID pattern — accepts SQL Server newsequentialid() and standard UUIDs
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ═══════════════════════════════════════
// ADD ROUTE
// ═══════════════════════════════════════
export function AddRouteModal() {
  const { modal, closeModal } = useStore()
  const { addRoute } = useRoutePointStore()
  const open = modal.type === 'add-route'
  const dirFromModal = (modal.data as TripDirection | undefined) ?? 'inbound'

  const [form, setForm] = useState({
    code: '', name_th: '', name_en: '',
    trip_direction: dirFromModal,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setForm({ code: '', name_th: '', name_en: '', trip_direction: (modal.data as TripDirection | undefined) ?? 'inbound' })
    setErrors({})
  }, [open, modal.data])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มเส้นทางใหม่" subtitle="routes table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (validate()) { addRoute(form); setErrors({}) }
        }}>
          บันทึกเส้นทาง
        </Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัส (code)" required error={errors.code}>
            <Input placeholder="RT-D" value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} />
          </Field>
          <Field label="ทิศทาง (trip_direction)">
            <Select value={form.trip_direction} onChange={e => s('trip_direction', e.target.value)}>
              <option value="inbound">เที่ยวเข้า (Inbound)</option>
              <option value="outbound">เที่ยวออก (Outbound)</option>
              <option value="unknown">ไม่ระบุ (Unknown)</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="ชื่อเส้นทาง (name_th)" required error={errors.name_th}>
          <Input placeholder="สาย D - เส้นทางตะวันตก" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} />
        </Field>
        <Field label="ชื่อเส้นทาง (name_en)">
          <Input placeholder="Route D - West" value={form.name_en} onChange={e => s('name_en', e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// EDIT ROUTE
// ═══════════════════════════════════════
export function EditRouteModal() {
  const { modal, closeModal } = useStore()
  const { updateRoute } = useRoutePointStore()
  const open = modal.type === 'edit-route'
  const route: Route | undefined = modal.data
  const [form, setForm] = useState({
    name_th: route?.name_th ?? '',
    name_en: route?.name_en ?? '',
    trip_direction: route?.trip_direction ?? 'inbound',
  })

  useEffect(() => {
    if (!open || !route) return
    setForm({ name_th: route.name_th, name_en: route.name_en ?? '', trip_direction: route.trip_direction })
  }, [open, route?.id])

  if (!route || !open) return null

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไขเส้นทาง · ${route.code}`} size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => updateRoute(route.id, form)}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <Field label="ทิศทาง">
          <Select value={form.trip_direction} onChange={e => s('trip_direction', e.target.value)}>
            <option value="inbound">เที่ยวเข้า (Inbound)</option>
            <option value="outbound">เที่ยวออก (Outbound)</option>
            <option value="unknown">ไม่ระบุ (Unknown)</option>
          </Select>
        </Field>
        <Field label="ชื่อ (name_th)"><Input value={form.name_th} onChange={e => s('name_th', e.target.value)} /></Field>
        <Field label="ชื่อ (name_en)"><Input value={form.name_en} onChange={e => s('name_en', e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// DELETE ROUTE
// ═══════════════════════════════════════
export function DeleteRouteModal() {
  const { modal, closeModal } = useStore()
  const { deleteRoute } = useRoutePointStore()
  const open = modal.type === 'delete-route'
  const route: Route | undefined = modal.data
  if (!route || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบเส้นทาง" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteRoute(route.id)}>ลบเส้นทาง</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="font-bold text-slate-800">{route.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          {route.code} · {route.trip_direction === 'inbound' ? 'เที่ยวเข้า' : route.trip_direction === 'outbound' ? 'เที่ยวออก' : 'ไม่ระบุ'}
        </p>
        <p className="text-xs font-semibold text-amber-600 mt-3 bg-amber-50 rounded-lg p-2 border border-amber-200">
          จุดจอด {route.points?.length ?? 0} จุดจะไม่ถูกลบ แต่เส้นทางจะ inactive
        </p>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// ADD POINT
// ═══════════════════════════════════════
interface PointModalData {
  routeId?: string
  direction?: TripDirection
}

export function AddPointModal() {
  const { modal, closeModal } = useStore()
  const { routes, addPoint } = useRoutePointStore()
  const open = modal.type === 'add-point'

  const modalData = modal.data as PointModalData | undefined
  const defaultRouteId = modalData?.routeId ?? ''
  const defaultDirection: TripDirection =
    modalData?.direction ??
    routes.find(r => r.id === modalData?.routeId)?.trip_direction ??
    'inbound'

  const [form, setForm] = useState({
    code: '', name_th: '', name_en: '',
    trip_direction: defaultDirection,
    route_id: defaultRouteId,
    latitude: '13.7563', longitude: '100.5018', queue_default: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const dir: TripDirection =
      (modal.data as PointModalData | undefined)?.direction ??
      routes.find(r => r.id === (modal.data as PointModalData | undefined)?.routeId)?.trip_direction ??
      'inbound'
    const rid = (modal.data as PointModalData | undefined)?.routeId ?? ''
    setForm(f => ({ ...f, trip_direction: dir, route_id: rid }))
    setErrors({})
  }, [open, modal.data])

  const routeOptions = useMemo(
    () => routes
      .filter(r => r.is_status === 'active' && r.trip_direction === form.trip_direction)
      .sort((a, b) => a.code.localeCompare(b.code)),
    [routes, form.trip_direction],
  )

  const validate = () => {
    const e: Record<string, string> = {}
    const lat = Number(form.latitude)
    const lon = Number(form.longitude)
    const q = form.queue_default ? Number(form.queue_default) : null

    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    if (!form.route_id) e.route_id = 'จำเป็น'
    else if (!GUID_PATTERN.test(form.route_id)) e.route_id = 'route_id ไม่ถูกต้อง'
    if (!Number.isFinite(lat)) e.latitude = 'ต้องเป็นตัวเลข'
    if (!Number.isFinite(lon)) e.longitude = 'ต้องเป็นตัวเลข'
    if (q !== null && (!Number.isInteger(q) || q < 0)) e.queue_default = 'ต้องเป็นจำนวนเต็ม 0 ขึ้นไป'
    setErrors(e)
    return !Object.keys(e).length
  }

  const s = (k: string, v: string) => setForm(f => {
    if (k === 'trip_direction') {
      const nextRoute = routes.find(r => r.is_status === 'active' && r.trip_direction === v)
      return { ...f, trip_direction: v as TripDirection, route_id: nextRoute?.id ?? '' }
    }
    return { ...f, [k]: v }
  })

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มจุดจอดใหม่" subtitle="points table" size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (!validate()) return
          addPoint({
            ...form,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            queue_default: form.queue_default ? parseInt(form.queue_default) : null,
          })
          setErrors({})
        }}>บันทึกจุดจอด</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัส (code)" required error={errors.code}>
            <Input placeholder="PT-07" value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} />
          </Field>
          <Field label="ลำดับจอด (queue_default)" error={errors.queue_default}>
            <Input type="number" placeholder="1" value={form.queue_default} onChange={e => s('queue_default', e.target.value)} error={!!errors.queue_default} />
          </Field>
        </FormGrid>
        <Field label="ชื่อจุดจอด (name_th)" required error={errors.name_th}>
          <Input placeholder="บีทีเอส สยาม" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} />
        </Field>
        <Field label="ชื่อจุดจอด (name_en)">
          <Input placeholder="BTS Siam" value={form.name_en} onChange={e => s('name_en', e.target.value)} />
        </Field>
        <Field label="ทิศทาง (trip_direction)">
          <Select value={form.trip_direction} onChange={e => s('trip_direction', e.target.value)}>
            <option value="inbound">เที่ยวเข้า (Inbound)</option>
            <option value="outbound">เที่ยวออก (Outbound)</option>
            <option value="unknown">ไม่ระบุ (Unknown)</option>
          </Select>
        </Field>
        <Field label="เส้นทาง (route)" required error={errors.route_id}>
          <Select value={form.route_id} onChange={e => s('route_id', e.target.value)} error={!!errors.route_id}>
            <option value="">เลือกเส้นทาง</option>
            {routeOptions.map(r => (
              <option key={r.id} value={r.id}>{r.code} · {r.name_th}</option>
            ))}
          </Select>
        </Field>
        <FormSection label="พิกัด GPS" />
        <FormGrid>
          <Field label="ละติจูด (latitude)" hint="เช่น 13.7563" error={errors.latitude}>
            <Input type="number" step="0.0001" value={form.latitude} onChange={e => s('latitude', e.target.value)} error={!!errors.latitude} />
          </Field>
          <Field label="ลองจิจูด (longitude)" hint="เช่น 100.5018" error={errors.longitude}>
            <Input type="number" step="0.0001" value={form.longitude} onChange={e => s('longitude', e.target.value)} error={!!errors.longitude} />
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// EDIT POINT
// ═══════════════════════════════════════
export function EditPointModal() {
  const { modal, closeModal } = useStore()
  const { updatePoint } = useRoutePointStore()
  const open = modal.type === 'edit-point'
  const point: Point | undefined = modal.data

  const [form, setForm] = useState({
    code: '',
    name_th: '',
    name_en: '',
    latitude: '',
    longitude: '',
    queue_default: '',
    is_status: 'active' as 'active' | 'inactive',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || !point) return
    setForm({
      code: point.code,
      name_th: point.name_th,
      name_en: point.name_en ?? '',
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      queue_default: point.queue_default != null ? String(point.queue_default) : '',
      is_status: point.is_status,
    })
    setErrors({})
  }, [open, point?.id])

  if (!point || !open) return null

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    const lat = Number(form.latitude)
    const lon = Number(form.longitude)
    const q = form.queue_default ? Number(form.queue_default) : null
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    if (!Number.isFinite(lat)) e.latitude = 'ต้องเป็นตัวเลข'
    if (!Number.isFinite(lon)) e.longitude = 'ต้องเป็นตัวเลข'
    if (q !== null && (!Number.isInteger(q) || q < 0)) e.queue_default = 'ต้องเป็นจำนวนเต็ม 0 ขึ้นไป'
    setErrors(e)
    return !Object.keys(e).length
  }

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไขจุดจอด · ${point.code}`} size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (!validate()) return
          updatePoint(point.id, {
            code: form.code,
            name_th: form.name_th,
            name_en: form.name_en,
            latitude: parseFloat(form.latitude),
            longitude: parseFloat(form.longitude),
            queue_default: form.queue_default ? parseInt(form.queue_default) : null,
            is_status: form.is_status,
          })
        }}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="รหัส (code)" required error={errors.code}>
            <Input value={form.code} onChange={e => s('code', e.target.value)} error={!!errors.code} />
          </Field>
          <Field label="ลำดับจอด (queue_default)" error={errors.queue_default}>
            <Input type="number" value={form.queue_default} onChange={e => s('queue_default', e.target.value)} error={!!errors.queue_default} />
          </Field>
        </FormGrid>
        <Field label="ชื่อจุดจอด (name_th)" required error={errors.name_th}>
          <Input value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} />
        </Field>
        <Field label="ชื่อจุดจอด (name_en)">
          <Input value={form.name_en} onChange={e => s('name_en', e.target.value)} />
        </Field>
        <FormSection label="พิกัด GPS" />
        <FormGrid>
          <Field label="ละติจูด (latitude)" hint="เช่น 13.7563" error={errors.latitude}>
            <Input type="number" step="0.0001" value={form.latitude} onChange={e => s('latitude', e.target.value)} error={!!errors.latitude} />
          </Field>
          <Field label="ลองจิจูด (longitude)" hint="เช่น 100.5018" error={errors.longitude}>
            <Input type="number" step="0.0001" value={form.longitude} onChange={e => s('longitude', e.target.value)} error={!!errors.longitude} />
          </Field>
        </FormGrid>
        <Field label="สถานะ">
          <Select value={form.is_status} onChange={e => s('is_status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// DELETE POINT
// ═══════════════════════════════════════
export function DeletePointModal() {
  const { modal, closeModal } = useStore()
  const { deletePoint } = useRoutePointStore()
  const open = modal.type === 'delete-point'
  const point: Point | undefined = modal.data
  if (!point || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบจุดจอด" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deletePoint(point.id)}>ลบจุดจอด</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-3">📍</div>
        <p className="font-bold text-slate-800">{point.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">{point.code}</p>
        <p className="text-xs text-slate-400">{point.latitude}, {point.longitude}</p>
        <p className="text-xs text-red-600 mt-3 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive</p>
      </div>
    </Modal>
  )
}
