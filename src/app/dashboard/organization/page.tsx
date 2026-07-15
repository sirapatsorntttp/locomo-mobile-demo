'use client'
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Building2, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Users, Layers, FolderOpen, Folder, GitBranch, Search,
  CheckCircle2, XCircle, Briefcase, Star, Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/lang-context'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui'
import { Field, Input } from '@/components/ui/FormFields'
import UploadFileModal from '@/components/modals/UploadFileModal'
import type { Status } from '@/types'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useOrganizeStore } from '@/lib/stores/useOrganize';
import { useLevelStore } from '@/lib/stores/useLevelStore';

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrgNode {
  id: string
  levelRank: number          // from organization_levels.level
  parent_id: string | null
  code: string
  name_th: string
  name_en: string
  is_status: Status
  company_plant_id: string
  organization_level_id: string
}

interface Level {
  id: string; code: string; rank: number
  name_th: string; name_en: string; is_status: Status
}

// ── Palette (cycles for any number of org levels) ────────────────────────────
const LEVEL_PALETTE = [
  {
    color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', light: 'bg-sky-100',
    icon: (o: boolean) => o ? <FolderOpen size={14} className="text-sky-500" /> : <Folder size={14} className="text-sky-400" />,
    gradient: 'from-sky-500 to-blue-600', emoji: '🏢',
  },
  {
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', light: 'bg-violet-100',
    icon: (o: boolean) => o ? <FolderOpen size={13} className="text-violet-500" /> : <Folder size={13} className="text-violet-400" />,
    gradient: 'from-violet-500 to-purple-600', emoji: '📁',
  },
  {
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', light: 'bg-emerald-100',
    icon: (_o: boolean) => <Layers size={12} className="text-emerald-500" />,
    gradient: 'from-emerald-500 to-teal-600', emoji: '📂',
  },
  {
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', light: 'bg-amber-100',
    icon: (_o: boolean) => <GitBranch size={12} className="text-amber-500" />,
    gradient: 'from-amber-500 to-orange-600', emoji: '⚙️',
  },
  {
    color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', light: 'bg-rose-100',
    icon: (_o: boolean) => <Star size={12} className="text-rose-500" />,
    gradient: 'from-rose-500 to-pink-600', emoji: '🔧',
  },
  {
    color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', light: 'bg-indigo-100',
    icon: (_o: boolean) => <Briefcase size={12} className="text-indigo-500" />,
    gradient: 'from-indigo-500 to-blue-700', emoji: '📋',
  },
]

function getPalette(rank: number) {
  return LEVEL_PALETTE[(rank - 1) % LEVEL_PALETTE.length]
}

