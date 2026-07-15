'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Search, Trash2, Phone, Bus, Pencil,
  MapPin, UserCheck, UserX, Printer, ChevronDown,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'
import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Driver } from '@/types'
import { AddDriverModal, EditDriverModal, DeleteDriverModal } from '@/components/modals/DriverModals'
import { useDriverStore } from '@/lib/stores/driver.store'

// ─── Print card ──────────────────────────────────────────────────────────────
const PHOTO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" fill="none"><rect width="80" height="100" fill="#eef2f7"/><circle cx="40" cy="36" r="18" fill="#c8d3e0"/><path d="M6 100 Q6 68 40 68 Q74 68 74 100Z" fill="#c8d3e0"/></svg>`

async function printDriverCard(driver: Driver) {
  const qrData = JSON.stringify({ type: 'driver', code: driver.code, id: driver.id })
  const qrUrl = await QRCode.toDataURL(qrData, { width: 160, margin: 1, color: { dark: '#0f172a', light: '#ffffff' }, errorCorrectionLevel: 'M' })
  const vehicle = driver.drivers_vehicles?.vehicles
  const vendor = driver.drivers_vehicles?.vendors_drivers_vehicles?.vendors
  const photoSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PHOTO_SVG)}`
  const now = new Date()
  const expiry = new Date(now); expiry.setFullYear(expiry.getFullYear() + 1)
  const fmt = (d: Date) => d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  const win = window.open('', '_blank', 'width=460,height=340')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#d1d9e6;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Sarabun',sans-serif}
.card{width:380px;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.28)}
.stripe{height:5px;background:linear-gradient(90deg,#1a3a6b,#2563eb,#0ea5e9)}
.hdr{background:linear-gradient(160deg,#0b1f45,#163370);padding:10px 14px 9px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:8px}.icon{width:32px;height:32px;border-radius:6px;background:linear-gradient(135deg,#38bdf8,#2563eb);display:flex;align-items:center;justify-content:center}
.bn{font-size:15px;font-weight:800;color:#fff}.bs{font-size:7px;color:rgba(255,255,255,.45);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.hr{text-align:right}.ct{font-size:7px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1.5px}.cm{font-size:11px;font-weight:700;color:#fff;margin-top:1px}.cn{font-size:8px;color:rgba(255,255,255,.35);font-family:monospace;margin-top:3px}
.accent{height:2px;background:linear-gradient(90deg,#f59e0b,#ef4444)}
.body{display:flex}
.left{width:100px;background:#f8fafc;border-right:1px solid #e8edf2;display:flex;flex-direction:column;align-items:center;padding:12px 8px 10px;gap:8px}
.photo{width:76px;height:96px;border:1.5px solid #cbd5e1;border-radius:3px;overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover}
.qr{width:72px;height:72px;border:1px solid #e2e8f0;border-radius:3px;overflow:hidden}
.qr img{width:100%;height:100%}
.right{flex:1;padding:12px 14px 10px;display:flex;flex-direction:column;gap:6px}
.name-th{font-size:15px;font-weight:700;color:#1e293b;line-height:1.2}
.name-en{font-size:10px;color:#64748b;margin-top:1px}
.badge{display:inline-flex;align-items:center;gap:4px;font-size:8px;font-weight:700;padding:2px 7px;border-radius:20px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;margin-top:2px}
.divider{height:1px;background:#f1f5f9;margin:4px 0}
.info-row{display:flex;align-items:center;gap:6px}
.info-label{font-size:7.5px;color:#94a3b8;width:50px;flex-shrink:0}
.info-val{font-size:8.5px;color:#334155;font-weight:600;flex:1}
.dates{display:flex;gap:8px;margin-top:4px}
.date-box{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;padding:4px 6px}
.date-lbl{font-size:6.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px}
.date-val{font-size:8px;font-weight:600;color:#475569;margin-top:1px}
.footer{background:#f8fafc;border-top:1px solid #e8edf2;padding:5px 14px;display:flex;justify-content:space-between;align-items:center}
.ft{font-size:7px;color:#94a3b8}
</style></head><body>
<div class="card">
<div class="stripe"></div>
<div class="hdr">
  <div class="brand"><div class="icon"><svg width="18" height="18" fill="none" stroke="#fff" stroke-width="1.8" viewBox="0 0 24 24"><path d="M8 6v6M16 6v6M2 12h20M6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
  <div><div class="bn">LOCOMO</div><div class="bs">Driver ID Card</div></div></div>
  <div class="hr"><div class="ct">พนักงานขับรถ</div><div class="cm">Driver Card</div><div class="cn">${driver.code}</div></div>
</div>
<div class="accent"></div>
<div class="body">
  <div class="left">
    <div class="photo"><img src="${photoSrc}" alt="photo"/></div>
    <div class="qr"><img src="${qrUrl}" alt="QR"/></div>
    <div style="font-size:7px;color:#94a3b8;text-align:center">${driver.code}</div>
  </div>
  <div class="right">
    <div><div class="name-th">${driver.first_name_th} ${driver.last_name_th}</div>
    <div class="name-en">${driver.first_name_en} ${driver.last_name_en}</div>
    ${vendor ? `<div class="badge">🏢 ${vendor.name_th}</div>` : ''}</div>
    <div class="divider"></div>
    <div class="info-row"><span class="info-label">เบอร์โทร</span><span class="info-val">${driver.tel || '—'}</span></div>
    <div class="info-row"><span class="info-label">ยานพาหนะ</span><span class="info-val">${vehicle ? vehicle.license + (vehicle.province ? ' ' + vehicle.province : '') : '—'}</span></div>
    <div class="info-row"><span class="info-label">ประเภทรถ</span><span class="info-val">${(vehicle as any)?.vehicle_types?.name_th || '—'}</span></div>
    <div class="dates">
      <div class="date-box"><div class="date-lbl">ออกบัตร</div><div class="date-val">${fmt(now)}</div></div>
      <div class="date-box"><div class="date-lbl">หมดอายุ</div><div class="date-val">${fmt(expiry)}</div></div>
    </div>
  </div>
</div>
<div class="footer"><span class="ft">LOCOMO Transport Management</span><span class="ft">${driver.id.slice(-8).toUpperCase()}</span></div>
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),1200)}</script>
</body></html>`)
  win.document.close()
}

