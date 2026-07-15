'use client'
import { useEffect, useState } from 'react'
import { Settings, Shield, Globe, Bell, Database, Code, ToggleRight, ToggleLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Card, Button, Badge, Table, Th, Td } from '@/components/ui'

import { useStore } from '@/lib/store'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import type { ModuleType, ModuleSettingType, Status } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useModuleStore } from '@/lib/stores/module.store'

const moduleTypeColors: Record<ModuleType, string> = {
  admin: 'bg-violet-100 text-violet-700',
  driver: 'bg-sky-100 text-sky-700',
  passenger: 'bg-emerald-100 text-emerald-700',
}
const settingTypeColors: Record<ModuleSettingType, string> = {
  main: 'bg-blue-100 text-blue-700',
  configuration: 'bg-amber-100 text-amber-700',
  advanced_config: 'bg-red-100 text-red-700',
  report: 'bg-slate-100 text-slate-600',
}

type Section = 'modules' | 'permissions' | 'general'

export default function SettingsPage() {
  const { addToast } = useStore()
  const { employees } = useEmployeeStore()
  const { t } = useLang()
  const [activeSection, setActiveSection] = useState<Section>('modules')
  const {modules,loadModules,updateModule} = useModuleStore()

  const [settings, setSettings] = useState({
    language: 'th',
    pushNotification: true,
    autoBackup: true,
    backupTime: '02:00',
    rfidTimeout: '30',
    allowQrCode: true,
    maxReservePerDay: '1',
    requireApproval: false,
  })

  const [saved, setSaved] = useState(false)

 useEffect(() => {
    loadModules()
  }, [])

  const handleSave = () => {
    setSaved(true)
    addToast('success', t('settings', 'saveBtn'))
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleModuleStatus = (id: string,currentStatus:string) => {

  updateModule(id, {
      is_status: currentStatus === 'active' ? 'inactive' : 'active',
    } as any
  )
  }

  const setSetting = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }))

 
  const navItems: {
    key: Section
    icon: React.ReactNode
    label: string
    sub: string
  }[] = [
    {
      key: 'modules',
      icon: <Code size={14} />,
      label: t('settings', 'modulesTab'),
      sub: t('settings', 'modulesSubtitle'),
    },
    {
      key: 'permissions',
      icon: <Shield size={14} />,
      label: t('settings', 'permissionsTab'),
      sub: t('settings', 'permissionsSubtitle'),
    },
    {
      key: 'general',
      icon: <Settings size={14} />,
      label: t('settings', 'generalTab'),
      sub: `${t('settings', 'langSection')} · backup · RFID`,
    },
  ]

  // ─── Stats by setting type ───────────────────────────────
  const settingGroups = [
    { key: 'main', label: 'Main', color: 'bg-blue-50 border-blue-100 text-blue-700' },
    { key: 'configuration', label: 'Config', color: 'bg-amber-50 border-amber-100 text-amber-700' },
    { key: 'advanced_configuration', label: 'Advanced', color: 'bg-red-50 border-red-100 text-red-700' },
    { key: 'report', label: 'Report', color: 'bg-slate-50 border-slate-100 text-slate-600' },
  ]


  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('settings', 'title')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('settings', 'subtitle')}</p>
        </div>
        {activeSection === 'general' && (
          <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={handleSave}>
            {saved ? `✓ ${t('settings', 'saveBtn')}` : t('settings', 'saveBtn')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Nav */}
        <Card padding="sm" className="xl:col-span-1 h-fit">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('settings', 'menuLabel')}</p>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeSection === item.key ? 'bg-sky-50 text-sky-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                <span className={activeSection === item.key ? 'text-sky-600' : 'text-slate-400'}>{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{item.sub}</p>
                </div>
              </button>
            ))}
          </nav>

          {/* Plant info */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t('settings', 'systemInfo')}</p>
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5">
              {[
                { k: 'Plant', v: 'TT Techno-Park (HQ)' },
                { k: 'Company', v: 'TTTP' },
                { k: 'Timezone', v: 'Asia/Bangkok' },
                { k: 'DB', v: 'SQL Server' },
                { k: 'Version', v: '1.0.0' },
              ].map(r => (
                <div key={r.k} className="flex justify-between">
                  <span className="text-slate-400">{r.k}</span>
                  <span className="font-mono text-slate-600 text-[10px]">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Content */}
        <div className="xl:col-span-3 space-y-4">
          {/* Modules */}
          {activeSection === 'modules' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {(['admin', 'driver', 'passenger'] as ModuleType[]).map(type => (
                  <div key={type} className={`rounded-xl p-4 border ${type === 'admin' ? 'bg-violet-50 border-violet-100' : type === 'driver' ? 'bg-sky-50 border-sky-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: type === 'admin' ? '#7c3aed' : type === 'driver' ? '#0369a1' : '#065f46' }}>{type}</p>
                    <p className="text-2xl font-bold text-slate-800">{modules.filter(m => m.type === type && m.is_status === 'active').length}</p>
                    <p className="text-xs text-slate-400">active modules</p>
                  </div>
                ))}
              </div>

              <Card padding="sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{t('settings', 'allModules')}</h2>
                    <p className="text-xs text-slate-400">{t('settings', 'toggleHint')}</p>
                  </div>
                </div>
                <Table>
                  <thead>
                    <tr>
                      <Th>code</Th>
                      <Th>{t('settings', 'nameLabel')}</Th>
                      <Th>{t('settings', 'domainLabel')}</Th>
                      <Th>Type</Th>
                      <Th>{t('settings', 'settingLabel')}</Th>
                      <Th>{t('common', 'status')}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(mod => (
                      <tr key={mod.id} className="table-row-hover transition-colors cursor-pointer" onClick={() => toggleModuleStatus(mod.id,mod.is_status)}>
                        <Td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{mod.code}</span></Td>
                        <Td>
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{mod.name_th}</p>
                            <p className="text-[10px] text-slate-400">{mod.name_en}</p>
                          </div>
                        </Td>
                        <Td><span className="font-mono text-[10px] text-sky-600">{mod.domain}</span></Td>
                        {/* <Td><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${moduleTypeColors[mod.type]}`}>{mod.type}</span></Td> */}
                       
   <Td>
        {mod.setting ? (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              settingTypeColors[mod.setting] ??
              'bg-slate-100 text-slate-500'
            }`}
          >
            {mod.setting}
          </span>
        ) : (
          <span className="text-[10px] text-slate-300">-</span>
        )}
      </Td>

                        <Td>
                          <button className="flex items-center gap-1 text-xs">
                            {mod.is_status === 'active'
                              ? <ToggleRight size={18} className="text-emerald-500" />
                              : <ToggleLeft size={18} className="text-slate-300" />}
                            <span className={mod.is_status === 'active' ? 'text-emerald-600' : 'text-slate-400'}>
                              {getStatusLabel(mod.is_status)}
                            </span>
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </>
          )}

          {/* Permissions */}
          {activeSection === 'permissions' && (
            <Card padding="sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{t('settings', 'permissionsSection')}</h2>
                  <p className="text-xs text-slate-400">permissions · permissions_modules · employees_permissions</p>
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={12} />}>{t('settings', 'addPermission')}</Button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Admin Full Access', modules: ['EMP', 'DRV', 'VEH', 'RES', 'RPT'], emps: employees.slice(0, 1) },
                  { name: 'Report View Only', modules: ['RPT'], emps: employees.slice(1, 3) },
                  { name: 'Reserve Manager', modules: ['RES', 'EMP'], emps: employees.slice(2, 4) },
                ].map((perm, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 hover:border-sky-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{perm.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {perm.modules.map(m => (
                            <span key={m} className="text-[9px] font-mono font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={11} />} className="text-slate-300 hover:text-red-400">{t('common', 'delete')}</Button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400">{t('common', 'employee')}:</span>
                      {perm.emps.map(e => (
                        <div key={e.id} className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center text-[9px] font-bold text-sky-600">{e.first_name_th.charAt(0)}</div>
                          <span className="text-[10px] text-slate-500">{e.first_name_th}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* General settings */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              <Card padding="md">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe size={15} className="text-slate-400" />{t('settings', 'langSection')}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{t('settings', 'defaultLang')}</p>
                      <p className="text-[10px] text-slate-400">{t('settings', 'langDesc')}</p>
                    </div>
                    <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none"
                      value={settings.language} onChange={e => setSetting('language', e.target.value)}>
                      <option value="th">{t('settings', 'langTh')}</option>
                      <option value="en">{t('settings', 'langEn')}</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card padding="md">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Bell size={15} className="text-slate-400" />{t('settings', 'notifSection')}
                </h2>
                <div className="space-y-3">
                  {[
                    { key: 'pushNotification', label: t('settings', 'pushNotif'), desc: t('settings', 'pushNotifDesc') },
                    { key: 'requireApproval', label: t('settings', 'requireApproval'), desc: t('settings', 'requireApprovalDesc') },
                    { key: 'allowQrCode', label: t('settings', 'allowQr'), desc: t('settings', 'allowQrDesc') },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                      <button onClick={() => setSetting(item.key, !(settings as any)[item.key])}>
                        {(settings as any)[item.key]
                          ? <ToggleRight size={22} className="text-emerald-500" />
                          : <ToggleLeft size={22} className="text-slate-300" />}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card padding="md">
                <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Database size={15} className="text-slate-400" />{t('settings', 'rfidSection')}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'rfidTimeout', label: t('settings', 'rfidTimeout'), desc: t('settings', 'rfidTimeoutDesc') },
                    { key: 'maxReservePerDay', label: t('settings', 'maxBookings'), desc: t('settings', 'maxBookingsDesc') },
                    { key: 'backupTime', label: t('settings', 'backupTime'), desc: t('settings', 'backupTimeDesc') },
                  ].map(item => (
                    <div key={item.key} className="bg-slate-50 rounded-xl p-3">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">{item.label}</label>
                      <input type={item.key === 'backupTime' ? 'time' : 'number'}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-sky-300"
                        value={(settings as any)[item.key]}
                        onChange={e => setSetting(item.key, e.target.value)} />
                      <p className="text-[9px] text-slate-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" size="md" icon={<Save size={14} />} onClick={handleSave}>
                  {saved ? `✓ ${t('settings', 'saveBtn')}` : t('settings', 'saveAll')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}