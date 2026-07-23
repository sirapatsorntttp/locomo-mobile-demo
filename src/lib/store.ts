import { Attendance, Status } from '@/types'
import { create } from 'zustand'
import { useEmployeeStore } from './stores/employee.store'
import { useReserveStore } from './stores/reserve.store'
import { usePostStore } from './stores/post.store'
import { useAttendanceStore } from './stores/attendance.store'
import { useRoutePointStore } from './stores/useRoutePointStore'
import { useDriverStore } from './stores/driver.store'


 export   const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'


export function genId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
export function nowISO() { return new Date().toISOString() }
function extractList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.body)) return payload.body
  if (Array.isArray(payload?.body?.data)) return payload.body.data
  return []
}

function normalizeStatus(value: unknown): Status {
  const status = String(value ?? 'active').toLowerCase()
  return status === 'inactive' || status === 'false' || status === '0' ? 'inactive' : 'active'
}

// â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

// â”€â”€â”€ Modal types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ModalType =
  | 'add-employee' | 'edit-employee' | 'view-employee' | 'delete-employee'
  | 'add-driver'   | 'edit-driver'   | 'view-driver'   | 'delete-driver'
  | 'add-vehicle-type' | 'edit-vehicle-type' | 'delete-vehicle-type'
  | 'add-vehicle'  | 'edit-vehicle'  | 'view-vehicle'  | 'delete-vehicle'
  | 'add-zone'     | 'edit-zone'     | 'delete-zone'
  | 'add-route'    | 'edit-route'    | 'view-route'    | 'delete-route'
  | 'add-point'    | 'edit-point' | 'delete-point'
  | 'add-reserve'  | 'edit-reserve'  | 'view-reserve'  | 'delete-reserve'
  | 'add-post'     | 'edit-post'     | 'delete-post'
  | 'add-shift'    | 'edit-shift'    | 'delete-shift'
  | 'add-shift-group' | 'edit-shift-group'
  | 'add-calendar' | 'delete-calendar'
  | 'add-vendor'   | 'edit-vendor'   | 'delete-vendor'
  | 'add-coordinator' | 'edit-coordinator' | 'delete-coordinator'
  | 'add-coordinator-type' | 'edit-coordinator-type' | 'delete-coordinator-type'
  | 'add-plant'   | 'edit-plant'   | 'delete-plant'
  | 'add-company' | 'edit-company' | 'delete-company'
  | 'add-booking-policy' | 'edit-booking-policy' | 'view-booking-policy' | 'delete-booking-policy'
  | 'bulk-reserve' | 'bulk-edit-reserve'
  | 'assign-driver-vehicle'
  | 'add-user-account' | 'edit-user-account' | 'view-user-account' | 'delete-user-account'
  | 'bulk-add-user-account' | 'change-password' | 'set-role'
  | 'rfid-scan'
  | 'confirm-delete'
  | null

export interface ModalState { type: ModalType; data?: any }

interface UIState {
  isDialogOpen: boolean
  openDialog: () => void
  closeDialog: () => void

  menuOpen:boolean
  openMenu:() =>void
   closeMenu:() =>void
    toggleMenu:() =>void
}

export const useUIStore = create<UIState>((set) => ({
  isDialogOpen: false,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),

  
menuOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),



  
}))


export interface AppState {

  // Modal
  modal: ModalState
  openModal: (type: ModalType, data?: any) => void
  closeModal: () => void

  // Toast
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void

  // // â”€â”€ Employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadEmployees: () => Promise<void>
  // addEmployee: (data: Partial<EmployeeFull> & { defaults?: any; transportDefaults?: any[] }) => void
  // updateEmployee: (id: string, data: Partial<EmployeeFull> & { transportDefaults?: any[] }) => void
  // deleteEmployee: (id: string) => void
  // toggleEmployeeStatus: (id: string) => void

