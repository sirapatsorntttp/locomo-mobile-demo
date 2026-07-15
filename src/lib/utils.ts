import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ReserveStatus, AttendanceStatus, AttendanceType, Status, ShiftType, ShiftSchedule, CalendarType, Calendar, AllowDaysType, AfterCutoffAction, AllowDays } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Reserve Status ───────────────────────────────────────
export function getReserveStatusLabel(status: ReserveStatus): string {
  const m: Record<ReserveStatus, string> = {
    waiting: 'รอการยืนยัน',
    approved: 'อนุมัติแล้ว',
    canceled: 'ยกเลิก',
    finished: 'เสร็จสิ้น',
  }
  return m[status]
}

export function getReserveStatusColor(status: ReserveStatus): string {
  const m: Record<ReserveStatus, string> = {
    waiting: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    canceled: 'bg-red-100 text-red-700 border-red-200',
    finished: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  return m[status]
}

export function getReserveStatusVariant(status: ReserveStatus): 'warning' | 'success' | 'error' | 'info' {
  const m: Record<ReserveStatus, 'warning' | 'success' | 'error' | 'info'> = {
    waiting: 'warning',
    approved: 'success',
    canceled: 'error',
    finished: 'info',
  }
  return m[status]
}

// ─── Attendance Status ────────────────────────────────────
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const m: Record<AttendanceStatus, string> = {
    reserved: 'จองรถแล้ว',
    not_reserved: 'ไม่ได้จอง',
    not_found: 'ไม่พบข้อมูล',
  }
  return m[status]
}

export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const m: Record<AttendanceStatus, string> = {
    reserved: 'bg-emerald-100 text-emerald-700',
    not_reserved: 'bg-amber-100 text-amber-700',
    not_found: 'bg-slate-100 text-slate-500',
  }
  return m[status]
}

// ─── Attendance Type ──────────────────────────────────────
export function getAttendanceTypeLabel(type: AttendanceType): string {
  return type === 'rfid' ? 'แสกนบัตร RFID' : 'แสกน QR Code'
}

// ─── Shift ────────────────────────────────────────────────
export function getShiftTypeLabel(type: ShiftType): string {
  return type === 'regular' ? 'ปกติ' : 'ล่วงเวลา'
}

export function getShiftScheduleLabel(schedule: ShiftSchedule): string {
  return schedule === 'day' ? 'กลางวัน' : 'กลางคืน'
}

export function getShiftScheduleColor(schedule: ShiftSchedule): string {
  return schedule === 'day'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-indigo-100 text-indigo-700'
}

// ─── Calendar ─────────────────────────────────────────────
export function getCalendarTypeLabel(type: CalendarType): string {
  return type === 'weekday' ? 'วันปกติ' : 'วันหยุด'
}

// ─── Status ───────────────────────────────────────────────
export function getStatusLabel(status: Status): string {
  return status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'
}

export function getStatusColor(status: Status): string {
  return status === 'active'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-500 border-slate-200'
}

// ─── Employee helpers ─────────────────────────────────────
export function getEmployeeFullName(emp: { first_name_th: string; last_name_th: string }, lang: 'th' | 'en' = 'th'): string {
  if (lang === 'en') return `${emp.first_name_th} ${emp.last_name_th}` // using th fallback
  return `${emp.first_name_th} ${emp.last_name_th}`
}

export function getDriverFullName(driver: { first_name_th: string; last_name_th: string }): string {
  return `${driver.first_name_th} ${driver.last_name_th}`
}

// ─── Misc ─────────────────────────────────────────────────
export function calcAttendanceRate(attended: number, reserves: number): number {
  if (reserves === 0) return 0
  return Math.round((attended / reserves) * 100)
}

export function formatDate(dateStr: string, locale = 'th-TH'): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5) // "HH:mm:ss" → "HH:mm"
}

export function formatDatetime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

export function getPlatformIcon(platform: string): string {
  const m: Record<string, string> = { api: '⚙️', mobile: '📱', web: '🌐' }
  return m[platform] ?? '❓'
}

export function getDeviceIcon(device: string): string {
  const m: Record<string, string> = { android: '🤖', ios: '🍎', pc: '💻' }
  return m[device] ?? '❓'
}

// ─── Booking Policy Helpers ───────────────────────────────

/** Returns true if the given date is marked as a holiday in the company calendar */
export function isHoliday(dateStr: string, calendars: Calendar[], plant_company_id: string): boolean {
  const d = dateStr.slice(0, 10)
  return calendars.some(c => c.date_at === d && c.type === 'holiday' && c.plant_company_id === plant_company_id)
}

/** Returns true if the current wall-clock time is past the given cutoff (e.g. "15:00") */
export function isPastCutoff(cutoffTime: string): boolean {
  const now = new Date()
  const [ch, cm] = cutoffTime.split(':').map(Number)
  return now.getHours() > ch || (now.getHours() === ch && now.getMinutes() >= cm)
}

/**
 * Expands a date range into individual workday strings (YYYY-MM-DD).
 * Excludes days explicitly marked as holidays in the company calendar.
 */
export function expandWorkdays(from: string, to: string, calendars: Calendar[], plant_company_id: string): string[] {
  const result: string[] = []
  const cur = new Date(from)
  const end = new Date(to)
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10)
    if (!isHoliday(d, calendars, plant_company_id)) {
      result.push(d)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export function getAllowDaysLabel(allow_days: AllowDays | AllowDaysType | string): string {
  if (allow_days === 'weekday')      return 'วันทำงาน'
  if (allow_days === 'holiday_only') return 'วันหยุดเท่านั้น'
  if (allow_days === 'custom')       return 'กำหนดเอง'
  return 'ทุกวัน'
}

export function getAfterCutoffLabel(action: AfterCutoffAction | string): string {
  if (action === 'block')            return 'ปิดรับการจอง'
  if (action === 'require_approval') return 'ต้องให้ GA อนุมัติ'
  return 'อนุญาต'
}

/** Returns true if current wall-clock time is past the given cutoff time string (e.g. "15:30") */
export function isPastCutoffTime(cutoffTime: string): boolean {
  const now = new Date()
  const [ch, cm] = cutoffTime.split(':').map(Number)
  return now.getHours() > ch || (now.getHours() === ch && now.getMinutes() >= cm)
}
