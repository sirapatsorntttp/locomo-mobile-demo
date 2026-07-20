'use client'

import { useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import type { FeedbackItem } from '@/app/mobile/comment/page'

interface Props {
  item: FeedbackItem
  onClose: () => void
}

export default function FeedbackDialog({ item, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore()

  useEffect(() => {
    openDialog()
    document.body.style.overflow = 'hidden'
    return () => {
      closeDialog()
      document.body.style.overflow = ''
    }
  }, [openDialog, closeDialog])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full rounded-3xl bg-white p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <h2 className="pr-8 text-lg font-bold text-slate-800">
          {item.routeName}
        </h2>

        {/* Date + Time */}
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-slate-500" />
            <span>{item.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <span>{item.time}</span>
          </div>
        </div>

        {/* Code */}
        <p className="mt-2 text-sm font-semibold text-blue-500">
          {item.code}
        </p>

        <hr className="my-4 border-slate-200" />

        {/* Detail */}
        <h3 className="text-sm font-bold text-slate-800">รายละเอียด</h3>
        <div className="mt-3 min-h-[180px] rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          {item.detail}
        </div>
      </div>
    </div>
  )
}
