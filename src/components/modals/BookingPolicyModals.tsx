'use client'
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, FormGrid, FormSection } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getAllowDaysLabel, getAfterCutoffLabel, getStatusLabel } from '@/lib/utils'
import type { BookingPolicy } from '@/types'

type RulesForm = {
  booking_mode: string
  advance_days_min: number
  advance_days_max: number | ''
  cutoff_time: string
  after_cutoff_action: string
  cancel_deadline_minutes: number
  allow_days: string
  max_per_day: number | ''
  allow_recurring: boolean
  requires_approval: boolean
  ot_requires_approval: boolean
  holiday_requires_approval: boolean
  allow_employee_edit: boolean
  allow_employee_cancel: boolean
  allow_admin_book_others: boolean
  pre_holiday_cutoff_time: string
  pre_holiday_cutoff_action: string
}

const defaultRules: RulesForm = {
  booking_mode: 'self_select',
  advance_days_min: 0,
  advance_days_max: '',
  cutoff_time: '15:00',
  after_cutoff_action: 'block',
  cancel_deadline_minutes: 60,
  allow_days: 'any',
  max_per_day: '',
  allow_recurring: false,
  requires_approval: false,
  ot_requires_approval: true,
  holiday_requires_approval: true,
  allow_employee_edit: false,
  allow_employee_cancel: true,
  allow_admin_book_others: false,
  pre_holiday_cutoff_time: '',
  pre_holiday_cutoff_action: 'block',
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function PolicyForm({
  form, rules, setForm, setRules, errors, companies,
}: {
  form: { company_id: string; name_th: string; name_en: string; description: string; priority: number }
  rules: RulesForm
  setForm: (f: typeof form) => void
  setRules: (r: RulesForm) => void
  errors: Record<string, string>
  companies: { id: string; name_th: string; code: string }[]
}) {
  const s = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm({ ...form, [k]: v })
  const r = <K extends keyof RulesForm>(k: K, v: RulesForm[K]) => setRules({ ...rules, [k]: v })

  return (
    <div className="space-y-5">
      <FormSection label="บริษัท (Client)" />
      <Field label="บริษัทที่ผูกกับนโยบายนี้" required error={errors.company_id}>
        <Select value={form.company_id} onChange={e => s('company_id', e.target.value)}>
          <option value="">— เลือกบริษัท —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name_th} ({c.code})</option>)}
        </Select>
      </Field>

      <FormSection label="ชื่อนโยบาย" />
      <FormGrid>
        <Field label="ชื่อ (ภาษาไทย)" required error={errors.name_th}>
          <Input placeholder="เช่น นโยบายมาตรฐาน" value={form.name_th} onChange={e => s('name_th', e.target.value)} error={!!errors.name_th} />
        </Field>
        <Field label="ชื่อ (ภาษาอังกฤษ)">
          <Input placeholder="e.g. Standard Policy" value={form.name_en} onChange={e => s('name_en', e.target.value)} />
        </Field>
      </FormGrid>
      <FormGrid>
        <Field label="คำอธิบาย">
          <Input placeholder="คำอธิบายนโยบาย..." value={form.description} onChange={e => s('description', e.target.value)} />
        </Field>
        <Field label="ลำดับความสำคัญ (Priority)">
          <Input type="number" value={form.priority} onChange={e => s('priority', Number(e.target.value))} />
        </Field>
      </FormGrid>

      <FormSection label="โหมดการจอง" />
      <Field label="ใครเป็นคนจองรถ?" hint="self_select = พนักงานเลือกเส้นทางเอง / assigned = ระบบกำหนดให้ตามที่อยู่">
        <Select value={rules.booking_mode} onChange={e => r('booking_mode', e.target.value)}>
          <option value="self_select">พนักงานเลือกเส้นทางเอง</option>
          <option value="assigned">ระบบกำหนดเส้นทางให้อัตโนมัติ</option>
        </Select>
      </Field>

      <FormSection label="วันที่สามารถจองได้" />
      <Field label="เดินทางได้วันไหนบ้าง?" hint="กรองวันที่เดินทาง ไม่ใช่วันที่กดจอง">
        <Select value={rules.allow_days} onChange={e => r('allow_days', e.target.value)}>
          <option value="any">ทุกวัน (ทั้งวันทำงานและวันหยุด)</option>
          <option value="weekday">เฉพาะวันทำงานปกติ (จันทร์–ศุกร์)</option>
          <option value="holiday_only">เฉพาะวันหยุด (สำหรับ OT วันหยุด)</option>
          <option value="custom">กำหนดเองตามปฏิทิน</option>
        </Select>
      </Field>
      {rules.allow_days === 'holiday_only' && (
        <div className="rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-xs text-rose-700">
          พนักงานจะจองรถได้เฉพาะวันที่ถูกทำเครื่องหมายเป็น &quot;วันหยุด&quot; ในปฏิทินบริษัทเท่านั้น เหมาะสำหรับกรณี OT วันหยุด
        </div>
      )}
      {rules.allow_days === 'weekday' && (
        <div className="rounded-lg bg-sky-50 border border-sky-100 p-2.5 text-xs text-sky-700">
          พนักงานจองรถได้เฉพาะวันทำงานปกติ — วันหยุดจะถูกบล็อกไม่ให้จอง
        </div>
      )}

      <FormSection label="ระยะเวลาจองล่วงหน้า" />
      <FormGrid>
        <Field label="จองล่วงหน้าได้เร็วสุด (วัน)" hint="0 = จองวันนั้นเลยได้">
          <Input type="number" min={0} value={rules.advance_days_min} onChange={e => r('advance_days_min', Number(e.target.value))} />
        </Field>
        <Field label="จองล่วงหน้าได้ไกลสุด (วัน)" hint="ปล่อยว่าง = ไม่จำกัด">
          <Input type="number" min={0} value={rules.advance_days_max === '' ? '' : rules.advance_days_max} onChange={e => r('advance_days_max', e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
      </FormGrid>
      <Field label="จองได้สูงสุดกี่ครั้งต่อวัน" hint="ปล่อยว่าง = ไม่จำกัด">
        <Input type="number" min={1} value={rules.max_per_day === '' ? '' : rules.max_per_day} onChange={e => r('max_per_day', e.target.value === '' ? '' : Number(e.target.value))} />
      </Field>

      <FormSection label="กฎการตัดรอบการจอง" />
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">กฎปกติ (ทุกวัน)</p>
        <FormGrid>
          <Field label="ปิดรับจองเวลา" hint="พนักงานต้องจองก่อนเวลานี้ในวันเดียวกัน">
            <Input type="time" value={rules.cutoff_time} onChange={e => r('cutoff_time', e.target.value)} />
          </Field>
          <Field label="ถ้าจองหลังเวลาตัดรอบ">
            <Select value={rules.after_cutoff_action} onChange={e => r('after_cutoff_action', e.target.value)}>
              <option value="block">ไม่รับการจอง (บล็อก)</option>
              <option value="allow">รับได้ปกติ</option>
              <option value="require_approval">รับได้แต่ต้องรอ GA อนุมัติ</option>
            </Select>
          </Field>
        </FormGrid>
        <Field label="ยกเลิกการจองได้ก่อนเวลาตัดรอบกี่นาที" hint="0 = ยกเลิกได้จนถึงเวลาตัดรอบเลย">
          <Input type="number" min={0} value={rules.cancel_deadline_minutes} onChange={e => r('cancel_deadline_minutes', Number(e.target.value))} />
        </Field>

        <div className="border-t border-slate-200 pt-3">
          <Toggle
            checked={!!rules.pre_holiday_cutoff_time}
            onChange={v => r('pre_holiday_cutoff_time', v ? '16:00' : '')}
            label="เพิ่มกฎพิเศษ: ตัดรอบก่อนวันหยุด (ทำงานเสริมกฎปกติ)"
          />
          {rules.pre_holiday_cutoff_time && (
            <div className="mt-3 space-y-3">
              <FormGrid>
                <Field label="ปิดรับจองก่อนวันหยุด เวลา" hint="วันก่อนวันหยุดต้องจองก่อนเวลานี้">
                  <Input type="time" value={rules.pre_holiday_cutoff_time} onChange={e => r('pre_holiday_cutoff_time', e.target.value)} />
                </Field>
                <Field label="ถ้าจองหลังเวลาตัดรอบก่อนวันหยุด">
                  <Select value={rules.pre_holiday_cutoff_action} onChange={e => r('pre_holiday_cutoff_action', e.target.value)}>
                    <option value="block">ไม่รับการจอง (บล็อก)</option>
                    <option value="allow">รับได้ปกติ</option>
                    <option value="require_approval">รับได้แต่ต้องรอ GA อนุมัติ</option>
                  </Select>
                </Field>
              </FormGrid>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-2.5 text-xs text-amber-700">
                ตัวอย่าง: ถ้าวันเสาร์เป็นวันหยุด พนักงานต้องจองก่อน {rules.pre_holiday_cutoff_time} น. ของวันศุกร์ — กฎนี้ทำงานร่วมกับกฎปกติ {rules.cutoff_time} น.
              </div>
            </div>
          )}
        </div>
      </div>

      <FormSection label="การอนุมัติและสิทธิ์พนักงาน" />
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
        <Toggle checked={rules.requires_approval}         onChange={v => r('requires_approval', v)}         label="ทุกการจองต้องรอ GA อนุมัติก่อน" />
        <Toggle checked={rules.ot_requires_approval}      onChange={v => r('ot_requires_approval', v)}      label="การจอง OT ต้องรอ GA อนุมัติ" />
        <Toggle checked={rules.holiday_requires_approval} onChange={v => r('holiday_requires_approval', v)} label="การจองวันหยุดต้องรอ GA อนุมัติ" />
        <Toggle checked={rules.allow_recurring}           onChange={v => r('allow_recurring', v)}           label="อนุญาตการจองแบบประจำ (recurring)" />
        <Toggle checked={rules.allow_employee_edit}       onChange={v => r('allow_employee_edit', v)}       label="พนักงานแก้ไขการจองของตัวเองได้" />
        <Toggle checked={rules.allow_employee_cancel}     onChange={v => r('allow_employee_cancel', v)}     label="พนักงานยกเลิกการจองของตัวเองได้" />
      </div>

      <FormSection label="สิทธิ์ Admin/HR จองแทนพนักงาน" />
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1">
        <Toggle
          checked={rules.allow_admin_book_others}
          onChange={v => r('allow_admin_book_others', v)}
          label="Admin หรือ HR สามารถจองรถแทนพนักงานได้"
        />
        {rules.allow_admin_book_others && (
          <div className="rounded-lg bg-sky-50 border border-sky-100 p-2.5 text-xs text-sky-700 mt-2">
            ขอบเขตถูกกำหนดโดย Role อัตโนมัติ — CompanyAdmin (HR/GA) จองได้ทั้งบริษัท, Admin จองได้เฉพาะแผนกตัวเอง
          </div>
        )}
      </div>
    </div>
  )
}