// ── TreeNode component ────────────────────────────────────────────────────────
function TreeNode({
  node, nodes, depth, expanded, selectedId,
  sortedOrgLevels,
  onToggle, onSelect, onAdd, onEdit, onDelete, empMap,
}: {
  node: OrgNode
  nodes: OrgNode[]
  depth: number
  expanded: Set<string>
  selectedId: string | null
  sortedOrgLevels: { id: string; level: number; name_th: string; name_en: string }[]
  onToggle: (id: string) => void
  onSelect: (node: OrgNode) => void
  onAdd: (parentId: string, childLevelRank: number) => void
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
  empMap: Record<string, number>
}) {
  const { t, lang } = useLang()
  const cfg = getPalette(node.levelRank)
  const childOrgLevel = sortedOrgLevels.find(l => l.level === node.levelRank + 1) ?? null
  const childLabel = childOrgLevel ? (lang === 'th' ? childOrgLevel.name_th : childOrgLevel.name_en) : ''
  const children = nodes.filter(n => n.parent_id === node.id)
  const hasChild = children.length > 0
  const isOpen = expanded.has(node.id)
  const isActive = selectedId === node.id
  const empCount = empMap[node.id] ?? 0

  return (
    <div>
      <div
        style={{ paddingLeft: depth * 20 + 4 }}
        className={cn(
          'group flex items-center gap-1.5 py-1.5 pr-2 rounded-xl cursor-pointer transition-all select-none',
          isActive ? cn('ring-1', cfg.border, cfg.bg) : 'hover:bg-slate-50'
        )}
        onClick={() => onSelect(node)}
      >
        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); if (hasChild) onToggle(node.id) }}
          className={cn('w-5 h-5 flex items-center justify-center rounded flex-shrink-0 transition-colors',
            hasChild ? 'hover:bg-slate-200 text-slate-400' : 'text-transparent cursor-default')}
        >
          {hasChild
            ? isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />
            : <span className="w-2 h-px bg-slate-200 block" />
          }
        </button>

        {/* Icon */}
        <span className="flex-shrink-0">{cfg.icon(isOpen)}</span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className={cn('text-xs font-semibold truncate block', isActive ? cfg.color : 'text-slate-700')}>
            {node.name_th}
          </span>
          {isActive && (
            <span className="text-[9px] text-slate-400 font-mono">{node.name_en}</span>
          )}
        </div>

        {/* Code badge */}
        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
          {node.code}
        </span>

        {/* Emp count */}
        {empCount > 0 && (
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 flex items-center gap-0.5', cfg.light, cfg.color)}>
            <Users size={8} />{empCount}
          </span>
        )}

        {/* Children count */}
        {hasChild && (
          <span className="text-[9px] text-slate-400 flex-shrink-0">{children.length}</span>
        )}

        {/* Hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 ml-1">
          {childOrgLevel && (
            <button onClick={e => { e.stopPropagation(); onAdd(node.id, childOrgLevel.level) }}
              className="p-1 rounded hover:bg-emerald-100 text-emerald-500 transition-colors"
              title={`${t('organization', 'addNew')} ${childLabel}`}>
              <Plus size={10} />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onEdit(node) }}
            className="p-1 rounded hover:bg-amber-100 text-amber-500 transition-colors">
            <Pencil size={10} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(node) }}
            className="p-1 rounded hover:bg-red-100 text-red-400 transition-colors">
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isOpen && hasChild && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-0 border-l border-dashed border-slate-200"
            style={{ left: depth * 20 + 14 }}
          />
          {children.map(child => (
            <TreeNode key={child.id} node={child} nodes={nodes} depth={depth + 1}
              expanded={expanded} selectedId={selectedId}
              sortedOrgLevels={sortedOrgLevels}
              onToggle={onToggle} onSelect={onSelect}
              onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} empMap={empMap} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrganizationPage() {
  const {
  } = useStore()
  const {
    jobLevels, loadJobLevels, addJobLevel, updateJobLevel, deleteJobLevel,
  } = useLevelStore()

  const { companyPlants } = useCompanyStore()

  const { employees, loadEmployees } = useEmployeeStore()

  const { orgLevels, orgUnits, loadOrganization,
    addOrgUnit, updateOrgUnit, deleteOrgUnit } = useOrganizeStore()

  const [uploadOpen, setUploadOpen] = useState(false)
  const { t, lang } = useLang()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const initialExpandRef = useRef(false)

  useEffect(() => { loadOrganization(); loadJobLevels(); loadEmployees() }, [])

  useEffect(() => {
    if (orgUnits.length > 0 && !initialExpandRef.current) {
      initialExpandRef.current = true
      setExpanded(new Set(orgUnits.filter(u => u.parent_id === null).map(u => u.id)))
    }
  }, [orgUnits])

  // Sort org levels by rank
  const sortedOrgLevels = useMemo(() =>
    [...orgLevels].sort((a, b) => a.level - b.level),
    [orgLevels]
  )

  // Map orgUnits → OrgNode[] using levelRank from embedded organization_levels
  const nodes: OrgNode[] = useMemo(() =>
    orgUnits.map(u => ({
      id: u.id,
      levelRank: u.organization_levels?.level ?? 1,
      parent_id: u.parent_id,
      code: u.code,
      name_th: u.name_th,
      name_en: u.name_en,
      is_status: 'active' as Status,
      company_plant_id: u.company_plant_id,
      organization_level_id: u.organization_level_id,
    })),
    [orgUnits]
  )

  // Map jobLevels → Level[] (separate concept: staff grade levels)
  const levels: Level[] = useMemo(() =>
    jobLevels.map((l, i) => ({
      id: l.id,
      code: l.code,
      rank: i + 1,
      name_th: l.name_th,
      name_en: l.name_en,
      is_status: l.is_status,
    })),
    [jobLevels]
  )

  const defaultPlantId = useMemo(() =>
    orgUnits[0]?.company_plant_id ?? orgLevels[0]?.company_plant_id ?? companyPlants[0]?.id ?? '',
    [orgUnits, orgLevels, companyPlants]
  )

  // Count units per org level rank
  const statsByLevel = useMemo(() => {
    const m: Record<number, number> = {}
    nodes.forEach(n => { m[n.levelRank] = (m[n.levelRank] ?? 0) + 1 })
    return m
  }, [nodes])

  // Modal state
  const [modal, setModal] = useState<{
    open: boolean; mode: 'add-node' | 'edit-node' | 'add-level' | 'edit-level' | null
    parentId?: string; parentLevelRank?: number; editNode?: OrgNode; editLevel?: Level
  }>({ open: false, mode: null })
  const [form, setForm] = useState({ code: '', name_th: '', name_en: '', rank: '1' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Emp map (id → count)
  const empMap = useMemo(() => {
    const m: Record<string, number> = {}
    employees.forEach(e => {
      const unitId = e.defaults?.organizationUnit?.id
      if (unitId) m[unitId] = (m[unitId] ?? 0) + 1
    })
    return m
  }, [employees])

  // Filtered nodes by search
  const filteredNodes = useMemo(() => {
    if (!search.trim()) return nodes
    const q = search.toLowerCase()
    return nodes.filter(n => n.name_th.toLowerCase().includes(q) || n.code.toLowerCase().includes(q))
  }, [nodes, search])

  const selected = selectedId ? nodes.find(n => n.id === selectedId) ?? null : null
  const selectedChildren = selected ? nodes.filter(n => n.parent_id === selected.id) : []
  const selectedCfg = selected ? getPalette(selected.levelRank) : null
  const childOrgLevel = selected
    ? sortedOrgLevels.find(l => l.level === selected.levelRank + 1) ?? null
    : null

  const levelName = useCallback((rank: number) => {
    const lv = sortedOrgLevels.find(l => l.level === rank)
    return lv ? (lang === 'th' ? lv.name_th : lv.name_en) : String(rank)
  }, [sortedOrgLevels, lang])

  const childLabel = childOrgLevel
    ? (lang === 'th' ? childOrgLevel.name_th : childOrgLevel.name_en)
    : ''

  // Ancestors breadcrumb
  const ancestors = useMemo(() => {
    if (!selected) return []
    const result: OrgNode[] = []
    let cur: OrgNode | undefined = selected
    while (cur?.parent_id) {
      cur = nodes.find(n => n.id === cur!.parent_id)
      if (cur) result.unshift(cur)
    }
    return result
  }, [selected, nodes])

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const expandAll = () => setExpanded(new Set(nodes.map(n => n.id)))
  const collapseAll = () => setExpanded(new Set())

  const openAddNode = (parentId: string, childLevelRank: number) => {
    setForm({ code: '', name_th: '', name_en: '', rank: '1' })
    setErrors({})
    setModal({ open: true, mode: 'add-node', parentId, parentLevelRank: childLevelRank })
  }

  const openAddRootUnit = () => {
    const firstLevel = sortedOrgLevels[0]
    if (!firstLevel) return
    setForm({ code: '', name_th: '', name_en: '', rank: '1' })
    setErrors({})
    setModal({ open: true, mode: 'add-node', parentId: undefined, parentLevelRank: firstLevel.level })
  }

  const openEditNode = (node: OrgNode) => {
    setForm({ code: node.code, name_th: node.name_th, name_en: node.name_en, rank: '1' })
    setErrors({})
    setModal({ open: true, mode: 'edit-node', editNode: node })
  }

  const deleteNode = async (node: OrgNode) => {
    try {
      await deleteOrgUnit(node.id)
      if (selectedId === node.id) setSelectedId(null)
    } catch { /* toast already shown by store */ }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = t('organization', 'required')
    if (!form.name_th.trim()) e.name_th = t('organization', 'required')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (modal.mode === 'add-node') {
        const targetLevel = orgLevels.find(l => l.level === (modal.parentLevelRank ?? 1))
        const parentUnit = modal.parentId ? orgUnits.find(u => u.id === modal.parentId) : null
        await addOrgUnit({
          company_plant_id: parentUnit?.company_plant_id ?? defaultPlantId,
          organization_level_id: targetLevel?.id ?? '',
          parent_id: modal.parentId ?? null,
          code: form.code,
          name_th: form.name_th,
          name_en: form.name_en,
        })
        if (modal.parentId) setExpanded(prev => new Set([...prev, modal.parentId!]))
      } else if (modal.mode === 'edit-node' && modal.editNode) {
        await updateOrgUnit(modal.editNode.id, {
          code: form.code,
          name_th: form.name_th,
          name_en: form.name_en,
        })
      } else if (modal.mode === 'add-level') {
        await addJobLevel({ code: form.code, name_th: form.name_th, name_en: form.name_en })
      } else if (modal.mode === 'edit-level' && modal.editLevel) {
        await updateJobLevel(modal.editLevel.id, { name_th: form.name_th, name_en: form.name_en })
      }
      setModal({ open: false, mode: null })
    } catch { /* store already showed error toast */ }
  }

  const addNodeLevelName = modal.parentLevelRank != null ? levelName(modal.parentLevelRank) : ''
  const modalTitle = modal.mode === 'add-node'
    ? `${t('organization', 'addNew')} ${addNodeLevelName}`
    : modal.mode === 'edit-node' ? `${t('organization', 'editOrgNode')} "${modal.editNode?.name_th}"`
      : modal.mode === 'add-level' ? t('organization', 'addJobLevel')
        : `${t('organization', 'editJobLevel')} "${modal.editLevel?.name_th}"`

  const firstOrgLevel = sortedOrgLevels[0]
  const firstOrgLevelLabel = firstOrgLevel
    ? (lang === 'th' ? firstOrgLevel.name_th : firstOrgLevel.name_en)
    : '...'

  const rootNodes = filteredNodes.filter(n => n.parent_id === null)

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t('organization', 'title')}</h1>
            <p className="text-xs text-slate-400">{t('organization', 'subtitle')}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-2 flex-wrap">
          {sortedOrgLevels.map(lv => {
            const p = getPalette(lv.level)
            const count = statsByLevel[lv.level] ?? 0
            const name = lang === 'th' ? lv.name_th : lv.name_en
            return (
              <div key={lv.id} className={cn('flex items-center gap-1 border rounded-xl px-3 py-2', p.bg, p.border)}>
                <span className={cn('text-sm font-bold', p.color)}>{count}</span>
                <span className={cn('text-[10px] opacity-70', p.color)}>{name}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            <span className="text-sm font-bold text-slate-700">{employees.length}</span>
            <span className="text-[10px] text-slate-500 opacity-70">{t('organization', 'employees')}</span>
          </div>
          <button onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">
            <Upload size={13} /> {t('organization', 'importFile')}
          </button>
          {firstOrgLevel && (
            <button onClick={openAddRootUnit}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 px-4 py-2 rounded-xl shadow-md shadow-sky-200 transition-all">
              <Plus size={13} /> {t('organization', 'addNew')} {firstOrgLevelLabel}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── LEFT: Tree + Levels ──────────────────────────────────── */}
        <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 min-h-0">

          {/* Tree panel */}
          <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Building2 size={13} className="text-sky-500" />
                <span className="text-xs font-bold text-slate-700">{t('organization', 'orgTree')}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={expandAll}
                  className="text-[9px] font-semibold text-slate-400 hover:text-sky-600 px-1.5 py-1 rounded hover:bg-sky-50 transition-colors">
                  {t('organization', 'expandAll')}
                </button>
                <button onClick={collapseAll}
                  className="text-[9px] font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-1 rounded hover:bg-slate-50 transition-colors">
                  {t('organization', 'collapseAll')}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Search size={11} className="text-slate-400 flex-shrink-0" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={t('organization', 'searchOrg')}
                  className="text-xs bg-transparent outline-none flex-1 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {rootNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-300 gap-2">
                  <Building2 size={24} /><p className="text-xs">{t('organization', 'noOrg')}</p>
                </div>
              ) : rootNodes.map(node => (
                <TreeNode key={node.id} node={node} nodes={filteredNodes} depth={0}
                  expanded={expanded} selectedId={selectedId}
                  sortedOrgLevels={sortedOrgLevels}
                  onToggle={toggle}
                  onSelect={n => setSelectedId(n.id === selectedId ? null : n.id)}
                  onAdd={openAddNode} onEdit={openEditNode} onDelete={deleteNode}
                  empMap={empMap}
                />
              ))}
            </div>
          </div>

          {/* Job Levels panel */}
          <div className="flex-shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700">{t('organization', 'jobLevels')}</span>
              </div>
              <button onClick={() => {
                setForm({ code: '', name_th: '', name_en: '', rank: String(levels.length + 1) })
                setErrors({})
                setModal({ open: true, mode: 'add-level' })
              }}
                className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors">
                <Plus size={10} /> {t('organization', 'addNew')}
              </button>
            </div>
            <div className="px-3 py-2 space-y-1">
              {levels.sort((a, b) => a.rank - b.rank).map(lv => (
                <div key={lv.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                  <div className="w-5 h-5 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-amber-700">{lv.rank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{lv.name_th}</p>
                    <p className="text-[9px] text-slate-400">{lv.name_en}</p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={() => {
                      setForm({ code: lv.code, name_th: lv.name_th, name_en: lv.name_en, rank: String(lv.rank) })
                      setErrors({})
                      setModal({ open: true, mode: 'edit-level', editLevel: lv })
                    }}
                      className="p-1 rounded hover:bg-amber-100 text-amber-500 transition-colors"><Pencil size={10} /></button>
                    <button onClick={async () => {
                      try { await deleteJobLevel(lv.id) } catch { /* toast shown */ }
                    }}
                      className="p-1 rounded hover:bg-red-100 text-red-400 transition-colors"><Trash2 size={10} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Detail / Overview ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {selected && selectedCfg ? (
            // ── Node Detail Panel ──────────────────────────────────
            <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Detail header */}
              <div className={cn('px-6 py-5 border-b border-slate-100 flex-shrink-0', selectedCfg.bg)}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0', selectedCfg.border, 'bg-white')}>
                    {selectedCfg.icon(true)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Breadcrumb */}
                    {ancestors.length > 0 && (
                      <div className="flex items-center gap-1 mb-1 flex-wrap">
                        {ancestors.map((a, i) => (
                          <React.Fragment key={a.id}>
                            <button onClick={() => setSelectedId(a.id)}
                              className={cn('text-[9px] font-semibold hover:underline', getPalette(a.levelRank).color)}>
                              {a.name_th}
                            </button>
                            {i < ancestors.length - 1 && <ChevronRight size={8} className="text-slate-300" />}
                          </React.Fragment>
                        ))}
                        <ChevronRight size={8} className="text-slate-300" />
                      </div>
                    )}
                    <h2 className={cn('text-base font-bold', selectedCfg.color)}>{selected.name_th}</h2>
                    <p className="text-xs text-slate-500">{selected.name_en}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border', selectedCfg.bg, selectedCfg.color, selectedCfg.border)}>
                      {levelName(selected.levelRank)}
                    </span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{selected.code}</span>
                    <button onClick={() => openEditNode(selected)}
                      className={cn('flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors hover:opacity-80', selectedCfg.border, selectedCfg.color, 'bg-white')}>
                      <Pencil size={11} /> {t('common', 'edit')}
                    </button>
                    <button onClick={() => deleteNode(selected)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 bg-white px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 size={11} /> {t('common', 'delete')}
                    </button>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{empMap[selected.id] ?? 0}</span>
                    <span className="text-[10px] text-slate-400">{t('organization', 'employees')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers size={12} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{selectedChildren.length}</span>
                    <span className="text-[10px] text-slate-400">
                      {childOrgLevel ? childLabel : t('organization', 'subUnits')}
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-1.5 ml-auto text-[10px] font-semibold px-2 py-1 rounded-full border',
                    selected.is_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}>
                    {selected.is_status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {selected.is_status === 'active' ? t('common', 'active') : t('organization', 'inactive')}
                  </div>
                </div>
              </div>

              {/* Children list */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {childOrgLevel ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {t('organization', 'allSubUnits')} {childLabel}
                      </h3>
                      <button
                        onClick={() => openAddNode(selected.id, childOrgLevel.level)}
                        className={cn('flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-colors',
                          getPalette(childOrgLevel.level).bg,
                          getPalette(childOrgLevel.level).color,
                          getPalette(childOrgLevel.level).border,
                          'hover:opacity-80')}>
                        <Plus size={10} /> {t('organization', 'addNew')} {childLabel}
                      </button>
                    </div>

                    {selectedChildren.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2 border-2 border-dashed border-slate-200 rounded-xl">
                        <Folder size={24} />
                        <p className="text-xs">{t('organization', 'noSubUnits')} {childLabel}</p>
                        <button onClick={() => openAddNode(selected.id, childOrgLevel.level)}
                          className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl border',
                            getPalette(childOrgLevel.level).bg,
                            getPalette(childOrgLevel.level).color,
                            getPalette(childOrgLevel.level).border)}>
                          <Plus size={10} className="inline mr-1" />{t('organization', 'addNew')}
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedChildren.map(child => {
                          const ccfg = getPalette(child.levelRank)
                          const grandchildren = nodes.filter(n => n.parent_id === child.id)
                          return (
                            <button key={child.id}
                              onClick={() => setSelectedId(child.id)}
                              className={cn('text-left p-4 rounded-xl border transition-all hover:shadow-sm', ccfg.bg, ccfg.border, 'hover:opacity-90')}>
                              <div className="flex items-center gap-2 mb-2">
                                {ccfg.icon(false)}
                                <span className="font-mono text-[9px] text-slate-400">{child.code}</span>
                                {child.is_status !== 'active' && (
                                  <span className="text-[8px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full ml-auto">{t('organization', 'inactive')}</span>
                                )}
                              </div>
                              <p className={cn('text-xs font-bold truncate mb-0.5', ccfg.color)}>{child.name_th}</p>
                              <p className="text-[9px] text-slate-400 truncate">{child.name_en}</p>
                              <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-500">
                                {grandchildren.length > 0 && (
                                  <span className="flex items-center gap-0.5"><Layers size={8} />{grandchildren.length}</span>
                                )}
                                {(empMap[child.id] ?? 0) > 0 && (
                                  <span className="flex items-center gap-0.5"><Users size={8} />{empMap[child.id]}</span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-300 gap-2">
                    <GitBranch size={24} />
                    <p className="text-xs">{t('organization', 'lineIsLeaf')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ── Overview when nothing selected ─────────────────────
            <div className="h-full flex flex-col gap-3">
              {/* Org structure visual overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <Building2 size={12} /> {t('organization', 'structureOverview')}
                </h3>

                {sortedOrgLevels.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Building2 size={32} />
                    <p className="text-sm">{t('organization', 'noOrg')}</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    {sortedOrgLevels.map((lv, i) => {
                      const p = getPalette(lv.level)
                      const name = lang === 'th' ? lv.name_th : lv.name_en
                      const count = statsByLevel[lv.level] ?? 0
                      // Slightly narrower for deeper levels
                      const widths = ['w-56', 'w-48', 'w-40', 'w-36', 'w-32', 'w-28']
                      const w = widths[i % widths.length]
                      return (
                        <React.Fragment key={lv.id}>
                          <div className="flex items-center justify-center w-full max-w-sm">
                            <div className={cn('bg-gradient-to-r text-white rounded-2xl px-8 py-3 flex items-center gap-3 shadow-md', p.gradient, w)}>
                              <span className="text-lg">{p.emoji}</span>
                              <div>
                                <p className="text-xs font-bold">{name}</p>
                                <p className="text-[10px] opacity-70">{count} {t('organization', 'units')}</p>
                              </div>
                              <span className="ml-auto text-xl font-black opacity-80">{count}</span>
                            </div>
                          </div>
                          {i < sortedOrgLevels.length - 1 && (
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="w-px h-3 bg-slate-300" />
                              <ChevronDown size={10} className="text-slate-400" />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                )}

                <p className="text-center text-[10px] text-slate-400 mt-4">
                  {t('organization', 'clickToView')}
                </p>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Upload Modal ──────────────────────────────────────────── */}
      <UploadFileModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        type="organizations"
        onSuccess={() => { loadOrganization(); loadJobLevels() }}
      />

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: null })}
        title={modalTitle}
        subtitle={modal.mode?.includes('level') ? 'ตำแหน่งงาน · ลำดับ' : 'organization unit'}
        size="sm"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setModal({ open: false, mode: null })}>{t('common', 'cancel')}</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{t('common', 'save')}</Button>
        </>}>
        <div className="space-y-4">
          <Field label={t('organization', 'codeField')} required error={errors.code}>
            <Input placeholder={t('organization', 'codePlaceholder')} value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              error={!!errors.code} disabled={!!(modal.editNode || modal.editLevel)} />
          </Field>
          <Field label={t('organization', 'nameTh')} required error={errors.name_th}>
            <Input placeholder={t('organization', 'namePlaceholder')} value={form.name_th}
              onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))}
              error={!!errors.name_th} />
          </Field>
          <Field label={t('organization', 'nameEn')}>
            <Input placeholder="English name" value={form.name_en}
              onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
