'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import { apiFetch } from '@/lib/api-fetch'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui'
import { useCompanyStore } from '@/lib/stores/company.store'
import { usePlantStore } from '@/lib/stores/plant.store'

export type UploadFileType = 'organizations' | 'route-point' | 'employees'

interface ImportResult {
  total: number
  imported: number
  skipped: number
  skippedDetail: { row: number; message: { en: string; th: string } }[]
  message: { en: string; th: string }
}

interface Props {
  open: boolean
  onClose: () => void
  type: UploadFileType
  onSuccess?: () => void
}

export default function UploadFileModal({ open, onClose, type, onSuccess }: Props) {
  const { addToast } = useStore()
  const { plants,  loadPlants } = usePlantStore()

  const {loadCompanies,companyPlants} = useCompanyStore()
  const { t, lang } = useLang()

  useEffect(() => {
    if (open) {
      loadCompanies()
      loadPlants()
    }
  }, [open])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [plantId, setPlantId]     = useState('')
  const [file, setFile]           = useState<File | null>(null)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<ImportResult | null>(null)
  const [error, setError]         = useState<string | null>(null)

  const titleKey = type === 'organizations' ? 'titleOrg' : type === 'route-point' ? 'titleRoute' : 'titleEmployee'
  const title = t('uploadFile', titleKey)

  function handleClose() {
    if (loading) return
    setPlantId('')
    setFile(null)
    setResult(null)
    setError(null)
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setError(null)
  }

  async function handleUpload() {
    if (!plantId) { setError(t('uploadFile', 'noPlantSelected')); return }
    if (!file)    { setError(t('uploadFile', 'noFile'));           return }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('plant_id', plantId)

    try {
      const res = await apiFetch(`/api/upload-files/${type}`, {
        method: 'POST',
        body: formData,
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = json?.error ?? `HTTP ${res.status}`
        setError(msg)
        return
      }

      const data: ImportResult = json.data
      setResult(data)
      addToast('success', data.message?.[lang] ?? t('uploadFile', 'successTitle'))
      onSuccess?.()
    } catch (err: any) {
      setError(err?.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const plantOptions = companyPlants.map(cp => {
    const plant = plants.find(p => p.id === cp.plant_id)
    return { value: cp.plant_id, label: plant ? `${plant.code} — ${lang === 'th' ? plant.name_th : plant.name_en}` : cp.plant_id }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      subtitle="Excel / CSV"
      size="md"
      footer={
        result ? (
          <Button variant="secondary" size="sm" onClick={handleClose}>{t('common', 'close')}</Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={loading}>{t('common', 'cancel')}</Button>
            <Button variant="primary" size="sm" onClick={handleUpload} disabled={loading}>
              {loading ? t('uploadFile', 'uploading') : t('uploadFile', 'upload')}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">

        {/* Plant selector */}
        {!result && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('uploadFile', 'selectPlant')}<span className="text-red-400 ml-0.5">*</span></label>
              {plantOptions.length === 0 ? (
                <p className="text-xs text-slate-400">{t('uploadFile', 'noPlant')}</p>
              ) : (
                <div className="relative">
                  <select
                    value={plantId}
                    onChange={e => { setPlantId(e.target.value); setError(null) }}
                    disabled={loading}
                    className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
                  >
                    <option value="">{t('uploadFile', 'selectPlantPlaceholder')}</option>
                    {plantOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
              )}
            </div>

            {/* File input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">{t('uploadFile', 'chooseFile')}<span className="text-red-400 ml-0.5">*</span></label>
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 cursor-pointer transition-colors',
                  file ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {file ? (
                  <>
                    <FileSpreadsheet size={24} className="text-sky-500"/>
                    <p className="text-sm font-semibold text-sky-700 text-center break-all">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-300"/>
                    <p className="text-xs text-slate-500 font-semibold">{t('uploadFile', 'chooseFile')}</p>
                    <p className="text-[10px] text-slate-400">{t('uploadFile', 'fileHint')}</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-red-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 flex-shrink-0"><X size={12}/></button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"/>
            <p className="text-sm text-slate-500">{t('uploadFile', 'uploading')}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={18}/>
              <h3 className="text-sm font-bold">{t('uploadFile', 'successTitle')}</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('uploadFile', 'total'),    value: result.total,    color: 'bg-slate-50 border-slate-200 text-slate-700' },
                { label: t('uploadFile', 'imported'), value: result.imported, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { label: t('uploadFile', 'skipped'),  value: result.skipped,  color: 'bg-amber-50 border-amber-200 text-amber-700' },
              ].map(item => (
                <div key={item.label} className={cn('border rounded-xl p-3 text-center', item.color)}>
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="text-[10px] font-semibold mt-0.5 opacity-70">{item.label}</p>
                </div>
              ))}
            </div>

            {result.skippedDetail.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500">{t('uploadFile', 'skippedDetail')}</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.skippedDetail.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-200 px-1.5 py-0.5 rounded flex-shrink-0">
                        {t('uploadFile', 'row')} {d.row}
                      </span>
                      <p className="text-xs text-amber-800">{d.message?.[lang] ?? d.message?.en}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}