  // â”€â”€ Drivers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadDrivers: () => Promise<void>
  // addDriver: (data: Partial<Driver>) => Promise<void>
  // updateDriver: (id: string, data: Partial<Driver>) => Promise<void>
  // deleteDriver: (id: string) => Promise<void>
  // addDriverRouteDefault: (driver_id: string, route_id: string, trip_direction?: string) => Promise<void>
  // removeDriverRouteDefault: (driver_id: string, rd_id: string) => Promise<void>
  // assignDriverVehicle: (driver_id: string, vehicle_id: string, vendor_id: string) => Promise<void>
  // unassignDriverVehicle: (driver_id: string) => Promise<void>

  // â”€â”€ User Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadUserAccounts: () => Promise<void>
  // addUserAccount: (data: Partial<UserAccount> & { employeeId?: string; driverId?: string; roleIds?: string[]; roleId?: string; password?: string; language?: string }) => Promise<void>
  // bulkAddUserAccounts: (params: {
  //   account_type: 'employee' | 'driver'
  //   ids: string[]                      // employee_id[] or driver_id[]
  //   role: UserRole
  //   company_id: string | null
  //   username_pattern: 'code' | 'firstname' | 'custom_prefix'
  //   custom_prefix?: string
  //   email_domain?: string              // e.g. "@tttp.co.th" â†’ auto fill email
  // }) => Promise<{ created: number; skipped: number }>
  // updateUserAccount: (id: string, data: Partial<UserAccount> & { type?: string }) => Promise<void>
  // deleteUserAccount: (id: string) => Promise<void>
  // toggleUserAccountStatus: (id: string) => Promise<void>
  // resetUserPassword: (id: string, newPassword: string) => Promise<void>

  // ── Roles
  // roles: Role[]
  // loadRoles: () => Promise<void>
  // addRole: (data: Partial<Role>) => Promise<void>
  // updateRole: (id: string, data: Partial<Role>) => Promise<void>
  // deleteRole: (id: string) => Promise<void>

  // â”€â”€ Vehicles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadVehicles: () => Promise<void>
  // addVehicle: (data: Partial<Vehicle>) => Promise<void>
  // updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>
  // deleteVehicle: (id: string) => Promise<void>
  // loadVehicleTypes: () => Promise<void>
  // addVehicleType: (data: Partial<VehicleType>) => Promise<void>
  // updateVehicleType: (id: string, data: Partial<VehicleType>) => Promise<void>
  // deleteVehicleType: (id: string) => Promise<void>

  // â”€â”€ Shift Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadShiftGroups: (companyPlantId?: string) => Promise<void>
  // addShiftGroup: (data: Partial<ShiftGroup> & { company_plant_id?: string }) => Promise<void>
  // updateShiftGroup: (id: string, data: Partial<ShiftGroup>) => Promise<void>
  // deleteShiftGroup: (id: string) => Promise<void>

  // â”€â”€ Shifts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadShifts: (companyPlantId?: string) => Promise<void>

  // â”€â”€ Zones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadZones: () => Promise<void>
  // addZone: (data: Partial<Zone>) => Promise<void>
  // updateZone: (id: string, data: Partial<Zone>) => Promise<void>
  // deleteZone: (id: string) => Promise<void>
  // toggleZoneStatus: (id: string) => Promise<void>
  // assignRouteToZone: (zone_id: string, route_id: string) => Promise<void>
  // assignRoutesToZone: (zone_id: string, route_ids: string[]) => Promise<void>
  // removeRouteFromZone: (zone_id: string, route_id: string) => Promise<void>

  // â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadRoutesPoints: () => Promise<void>
  // addRoute: (data: Partial<Route>) => Promise<void>
  // updateRoute: (id: string, data: Partial<Route>) => Promise<void>
  // deleteRoute: (id: string) => Promise<void>
  // toggleRouteStatus: (id: string) => Promise<void>

