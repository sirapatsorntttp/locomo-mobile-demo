import { cn } from '@/lib/utils'
import React from 'react'

// Badge
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-sky-100 text-sky-700 border-sky-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', icon, children, className, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm',
    ghost: 'text-slate-600 hover:text-slate-800 hover:bg-slate-100',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  }
  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-xl gap-2',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}

// Card
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }
  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 shadow-card', pads[padding], className)}>
      {children}
    </div>
  )
}

// Stat Card
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  colorClass?: string
  iconBg?: string
}

export function StatCard({ title, value, subtitle, icon, trend, colorClass = 'stat-card-blue', iconBg = 'bg-blue-500' }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-5 flex items-start justify-between transition-all hover:shadow-md', colorClass)}>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {trend && (
          <div className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2 py-0.5 rounded-full',
            trend.value >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          )}>
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0', iconBg)}>
        {icon}
      </div>
    </div>
  )
}

// Section Header
interface SectionHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  iconBg?: string
  actions?: React.ReactNode
}

export function SectionHeader({ icon, title, subtitle, iconBg = 'bg-sky-500', actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm', iconBg)}>
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// Empty State
export function EmptyState({ message = 'ไม่มีข้อมูล' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 opacity-40">
        <rect width="40" height="40" rx="8" fill="#e2e8f0" />
        <path d="M12 28V18M20 28V12M28 28V22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// Loading Skeleton
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

// Table components
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto table-scroll">
      <table className={cn('w-full text-sm', className)}>
        {children}
      </table>
    </div>
  )
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 first:rounded-l-lg last:rounded-r-lg whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-3 py-2.5 text-slate-600 border-b border-slate-50 whitespace-nowrap', className)}>
      {children}
    </td>
  )
}