import type { BookingMode, AfterCutoffAction, AllowDays } from '@/types'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useBookingStore } from '@/lib/stores/booking.store'

function rulesFormToDto(rules: RulesForm) {
  return {
    ...rules,
    booking_mode:              rules.booking_mode        as BookingMode,
    after_cutoff_action:       rules.after_cutoff_action as AfterCutoffAction,
    allow_days:                rules.allow_days          as AllowDays,
    advance_days_max:          rules.advance_days_max === '' ? undefined : rules.advance_days_max,
    max_per_day:               rules.max_per_day === '' ? undefined : rules.max_per_day,
    pre_holiday_cutoff_time:   rules.pre_holiday_cutoff_time || undefined,
    pre_holiday_cutoff_action: rules.pre_holiday_cutoff_action as AfterCutoffAction,
  }
}

function policyToRulesForm(policy: BookingPolicy): RulesForm {
  const r = policy.booking_policy_rules
  if (!r) return { ...defaultRules }
  return {
    booking_mode:              r.booking_mode,
    advance_days_min:          r.advance_days_min,
    advance_days_max:          r.advance_days_max ?? '',
    cutoff_time:               r.cutoff_time,
    after_cutoff_action:       r.after_cutoff_action,
    cancel_deadline_minutes:   r.cancel_deadline_minutes,
    allow_days:                r.allow_days,
    max_per_day:               r.max_per_day ?? '',
    allow_recurring:           r.allow_recurring,
    requires_approval:         r.requires_approval,
    ot_requires_approval:      r.ot_requires_approval,
    holiday_requires_approval: r.holiday_requires_approval,
    allow_employee_edit:       r.allow_employee_edit,
    allow_employee_cancel:     r.allow_employee_cancel,
    allow_admin_book_others:   r.allow_admin_book_others,
    pre_holiday_cutoff_time:   r.pre_holiday_cutoff_time ?? '',
    pre_holiday_cutoff_action: r.pre_holiday_cutoff_action,
  }
}

