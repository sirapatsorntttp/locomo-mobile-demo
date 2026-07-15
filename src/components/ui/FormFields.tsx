import { cn } from '@/lib/utils'
import React from 'react'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

export function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}
export function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400',
        error
          ? 'border-red-300 focus:ring-2 focus:ring-red-100'
          : 'border-slate-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}
export function Select({ error, className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full text-xs border rounded-lg px-3 py-2 outline-none transition-all bg-white text-slate-700 cursor-pointer',
        error
          ? 'border-red-300 focus:ring-2 focus:ring-red-100'
          : 'border-slate-200 focus:border-sky-300 focus:ring-2 focus:ring-sky-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      rows={3}
      className={cn(
        'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 transition-all bg-white text-slate-700 placeholder:text-slate-400 resize-none',
        className
      )}
      {...props}
    />
  )
}

// 2-column grid helper
export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={cn('grid gap-4', cols === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
      {children}
    </div>
  )
}

// Section separator inside modal
export function FormSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-100" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}