  // // â”€â”€ Points â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // addPoint: (data: Partial<Point>) => Promise<void>
  // updatePoint: (id: string, data: Partial<Point>) => Promise<void>
  // deletePoint: (id: string) => Promise<void>

  // â”€â”€ Session (current admin company) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  currentCompanyId: string
  setCurrentCompany: (companyId: string) => void

   // สำหรับ Super Admin
  selectedCompanyPlantId: string
  setSelectedCompanyPlantId: (id: string) => void

   scanAttendance: (rfid: string, postId: string, pointId: string, type?: 'rfid' | 'gps') => boolean

  // â”€â”€ Computed helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getDashboardStats: () => {
    activeEmployees: number
    todayReserves: number
    todayAttended: number
    waitingReserves: number

   
    totalRoutes: number
    totalDrivers: number
    usageRate: number
  }
}

export const useStore = create<AppState>((set, get) => ({

    currentCompanyId: '',
  setCurrentCompany: (companyId) => set({ currentCompanyId: companyId }),

selectedCompanyPlantId: '',
setSelectedCompanyPlantId: (id) =>
  set({ selectedCompanyPlantId: id }),


  // â”€â”€ Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  modal: { type: null },
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: { type: null, data: undefined } }),

  // â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  toasts: [],
  addToast: (type, message) => {
    const id = genId()
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ── Attendance scan ───────────────────────────────────────────────────────────
  scanAttendance: (rfid, postId, pointId, type = 'rfid') => {
      const employees = useEmployeeStore.getState().employees
    const reserves = useReserveStore.getState().reserves
    const posts = usePostStore.getState().posts
     const attendances = useAttendanceStore.getState().attendances
    const emp = employees.find(e => e.rfid === rfid)
    const points = useRoutePointStore.getState().points
    if (!emp) { get().addToast('error', `ไม่พบพนักงาน RFID: "${rfid}"`); return false }
    const post =posts.find(p => p.id === postId)
    const point = points.find(p => p.id === pointId)
    const already = attendances.find(a => a.employee_id === emp.id && a.post_id === postId)
    if (already) { get().addToast('warning', `${emp.first_name_th} สแกนแล้วในเที่ยวนี้`); return false }
    const hasReserve = reserves.find(r => r.employee_id === emp.id && r.shift_id === (post?.shift_id ?? '') && r.is_state === 'approved')
    const att: Attendance = { id: genId(), employee_id: emp.id, employee: emp, point_id: pointId, point: point ?? undefined, post_id: postId, post: post ?? undefined, rfid, remark: null, type, is_state: hasReserve ? 'reserved' : 'not_reserved', is_status: 'active', created_by: 'system', created_at: nowISO(), updated_by: null, updated_at: null }
    useAttendanceStore.setState(s => ({ attendances: [att, ...s.attendances] }))
    get().addToast('success', `✓ ${emp.first_name_th} ${emp.last_name_th} · ${hasReserve ? 'จองแล้ว' : 'ไม่ได้จอง'}`)
    return true
  },

  // ── Computed stats ────────────────────────────────────────────────────────────
  getDashboardStats: () => {
    const employees = useEmployeeStore.getState().employees
    const drivers = useDriverStore.getState().drivers
    const reserves = useReserveStore.getState().reserves

    const routes = useRoutePointStore.getState().routes
         const attendances = useAttendanceStore.getState().attendances
    const s = get()
    const activeEmployees = employees.filter(e => e.is_status === 'active').length
    const todayReserves = reserves.length
    const todayAttended = attendances.length
    const waitingReserves = reserves.filter(r => r.is_state === 'waiting').length
  
    const usageRate = todayReserves > 0 ? Math.round((todayAttended / todayReserves) * 100) : 0
    return { activeEmployees, todayReserves, todayAttended, waitingReserves,  totalRoutes: routes.filter(r => r.is_status === 'active').length, totalDrivers:drivers.filter(d => d.is_status === 'active').length, usageRate }
  },
}))