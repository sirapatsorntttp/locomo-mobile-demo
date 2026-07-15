'use client'
import { useState, useEffect } from 'react'
import {
  Plus, Search, Download, Upload, Eye, Edit, Trash2,
  ToggleRight, ToggleLeft, Printer, X,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { EmployeeFull, Status } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'

// ─── QR payload: RFID scan for boarding ───────────────────────
function makeQrPayload(emp: EmployeeFull) {
  return JSON.stringify({ type: 'employee_attendance', rfid: emp.rfid, code: emp.code, username: emp.username })
}

// ─── Print in new window ───────────────────────────────────────
async function printEmployeeCard(emp: EmployeeFull) {
  const qrDataUrl = await QRCode.toDataURL(makeQrPayload(emp), {
    width: 160, margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  const nameTh = `${emp.first_name_th} ${emp.last_name_th}`
  const nameEn = `${emp.first_name_en} ${emp.last_name_en}`
  const initial = emp.first_name_th.charAt(0)
  const dept = emp.defaults?.organizationUnit?.nameTh ?? ''
  const division = emp.defaults?.organizationUnit?.levelNameTh ?? ''
  const level = emp.defaults?.level?.nameTh ?? ''
  const inboundTd = emp.transport_defaults?.find(td => td.trip_direction === 'inbound')
  const route = inboundTd?.route?.name_th ?? ''
  const point = inboundTd?.point?.name_th ?? ''
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const yearTh = (new Date().getFullYear() + 543).toString()

  const infoRows = [
    { icon: '🪪', label: 'รหัส', val: emp.code, mono: true },
    { icon: '📡', label: 'RFID', val: emp.rfid, mono: true },
    ...(dept ? [{ icon: '🏢', label: 'แผนก', val: dept, mono: false }] : []),
    ...(level ? [{ icon: '⭐', label: 'ระดับ', val: level, mono: false }] : []),
    ...(route ? [{ icon: '🚌', label: 'สาย', val: route, mono: false }] : []),
    ...(point ? [{ icon: '📍', label: 'จุดขึ้น', val: point, mono: false }] : []),
  ]

  const rowsHtml = infoRows.map(r => `
    <div class="field-row">
      <div class="field-icon">${r.icon}</div>
      <div class="field-label">${r.label}</div>
      <div class="field-value${r.mono ? '' : ' normal'}">${r.val}</div>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>บัตรพนักงาน – ${nameTh}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#e8edf2; display:flex; align-items:center; justify-content:center; font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif; }

    .card { width:340px; background:white; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.22),0 4px 16px rgba(0,0,0,0.10); position:relative; }

    .header { background:linear-gradient(135deg,#064e3b 0%,#065f46 55%,#047857 100%); position:relative; overflow:hidden; }
    .header::before { content:''; position:absolute; top:-40px; right:-40px; width:130px; height:130px; border-radius:50%; background:rgba(255,255,255,0.05); }
    .header::after  { content:''; position:absolute; bottom:-30px; left:60px; width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,0.04); }
    .header-inner { position:relative; z-index:2; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; }

    .brand { display:flex; align-items:center; gap:10px; }
    .brand-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#34d399,#10b981); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(52,211,153,0.4); }
    .brand-name { color:white; font-size:16px; font-weight:800; letter-spacing:0.5px; line-height:1; }
    .brand-sub  { color:rgba(255,255,255,0.5); font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:2px; margin-top:3px; }
    .card-type  { font-size:9px; font-weight:700; color:rgba(255,255,255,0.55); text-transform:uppercase; letter-spacing:2px; text-align:right; }
    .card-type strong { display:block; font-size:12px; color:rgba(255,255,255,0.9); letter-spacing:1px; margin-top:2px; }

    .stripe { height:3px; background:linear-gradient(90deg,#34d399 0%,#10b981 40%,#0d9488 100%); }

    .body { padding:14px 18px; display:flex; gap:14px; }

    .avatar { width:62px; height:62px; border-radius:14px; background:linear-gradient(135deg,#34d399,#10b981); display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:900; color:white; box-shadow:0 4px 14px rgba(16,185,129,0.35); border:2.5px solid #d1fae5; flex-shrink:0; }
    .role-badge { margin-top:7px; text-align:center; font-size:8px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#065f46; background:#d1fae5; border:1px solid #a7f3d0; border-radius:6px; padding:3px 7px; }

    .info { flex:1; min-width:0; }
    .name-th { font-size:15px; font-weight:800; color:#0f172a; line-height:1.2; }
    .name-en { font-size:10px; color:#94a3b8; margin-top:2px; font-weight:500; }
    .divider  { height:1px; background:#f1f5f9; margin:9px 0 7px; }

    .field-row   { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
    .field-icon  { width:15px; height:15px; border-radius:4px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:8px; }
    .field-label { font-size:8px; color:#94a3b8; width:42px; flex-shrink:0; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
    .field-value { font-size:10px; color:#1e293b; font-weight:700; font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .field-value.normal { font-family:inherit; font-weight:600; }

    .qr-wrap { flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 8px 6px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px; }
    .qr-wrap img { display:block; width:88px; height:88px; }
    .qr-label { font-size:7px; color:#6b7280; text-align:center; line-height:1.5; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }

    .footer { background:#064e3b; padding:6px 18px; display:flex; align-items:center; justify-content:space-between; }
    .footer-dot  { width:5px; height:5px; border-radius:50%; background:#34d399; }
    .footer-text { font-size:8px; color:rgba(255,255,255,0.45); font-weight:600; letter-spacing:0.5px; margin-left:6px; }
    .footer-year { font-size:8px; color:rgba(255,255,255,0.3); font-family:monospace; }

    .watermark { position:absolute; bottom:38px; right:14px; font-size:52px; font-weight:900; color:rgba(16,185,129,0.05); transform:rotate(-12deg); pointer-events:none; z-index:0; letter-spacing:-2px; font-family:monospace; }

    @media print {
      html, body { background:white; }
      @page { size:9cm 5.4cm; margin:0; }
      .card { width:100%; border-radius:0; box-shadow:none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="watermark">LOCOMO</div>
    <div class="header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">LOCOMO</div>
            <div class="brand-sub">Transport Management</div>
          </div>
        </div>
        <div class="card-type">บัตรประจำตัว<strong>พนักงาน</strong></div>
      </div>
    </div>
    <div class="stripe"></div>
    <div class="body">
      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div class="avatar">${initial}</div>
        <div class="role-badge">Employee</div>
      </div>
      <div class="info">
        <div class="name-th">${nameTh}</div>
        <div class="name-en">${nameEn}</div>
        <div class="divider"></div>
        ${rowsHtml}
      </div>
      <div class="qr-wrap">
        <img src="${qrDataUrl}" alt="QR"/>
        <div class="qr-label">สแกนขึ้นรถ<br/>RFID/QR</div>
      </div>
    </div>
    <div class="footer">
      <div style="display:flex;align-items:center;">
        <div class="footer-dot"></div>
        <span class="footer-text">ออกบัตร: ${today}</span>
      </div>
      <span class="footer-year">© ${yearTh}</span>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 300); });
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=520,height=400,toolbar=0,menubar=0,scrollbars=0')
  if (!win) { alert('กรุณาอนุญาต popup เพื่อพิมพ์บัตร'); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

// ─── Employee Card Modal (preview) ────────────────────────────
function EmployeeCardModal({ emp, onClose }: { emp: EmployeeFull; onClose: () => void }) {
  const { t } = useLang()
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(makeQrPayload(emp), {
      width: 160, margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrUrl)
  }, [emp])

  const nameTh = `${emp.first_name_th} ${emp.last_name_th}`
  const nameEn = `${emp.first_name_en} ${emp.last_name_en}`
  const dept = emp.defaults?.organizationUnit?.nameTh
  const level = emp.defaults?.level?.nameTh
  const inboundTd2 = emp.transport_defaults?.find(td => td.trip_direction === 'inbound')
  const route = inboundTd2?.route?.name_th
  const point = inboundTd2?.point?.name_th
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  const yearTh = (new Date().getFullYear() + 543).toString()

  const fields = [
    { icon: '🪪', label: t('common', 'code'), val: emp.code, mono: true },
    { icon: '📡', label: 'RFID', val: emp.rfid, mono: true },
    ...(dept ? [{ icon: '🏢', label: t('common', 'department'), val: dept, mono: false }] : []),
    ...(level ? [{ icon: '⭐', label: t('employees', 'level'), val: level, mono: false }] : []),
    ...(route ? [{ icon: '🚌', label: t('common', 'route'), val: route, mono: false }] : []),
    ...(point ? [{ icon: '📍', label: t('common', 'point'), val: point, mono: false }] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 w-[420px]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">{t('employees', 'cardPreview')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t('employees', 'cardCheck')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={14} /></button>
        </div>

        {/* Card preview */}
        <div style={{ width: 340, borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', position: 'relative' }}>
          {/* Watermark */}
          <div style={{ position: 'absolute', bottom: 32, right: 14, fontSize: 50, fontWeight: 900, color: 'rgba(16,185,129,0.05)', transform: 'rotate(-12deg)', letterSpacing: -2, fontFamily: 'monospace', pointerEvents: 'none', zIndex: 0 }}>LOCOMO</div>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 55%,#047857 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#34d399,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(52,211,153,0.4)', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>LOCOMO</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginTop: 3 }}>Transport Management</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 9, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
                {t('employees', 'cardId')}<br />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 }}>{t('employees', 'cardEmployee')}</span>
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div style={{ height: 3, background: 'linear-gradient(90deg,#34d399 0%,#10b981 40%,#0d9488 100%)' }} />

          {/* Body */}
          <div style={{ padding: '14px 18px', display: 'flex', gap: 14, background: 'white', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 62, height: 62, borderRadius: 14, background: 'linear-gradient(135deg,#34d399,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', border: '2.5px solid #d1fae5' }}>
                {emp.first_name_th.charAt(0)}
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#065f46', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '3px 7px' }}>Employee</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{nameTh}</div>
              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{nameEn}</div>
              <div style={{ height: 1, background: '#f1f5f9', margin: '9px 0 7px' }} />
              {fields.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, flexShrink: 0 }}>{f.icon}</div>
                  <span style={{ fontSize: 8, color: '#94a3b8', width: 42, flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: '#1e293b', fontWeight: 700, fontFamily: f.mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.val}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 8px 6px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12 }}>
              {qrUrl
                ? (/* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrUrl} alt="QR" style={{ width: 88, height: 88, display: 'block' }} />)
                : <div style={{ width: 88, height: 88, background: '#e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94a3b8' }}>loading…</div>
              }
              <div style={{ fontSize: 7, color: '#6b7280', textAlign: 'center', lineHeight: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('employees', 'cardScan')}<br />RFID/QR</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: '#064e3b', padding: '6px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: 0.5 }}>{t('employees', 'cardIssued')} {today}</span>
            </div>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>© {yearTh}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm font-semibold text-slate-500 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors">{t('common', 'close')}</button>
          <button
            onClick={() => printEmployeeCard(emp)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold py-2.5 rounded-xl shadow-md shadow-emerald-200 transition-all"
          >
            <Printer size={14} /> {t('employees', 'printCard2')}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 -mt-1">{t('employees', 'printNote')}</p>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────
export default function EmployeesPage() {
  const { openModal } = useStore()
  const { employees, loadEmployees, toggleEmployeeStatus } = useEmployeeStore()
  const { t } = useLang()

  useEffect(() => { loadEmployees() }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [divFilter, setDivFilter] = useState('')
  const [routeFilter, setRouteFilter] = useState('')
  const [printEmp, setPrintEmp] = useState<EmployeeFull | null>(null)

  const divisions = Array.from(new Map(
    employees.flatMap(e => e.defaults?.organizationUnit
      ? [[e.defaults.organizationUnit.id, e.defaults.organizationUnit]]
      : [])
  ).entries())
  const routes = Array.from(new Map(
    employees.flatMap(e => {
      const td = e.transport_defaults?.find(t => t.trip_direction === 'inbound')
      return td?.route ? [[td.route.id, td.route]] : []
    })
  ).entries())

  const filtered = employees.filter(e => {
    const q = `${e.first_name_th} ${e.last_name_th} ${e.code} ${e.rfid} ${e.email ?? ''}`.toLowerCase()
    return q.includes(search.toLowerCase())
      && (statusFilter === 'all' || e.is_status === statusFilter)
      && (!divFilter || e.defaults?.organizationUnit?.id === divFilter)
      && (!routeFilter || e.transport_defaults?.some(td => td.trip_direction === 'inbound' && td.route_id === routeFilter))
  })

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_status === 'active').length,
    inactive: employees.filter(e => e.is_status === 'inactive').length,
    withRoute: employees.filter(e => e.transport_defaults?.some(td => td.route_id)).length,
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {printEmp && <EmployeeCardModal emp={printEmp} onClose={() => setPrintEmp(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('employees', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">employees + employees_defaults · {employees.length} {t('common', 'items')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Upload size={13} />}>{t('employees', 'importCsv')}</Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />}>{t('employees', 'exportExcel')}</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-employee')}>{t('employees', 'addEmployee')}</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t('employees', 'allFilter'), value: stats.total, c: 'bg-slate-50 border-slate-200', t: 'text-slate-700' },
          { label: t('common', 'active'), value: stats.active, c: 'bg-emerald-50 border-emerald-100', t: 'text-emerald-700' },
          { label: t('common', 'inactive'), value: stats.inactive, c: 'bg-slate-50 border-slate-200', t: 'text-slate-500' },
          { label: t('employees', 'hasRoute'), value: stats.withRoute, c: 'bg-sky-50 border-sky-100', t: 'text-sky-700' },
        ].map(i => (
          <div key={i.label} className={`rounded-xl p-4 border ${i.c}`}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{i.label}</p>
            <p className={`text-2xl font-bold ${i.t}`}>{i.value}</p>
          </div>
        ))}
      </div>

      <Card padding="sm">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex-1 min-w-48">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input className="text-xs bg-transparent outline-none text-slate-600 placeholder:text-slate-400 w-full"
              placeholder={t('employees', 'searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
            value={divFilter} onChange={e => setDivFilter(e.target.value)}>
            <option value="">{t('employees', 'allDivisions')}</option>
            {divisions.map(([id, div]) => <option key={id} value={id}>{div?.nameTh}</option>)}
          </select>
          <select className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none"
            value={routeFilter} onChange={e => setRouteFilter(e.target.value)}>
            <option value="">{t('employees', 'allRoutes')}</option>
            {routes.map(([id, route]) => <option key={id} value={id}>{route?.name_th}</option>)}
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${statusFilter === s ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'}`}>
                {s === 'all' ? t('employees', 'allFilter') : s}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th><input type="checkbox" className="rounded" /></Th>
              <Th>{t('employees', 'codeRfid')}</Th><Th>{t('employees', 'fullName')}</Th><Th>{t('common', 'email')}</Th>
              <Th>{t('employees', 'dept')}</Th><Th>{t('employees', 'level')}</Th><Th>Route</Th><Th>{t('employees', 'pointLabel')}</Th>
              <Th>{t('common', 'status')}</Th><Th>{t('common', 'actions')}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="table-row-hover transition-colors">
                <Td><input type="checkbox" className="rounded" /></Td>
                <Td>
                  <div>
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded block mb-0.5">{emp.code}</span>
                    <span className="font-mono text-[10px] text-slate-400">{emp.rfid}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
                      {emp.first_name_th.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{emp.first_name_th} {emp.last_name_th}</p>
                      <p className="text-[10px] text-slate-400">{emp.first_name_en} {emp.last_name_en}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-xs text-sky-600 truncate block max-w-[130px]">{emp.email ?? '-'}</span></Td>
                <Td>
                  <div>
                    <p className="text-xs text-slate-600">{emp.defaults?.organizationUnit?.nameTh ?? '-'}</p>
                    <p className="text-[10px] text-slate-400">{emp.defaults?.organizationUnit?.levelNameTh ?? ''}</p>
                  </div>
                </Td>
                <Td>{emp.defaults?.level ? <Badge variant="info">{emp.defaults.level.nameTh}</Badge> : <span className="text-xs text-slate-300">-</span>}</Td>
                <Td><span className="text-xs text-slate-600 truncate block max-w-[100px]">{emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.route?.name_th ?? '-'}</span></Td>
                <Td><span className="text-xs text-slate-500">{emp.transport_defaults?.find(td => td.trip_direction === 'inbound')?.point?.name_th ?? '-'}</span></Td>
                <Td>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(emp.is_status)}`}>
                    {getStatusLabel(emp.is_status)}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openModal('view-employee', emp)} title={t('common', 'view')}
                      className="p-1 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => openModal('edit-employee', emp)} title={t('common', 'edit')}
                      className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                      <Edit size={13} />
                    </button>
                    {/* Print employee card */}
                    <button onClick={() => setPrintEmp(emp)} title={t('employees', 'printCard')}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Printer size={13} />
                    </button>
                    <button onClick={() => toggleEmployeeStatus(emp.id)} title={t('employees', 'changeStatus')}
                      className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                      {emp.is_status === 'active'
                        ? <ToggleRight size={13} className="text-emerald-500" />
                        : <ToggleLeft size={13} />}
                    </button>
                    <button onClick={() => openModal('delete-employee', emp)} title={t('common', 'delete')}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={10} className="text-center py-10 text-xs text-slate-400">{t('employees', 'notFound')}</td></tr>
            )}
          </tbody>
        </Table>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{t('common', 'show')} {filtered.length} / {employees.length} {t('common', 'items')}</p>
          <div className="flex items-center gap-1">
            <button className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">← {t('common', 'prev')}</button>
            <button className="w-8 h-8 text-xs rounded-lg bg-sky-500 text-white font-medium">1</button>
            <button className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">{t('common', 'next')} →</button>
          </div>
        </div>
      </Card>
    </div>
  )
}
