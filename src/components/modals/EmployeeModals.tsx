'use client'
import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { Field, Input, Select, FormGrid, FormSection } from '@/components/ui/FormFields'
import { Button, Badge } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { User, Mail, CreditCard, MapPin, Building2 } from 'lucide-react'
import { getCompanyPlantId,getProfile } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'
import type { EmployeeFull } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useCompanyStore } from '@/lib/stores/company.store'

const EMPTY_FORM = {
  company_plant_id:'',
  code: '', rfid: '', first_name_th: '', last_name_th: '',
  first_name_en: '', last_name_en: '', email: '',
  organization_unit_id: '', level_id: '',
  inbound_route_id: '', inbound_point_id: '',
  outbound_route_id: '', outbound_point_id: '',
}

// ─── Cascading org-unit dropdowns ─────────────────────────────
// Renders one <Select> per org level; each level filters by the previous level's selected unit (parent_id).
// initialUnitId is used only for pre-filling (edit modal); onChange fires with the deepest selected unit id.
function OrgUnitCascade({
  orgLevels,
  orgUnits,
  initialUnitId,
  onChange,
}: {
  orgLevels: any[]
  orgUnits:  any[]
  initialUnitId: string
  onChange: (id: string) => void
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // Track what we last initialized from so we don't loop when onChange updates the parent form
  const lastInitRef = useRef('')

  useEffect(() => {
    if (!orgUnits.length || !orgLevels.length) {
      setSelectedIds([])
      lastInitRef.current = ''
      return
    }
    if (lastInitRef.current === initialUnitId) return
    lastInitRef.current = initialUnitId

    if (!initialUnitId) { setSelectedIds([]); return }

    // Walk up parent_id chain to rebuild the full selection path
    const chain: string[] = []
    let cur: any = orgUnits.find((u: any) => u.id === initialUnitId)
    while (cur) {
      chain.unshift(cur.id)
      cur = cur.parent_id ? orgUnits.find((u: any) => u.id === cur.parent_id) : null
    }
    setSelectedIds(chain)
  }, [initialUnitId, orgUnits.length, orgLevels.length])

  const handleSelect = (levelIdx: number, unitId: string) => {
    const next = [...selectedIds.slice(0, levelIdx)]
    if (unitId) next.push(unitId)
    setSelectedIds(next)
    onChange(next.length > 0 ? next[next.length - 1] : '')
  }

  if (!orgLevels.length) {
    return <p className="col-span-2 text-xs text-slate-400">ไม่มีโครงสร้างองค์กร</p>
  }

  return (
    <>
      {orgLevels.map((lvl: any, i: number) => {
        const parentId = i === 0 ? null : (selectedIds[i - 1] ?? null)
        const available = orgUnits.filter((u: any) =>
          u.organization_level_id === lvl.id && u.parent_id === (parentId ?? null)
        )
        const isDisabled = i > 0 && !selectedIds[i - 1]
        return (
          <Field key={lvl.id} label={lvl.name_th}>
            <Select
              value={selectedIds[i] ?? ''}
              onChange={e => handleSelect(i, e.target.value)}
              disabled={isDisabled}
            >
              <option value="">— ไม่ระบุ —</option>
              {available.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.code ? `[${u.code}] ` : ''}{u.name_th}
                </option>
              ))}
            </Select>
          </Field>
        )
      })}
    </>
  )
}