// ─── Direction badge ─────────────────────────────────────────────────────────
const DIR_COLOR: Record<string, string> = {
  inbound: 'bg-sky-100 text-sky-700 border-sky-200',
  outbound: 'bg-amber-100 text-amber-700 border-amber-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
}
const DIR_LABEL: Record<string, string> = { inbound: 'เข้า', outbound: 'ออก', unknown: 'ทั้งสอง' }

// ─── Driver Card ─────────────────────────────────────────────────────────────
function DriverCard({ driver, onEdit, onDelete, onAssign }: { driver: Driver; onEdit: () => void; onDelete: () => void; onAssign: () => void }) {
  const vehicle = driver.drivers_vehicles?.vehicles
  const vendor = driver.drivers_vehicles?.vendors_drivers_vehicles?.vendors
  const routes = driver.driver_route_defaults ?? []

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <UserCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{driver.first_name_th} {driver.last_name_th}</p>
            <p className="text-[10px] text-white/50 font-mono">{driver.code}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(driver.is_status)}`}>
          {getStatusLabel(driver.is_status)}
        </span>
      </div>

      {/* body */}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[11px] text-slate-400">{driver.first_name_en} {driver.last_name_en}</p>

        {driver.tel && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone size={11} className="text-slate-300" />
            <span>{driver.tel}</span>
          </div>
        )}

        {/* vehicle + vendor */}
        {vehicle ? (
          <div className="flex items-center gap-1.5 bg-sky-50 rounded-xl px-3 py-2 border border-sky-100">
            <Bus size={12} className="text-sky-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sky-700 truncate">{vehicle.license}{vehicle.province ? ` · ${vehicle.province}` : ''}</p>
              {vendor && <p className="text-[10px] text-sky-400 truncate">{vendor.name_th}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border border-dashed border-slate-200 rounded-xl px-3 py-2">
            <UserX size={11} />
            <span>ยังไม่มียานพาหนะ</span>
          </div>
        )}

        {/* route defaults */}
        {routes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {routes.slice(0, 3).map(rd => (
              <span key={rd.id} className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${DIR_COLOR[rd.trip_direction] ?? DIR_COLOR.unknown}`}>
                <MapPin size={8} />
                {rd.routes?.code}
                <span className="opacity-60">·{DIR_LABEL[rd.trip_direction]}</span>
              </span>
            ))}
            {routes.length > 3 && (
              <span className="text-[9px] text-slate-400 px-1.5 py-0.5">+{routes.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => printDriverCard(driver)}
          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          <Printer size={11} /> บัตร
        </button>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onAssign} title="กำหนดรถ" className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
            <Bus size={12} />
          </button>
          <button onClick={onEdit} title="แก้ไข" className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} title="ลบ" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DriversPage() {
  const { openModal } = useStore()
  const { drivers, loadDrivers } = useDriverStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [view, setView] = useState<'card' | 'table'>('card')

  useEffect(() => { loadDrivers() }, [])

  const filtered = useMemo(() => {
    return drivers.filter(d => {
      if (statusFilter !== 'all' && d.is_status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        d.code.toLowerCase().includes(q) ||
        d.first_name_th.includes(q) ||
        d.last_name_th.includes(q) ||
        d.first_name_en.toLowerCase().includes(q) ||
        d.last_name_en.toLowerCase().includes(q) ||
        (d.tel ?? '').includes(q)
      )
    })
  }, [drivers, search, statusFilter])

  const stats = useMemo(() => ({
    total: drivers.filter(d => d.is_status === 'active').length,
    withVehicle: drivers.filter(d => d.is_status === 'active' && d.drivers_vehicles).length,
    noVehicle: drivers.filter(d => d.is_status === 'active' && !d.drivers_vehicles).length,
    withRoutes: drivers.filter(d => d.is_status === 'active' && (d.driver_route_defaults?.length ?? 0) > 0).length,
  }), [drivers])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">พนักงานขับรถ</h1>
          <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลคนขับ สายรถ default และยานพาหนะ</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openModal('add-driver')}>
          เพิ่มคนขับ
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'คนขับทั้งหมด', value: stats.total, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
          { label: 'มียานพาหนะ', value: stats.withVehicle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'ยังไม่มีรถ', value: stats.noVehicle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'มีสายรถ default', value: stats.withRoutes, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ รหัส เบอร์โทร..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {(['card', 'table'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-sky-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {v === 'card' ? 'การ์ด' : 'ตาราง'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filtered.length} รายการ</span>
      </div>

      {/* ── Card View ── */}
      {view === 'card' && (
        filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserX size={32} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm">ไม่พบข้อมูลคนขับ</p>
            <button onClick={() => openModal('add-driver')} className="text-xs text-sky-500 hover:underline mt-1">+ เพิ่มคนขับแรก</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(d => (
              <DriverCard
                key={d.id}
                driver={d}
                onEdit={() => openModal('edit-driver', d)}
                onDelete={() => openModal('delete-driver', d)}
                onAssign={() => openModal('assign-driver-vehicle', d)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Table View ── */}
      {view === 'table' && (
        <Card padding="none">
          <Table>
            <thead>
              <tr>
                <Th>รหัส</Th>
                <Th>ชื่อ-นามสกุล</Th>
                <Th>เบอร์โทร</Th>
                <Th>ยานพาหนะ / Vendor</Th>
                <Th>สายรถ default</Th>
                <Th>สถานะ</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const vehicle = d.drivers_vehicles?.vehicles
                const vendor = d.drivers_vehicles?.vendors_drivers_vehicles?.vendors
                const routes = d.driver_route_defaults ?? []
                return (
                  <tr key={d.id} className="table-row-hover transition-colors">
                    <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{d.code}</span></Td>
                    <Td>
                      <p className="text-xs font-semibold text-slate-700">{d.first_name_th} {d.last_name_th}</p>
                      <p className="text-[10px] text-slate-400">{d.first_name_en} {d.last_name_en}</p>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{d.tel || '—'}</span></Td>
                    <Td>
                      {vehicle ? (
                        <div>
                          <p className="text-xs font-medium text-slate-700">{vehicle.license}</p>
                          {vendor && <p className="text-[10px] text-slate-400">{vendor.name_th}</p>}
                        </div>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-0.5">
                        {routes.slice(0, 2).map(rd => (
                          <span key={rd.id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${DIR_COLOR[rd.trip_direction] ?? DIR_COLOR.unknown}`}>
                            {rd.routes?.code}
                          </span>
                        ))}
                        {routes.length > 2 && <span className="text-[9px] text-slate-400">+{routes.length - 2}</span>}
                        {routes.length === 0 && <span className="text-[10px] text-slate-300">—</span>}
                      </div>
                    </Td>
                    <Td>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(d.is_status)}`}>
                        {getStatusLabel(d.is_status)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => printDriverCard(d)} title="พิมพ์บัตร" className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                          <Printer size={12} />
                        </button>
                        <button onClick={() => openModal('assign-driver-vehicle', d)} title="กำหนดรถ" className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                          <Bus size={12} />
                        </button>
                        <button onClick={() => openModal('edit-driver', d)} title="แก้ไข" className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => openModal('delete-driver', d)} title="ลบ" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ── Modals ── */}
      <AddDriverModal />
      <EditDriverModal />
      <DeleteDriverModal />
    </div>
  )
}
