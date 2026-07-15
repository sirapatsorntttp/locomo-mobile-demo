'use client'
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Select, FormGrid } from '@/components/ui/FormFields'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store'
import { Layers, Map, Clock, UserCheck, Bus, Building2, ArrowRight, Trash2 } from 'lucide-react'
import type { Post, DriverVehicleVendor } from '@/types'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useRoutePointStore } from '@/lib/stores/useRoutePointStore';
import { usePostStore } from '@/lib/stores/post.store'

// ─── Helpers ──────────────────────────────────────────────────
function ChainPreview({ dvvId, driverVehicleVendors }: {
  dvvId: string
  driverVehicleVendors: DriverVehicleVendor[]
}) {
  const dvv = driverVehicleVendors.find((d: DriverVehicleVendor) => d.id === dvvId)
  if (!dvv) return null
  const driver  = dvv.driver_vehicle?.driver
  const vehicle = dvv.driver_vehicle?.vehicle
  const vendor  = dvv.vendor
  return (
    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <UserCheck size={11} className="text-emerald-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">
          {driver ? `${driver.first_name_th} ${driver.last_name_th}` : '-'}
        </span>
      </div>
      <ArrowRight size={11} className="text-slate-300 flex-shrink-0" />
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Bus size={11} className="text-amber-600" />
        </div>
        <span className="text-xs font-semibold font-mono text-slate-700">{vehicle?.license ?? '-'}</span>
      </div>
      <ArrowRight size={11} className="text-slate-300 flex-shrink-0" />
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Building2 size={11} className="text-indigo-600" />
        </div>
        <span className="text-xs font-semibold text-slate-700">{vendor?.name_th ?? '-'}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// ADD POST MODAL
// ═══════════════════════════════════════
export function AddPostModal() {
  const { modal, closeModal } = useStore()
  const { addPost } = usePostStore()
  const {shifts,loadShifts} = useShiftStore()
  const { driverVehicleVendors,loadDriverVehicleVendors } = useDriverStore()
  const { routes ,loadRoutesPoints} = useRoutePointStore()
  const open = modal.type === 'add-post'

  const [form, setForm] = useState({
    code:                      '',
    route_id:                  routes[0]?.id ?? '',
    shift_id:                  shifts[0]?.id ?? '',
    driver_vehicle_vendor_id:  driverVehicleVendors[0]?.id ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})


  
 // ── โหลด DVV ตอน modal เปิด ───────────────────────
  useEffect(() => {
    if (open) {
      loadDriverVehicleVendors() 
      loadRoutesPoints()  // ← เรียกโหลด
loadShifts()
      setErrors({})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setForm({
        code:                     '',
        route_id:                 routes[0]?.id ?? '',
        shift_id:                 shifts[0]?.id ?? '',
        driver_vehicle_vendor_id: driverVehicleVendors[0]?.id ?? '',
      })
      setErrors({})
    }
  }, [open,routes.length, shifts.length, driverVehicleVendors.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.route_id) e.route_id = 'กรุณาเลือกเส้นทาง'
    if (!form.shift_id) e.shift_id = 'กรุณาเลือกกะ'
    if (!form.driver_vehicle_vendor_id) e.dvv = 'กรุณาเลือกชุดคนขับ'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addPost(form)
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="เพิ่ม Post (เที่ยวรถ)"
      subtitle="posts table"
      size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึก Post</Button>
      </>}
    >
      <div className="space-y-4">
        {/* Code */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
            รหัส Post <span className="text-slate-400">(ปล่อยว่างให้ระบบสร้างให้)</span>
          </label>
          <input
            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 font-mono"
            placeholder="เช่น POST-001"
            value={form.code}
            onChange={e => s('code', e.target.value)}
          />
        </div>

        {/* Route + Shift */}
        <FormGrid>
          <Field label="เส้นทาง" required error={errors.route_id}>
            <Select value={form.route_id} onChange={e => s('route_id', e.target.value)} error={!!errors.route_id}>
              <option value="">-- เลือกเส้นทาง --</option>
              {routes.filter(r => r.is_status === 'active').map(r => (
                <option key={r.id} value={r.id}>{r.name_th}</option>
              ))}
            </Select>
          </Field>
          <Field label="กะ" required error={errors.shift_id}>
            <Select value={form.shift_id} onChange={e => s('shift_id', e.target.value)} error={!!errors.shift_id}>
              <option value="">-- เลือกกะ --</option>
              {shifts.filter(s => s.is_status === 'active').map(sh => (
                <option key={sh.id} value={sh.id}>{sh.name_th} ({sh.default_time})</option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        {/* Route preview */}
        {form.route_id && (() => {
          const route = routes.find(r => r.id === form.route_id)
          return route ? (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 text-xs">
              <Map size={12} className="text-sky-500 flex-shrink-0" />
              <span className="font-semibold text-sky-800">{route.name_th}</span>
              {route.name_en && <span className="text-sky-400">· {route.name_en}</span>}
            </div>
          ) : null
        })()}

        {/* DVV selector */}
        <Field label="ชุดคนขับ / รถ / Vendor" required error={errors.dvv}>
          <Select
            value={form.driver_vehicle_vendor_id}
            onChange={e => s('driver_vehicle_vendor_id', e.target.value)}
            error={!!errors.dvv}
          >
            <option value="">-- เลือกชุดคนขับ --</option>
            {driverVehicleVendors.map(dvv => {
              const driver  = dvv.driver_vehicle?.driver
              const vehicle = dvv.driver_vehicle?.vehicle
              const vendor  = dvv.vendor
              const label = [
                driver  ? `${driver.first_name_th} ${driver.last_name_th}` : null,
                vehicle ? vehicle.license : null,
                vendor  ? vendor.name_th  : null,
              ].filter(Boolean).join(' · ')
              return <option key={dvv.id} value={dvv.id}>{label || dvv.id}</option>
            })}
          </Select>
        </Field>

        {/* Chain preview */}
        {form.driver_vehicle_vendor_id && (
          <ChainPreview dvvId={form.driver_vehicle_vendor_id} driverVehicleVendors={driverVehicleVendors} />
        )}
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// EDIT POST MODAL
// ═══════════════════════════════════════
export function EditPostModal() {
  const { modal, closeModal } = useStore()
  const {updatePost} = usePostStore()
  const {shifts,loadShifts} = useShiftStore()
  const { driverVehicleVendors,loadDriverVehicleVendors } = useDriverStore()
  const { routes ,loadRoutesPoints} = useRoutePointStore()
  const open = modal.type === 'edit-post'
  const post: Post | undefined = modal.data

  const [form, setForm] = useState({
    route_id:                 post?.route_id ?? '',
    shift_id:                 post?.shift_id ?? '',
    driver_vehicle_vendor_id: post?.driver_vehicle_vendor_id ?? '',
  })
 useEffect(() => {
    if (open) {
      loadDriverVehicleVendors() 
      loadRoutesPoints()  // ← เรียกโหลด
loadShifts()
    
    }
  }, [open])

  useEffect(() => {
    if (open && post) {
      setForm({
        route_id:                 post.route_id,
        shift_id:                 post.shift_id,
        driver_vehicle_vendor_id: post.driver_vehicle_vendor_id,
      })
    }
  }, [open, post?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !post) return null

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={`แก้ไข Post · ${post.code}`}
      size="md"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => updatePost(post.id, form)}>บันทึก</Button>
      </>}
    >
      <div className="space-y-4">
        {/* Post code (read-only) */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Layers size={14} className="text-indigo-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Post Code</p>
            <p className="text-sm font-bold font-mono text-slate-800">{post.code}</p>
          </div>
        </div>

        <FormGrid>
          <Field label="เส้นทาง" required>
            <Select value={form.route_id} onChange={e => s('route_id', e.target.value)}>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.name_th}</option>
              ))}
            </Select>
          </Field>
          <Field label="กะ" required>
            <Select value={form.shift_id} onChange={e => s('shift_id', e.target.value)}>
              {shifts.map(sh => (
                <option key={sh.id} value={sh.id}>{sh.name_th} ({sh.default_time})</option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <Field label="ชุดคนขับ / รถ / Vendor" required>
          <Select value={form.driver_vehicle_vendor_id} onChange={e => s('driver_vehicle_vendor_id', e.target.value)}>
            {driverVehicleVendors.map(dvv => {
              const driver  = dvv.driver_vehicle?.driver
              const vehicle = dvv.driver_vehicle?.vehicle
              const vendor  = dvv.vendor
              const label = [
                driver  ? `${driver.first_name_th} ${driver.last_name_th}` : null,
                vehicle ? vehicle.license : null,
                vendor  ? vendor.name_th  : null,
              ].filter(Boolean).join(' · ')

              // console.log("driver-vehicle",label);
              
              return <option key={dvv.id} value={dvv.id}>{label || dvv.id}</option>
            })}
          </Select>
        </Field>

        {form.driver_vehicle_vendor_id && (
          <ChainPreview dvvId={form.driver_vehicle_vendor_id} driverVehicleVendors={driverVehicleVendors} />
        )}
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════
// DELETE POST MODAL
// ═══════════════════════════════════════
export function DeletePostModal() {
  const { modal, closeModal } = useStore()
  const {deletePost} = usePostStore()
  const open = modal.type === 'delete-post'
  const post: Post | undefined = modal.data

  if (!open || !post) return null

  const dv     = post.driver_vehicle_vendor?.driver_vehicle
  const driver  = dv?.driver
  const vehicle = dv?.vehicle

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="ลบ Post"
      size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => deletePost(post.id)}>
          ลบ Post
        </Button>
      </>}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          ต้องการลบ Post นี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-sm font-bold font-mono text-red-700">{post.code}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-red-600 pl-6">
            <span className="flex items-center gap-1">
              <Map size={10} /> {post.route?.name_th ?? '-'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {post.shift?.name_th ?? '-'}
            </span>
          </div>
          {(driver || vehicle) && (
            <div className="flex items-center gap-2 text-xs text-red-600 pl-6">
              {driver && <span className="flex items-center gap-1"><UserCheck size={10} /> {driver.first_name_th} {driver.last_name_th}</span>}
              {vehicle && <span className="flex items-center gap-1"><Bus size={10} /> {vehicle.license}</span>}
            </div>
          )}
        </div>
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          การสแกนขึ้นรถที่ผูกกับ Post นี้จะยังคงอยู่ในระบบ
        </p>
      </div>
    </Modal>
  )
}
