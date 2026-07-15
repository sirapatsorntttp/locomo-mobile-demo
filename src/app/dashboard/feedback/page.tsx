'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  MessageSquare, Send, CheckCircle2,
  User, Clock,
  ShieldCheck, RefreshCw, Inbox, CheckCheck, AlertCircle, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'
import { useStore } from '@/lib/store'
import type { FeedbackComment, CommentStatus } from '@/types'
import { useCommentStore } from '@/lib/stores/comment.store'

// ── Config ─────────────────────────────────────────────────────
const STATUS_CFG: Record<CommentStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'รอตอบ', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <AlertCircle size={10} /> },
  reviewed: { label: 'กำลังพิจารณา', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: <RefreshCw size={10} /> },
  implemented: { label: 'ดำเนินการแล้ว', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 size={10} /> },
  closed: { label: 'ปิดเรื่อง', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', icon: <CheckCheck size={10} /> },
}

type FilterStatus = 'all' | CommentStatus

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}

// ── Main Page ──────────────────────────────────────────────────
export default function FeedbackPage() {
  const { t } = useLang()
  const { comments, commentsTotal, loadComments, updateComment, deleteComment } = useCommentStore()

  const [selected, setSelected] = useState<FeedbackComment | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [noteText, setNoteText] = useState('')

  useEffect(() => { loadComments() }, [])

  const current = selected ? comments.find(c => c.id === selected.id) ?? null : null

  const inbox = useMemo(() => {
    if (filterStatus === 'all') return comments
    return comments.filter(c => c.is_status === filterStatus)
  }, [comments, filterStatus])

  const pendingCount = comments.filter(c => c.is_status === 'pending').length
  const implementedCount = comments.filter(c => c.is_status === 'implemented').length

  const setStatus = async (id: string, status: CommentStatus) => {
    await updateComment(id, { status })
  }

  const appendNote = async () => {
    if (!noteText.trim() || !current) return
    const newDetail = current.detail
      ? `${current.detail}\n\n[Admin] ${noteText.trim()}`
      : `[Admin] ${noteText.trim()}`
    await updateComment(current.id, { detail: newDetail, status: current.is_status === 'pending' ? 'reviewed' : current.is_status })
    setNoteText('')
  }

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
            <MessageSquare size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('feedback', 'title')}</h1>
            <p className="text-xs text-slate-400">{t('feedback', 'subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {[
            { icon: <AlertCircle size={12} className="text-rose-400" />, label: 'รอตอบ', value: pendingCount, cls: 'text-rose-700' },
            { icon: <CheckCircle2 size={12} className="text-emerald-400" />, label: 'ดำเนินการแล้ว', value: implementedCount, cls: 'text-emerald-700' },
            { icon: <MessageSquare size={12} className="text-violet-400" />, label: 'ทั้งหมด', value: commentsTotal, cls: 'text-violet-700' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
              {s.icon}
              <span className={`text-sm font-bold ${s.cls}`}>{s.value}</span>
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── LEFT: Inbox ──────────────────────────────────── */}
        <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-shrink-0">
            {(['all', 'pending', 'reviewed', 'implemented', 'closed'] as FilterStatus[]).map(f => {
              const label = f === 'all' ? 'ทั้งหมด' : STATUS_CFG[f as CommentStatus].label
              const count = f === 'all' ? comments.length : comments.filter(c => c.is_status === f).length
              return (
                <button key={f} onClick={() => setFilterStatus(f)}
                  className={cn(
                    'flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all',
                    filterStatus === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                  )}>
                  {label}
                  <span className={cn('ml-1 text-[9px]', filterStatus === f ? 'opacity-60' : 'opacity-40')}>({count})</span>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {inbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                <Inbox size={28} /><p className="text-xs">ไม่มีรายการ</p>
              </div>
            ) : inbox.map(item => {
              const stCfg = STATUS_CFG[item.is_status] ?? STATUS_CFG.pending
              const isActive = current?.id === item.id
              const empName = item.employees ? `${item.employees.first_name_th} ${item.employees.last_name_th}` : '-'
              return (
                <button key={item.id} onClick={() => setSelected(item)}
                  className={cn(
                    'w-full text-left rounded-xl border px-3 py-3 transition-all hover:shadow-sm',
                    isActive
                      ? 'bg-violet-50 border-violet-300 shadow-sm'
                      : item.is_status === 'pending'
                        ? 'bg-rose-50/50 border-rose-100 hover:border-violet-200'
                        : 'bg-white border-slate-100 hover:border-violet-200'
                  )}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5', stCfg.bg, stCfg.text, stCfg.border)}>
                      {stCfg.icon}{stCfg.label}
                    </span>
                    <span className="ml-auto text-[9px] text-slate-400 font-mono">{formatDate(item.created_at)}</span>
                  </div>
                  <p className={cn('text-xs font-bold leading-snug truncate mb-1', isActive ? 'text-violet-800' : 'text-slate-800')}>
                    {item.is_status === 'pending' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 mb-0.5" />}
                    {item.subject || '(ไม่มีหัวข้อ)'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><User size={8} /> {empName}</span>
                    {item.routes && <span className="text-[9px] text-slate-400 truncate">· {item.routes.name_th}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Detail ────────────────────────────────── */}
        {current ? (
          <div className="flex-1 min-w-0 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare size={14} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 leading-snug">{current.subject || '(ไม่มีหัวข้อ)'}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User size={9} />
                      {current.employees ? `${current.employees.first_name_th} ${current.employees.last_name_th}` : '-'}
                    </span>
                    {current.routes && <span>· {current.routes.name_th}</span>}
                    <span className="flex items-center gap-1 ml-auto"><Clock size={9} /> {formatDate(current.created_at)}</span>
                  </div>
                </div>
                <button onClick={() => deleteComment(current.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">สถานะ</span>
                {(['pending', 'reviewed', 'implemented', 'closed'] as CommentStatus[]).map(s => {
                  const cfg = STATUS_CFG[s]
                  const isActive = current.is_status === s
                  return (
                    <button key={s} onClick={() => setStatus(current.id, s)}
                      className={cn(
                        'flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all',
                        isActive ? cn(cfg.bg, cfg.text, cfg.border, 'shadow-sm') : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      )}>
                      {cfg.icon} {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[11px] font-bold text-white">
                    {current.employees?.first_name_th?.charAt(0) ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    {current.detail ? (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{current.detail}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">ไม่มีรายละเอียด</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {current.is_status !== 'closed' ? (
              <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <ShieldCheck size={11} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Admin Note</span>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) appendNote() }}
                    rows={2}
                    placeholder="เพิ่มหมายเหตุ... (Ctrl+Enter ส่ง)"
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none bg-white transition-all"
                  />
                  <button onClick={appendNote} disabled={!noteText.trim()}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-40 rounded-xl px-4 py-2.5 transition-colors shadow-md shadow-violet-200 flex-shrink-0 h-fit">
                    <Send size={13} /> บันทึก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50">
                <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <CheckCheck size={11} /> ปิดเรื่องแล้ว
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-300">
            <div className="text-center">
              <MessageSquare size={32} className="mx-auto mb-3" />
              <p className="text-sm font-semibold">เลือก Comment เพื่อดูรายละเอียด</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