export function AddBookingPolicyModal() {
  const { modal, closeModal  } = useStore()
  const{addBookingPolicy} = useBookingStore()
  const {companies, loadCompanies} = useCompanyStore()
  const open = modal.type === 'add-booking-policy'

  const [form, setForm] = useState({ company_id: '', name_th: '', name_en: '', description: '', priority: 0 })
  const [rules, setRules] = useState<RulesForm>({ ...defaultRules })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { if (open) loadCompanies() }, [open])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.company_id) e.company_id = 'กรุณาเลือกบริษัท'
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อนโยบาย'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!validate()) return
    addBookingPolicy({ ...form, rules: rulesFormToDto(rules) })
    setForm({ company_id: '', name_th: '', name_en: '', description: '', priority: 0 })
    setRules({ ...defaultRules })
    setErrors({})
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={closeModal} title="สร้างนโยบายการจองใหม่" subtitle="booking_policies" size="lg"
      footer={<><Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button><Button variant="primary" size="sm" onClick={handleSubmit}>สร้างนโยบาย</Button></>}
    >
      <PolicyForm form={form} rules={rules} setForm={setForm} setRules={setRules} errors={errors} companies={companies} />
    </Modal>
  )
}

export function EditBookingPolicyModal() {
  const { modal, closeModal } = useStore()

  const{updateBookingPolicy} = useBookingStore()
  const {companies, loadCompanies} =useCompanyStore()
  const open = modal.type === 'edit-booking-policy'
  const policy: BookingPolicy | undefined = modal.data

  useEffect(() => { if (open) loadCompanies() }, [open])

  const [form, setForm] = useState({
    company_id:  policy?.company_id  ?? '',
    name_th:     policy?.name_th     ?? '',
    name_en:     policy?.name_en     ?? '',
    description: policy?.description ?? '',
    priority:    policy?.priority    ?? 0,
  })
  const [rules, setRules]   = useState<RulesForm>(policy ? policyToRulesForm(policy) : { ...defaultRules })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (policy && form.name_th !== policy.name_th) {
    setForm({ company_id: policy.company_id, name_th: policy.name_th, name_en: policy.name_en, description: policy.description ?? '', priority: policy.priority })
    setRules(policyToRulesForm(policy))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name_th.trim()) e.name_th = 'กรุณากรอกชื่อนโยบาย'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => {
    if (!policy || !validate()) return
    const { company_id, ...patchFields } = form
    updateBookingPolicy(policy.id, { ...patchFields, rules: rulesFormToDto(rules) })
  }

  if (!open || !policy) return null

  return (
    <Modal open={open} onClose={closeModal} title="แก้ไขนโยบายการจอง" subtitle={`ID: ${policy.id}`} size="lg"
      footer={<><Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button><Button variant="primary" size="sm" onClick={handleSubmit}>บันทึก</Button></>}
    >
      <PolicyForm form={form} rules={rules} setForm={setForm} setRules={setRules} errors={errors} companies={companies} />
    </Modal>
  )
}