// ─── Add Employee Modal ───────────────────────────────────────
export function AddEmployeeModal() {
  const {   modal,
  closeModal,
  currentCompanyId,
  selectedCompanyPlantId,
  setSelectedCompanyPlantId,
} = useStore()

  const {  companyPlants,
  loadCompanies,}=useCompanyStore()  
  const {  addEmployee} = useEmployeeStore()
  const open = modal.type === 'add-employee'

  const profile = getProfile()
const canSelectPlant =
  profile?.roleTypes?.includes('superadmin') ||
  profile?.roleTypes?.includes('admin')

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // org structure from API
  const [orgLevels, setOrgLevels] = useState<any[]>([])
  const [orgUnits, setOrgUnits]   = useState<any[]>([])
  const [levels, setLevels]       = useState<any[]>([])
  const [routes, setRoutes]       = useState<any[]>([])
  const [points, setPoints]       = useState<any[]>([])


const availableCompanyPlants = companyPlants.filter((cp: any) =>
  currentCompanyId ? cp.company_id === currentCompanyId : true
)

useEffect(() => {
  if (!open) return

  loadCompanies()
  setForm({
    ...EMPTY_FORM,
    company_plant_id: selectedCompanyPlantId || '',
  })
  setErrors({})
}, [open])


const cpId =
  form.company_plant_id ||
  selectedCompanyPlantId ||
  getCompanyPlantId()

useEffect(() => {
  if (!open) return

  setOrgLevels([])
  setOrgUnits([])

  const cpQuery = cpId ? `?company_plant_id=${cpId}` : ''
  const routeQuery = cpId
    ? `?company_plant_ids=${cpId}&status=active&limit=200`
    : `?status=active&limit=200`

  Promise.all([
    apiFetch(`/api/organization-levels${cpQuery}`).then(r => r.json()),
    apiFetch(`/api/organization-units${cpQuery}`).then(r => r.json()),
    apiFetch('/api/levels?status=active&limit=100').then(r => r.json()),
    apiFetch(`/api/routes${routeQuery}`).then(r => r.json()),
    apiFetch('/api/points?status=active&limit=500').then(r => r.json()),
  ]).then(([orgLvls, units, lvls, rts, pts]) => {

console.log('cpId', cpId)
console.log('orgLvls', orgLvls)
console.log('units', units)

    setOrgLevels(Array.isArray(orgLvls.data) ? orgLvls.data : [])
    setOrgUnits(Array.isArray(units.data) ? units.data : [])
    setLevels(Array.isArray(lvls.data?.data) ? lvls.data.data : [])
    setRoutes(Array.isArray(rts.data?.data) ? rts.data.data : [])
    setPoints(Array.isArray(pts.data?.data) ? pts.data.data : [])
  }).catch(() => {})
}, [open, cpId])

  const inboundRoutes  = routes.filter((r: any) => r.trip_direction === 'inbound')
  const outboundRoutes = routes.filter((r: any) => r.trip_direction === 'outbound')
  const inboundPoints  = points.filter((p: any) => !form.inbound_route_id  || p.route_id === form.inbound_route_id)
  const outboundPoints = points.filter((p: any) => !form.outbound_route_id || p.route_id === form.outbound_route_id)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'กรุณากรอกรหัสพนักงาน'
    if (!form.first_name_th.trim()) e.first_name_th = 'กรุณากรอกชื่อ'
    if (!form.last_name_th.trim()) e.last_name_th = 'กรุณากรอกนามสกุล'
    if (canSelectPlant && !(form.company_plant_id || selectedCompanyPlantId)) {
  e.company_plant_id = 'กรุณาเลือก Plant'
}
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const transportDefaults = [
      ...(form.inbound_route_id  ? [{ trip_direction: 'inbound',  route_id: form.inbound_route_id,  point_id: form.inbound_point_id  || undefined }] : []),
      ...(form.outbound_route_id ? [{ trip_direction: 'outbound', route_id: form.outbound_route_id, point_id: form.outbound_point_id || undefined }] : []),
    ]
 addEmployee({
  company_plant_id:
    form.company_plant_id ||
    selectedCompanyPlantId ||
    getCompanyPlantId(),

  code: form.code,
  rfid: form.rfid || undefined,
  first_name_th: form.first_name_th,
  last_name_th: form.last_name_th,
  first_name_en: form.first_name_en || undefined,
  last_name_en: form.last_name_en || undefined,
  email: form.email || undefined,
  organization_unit_id: form.organization_unit_id || undefined,
  level_id: form.level_id || undefined,
  transportDefaults,
} as any)
    closeModal()
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title="เพิ่มพนักงานใหม่" subtitle="กรอกข้อมูลพนักงาน" size="lg"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>บันทึกพนักงาน</Button>
      </>}
    >
      <div className="space-y-4">
        <FormSection label="ข้อมูลพื้นฐาน" />
        <FormGrid>
          <Field label="รหัสพนักงาน (code)" required error={errors.code}>
            <Input placeholder="เช่น 930920" value={form.code} onChange={e => set('code', e.target.value)} error={!!errors.code} />
          </Field>
          <Field label="RFID">
            <Input placeholder="เช่น 9309200001 (ไม่บังคับ)" value={form.rfid} onChange={e => set('rfid', e.target.value)} />
          </Field>
          <Field label="อีเมล">
            <Input type="email" placeholder="email@tttp.co.th" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </FormGrid>

        <FormSection label="ชื่อ-นามสกุล" />
        <FormGrid>
          <Field label="ชื่อ (ภาษาไทย)" required error={errors.first_name_th}>
            <Input placeholder="ชื่อจริง" value={form.first_name_th} onChange={e => set('first_name_th', e.target.value)} error={!!errors.first_name_th} />
          </Field>
          <Field label="นามสกุล (ภาษาไทย)" required error={errors.last_name_th}>
            <Input placeholder="นามสกุล" value={form.last_name_th} onChange={e => set('last_name_th', e.target.value)} error={!!errors.last_name_th} />
          </Field>
          <Field label="First name (EN)">
            <Input placeholder="First name" value={form.first_name_en} onChange={e => set('first_name_en', e.target.value)} />
          </Field>
          <Field label="Last name (EN)">
            <Input placeholder="Last name" value={form.last_name_en} onChange={e => set('last_name_en', e.target.value)} />
          </Field>
        </FormGrid>
{canSelectPlant && (
  <>
    <FormSection label="โรงงาน / Plant" />
    <FormGrid>
      <Field label="เลือก Plant" required error={errors.company_plant_id}>
        <Select
          value={form.company_plant_id}
          onChange={e => {
            const plantId = e.target.value
            setSelectedCompanyPlantId(plantId)

            setForm(f => ({
              ...f,
              company_plant_id: plantId,
              organization_unit_id: '',
              level_id: '',
              inbound_route_id: '',
              inbound_point_id: '',
              outbound_route_id: '',
              outbound_point_id: '',
            }))
          }}
          error={!!errors.company_plant_id}
        >
          <option value="">— เลือก Plant —</option>

          {availableCompanyPlants.map((cp: any) => (
            <option key={cp.id} value={cp.id}>
              {cp.plant?.code ? `[${cp.plant.code}] ` : ''}
              {cp.plant?.name_th ?? cp.plants?.name_th ?? cp.id}
            </option>
          ))}
        </Select>
      </Field>
    </FormGrid>
  </>
)}
        <FormSection label="โครงสร้างองค์กร" />
        <FormGrid>
          <OrgUnitCascade
            orgLevels={orgLevels}
            orgUnits={orgUnits}
            initialUnitId={form.organization_unit_id}
            onChange={id => set('organization_unit_id', id)}
          />
          <Field label="ระดับพนักงาน (Level)">
            <Select value={form.level_id} onChange={e => set('level_id', e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {levels.map((l: any) => <option key={l.id} value={l.id}>{l.name_th}</option>)}
            </Select>
          </Field>
        </FormGrid>

        <FormSection label="เส้นทาง & จุดจอด (transport defaults)" />
        <FormGrid>
          <Field label="Route เที่ยวเข้า">
            <Select value={form.inbound_route_id} onChange={e => { set('inbound_route_id', e.target.value); set('inbound_point_id', '') }}>
              <option value="">ไม่ระบุ</option>
              {inboundRoutes.map(r => <option key={r.id} value={r.id}>{r.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Point เที่ยวเข้า">
            <Select value={form.inbound_point_id} onChange={e => set('inbound_point_id', e.target.value)} disabled={!form.inbound_route_id}>
              <option value="">ไม่ระบุ</option>
              {inboundPoints.map(p => <option key={p.id} value={p.id}>{p.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Route เที่ยวออก">
            <Select value={form.outbound_route_id} onChange={e => { set('outbound_route_id', e.target.value); set('outbound_point_id', '') }}>
              <option value="">ไม่ระบุ</option>
              {outboundRoutes.map(r => <option key={r.id} value={r.id}>{r.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Point เที่ยวออก">
            <Select value={form.outbound_point_id} onChange={e => set('outbound_point_id', e.target.value)} disabled={!form.outbound_route_id}>
              <option value="">ไม่ระบุ</option>
              {outboundPoints.map(p => <option key={p.id} value={p.id}>{p.name_th}</option>)}
            </Select>
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

// ─── Edit Employee Modal ──────────────────────────────────────
export function EditEmployeeModal() {
  const { modal, closeModal } = useStore()
  const {updateEmployee} = useEmployeeStore()
  const open = modal.type === 'edit-employee'
  const emp: EmployeeFull | undefined = modal.data

  const [form, setForm] = useState({
    first_name_th: '', last_name_th: '',
    first_name_en: '', last_name_en: '',
    email: '', level_id: '', organization_unit_id: '',
    inbound_route_id: '', inbound_point_id: '',
    outbound_route_id: '', outbound_point_id: '',
  })
  const [orgLevels, setOrgLevels] = useState<any[]>([])
  const [orgUnits, setOrgUnits]   = useState<any[]>([])
  const [levels, setLevels]       = useState<any[]>([])
  const [routes, setRoutes]       = useState<any[]>([])
  const [points, setPoints]       = useState<any[]>([])



  // Fetch all reference data when modal opens
  useEffect(() => {
    if (!open) return
    
    setOrgLevels([])
    setOrgUnits([])
    const cpId = getCompanyPlantId()
    const cpQuery = cpId ? `?company_plant_id=${cpId}` : ''
    const routeQuery = cpId
      ? `?company_plant_ids=${cpId}&status=active&limit=200`
      : `?status=active&limit=200`

    Promise.all([
      apiFetch(`/api/organization-levels${cpQuery}`).then(r => r.json()),
      apiFetch(`/api/organization-units${cpQuery}`).then(r => r.json()),
      apiFetch('/api/levels?status=active&limit=100').then(r => r.json()),
      apiFetch(`/api/routes${routeQuery}`).then(r => r.json()),
      apiFetch('/api/points?status=active&limit=500').then(r => r.json()),
    ]).then(([orgLvls, units, lvls, rts, pts]) => {
      setOrgLevels(Array.isArray(orgLvls.data) ? orgLvls.data : [])
      setOrgUnits(Array.isArray(units.data) ? units.data : [])
      setLevels(Array.isArray(lvls.data?.data) ? lvls.data.data : [])
      setRoutes(Array.isArray(rts.data?.data) ? rts.data.data : [])
      setPoints(Array.isArray(pts.data?.data) ? pts.data.data : [])
    }).catch(() => {})
  }, [open])

  // Pre-fill form when employee data is ready
  useEffect(() => {
    if (emp && open) {
      const inbound  = emp.transport_defaults?.find(td => td.trip_direction === 'inbound')
      const outbound = emp.transport_defaults?.find(td => td.trip_direction === 'outbound')
      setForm({
        first_name_th:        emp.first_name_th ?? '',
        last_name_th:         emp.last_name_th  ?? '',
        first_name_en:        emp.first_name_en ?? '',
        last_name_en:         emp.last_name_en  ?? '',
        email:                emp.email         ?? '',
        level_id:             emp.defaults?.level?.id            ?? '',
        organization_unit_id: emp.defaults?.organizationUnit?.id ?? '',
        inbound_route_id:     inbound?.route_id  ?? '',
        inbound_point_id:     inbound?.point_id  ?? '',
        outbound_route_id:    outbound?.route_id ?? '',
        outbound_point_id:    outbound?.point_id ?? '',
      })
    }
  }, [emp?.id, open])

  if (!emp || !open) return null

  const inboundRoutes  = routes.filter((r: any) => r.trip_direction === 'inbound')
  const outboundRoutes = routes.filter((r: any) => r.trip_direction === 'outbound')
  const inboundPoints  = points.filter((p: any) => !form.inbound_route_id  || p.route_id === form.inbound_route_id)
  const outboundPoints = points.filter((p: any) => !form.outbound_route_id || p.route_id === form.outbound_route_id)

  const handleSave = () => {
    updateEmployee(emp.id, {
      first_name_th: form.first_name_th, last_name_th: form.last_name_th,
      first_name_en: form.first_name_en, last_name_en: form.last_name_en,
      email: form.email || null,
      organization_unit_id: form.organization_unit_id || undefined,
      level_id: form.level_id || undefined,
      transportDefaults: [
        { trip_direction: 'inbound',  route_id: form.inbound_route_id  || undefined, point_id: form.inbound_point_id  || undefined },
        { trip_direction: 'outbound', route_id: form.outbound_route_id || undefined, point_id: form.outbound_point_id || undefined },
      ],
    } as any)
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={closeModal} title={`แก้ไข · ${emp.first_name_th} ${emp.last_name_th}`} subtitle={`รหัส: ${emp.code}`} size="lg"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="primary" size="sm" onClick={handleSave}>บันทึกการแก้ไข</Button>
      </>}
    >
      <div className="space-y-4">
        <FormGrid>
          <Field label="ชื่อ (ภาษาไทย)">
            <Input value={form.first_name_th} onChange={e => set('first_name_th', e.target.value)} />
          </Field>
          <Field label="นามสกุล (ภาษาไทย)">
            <Input value={form.last_name_th} onChange={e => set('last_name_th', e.target.value)} />
          </Field>
          <Field label="First name (EN)">
            <Input value={form.first_name_en} onChange={e => set('first_name_en', e.target.value)} />
          </Field>
          <Field label="Last name (EN)">
            <Input value={form.last_name_en} onChange={e => set('last_name_en', e.target.value)} />
          </Field>
        </FormGrid>
        <Field label="อีเมล">
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </Field>

        <FormSection label="โครงสร้างองค์กร" />
        <FormGrid>
          <OrgUnitCascade
            orgLevels={orgLevels}
            orgUnits={orgUnits}
            initialUnitId={form.organization_unit_id}
            onChange={id => set('organization_unit_id', id)}
          />
          <Field label="ระดับพนักงาน (Level)">
            <Select value={form.level_id} onChange={e => set('level_id', e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {levels.map((l: any) => <option key={l.id} value={l.id}>{l.name_th}</option>)}
            </Select>
          </Field>
        </FormGrid>

        <FormSection label="เส้นทาง & จุดจอด (transport defaults)" />
        <FormGrid>
          <Field label="Route เที่ยวเข้า">
            <Select value={form.inbound_route_id} onChange={e => { set('inbound_route_id', e.target.value); set('inbound_point_id', '') }}>
              <option value="">ไม่ระบุ</option>
              {inboundRoutes.map((r: any) => <option key={r.id} value={r.id}>{r.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Point เที่ยวเข้า">
            <Select value={form.inbound_point_id} onChange={e => set('inbound_point_id', e.target.value)} disabled={!form.inbound_route_id}>
              <option value="">ไม่ระบุ</option>
              {inboundPoints.map(p => <option key={p.id} value={p.id}>{p.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Route เที่ยวออก">
            <Select value={form.outbound_route_id} onChange={e => { set('outbound_route_id', e.target.value); set('outbound_point_id', '') }}>
              <option value="">ไม่ระบุ</option>
              {outboundRoutes.map(r => <option key={r.id} value={r.id}>{r.name_th}</option>)}
            </Select>
          </Field>
          <Field label="Point เที่ยวออก">
            <Select value={form.outbound_point_id} onChange={e => set('outbound_point_id', e.target.value)} disabled={!form.outbound_route_id}>
              <option value="">ไม่ระบุ</option>
              {outboundPoints.map(p => <option key={p.id} value={p.id}>{p.name_th}</option>)}
            </Select>
          </Field>
        </FormGrid>
      </div>
    </Modal>
  )
}

// ─── View Employee Modal ──────────────────────────────────────
export function ViewEmployeeModal() {
  const { modal, closeModal } = useStore()
  const open = modal.type === 'view-employee'
  const emp: EmployeeFull | undefined = modal.data
  if (!emp || !open) return null

  const rows = [
    { label: 'รหัสพนักงาน', value: emp.code, mono: true },
    { label: 'RFID', value: emp.rfid, mono: true },
    { label: 'ชื่อ-นามสกุล (TH)', value: `${emp.first_name_th} ${emp.last_name_th}` },
    { label: 'ชื่อ-นามสกุล (EN)', value: `${emp.first_name_en} ${emp.last_name_en}` },
    { label: 'อีเมล', value: emp.email ?? '-' },
    { label: 'Username', value: emp.username, mono: true },
    { label: 'หน่วยงาน', value: emp.defaults?.organizationUnit?.nameTh ?? '-' },
    { label: 'ระดับองค์กร', value: emp.defaults?.organizationUnit?.levelNameTh ?? '-' },
    { label: 'Level', value: emp.defaults?.level?.nameTh ?? '-' },
    { label: 'Route เที่ยวเข้า', value: emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.route?.name_th ?? '-' },
    { label: 'Point เที่ยวเข้า', value: emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.point?.name_th ?? '-' },
    { label: 'Route เที่ยวออก', value: emp.transport_defaults?.find(td => td.trip_direction === 'outbound')?.route?.name_th ?? '-' },
    { label: 'Point เที่ยวออก', value: emp.transport_defaults?.find(td => td.trip_direction === 'outbound')?.point?.name_th ?? '-' },
    { label: 'สร้างเมื่อ', value: emp.created_at.slice(0, 10) },
  ]

  return (
    <Modal open={open} onClose={closeModal} title="รายละเอียดพนักงาน" subtitle={`ID: ${emp.id}`} size="md"
      footer={<Button variant="secondary" size="sm" onClick={closeModal}>ปิด</Button>}
    >
      <div className="flex items-center gap-4 mb-5 p-4 bg-sky-50 rounded-xl border border-sky-100">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
          {emp.first_name_th.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-slate-800 text-base">{emp.first_name_th} {emp.last_name_th}</p>
          <p className="text-xs text-slate-500">{emp.first_name_en} {emp.last_name_en}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${getStatusColor(emp.is_status)}`}>
            {getStatusLabel(emp.is_status)}
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between py-2.5 text-xs">
            <span className="text-slate-400 font-medium">{r.label}</span>
            <span className={`text-slate-700 font-semibold ${r.mono ? 'font-mono bg-slate-100 px-2 py-0.5 rounded' : ''}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────
export function DeleteEmployeeModal() {
  const { modal, closeModal } = useStore()
  const {  deleteEmployee} = useEmployeeStore()
  const open = modal.type === 'delete-employee'
  const emp: EmployeeFull | undefined = modal.data
  if (!emp || !open) return null

  return (
    <Modal open={open} onClose={closeModal} title="ยืนยันการลบ" size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={closeModal}>ยกเลิก</Button>
        <Button variant="danger" size="sm" onClick={() => deleteEmployee(emp.id)}>ลบพนักงาน</Button>
      </>}
    >
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-red-500">{emp.first_name_th.charAt(0)}</span>
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">{emp.first_name_th} {emp.last_name_th}</p>
        <p className="text-xs text-slate-400 mb-4">รหัส: {emp.code} · RFID: {emp.rfid}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
          การลบจะเปลี่ยน is_status เป็น <strong>inactive</strong> (soft delete) สามารถกู้คืนได้ภายหลัง
        </div>
      </div>
    </Modal>
  )
}
