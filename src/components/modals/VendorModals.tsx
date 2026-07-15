'use client'
import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, FormGrid } from '@/components/ui/FormFields'
import { Button } from '@/components/ui'
import { useStore } from '@/lib/store'
import type { Vendor } from '@/types'
import { Truck } from 'lucide-react'
import { useVendorStore } from '@/lib/stores/useVendorStore'

function VendorForm({
  form,
  errors,
  onChange,
}: {
  form: { code: string; name_th: string; name_en: string }
  errors: Record<string, string>
  onChange: (k: string, v: string) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="รหัส Vendor (code)" required error={errors.code}>
        <Input placeholder="VEN-003" value={form.code} onChange={e => onChange('code', e.target.value)} error={!!errors.code} />
      </Field>
      <Field label="ชื่อบริษัท (name_th)" required error={errors.name_th}>
        <Input placeholder="บริษัท ขนส่ง ซี จำกัด" value={form.name_th} onChange={e => onChange('name_th', e.target.value)} error={!!errors.name_th} />
      </Field>
      <Field label="ชื่อบริษัท (name_en)">
        <Input placeholder="Transport C Co., Ltd." value={form.name_en} onChange={e => onChange('name_en', e.target.value)} />
      </Field>
    </div>
  )
}

export function AddVendorModal() {
  const { modal, closeModal } = useStore()
  const { addVendor } = useVendorStore()
  const open = modal.type === 'add-vendor'
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (!open) { setForm({ code: '', name_th: '', name_en: '' }); setErrors({}) } }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่ม Vendor ใหม่" subtitle="vendors table" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (!validate()) return
          addVendor(form)
          setForm({ code: '', name_th: '', name_en: '' })
          setErrors({})
        }}>บันทึก Vendor</Button>
      </>}
    >
      <VendorForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
    </Modal>
  )
}

export function EditVendorModal() {
  const { modal, closeModal } = useStore()
  const { updateVendor } = useVendorStore()
  const open = modal.type === 'edit-vendor'
  const vendor = modal.data as Vendor | undefined
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && vendor) {
      setForm({ code: vendor.code, name_th: vendor.name_th, name_en: vendor.name_en })
    }
  }, [open, vendor])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'จำเป็น'
    if (!form.name_th.trim()) e.name_th = 'จำเป็น'
    setErrors(e)
    return !Object.keys(e).length
  }

  if (!vendor) return null

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไข Vendor" subtitle={`vendors · ${vendor.code}`} size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={() => {
          if (!validate()) return
          updateVendor(vendor.id, form)
        }}>บันทึกการแก้ไข</Button>
      </>}
    >
      <VendorForm form={form} errors={errors} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))} />
    </Modal>
  )
}

export function DeleteVendorModal() {
  const { modal, closeModal } = useStore()
  const { deleteVendor } = useVendorStore()
  const open = modal.type === 'delete-vendor'
  const vendor: Vendor | undefined = modal.data
  if (!vendor || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบ Vendor" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteVendor(vendor.id)}>ลบ Vendor</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-200">
          <Truck size={24} className="text-red-400" />
        </div>
        <p className="font-bold text-slate-800">{vendor.name_th}</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">{vendor.code}</p>
        <p className="text-xs text-red-600 mt-4 bg-red-50 rounded-lg p-2 border border-red-200">จะเปลี่ยนสถานะเป็น inactive (soft delete)</p>
      </div>
    </Modal>
  )
}