export function ViewBookingPolicyModal() {
  const { modal, closeModal, openModal } = useStore()
  const open = modal.type === 'view-booking-policy'
  const policy: BookingPolicy | undefined = modal.data
  if (!open || !policy) return null

  const r = policy.booking_policy_rules

  const rows = [
    { label: 'บริษัท',                    value: `${policy.companys?.name_th ?? '—'} (${policy.companys?.code ?? ''})` },
    { label: 'ใครเป็นคนจองรถ',            value: r?.booking_mode === 'assigned' ? 'ระบบกำหนดเส้นทางให้อัตโนมัติ' : 'พนักงานเลือกเส้นทางเอง' },
    { label: 'เดินทางได้วันไหน',           value: r ? getAllowDaysLabel(r.allow_days) : '—' },
    { label: 'จองล่วงหน้าได้ (วัน)',       value: r ? `${r.advance_days_min}–${r.advance_days_max ?? '∞'}` : '—' },
    { label: 'ปิดรับจองเวลา',             value: r ? `${r.cutoff_time} น.` : '—' },
    { label: 'จองหลังเวลาตัดรอบ',         value: r ? getAfterCutoffLabel(r.after_cutoff_action) : '—' },
    { label: 'ยกเลิกได้ก่อนตัดรอบ',       value: r ? `${r.cancel_deadline_minutes} นาที` : '—' },
    { label: 'ทุกการจองต้องอนุมัติ',      value: r?.requires_approval ? 'ใช่' : 'ไม่' },
    { label: 'OT ต้องรอ GA อนุมัติ',      value: r?.ot_requires_approval ? 'ใช่' : 'ไม่' },
    { label: 'วันหยุดต้องรอ GA อนุมัติ',  value: r?.holiday_requires_approval ? 'ใช่' : 'ไม่' },
    { label: 'พนักงานแก้ไขการจองได้',     value: r?.allow_employee_edit ? 'ได้' : 'ไม่ได้' },
    { label: 'พนักงานยกเลิกการจองได้',    value: r?.allow_employee_cancel ? 'ได้' : 'ไม่ได้' },
    { label: 'Admin/HR จองแทนพนักงาน',    value: r?.allow_admin_book_others ? 'ได้ (ขอบเขตตาม Role)' : 'ไม่ได้' },
    { label: 'ตัดรอบก่อนวันหยุด',         value: r?.pre_holiday_cutoff_time ? `${r.pre_holiday_cutoff_time} น. (${getAfterCutoffLabel(r.pre_holiday_cutoff_action)})` : 'ไม่ได้กำหนด' },
    { label: 'สถานะ',                    value: getStatusLabel(policy.is_status) },
  ]

  return (
    <Modal open={open} onClose={closeModal} title="รายละเอียดนโยบาย" subtitle={`ID: ${policy.id}`} size="md"
      footer={<><Button variant="secondary" size="sm" onClick={closeModal}>ปิด</Button><Button variant="primary" size="sm" onClick={() => openModal('edit-booking-policy', policy)}>แก้ไข</Button></>}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <p className="font-bold text-slate-800">{policy.name_th}</p>
            <p className="text-xs text-slate-400 mt-0.5">{policy.name_en}</p>
            <div className="flex gap-1.5 mt-1.5">
              <Badge variant={policy.is_status === 'active' ? 'success' : 'gray'}>{getStatusLabel(policy.is_status)}</Badge>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-slate-400">{row.label}</span>
              <span className="text-slate-700 font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export function DeleteBookingPolicyModal() {
  const { modal, closeModal } = useStore()
  const {  deleteBookingPolicy } = useBookingStore()
  const open = modal.type === 'delete-booking-policy'
  const policy: BookingPolicy | undefined = modal.data
  if (!open || !policy) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบนโยบาย" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button><Button variant="danger" size="sm" onClick={() => deleteBookingPolicy(policy.id)}>ลบนโยบาย</Button></>}
    >
      <div className="text-center py-4 text-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-2xl">🗑️</div>
        <p className="font-semibold text-slate-800">{policy.name_th}</p>
        <p className="text-xs text-slate-400 mt-1">{policy.companys?.name_th ?? ''}</p>
        <p className="text-xs text-red-600 mt-3 bg-red-50 rounded-lg p-2 border border-red-200">
          การลบจะเปลี่ยนสถานะเป็น inactive ไม่ลบข้อมูลจริง
        </p>
      </div>
    </Modal>
  )
}
