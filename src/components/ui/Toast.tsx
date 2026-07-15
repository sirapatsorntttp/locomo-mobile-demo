'use client'
import { useStore } from '@/lib/store'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ToastContainer() {
  const { toasts, removeToast } = useStore()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-modal border text-sm font-medium pointer-events-auto animate-slide-up min-w-[260px] max-w-[360px]',
            t.type === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-800',
            t.type === 'error'   && 'bg-red-50 border-red-200 text-red-800',
            t.type === 'info'    && 'bg-sky-50 border-sky-200 text-sky-800',
          )}
        >
          <span className="flex-shrink-0">
            {t.type === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
            {t.type === 'error'   && <XCircle size={16} className="text-red-500" />}
            {t.type === 'info'    && <Info size={16} className="text-sky-500" />}
          </span>
          <span className="flex-1 text-xs">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
