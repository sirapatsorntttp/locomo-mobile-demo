'use client'
import { create } from 'zustand'
import type {
  EmployeeFull, Driver, UserAccount, Vehicle, Reserve, Attendance,
  Route, Point, Shift, ShiftType, ShiftSchedule, ShiftGroup, Post, Calendar, CalendarGroup, DriverVehicle, DriverVehicleVendor,
  Status, ReserveStatus, Vendor, Coordinator, CoordinatorType, BookingPolicy, UserRole, VehicleType, Company, Plant,
  CompanyVendor, PlantVendorService, CompanyPlant, CompanyPlantEmployee,
  OrganizationLevel, OrganizationUnit, Zone, JobLevel, Role, AuthenticationLog, FeedbackComment,
} from '@/types'

import { isHoliday, isPastCutoff, expandWorkdays } from '@/lib/utils'
import { authHeader, getPlantIds, isSuperAdmin, getCompanyPlantId, getProfile } from '@/lib/auth-token'
import { apiFetch } from '@/lib/api-fetch'
import { useEmployeeStore } from '@/lib/stores/employee.store'
import { useDriverStore } from '@/lib/stores/driver.store'
import { useCompanyStore } from '@/lib/stores/company.store'
import { useShiftStore } from '@/lib/stores/shift.store'
import { useRoleStore } from '@/lib/stores/roles.store'
import { useReserveStore } from '@/lib/stores/reserve.store'
import { useVendorStore } from '@/lib/stores/useVendorStore'
import { useVehiclesStore } from './stores/useVehiclesStore';
import { useRoutePointStore } from './stores/useRoutePointStore';
import { usePostStore } from './stores/post.store'
import { useAttendanceStore } from './stores/attendance.store'


 export   const BACKEND_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'


export function genId() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
export function nowISO() { return new Date().toISOString() }

// function normalizePoint(p: any): Point {
//   return {
//     ...p,
//     latitude: Number(p.latitude),
//     longitude: Number(p.longitude),
//     queue_default: p.queue_default != null ? Number(p.queue_default) : null,
//   }
// }

// function normalizeReserve(r: any): Reserve {
//   return {
//     ...r,
//     employee:              r.employees   ?? r.employee   ?? undefined,
//     shift:                 r.shifts      ?? r.shift      ?? undefined,
//     point:                 r.points      ?? r.point      ?? undefined,
//     policy:                r.booking_policies ?? r.policy ?? undefined,
//     plant_company_zone_id: r.plant_company_zone_id ?? '',
//     platform:              r.platform  ?? 'web',
//     device:                r.device    ?? 'pc',
//     is_state:              r.is_state  ?? 'waiting',
//     remark:                r.remark    ?? null,
//     is_status:             r.is_status ?? 'active',
//     created_by:            r.created_by  ?? '',
//     created_at:            r.created_at  ?? new Date().toISOString(),
//     updated_by:            r.updated_by  ?? null,
//     updated_at:            r.updated_at  ?? null,
//   }
// }

// function isUuid(value: unknown): value is string {
//   return typeof value === 'string'
//     && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
// }

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

// â”€â”€â”€ App Store Interface â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AppState {
  // Data
  // plants: Plant[]
  // companies: Company[]
  // employees: EmployeeFull[]
  // drivers: Driver[]
  // vehicles: Vehicle[]
  // vehicleTypes: VehicleType[]
  // zones: Zone[]
  // routes: Route[]
  // points: Point[]
  // shiftGroups: ShiftGroup[]
  // shifts: Shift[]
  // posts: Post[]
  // reserves: Reserve[]
  // _reserveParams: Record<string, string>
  // attendances: Attendance[]
  // calendarGroups: CalendarGroup[]
  // calendars: Calendar[]
  // driverVehicles: DriverVehicle[]
  // driverVehicleVendors: DriverVehicleVendor[]
  // vendors: Vendor[]
  // userAccounts: UserAccount[]
  // authLogs: AuthenticationLog[]
  // authLogsTotal: number
  // loadAuthLogs: (params?: { result?: string; event?: string; dateFrom?: string; dateTo?: string; page?: number }) => Promise<void>



  // ── Comments / Feedback ───────────────────────────────────────
  // comments: FeedbackComment[]
  // commentsTotal: number
  // loadComments: (params?: { status?: string; route_id?: string; page?: number }) => Promise<void>
  // addComment: (data: { employee_id: string; route_id: string; date_at: string; subject?: string; detail?: string; status?: string }) => Promise<void>
  // updateComment: (id: string, data: { subject?: string; detail?: string; status?: string }) => Promise<void>
  // deleteComment: (id: string) => Promise<void>

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

  // â”€â”€ Booking Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // bookingPolicies: BookingPolicy[]
  // bookingPoliciesTotal: number
  // loadBookingPolicies: (params?: { status?: string; page?: number }) => Promise<void>
  // addBookingPolicy: (data: {
  //   company_id: string; name_th: string; name_en: string; description?: string; priority?: number;
  //   rules?: Partial<import('@/types').BookingPolicyRules>;
  //   route_ids?: string[]; org_unit_ids?: string[];
  // }) => Promise<void>
  // updateBookingPolicy: (id: string, data: {
  //   name_th?: string; name_en?: string; description?: string; priority?: number; status?: string;
  //   rules?: Partial<import('@/types').BookingPolicyRules>;
  //   route_ids?: string[]; org_unit_ids?: string[];
  // }) => Promise<void>
  // deleteBookingPolicy: (id: string) => Promise<void>

  // â”€â”€ Reserves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadReserves: (params?: { date_from?: string; date_to?: string; shift_id?: string; is_state?: string; employee_id?: string; page?: number; per_page?: number }) => Promise<void>
  // addReserve: (data: Partial<Reserve> & { policy_id?: string; date_from?: string; date_to?: string }) => Promise<void>
  // bulkAddReserves: (params: {
  //   employee_ids: string[]
  //   trip_mode: 'one_way' | 'round_trip'
  //   legs: Array<{
  //     shift_id: string
  //     point_mode: 'default' | 'override'
  //     override_point_id?: string
  //   }>
  //   travel_dates: string[]
  //   policy_id?: string
  //   remark?: string
  // }) => Promise<{ created: number; updated: number; skipped: number; blocked: number }>
  // updateReserveState: (id: string, state: ReserveStatus) => Promise<void>
  // deleteReserve: (id: string) => Promise<void>
  // bulkApprove: (ids: string[]) => Promise<void>
  // bulkCancelReserves: (ids: string[]) => Promise<void>
  // bulkEditReserveShift: (ids: string[], shift_id: string) => void

  // â”€â”€ Posts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // addPost: (data: Partial<Post>) => void
  // updatePost: (id: string, data: Partial<Post>) => void
  // deletePost: (id: string) => void

  // â”€â”€ Shifts (CRUD) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // addShift: (data: Partial<Shift>) => Promise<void>
  // updateShift: (id: string, data: Partial<Shift>) => Promise<void>
  // deleteShift: (id: string) => Promise<void>


  // â”€â”€ Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // loadCalendarGroups: () => Promise<void>
  // loadCalendars: () => Promise<void>
  // addCalendarGroup: (data: { plant_company_id: string; name: string; color: string; description?: string }) => Promise<CalendarGroup | null>
  // updateCalendarGroup: (id: string, data: Partial<CalendarGroup>) => Promise<void>
  // deleteCalendarGroup: (id: string) => Promise<void>
  // addCalendar: (data: Partial<Calendar>) => Promise<void>
  // deleteCalendar: (id: string) => Promise<void>


  
  // // ── Plants ───────────────────────────────────────────────────────────────
  // loadPlants: () => Promise<void>
  // addPlant: (data: Partial<Plant> & { company_id?: string }) => Promise<void>
  // updatePlant: (id: string, data: Partial<Plant> & { company_id?: string }) => Promise<void>
  // deletePlant: (id: string) => Promise<void>
  // togglePlantStatus: (id: string) => Promise<void>

  // â”€â”€ Companies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // companyPlants: CompanyPlant[]
  // companyPlantEmployees: CompanyPlantEmployee[]
  // loadCompanies: () => Promise<void>
  // addCompany: (data: Partial<Company>) => Promise<void>
  // updateCompany: (id: string, data: Partial<Company>) => Promise<void>
  // deleteCompany: (id: string) => Promise<void>
  // toggleCompanyStatus: (id: string) => Promise<void>
  // addCompanyPlant: (company_id: string, plant_id: string) => Promise<void>
  // removeCompanyPlant: (company_id: string, plant_id: string) => Promise<void>
  // addCompanyPlantEmployee: (company_id: string, plant_id: string, employee_id: string) => Promise<void>
  // removeCompanyPlantEmployee: (company_id: string, plant_id: string, employee_id: string) => Promise<void>

  // â”€â”€ Vendors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // companyVendors: CompanyVendor[]
  // plantVendorServices: PlantVendorService[]
  // loadVendors: () => Promise<void>
  // addVendor: (data: Partial<Vendor>) => Promise<void>
  // updateVendor: (id: string, data: Partial<Vendor>) => Promise<void>
  // deleteVendor: (id: string) => Promise<void>
  // assignVendorCompany: (vendor_id: string, company_id: string) => Promise<void>
  // removeVendorCompany: (vendor_id: string) => Promise<void>
  // addVendorPlant: (vendor_id: string, plant_id: string) => Promise<void>
  // removeVendorPlant: (vendor_id: string, plant_id: string) => Promise<void>
  // assignVendorDriverVehicle: (vendor_id: string, driver_vehicle_id: string) => Promise<void>
  // removeVendorDriverVehicle: (vendor_id: string, driver_vehicle_id: string) => Promise<void>

  // ── Coordinators ──────────────────────────────────────────────────────────
  // coordinatorTypes: CoordinatorType[]
  // coordinators: Coordinator[]
  // loadCoordinators: () => Promise<void>
  // addCoordinatorType: (data: Partial<CoordinatorType>) => Promise<void>
  // updateCoordinatorType: (id: string, data: Partial<CoordinatorType>) => Promise<void>
  // deleteCoordinatorType: (id: string) => Promise<void>
  // addCoordinator: (data: Partial<Coordinator>) => Promise<void>
  // updateCoordinator: (id: string, data: Partial<Coordinator>) => Promise<void>
  // deleteCoordinator: (id: string) => Promise<void>
  // toggleCoordinatorStatus: (id: string) => Promise<void>

  // ── Job Levels ─────────────────────────────────────────────────────────────
  // jobLevels: JobLevel[]
  // loadJobLevels: () => Promise<void>
  // addJobLevel: (data: Partial<JobLevel>) => Promise<void>
  // updateJobLevel: (id: string, data: Partial<JobLevel>) => Promise<void>
  // deleteJobLevel: (id: string) => Promise<void>

  // ── Organization ──────────────────────────────────────────────────────────
  // orgLevels: OrganizationLevel[]
  // orgUnits: OrganizationUnit[]
  // loadOrganization: () => Promise<void>
  // addOrgLevel: (data: Partial<OrganizationLevel>) => Promise<void>
  // updateOrgLevel: (id: string, data: Partial<OrganizationLevel>) => Promise<void>
  // deleteOrgLevel: (id: string) => Promise<void>
  // addOrgUnit: (data: Partial<OrganizationUnit>) => Promise<void>
  // updateOrgUnit: (id: string, data: Partial<OrganizationUnit>) => Promise<void>
  // deleteOrgUnit: (id: string) => Promise<void>

  // â”€â”€ Attendance scan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  scanAttendance: (rfid: string, postId: string, pointId: string, type?: 'rfid' | 'gps') => boolean

  // â”€â”€ Computed helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  getDashboardStats: () => {
    activeEmployees: number
    todayReserves: number
    todayAttended: number
    waitingReserves: number
    activeVehicles: number
    totalVehicles: number
    totalRoutes: number
    totalDrivers: number
    usageRate: number
  }
}

// â”€â”€â”€ Shift API mapping helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// function parseApiTime(val: unknown): string {
//   if (!val) return '00:00'
//   const s = String(val)
//   if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
//   if (s.includes('T')) {
//     const d = new Date(s)
//     if (!isNaN(d.getTime())) {
//       const h = String(d.getUTCHours()).padStart(2, '0')
//       const m = String(d.getUTCMinutes()).padStart(2, '0')
//       return `${h}:${m}`
//     }
//   }
//   return '00:00'
// }

// function mapApiShift(s: any): Shift {
//   return {
//     id: s.id,
//     code: s.code,
//     name_th: s.name_th,
//     name_en: s.name_en,
//     type: (s.type === 'ot' ? 'overtime' : s.type) as ShiftType,
//     schedule: s.schedule as ShiftSchedule,
//     trip_direction: s.trip_direction ?? 'unknown',
//     default_time: parseApiTime(s.default_time),
//     shift_group_id: s.shift_group_id ?? null,
//     shift_groups: s.shift_groups ?? null,
//     company_plant_id: s.company_plant_id ?? null,
//     is_status: s.is_status,
//     created_by: s.created_by ?? null,
//     created_at: s.created_at,
//     updated_by: s.updated_by ?? null,
//     updated_at: s.updated_at ?? null,
//   }
// }

export const useStore = create<AppState>((set, get) => ({
  // â”€â”€ Initial data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // plants: [],
  // companies: [],
  // companyPlants: [],
  // companyPlantEmployees: [],
  // employees: [],
  // drivers: [],
  // vehicles: [],
  // vehicleTypes: [],
  // zones: [],
  // routes: [],
  // points: [],
  // shiftGroups: [],
  // shifts: [],
  // posts: [],
  // reserves: [],
  // _reserveParams: {} as Record<string, string>,
  // attendances: [],
  // calendarGroups: [],
  // calendars: [],
  // driverVehicles: [],
  // driverVehicleVendors: [],
  // vendors: [],
  // companyVendors: [],
  // plantVendorServices: [],
  // coordinatorTypes: [],
  // coordinators: [],
  // jobLevels: [],
  // orgLevels: [],
  // orgUnits: [],
  // userAccounts: [],
  // authLogs: [],
  // authLogsTotal: 0,
  // comments: [],
  // commentsTotal: 0,
  // roles: [],
  currentCompanyId: '',
  setCurrentCompany: (companyId) => set({ currentCompanyId: companyId }),

selectedCompanyPlantId: '',
setSelectedCompanyPlantId: (id) =>
  set({ selectedCompanyPlantId: id }),

  // bookingPolicies: [],
  // bookingPoliciesTotal: 0,


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

  // loadAuthLogs: async (params = {}) => {
  //   try {
  //     const query = new URLSearchParams()
  //     if (params.result)   query.set('result',    params.result)
  //     if (params.event)    query.set('event',     params.event)
  //     if (params.dateFrom) query.set('date_from', params.dateFrom)
  //     if (params.dateTo)   query.set('date_to',   params.dateTo)
  //     query.set('limit', '100')
  //     query.set('page',  String(params.page ?? 1))

  //     const res  = await apiFetch(`/api/auth-logs?${query}`, { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) {
  //       set({ authLogs: json.data.data ?? [], authLogsTotal: json.data.total ?? 0 })
  //     }
  //   } catch { /* keep current state */ }
  // },

  // ── Comments / Feedback ── ─────────────────────────────────────────────────
  // loadComments: async (params = {}) => {
  //   try {
  //     const query = new URLSearchParams()
  //     if (params.status)   query.set('status',   params.status)
  //     if (params.route_id) query.set('route_id', params.route_id)
  //     query.set('limit', '200')
  //     query.set('page',  String(params.page ?? 1))
  //     const res  = await apiFetch(`/api/comments?${query}`, { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ comments: json.data?.data ?? json.data ?? [], commentsTotal: json.data?.total ?? 0 })
  //   } catch { /* keep current state */ }
  // },



  // addComment: async (data) => {
  //   try {
  //     const res  = await apiFetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ comments: [json.data as FeedbackComment, ...s.comments], commentsTotal: s.commentsTotal + 1 }))
  //     get().addToast('success', 'เพิ่ม Comment สำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateComment: async (id, data) => {
  //   try {
  //     const res  = await apiFetch(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ comments: s.comments.map(c => c.id === id ? { ...c, ...(json.data as FeedbackComment) } : c) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteComment: async (id) => {
  //   try {
  //     const res  = await apiFetch(`/api/comments/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ comments: s.comments.filter(c => c.id !== id), commentsTotal: s.commentsTotal - 1 }))
  //     get().addToast('success', 'ลบ Comment สำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

//   // â”€â”€ Employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//   loadEmployees: async () => {

 
  
//     try {
//       const plantIds = isSuperAdmin() ? [] : getPlantIds()
//       const plantQuery = plantIds.length ? `&company_plant_ids=${plantIds.join(',')}` : ''
//       const res = await apiFetch(`/api/employees?limit=500${plantQuery}`, { headers: authHeader() })
//       const json = await res.json()
//       const raw: any[] = json.data?.data ?? json.data ?? []
      
//       if (json.success && Array.isArray(raw)) {
//         const data: EmployeeFull[] = raw.map((e: any) => ({
//           ...e,
//           transport_defaults: Array.isArray(e.transport_defaults) ? e.transport_defaults : [],
//         }))
//         set({ employees: data })
//       }
//     } catch { /* keep current state */ }
//   },

// addEmployee: async (data) => {
//   try {
//     const cpId =data.company_plant_id ||
//       (isSuperAdmin() ? get().selectedCompanyPlantId : getCompanyPlantId())

//     if (!cpId) {
//       throw new Error('กรุณาเลือกบริษัท/Plant ก่อนเพิ่มพนักงาน')
//     }

//     const cleanedData = {
//       code: data.code,
//       rfid: data.rfid?.trim() || undefined,

//       firstNameTh: data.first_name_th,
//       lastNameTh: data.last_name_th,
//       firstNameEn: data.first_name_en?.trim() || 'NA',
//       lastNameEn: data.last_name_en?.trim() || 'NA',

//       email: data.email?.trim() || undefined,
//       company_plant_id: cpId,
//       organization_unit_id: data.organization_unit_id || undefined,
//       level_id: data.level_id || undefined,
//       transportDefaults: data.transportDefaults ?? [],
//     }

//     const res = await fetch(`${BACKEND_URL}/employees`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         ...authHeader(),
//       },
//       body: JSON.stringify(cleanedData),
//     })

//     const json = await res.json()

//     if (!res.ok) {
//       throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
//     }

//     get().addToast('success', 'เพิ่มพนักงานสำเร็จ')
//     await get().loadEmployees()
//     get().closeModal()
//   } catch (err: any) {
//     get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
//     throw err
//   }
// },

//   updateEmployee: async (id, data) => {
//     try {
//       const res = await apiFetch('/api/employees/' + id, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json', ...authHeader() },
//         body: JSON.stringify(data),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       get().addToast('success', 'อัปเดตข้อมูลพนักงานสำเร็จ')
//       get().closeModal()
//       await get().loadEmployees()
//     } catch (err: any) {
//       get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
//       throw err
//     }
//   },

//   deleteEmployee: async (id) => {
//     try {
//       const emp = get().employees.find(e => e.id === id)
//       const res = await apiFetch('/api/employees/' + id, { method: 'DELETE', headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ employees: s.employees.filter(e => e.id !== id) }))
//       get().addToast('success', 'ลบพนักงานสำเร็จ')
//       get().closeModal()
//     } catch (err: any) {
//       get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
//       throw err
//     }
//   },

//   toggleEmployeeStatus: async (id) => {
//     const emp = get().employees.find(e => e.id === id)
//     const next = emp?.is_status === 'active' ? 'inactive' : 'active'
//     try {
//       const res = await apiFetch('/api/employees/' + id, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json', ...authHeader() },
//         body: JSON.stringify({ is_status: next }),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, is_status: next as Status } : e) }))
//       get().addToast('info', 'เปลี่ยนสถานะพนักงานสำเร็จ')
//     } catch (err: any) {
//       get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด')
//     }
//   },

//   // â”€â”€ Drivers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//   loadDrivers: async () => {
//     try {
//       const res = await apiFetch('/api/drivers?limit=500', { headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error)
//       set({ drivers: json.data?.data ?? json.data ?? [] })
//     } catch (err: any) { get().addToast('error', err.message ?? 'โหลดข้อมูลคนขับไม่สำเร็จ') }
//   },

//   addDriver: async (data) => {
//     try {
//       const res = await apiFetch('/api/drivers', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', ...authHeader() },
//         body: JSON.stringify(data),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       const created = json.data as Driver
//       set(s => ({ drivers: [created, ...s.drivers] }))
//       get().addToast('success', `เพิ่มคนขับ "${created.first_name_th} ${created.last_name_th}" สำเร็จ`)
//       get().closeModal()
//     } catch (err: any) { get().addToast('error', err.message ?? 'เพิ่มคนขับไม่สำเร็จ') }
//   },

// updateDriver: async (id, data) => {
//   try {
//     const payload = {
//       code: data.code,
//       first_name_th: data.first_name_th,
//       last_name_th: data.last_name_th,
//       first_name_en: data.first_name_en || 'NA',
//       last_name_en: data.last_name_en || 'NA',
//       tel: data.tel || null,
//       status:  data.is_status ?? 'active',
//     }

//     const res = await apiFetch(`/api/drivers/${id}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json', ...authHeader() },
//       body: JSON.stringify(payload),
//     })

//     const json = await res.json()
//     console.log('update driver response', json)

//     if (!res.ok || !json.success) {
//       throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
//     }

//     const updated = json.data as Driver

//     set(s => ({
//       drivers: s.drivers.map(d =>
//         d.id === id || d.id === updated.id ? updated : d
//       ),
//     }))

//     get().addToast('success', 'อัปเดตคนขับสำเร็จ')
//     get().closeModal()
//   } catch (err: any) {
//     get().addToast('error', err.message ?? 'อัปเดตคนขับไม่สำเร็จ')
//   }
// },
//  deleteDriver: async (id) => {
//   try {
//     const drv = get().drivers.find(d => d.id === id)

//       const res = await apiFetch('/api/drivers/' + id, { method: 'DELETE', headers: authHeader() })
//     const json = await res.json()
//     console.log('delete driver response', json)

//     if (!res.ok || !json.success) {
//       throw new Error(json.message ?? json.error ?? 'เกิดข้อผิดพลาด')
//     }

//     set(s => ({
//       drivers: s.drivers.map(d =>
//         d.id === id ? { ...d, is_status: 'inactive' as Status } : d
//       ),
//     }))

//     get().addToast('success', `ลบคนขับ "${drv?.first_name_th}" สำเร็จ`)
//     get().closeModal()
//   } catch (err: any) {
//     get().addToast('error', err.message ?? 'ลบคนขับไม่สำเร็จ')
//   }
// },

//   addDriverRouteDefault: async (driver_id, route_id, trip_direction) => {
//     try {
//       const res = await apiFetch(`/api/drivers/${driver_id}/route-defaults`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', ...authHeader() },
//         body: JSON.stringify({ route_id, trip_direction }),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       const rd = json.data
//       set(s => ({
//         drivers: s.drivers.map(d => d.id === driver_id
//           ? { ...d, driver_route_defaults: [...(d.driver_route_defaults ?? []), rd] }
//           : d
//         ),
//       }))
//       get().addToast('success', 'เพิ่ม default สายรถสำเร็จ')
//     } catch (err: any) { get().addToast('error', err.message ?? 'เพิ่ม default สายรถไม่สำเร็จ') }
//   },

//   removeDriverRouteDefault: async (driver_id, rd_id) => {
//     try {
//       const res = await apiFetch(`/api/drivers/${driver_id}/route-defaults?rd_id=${rd_id}`, {
//         method: 'DELETE',
//         headers: authHeader(),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({
//         drivers: s.drivers.map(d => d.id === driver_id
//           ? { ...d, driver_route_defaults: (d.driver_route_defaults ?? []).filter(r => r.id !== rd_id) }
//           : d
//         ),
//       }))
//       get().addToast('success', 'ลบ default สายรถสำเร็จ')
//     } catch (err: any) { get().addToast('error', err.message ?? 'ลบ default สายรถไม่สำเร็จ') }
//   },

//   assignDriverVehicle: async (driver_id, vehicle_id, vendor_id) => {
//     try {
//       // 1. create/update drivers_vehicles record
//       const dvRes = await apiFetch(`/api/drivers/${driver_id}/vehicle`, {
//         method: 'POST',
//         headers: { ...authHeader(), 'Content-Type': 'application/json' },
//         body: JSON.stringify({ vehicle_id }),
//       })
//       const dvJson = await dvRes.json()
//       if (!dvJson.success) throw new Error(dvJson.message ?? 'ไม่สามารถกำหนดรถได้')
//       const driver_vehicle_id = dvJson.data.id

//       // 2. link driver_vehicle to vendor
//       const vdvRes = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles`, {
//         method: 'POST',
//         headers: { ...authHeader(), 'Content-Type': 'application/json' },
//         body: JSON.stringify({ driver_vehicle_id }),
//       })
//       const vdvJson = await vdvRes.json()
//       if (!vdvJson.success) throw new Error(vdvJson.message ?? 'ไม่สามารถผูก Vendor ได้')

//       get().addToast('success', 'กำหนดรถให้คนขับสำเร็จ')
//       get().closeModal()
//       await get().loadDrivers()
//     } catch (err: any) { get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด') }
//   },

//   unassignDriverVehicle: async (driver_id) => {
//     try {
//       const res = await apiFetch(`/api/drivers/${driver_id}/vehicle`, {
//         method: 'DELETE',
//         headers: authHeader(),
//       })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.message ?? 'ถอดรถไม่สำเร็จ')
//       get().addToast('success', 'ถอดรถออกสำเร็จ')
//       await get().loadDrivers()
//     } catch (err: any) { get().addToast('error', err.message ?? 'เกิดข้อผิดพลาด') }
//   },

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  // loadVehicles: async () => {
  //   try {
  //     const res = await apiFetch('/api/vehicles?limit=500&page=1', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ vehicles: json.data.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addVehicle: async (data) => {
  //   try {
  //     if (!isUuid(data.vehicle_type_id)) {
  //       get().addToast('error', 'กรุณาเลือกประเภทยานพาหนะจากข้อมูลจริงก่อนบันทึก')
  //       return
  //     }
  //     const res = await apiFetch('/api/vehicles', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', ...authHeader() },
  //       body: JSON.stringify({ vehicle_type_id: data.vehicle_type_id, code: data.code, province: data.province, license: data.license, capacity: data.capacity ?? null, status: data.is_status ?? 'active' }),
  //     })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vehicles: [json.data as Vehicle, ...s.vehicles] }))
  //     get().addToast('success', `เพิ่มรถ "${(json.data as Vehicle).license}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateVehicle: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/vehicles/${id}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json', ...authHeader() },
  //       body: JSON.stringify({ vehicle_type_id: data.vehicle_type_id, code: data.code, province: data.province, license: data.license, capacity: data.capacity, status: data.is_status }),
  //     })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? json.data as Vehicle : v) }))
  //     get().addToast('success', 'อัปเดตข้อมูลรถสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteVehicle: async (id) => {
  //   const veh = get().vehicles.find(v => v.id === id)
  //   try {
  //     const res = await apiFetch(`/api/vehicles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: 'inactive' }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? json.data as Vehicle : v) }))
  //     get().addToast('success', `ปิดใช้งานรถ "${veh?.license}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // // ── Vehicle Types ─────────────────────────────────────────────────────────────
  // loadVehicleTypes: async () => {
  //   try {
  //     const res = await apiFetch('/api/vehicle-types?limit=200&page=1', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) {
  //       set({ vehicleTypes: (json.data.data ?? []).filter((vt: any) => isUuid(vt.id)).map((vt: any) => ({ ...vt, is_status: vt.is_status ?? 'active', capacity: vt.capacity ?? null })) })
  //     }
  //   } catch { set({ vehicleTypes: [] }) }
  // },

  // addVehicleType: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/vehicle-types', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vehicleTypes: [{ ...json.data, capacity: null }, ...s.vehicleTypes] }))
  //     get().addToast('success', `เพิ่มประเภทยานพาหนะ "${(json.data as VehicleType).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateVehicleType: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/vehicle-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     const updated: VehicleType = { ...json.data, capacity: null }
  //     set(s => ({ vehicleTypes: s.vehicleTypes.map(t => t.id === id ? updated : t), vehicles: s.vehicles.map(v => v.vehicle_type_id === id ? { ...v, vehicle_type: updated } : v) }))
  //     get().addToast('success', 'อัปเดตประเภทยานพาหนะสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteVehicleType: async (id) => {
  //   const vt = get().vehicleTypes.find(t => t.id === id)
  //   try {
  //     const next: Status = vt?.is_status === 'active' ? 'inactive' : 'active'
  //     const res = await apiFetch(`/api/vehicle-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     const updated: VehicleType = { ...json.data, capacity: null }
  //     set(s => ({ vehicleTypes: s.vehicleTypes.map(t => t.id === id ? updated : t), vehicles: s.vehicles.map(v => v.vehicle_type_id === id ? { ...v, vehicle_type: updated } : v) }))
  //     get().addToast('success', `${updated.is_status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ประเภทยานพาหนะ "${vt?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // // ── Shift Groups ──────────────────────────────────────────────────────────────
  // loadShiftGroups: async (companyPlantId) => {
  //   try {
  //     const q = companyPlantId ? `&company_plant_id=${companyPlantId}` : ''
  //     const res = await apiFetch(`/api/shift-groups?limit=200&page=1${q}`, { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ shiftGroups: json.data.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addShiftGroup: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/shift-groups', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', ...authHeader() },
  //       body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, company_plant_id: data.company_plant_id ?? null }),
  //     })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ shiftGroups: [json.data as ShiftGroup, ...s.shiftGroups] }))
  //     get().addToast('success', `เพิ่มกลุ่มกะ "${(json.data as ShiftGroup).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateShiftGroup: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/shift-groups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ shiftGroups: s.shiftGroups.map(g => g.id === id ? json.data as ShiftGroup : g) }))
  //     get().addToast('success', 'อัปเดตกลุ่มกะสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteShiftGroup: async (id) => {
  //   const g = get().shiftGroups.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/shift-groups/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ shiftGroups: s.shiftGroups.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบกลุ่มกะ "${g?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Shifts ────────────────────────────────────────────────────────────────────
//   loadShifts: async (companyPlantId) => {

    
//   try {
//     const cpId =
//       companyPlantId ||
//       (isSuperAdmin() ? get().selectedCompanyPlantId : getCompanyPlantId())

//     const q = cpId ? `&company_plant_id=${cpId}` : ''

//     const res = await apiFetch(`/api/shifts?limit=200&page=1${q}`, {
//       headers: authHeader(),
//     })

//     const json = await res.json()
//     console.log("laod_shift",json);
//     if (json.success) {
//       set({ shifts: (json.data.data ?? []).map(mapApiShift) })
//     }
//   } catch {
//     // keep current state
//   }
// },

//  addShift: async (data) => {
//   console.log("addShift",data);
  
//   try {
//     const cpId =
//       data.company_plant_id ||
//       (isSuperAdmin() ? get().selectedCompanyPlantId : getCompanyPlantId())


//     if (!cpId) {
//       throw new Error('กรุณาเลือกบริษัท/Plant ก่อนเพิ่มกะ')
//     }

//     const payload = {
//       code: data.code,
//       name_th: data.name_th,
//     name_en: data.name_en?.trim() || 'NA',
//       type: data.type,
//       schedule: data.schedule,
//       default_time: data.default_time,
//       shift_group_id: data.shift_group_id,
//       company_plant_id: cpId,
//         status: data.is_status 
//     }

//     const res = await apiFetch('/api/shifts', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', ...authHeader() },
//       body: JSON.stringify(payload),
//     })

//     const json = await res.json()
//     console.log('create shift response', json)

//     if (!res.ok || !json.success) {
//       throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
//     }

//     set(s => ({
//   shifts: [mapApiShift(json.data), ...s.shifts],
// }))
//     get().addToast('success', `เพิ่มกะ "${json.data.name_th}" สำเร็จ`)
//     get().closeModal()
//   } catch (e: any) {
//     get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`)
//   }
// },

//   updateShift: async (id, data) => {
//     try {
//       const body: Record<string, any> = {}
//       if (data.code) body.code = data.code
//       if (data.name_th) body.name_th = data.name_th
//       if (data.name_en) body.name_en = data.name_en
//       if (data.type) body.type = data.type
//       if (data.schedule) body.schedule = data.schedule
//       if (data.trip_direction) body.trip_direction = data.trip_direction
//       if (data.default_time) body.default_time = data.default_time
//       if (data.shift_group_id !== undefined) body.shift_group_id = data.shift_group_id
//       if (data.is_status) body.status = data.is_status
//       const res = await apiFetch(`/api/shifts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(body) })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ shifts: s.shifts.map(sh => sh.id === id ? mapApiShift(json.data) : sh) }))
//       get().addToast('success', 'อัปเดตกะสำเร็จ')
//       get().closeModal()
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   deleteShift: async (id) => {
//     const sh = get().shifts.find(s => s.id === id)
//     try {
//       const res = await apiFetch(`/api/shifts/${id}`, { method: 'DELETE', headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ shifts: s.shifts.filter(x => x.id !== id) }))
//       get().addToast('success', `ลบกะ "${sh?.name_th}" สำเร็จ`)
//       get().closeModal()
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

  // ── Zones ─────────────────────────────────────────────────────────────────────
  // loadZones: async () => {
  //   try {
  //     const res = await apiFetch('/api/zones?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ zones: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addZone: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/zones', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ zones: [json.data as Zone, ...s.zones] }))
  //     get().addToast('success', `เพิ่มโซน "${(json.data as Zone).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateZone: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/zones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...(json.data as Zone) } : z) }))
  //     get().addToast('success', 'อัปเดตโซนสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteZone: async (id) => {
  //   const z = get().zones.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/zones/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ zones: s.zones.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบโซน "${z?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // toggleZoneStatus: async (id) => {
  //   const z = get().zones.find(x => x.id === id)
  //   const next: Status = z?.is_status === 'active' ? 'inactive' : 'active'
  //   try {
  //     const res = await apiFetch(`/api/zones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ zones: s.zones.map(x => x.id === id ? { ...x, is_status: next } : x) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // assignRouteToZone: async (zone_id, route_id) => {
  //   try {
  //     const res = await apiFetch(`/api/zones/${zone_id}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadZones()
  //     get().addToast('success', 'เพิ่มสายรถในโซนสำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // assignRoutesToZone: async (zone_id, route_ids) => {
  //   try {
  //     await Promise.all(route_ids.map(route_id =>
  //       apiFetch(`/api/zones/${zone_id}/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id }) })
  //     ))
  //     await get().loadZones()
  //     get().addToast('success', `เพิ่มสายรถ ${route_ids.length} สายในโซนสำเร็จ`)
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // removeRouteFromZone: async (zone_id, route_id) => {
  //   try {
  //     const res = await apiFetch(`/api/zones/${zone_id}/routes/${route_id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadZones()
  //     get().addToast('success', 'ลบสายรถออกจากโซนสำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Routes ────────────────────────────────────────────────────────────────────
  // loadRoutesPoints: async () => {
  //   try {
  //     const headers = authHeader()
  //     const [rRes, pRes] = await Promise.all([apiFetch('/api/routes?limit=200&page=1', { headers }), apiFetch('/api/points?limit=500&page=1', { headers })])
  //     const [rJson, pJson] = await Promise.all([rRes.json(), pRes.json()])
  //     if (rJson.success) set({ routes: rJson.data.data ?? [] })
  //     if (pJson.success) set({ points: (pJson.data.data ?? []).map(normalizePoint) })
  //   } catch { /* keep current state */ }
  // },

  // addRoute: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/routes', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, trip_direction: data.trip_direction ?? 'unknown', status: data.is_status ?? 'active' }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ routes: [json.data as Route, ...s.routes] }))
  //     get().addToast('success', `เพิ่มเส้นทาง "${(json.data as Route).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateRoute: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/routes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, trip_direction: data.trip_direction, status: data.is_status }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ routes: s.routes.map(r => r.id === id ? { ...r, ...(json.data as Route) } : r) }))
  //     get().addToast('success', 'อัปเดตเส้นทางสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteRoute: async (id) => {
  //   const route = get().routes.find(r => r.id === id)
  //   try {
  //     const res = await apiFetch(`/api/routes/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ routes: s.routes.filter(r => r.id !== id) }))
  //     get().addToast('success', `ลบเส้นทาง "${route?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // toggleRouteStatus: async (id) => {
  //   const route = get().routes.find(r => r.id === id)
  //   const next: Status = route?.is_status === 'active' ? 'inactive' : 'active'
  //   try {
  //     const res = await apiFetch(`/api/routes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ routes: s.routes.map(r => r.id === id ? { ...r, is_status: next } : r) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // // ── Points ────────────────────────────────────────────────────────────────────
  // addPoint: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/points', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ route_id: data.route_id, code: data.code, name_th: data.name_th, name_en: data.name_en, latitude: data.latitude ?? 13.7563, longitude: data.longitude ?? 100.5018, queue_default: data.queue_default ?? null, status: data.is_status ?? 'active' }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     const point = normalizePoint(json.data)
  //     set(s => ({ points: [...s.points, point], routes: s.routes.map(r => r.id === point.route_id ? { ...r, points: [...(r.points ?? []), point] } : r) }))
  //     get().addToast('success', `เพิ่มจุดจอด "${point.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updatePoint: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/points/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en, latitude: data.latitude, longitude: data.longitude, queue_default: data.queue_default, status: data.is_status }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ points: s.points.map(p => p.id === id ? normalizePoint({ ...p, ...json.data }) : p) }))
  //     get().addToast('success', 'อัปเดตจุดจอดสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deletePoint: async (id) => {
  //   const pt = get().points.find(p => p.id === id)
  //   try {
  //     const res = await apiFetch(`/api/points/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ points: s.points.filter(p => p.id !== id) }))
  //     get().addToast('success', `ลบจุดจอด "${pt?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Reserves ─────────────────────────────────────────────────────────────────
  // loadReserves: async (params) => {
  //   try {
  //     // Persist params so paramless calls (e.g. after booking) reuse same filter
  //     const saved = get()._reserveParams as any
  //     const p = params ?? saved
  //     if (params) set({ _reserveParams: params as any })
  //     const query = new URLSearchParams()
  //     query.set('per_page', String(p?.per_page ?? 200))
  //     query.set('page',     String(p?.page     ?? 1))
  //     if (p?.date_from)   query.set('date_from',   p.date_from)
  //     if (p?.date_to)     query.set('date_to',     p.date_to)
  //     if (p?.shift_id)    query.set('shift_id',    p.shift_id)
  //     if (p?.is_state)    query.set('is_state',    p.is_state)
  //     if (p?.employee_id) query.set('employee_id', p.employee_id)
  //     const res  = await apiFetch(`/api/reserves?${query}`)
  //     const json = await res.json()
  //     if (json.success) {
  //       const list = (json.data?.data ?? json.data ?? []) as any[]
  //       set({ reserves: list.map(normalizeReserve) })
  //     }
  //   } catch { /* keep current state */ }
  // },

  // addReserve: async (data) => {
  //   try {
  //     const body = {
  //       employee_id: data.employee_id,
  //       shift_id:    data.shift_id,
  //       point_id:    data.point_id,
  //       travel_date: data.travel_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  //       remark:      data.remark ?? undefined,
  //     }
  //     const res  = await apiFetch('/api/reserves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     const created = normalizeReserve(json.data)
  //     set(s => ({ reserves: [created, ...s.reserves] }))
  //     get().addToast('success', `จองรถสำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `จองรถไม่สำเร็จ: ${e.message}`) }
  // },

  // bulkAddReserves: async (params) => {
  //   const employees = useEmployeeStore.getState().employees
  //    const shifts = useShiftStore.getState().shifts
  //   const {  reserves } = get()
  //   let created = 0, updated = 0, skipped = 0, blocked = 0
  //   const calls: Promise<void>[] = []

  //   for (const employee_id of params.employee_ids) {
  //     const emp = employees.find(e => e.id === employee_id)
  //     if (!emp) { skipped += params.legs.length * params.travel_dates.length; continue }

  //     for (const date of params.travel_dates) {
  //       for (const leg of params.legs) {
  //         const dir = shifts.find(s => s.id === leg.shift_id)?.trip_direction ?? 'inbound'

  //         let point_id: string | undefined
  //         if (leg.point_mode === 'default') {
  //           point_id = emp.transport_defaults?.find(td => td.trip_direction === dir)?.point_id ?? undefined
  //         } else {
  //           point_id = leg.override_point_id
  //         }
  //         if (!point_id) { skipped++; continue }

  //         // Check for existing active reserve: same employee + working_date + direction
  //         const existing = reserves.find(r =>
  //           r.employee_id === employee_id &&
  //           (r.working_date ?? r.travel_date)?.slice(0, 10) === date &&
  //           r.shift?.trip_direction === dir &&
  //           r.is_state !== 'canceled' &&
  //           r.is_state !== 'finished',
  //         )

  //         if (existing) {
  //           // Update existing reserve's shift and point
  //           calls.push(
  //             apiFetch(`/api/reserves/${existing.id}`, {
  //               method: 'PATCH',
  //               headers: { 'Content-Type': 'application/json' },
  //               body: JSON.stringify({ shift_id: leg.shift_id, point_id }),
  //             }).then(async res => {
  //               const json = await res.json()
  //               json.success ? updated++ : blocked++
  //             }).catch(() => { blocked++ }),
  //           )
  //         } else {
  //           // Create new reserve
  //           calls.push(
  //             apiFetch('/api/reserves', {
  //               method: 'POST',
  //               headers: { 'Content-Type': 'application/json' },
  //               body: JSON.stringify({ employee_id, shift_id: leg.shift_id, point_id, travel_date: date, remark: params.remark }),
  //             }).then(async res => {
  //               const json = await res.json()
  //               json.success ? created++ : blocked++
  //             }).catch(() => { blocked++ }),
  //           )
  //         }
  //       }
  //     }
  //   }

  //   await Promise.all(calls)
  //   await get().loadReserves()

  //   const total = created + updated
  //   const parts: string[] = []
  //   if (created > 0) parts.push(`สร้างใหม่ ${created} รายการ`)
  //   if (updated > 0) parts.push(`อัปเดต ${updated} รายการ`)
  //   if (blocked > 0) parts.push(`ไม่สำเร็จ ${blocked} รายการ`)
  //   if (skipped > 0) parts.push(`ข้าม ${skipped} รายการ`)
  //   get().addToast(total > 0 ? 'success' : 'error', parts.join(' · ') || 'ไม่มีรายการที่ดำเนินการได้')
  //   get().closeModal()
  //   return { created, updated, skipped, blocked }
  // },

  // updateReserveState: async (id, state) => {
  //   try {
  //     const res  = await apiFetch(`/api/reserves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     const updated = normalizeReserve(json.data)
  //     set(s => ({ reserves: s.reserves.map(r => r.id === id ? updated : r) }))
  //     get().addToast('success', 'เปลี่ยนสถานะสำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteReserve: async (id) => {
  //   try {
  //     const res  = await apiFetch(`/api/reserves/${id}`, { method: 'DELETE' })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ reserves: s.reserves.map(r => r.id === id ? { ...r, is_state: 'canceled' as ReserveStatus } : r) }))
  //     get().addToast('success', 'ยกเลิกรายการจองสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // bulkApprove: async (ids) => {
  //   try {
  //     await Promise.all(ids.map(id =>
  //       apiFetch(`/api/reserves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: 'approved' }) })
  //     ))
  //     set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) && r.is_state === 'waiting' ? { ...r, is_state: 'approved' as ReserveStatus } : r) }))
  //     get().addToast('success', `อนุมัติ ${ids.length} รายการสำเร็จ`)
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // bulkCancelReserves: async (ids) => {
  //   try {
  //     await Promise.all(ids.map(id =>
  //       apiFetch(`/api/reserves/${id}`, { method: 'DELETE' })
  //     ))
  //     set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) ? { ...r, is_state: 'canceled' as ReserveStatus } : r) }))
  //     get().addToast('success', `ยกเลิก ${ids.length} รายการสำเร็จ`)
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // bulkEditReserveShift: (ids, shift_id) => {
  //    const shiftStore = useShiftStore.getState().shifts
    

  //   const shift = shiftStore.find(s => s.id === shift_id)
  //   if (!shift) return
  //   set(s => ({ reserves: s.reserves.map(r => ids.includes(r.id) ? { ...r, shift_id, shift } : r) }))
  //   get().addToast('success', `เปลี่ยนกะเป็น "${shift.name_th}" สำหรับ ${ids.length} รายการสำเร็จ`)
  //   get().closeModal()
  // },

  // ── Booking Policies ──────────────────────────────────────────────────────────
  // loadBookingPolicies: async (params) => {
  //   try {
  //     const query = new URLSearchParams()
  //     if (params?.status) query.set('status', params.status)
  //     if (params?.page)   query.set('page', String(params.page))
  //     query.set('limit', '100')
  //     const res  = await apiFetch(`/api/booking-policies?${query}`)
  //     const json = await res.json()
  //     if (json.success) set({ bookingPolicies: json.data?.data ?? json.data ?? [], bookingPoliciesTotal: json.data?.total ?? 0 })
  //   } catch { /* keep current state */ }
  // },

  // addBookingPolicy: async (data) => {
  //   try {
  //     const res  = await apiFetch('/api/booking-policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ bookingPolicies: [json.data as BookingPolicy, ...s.bookingPolicies], bookingPoliciesTotal: s.bookingPoliciesTotal + 1 }))
  //     get().addToast('success', `เพิ่มนโยบาย "${data.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateBookingPolicy: async (id, data) => {
  //   try {
  //     const res  = await apiFetch(`/api/booking-policies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ bookingPolicies: s.bookingPolicies.map(p => p.id === id ? { ...p, ...(json.data as BookingPolicy) } : p) }))
  //     get().addToast('success', 'อัปเดตนโยบายสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteBookingPolicy: async (id) => {
  //   try {
  //     const pol  = get().bookingPolicies.find(p => p.id === id)
  //     const res  = await apiFetch(`/api/booking-policies/${id}`, { method: 'DELETE' })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ bookingPolicies: s.bookingPolicies.filter(p => p.id !== id), bookingPoliciesTotal: s.bookingPoliciesTotal - 1 }))
  //     get().addToast('success', `ลบนโยบาย "${pol?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Posts (mock) ──────────────────────────────────────────────────────────────
  // addPost: (data) => {
  //   const state = get()
  //   const { driverVehicleVendors } = useDriverStore.getState()
  //   const routes = useRoutePointStore.getState().routes
  //   const shiftStore = useShiftStore.getState().shifts
  //   const route = routes.find(r => r.id === data.route_id)
  //   const shift = shiftStore.find(s => s.id === data.shift_id)
  //   const dvv = driverVehicleVendors.find(d => d.id === data.driver_vehicle_vendor_id)
  //   const post: Post = { id: genId(), code: data.code ?? `POST-${Date.now()}`, route_id: data.route_id ?? '', route, shift_id: data.shift_id ?? '', shift, driver_vehicle_vendor_id: data.driver_vehicle_vendor_id ?? '', driver_vehicle_vendor: dvv, is_status: 'active', created_by: 'admin', created_at: nowISO(), updated_by: null, updated_at: null }
  //   set(s => ({ posts: [post, ...s.posts] }))
  //   get().addToast('success', `เพิ่ม Post "${post.code}" สำเร็จ`)
  //   get().closeModal()
  // },

  // updatePost: (id, data) => {
  //   set(s => ({ posts: s.posts.map(p => p.id === id ? { ...p, ...data } : p) }))
  //   get().addToast('success', 'อัปเดต Post สำเร็จ')
  //   get().closeModal()
  // },

  // deletePost: (id) => {
  //   const post = get().posts.find(p => p.id === id)
  //   set(s => ({ posts: s.posts.filter(p => p.id !== id) }))
  //   get().addToast('success', `ลบ Post "${post?.code}" สำเร็จ`)
  //   get().closeModal()
  // },

  // ── Calendar ──────────────────────────────────────────────────────────────────
  // loadCalendarGroups: async () => {
  //   try {
  //     const res = await apiFetch('/api/calendar-groups?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ calendarGroups: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // loadCalendars: async () => {
  //   try {
  //     const res = await apiFetch('/api/calendars?limit=500', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ calendars: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addCalendarGroup: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/calendar-groups', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ calendarGroups: [...s.calendarGroups, json.data as CalendarGroup] }))
  //     get().addToast('success', `สร้างปฏิทิน "${(json.data as CalendarGroup).name}" สำเร็จ`)
  //     return json.data as CalendarGroup
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`); return null }
  // },

  // updateCalendarGroup: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/calendar-groups/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ calendarGroups: s.calendarGroups.map(g => g.id === id ? json.data as CalendarGroup : g) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteCalendarGroup: async (id) => {
  //   const grp = get().calendarGroups.find(g => g.id === id)
  //   try {
  //     const res = await apiFetch(`/api/calendar-groups/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ calendarGroups: s.calendarGroups.filter(g => g.id !== id), calendars: s.calendars.filter(c => c.calendar_group_id !== id) }))
  //     get().addToast('success', `ลบปฏิทิน "${grp?.name}" สำเร็จ`)
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // addCalendar: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/calendars', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ calendars: [...s.calendars, json.data as Calendar].sort((a, b) => a.date_at.localeCompare(b.date_at)) }))
  //     get().addToast('success', `เพิ่มวันหยุด ${(json.data as Calendar).date_at} สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteCalendar: async (id) => {
  //   const cal = get().calendars.find(c => c.id === id)
  //   try {
  //     const res = await apiFetch(`/api/calendars/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ calendars: s.calendars.filter(c => c.id !== id) }))
  //     get().addToast('success', `ลบ ${cal?.date_at} ออกจากปฏิทินสำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // // ── Plants ────────────────────────────────────────────────────────────────────
  // loadPlants: async () => {
  //   try {
  //     const res = await apiFetch('/api/plants?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ plants: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addPlant: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/plants', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ plants: [json.data as Plant, ...s.plants] }))

  //   await get().loadPlants?.()
  //    await useCompanyStore.getState().loadCompanies()
  

  //     get().addToast('success', `เพิ่มโรงงาน "${(json.data as Plant).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updatePlant: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/plants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ plants: s.plants.map(p => p.id === id ? { ...p, ...(json.data as Plant) } : p) }))
  //     get().addToast('success', 'อัปเดตโรงงานสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deletePlant: async (id) => {
  //   const p = get().plants.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/plants/${id}`, { method: 'DELETE', headers: authHeader() })
  //     console.log("res",res);
      
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ plants: s.plants.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบโรงงาน "${p?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // togglePlantStatus: async (id) => {
  //   const p = get().plants.find(x => x.id === id)
  //   const next: Status = p?.is_status === 'active' ? 'inactive' : 'active'
  //   try {
  //     const res = await apiFetch(`/api/plants/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ plants: s.plants.map(x => x.id === id ? { ...x, is_status: next } : x) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

//   // ── Companies ─────────────────────────────────────────────────────────────────
//   loadCompanies: async () => {

   
    
//     try {
//       const res = await apiFetch('/api/companies?limit=200', { headers: authHeader() })
//       const json = await res.json()
      
//       if (json.success) {
//         const raw = json.data?.data ?? json.data ?? []
//         set({
//           companies: raw,
//           companyPlants: raw.flatMap((c: any) => c.companys_plants ?? []),
//           companyPlantEmployees: raw.flatMap((c: any) => (c.companys_plants ?? []).flatMap((cp: any) => cp.companys_plants_employees ?? [])),
//         })
//       }
//     } catch { /* keep current state */ }

  
    
//   },

// addCompany: async (data) => {
//   try {
//     const payload = {
//       code: data.code?.trim(),
//       company_type: data.company_type,
//       name_th: data.name_th?.trim(),
//       name_en: data.name_en?.trim() || 'NA',
//       address: data.address?.trim() || null,
//       is_status: data.is_status ?? 'active',
//     }

//     console.log('company payload', payload)

//     if (!payload.code) throw new Error('กรุณากรอกรหัสบริษัท')
//     if (!payload.name_th) throw new Error('กรุณากรอกชื่อบริษัทภาษาไทย')
//     if (!payload.company_type) throw new Error('กรุณาเลือกประเภทบริษัท')

//     const res = await apiFetch('/api/companies', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', ...authHeader() },
//       body: JSON.stringify(payload),
//     })

//     const json = await res.json()
//     console.log('create company response', json)

//     if (!res.ok || !json.success) {
//       throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
//     }

//     set(s => ({ companies: [json.data as Company, ...s.companies] }))
//     get().addToast('success', `เพิ่มบริษัท "${(json.data as Company).name_th}" สำเร็จ`)
//     get().closeModal()
//   } catch (e: any) {
//     get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`)
//   }
// },

//   updateCompany: async (id, data) => {
//     try {
//       const res = await apiFetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ companies: s.companies.map(c => c.id === id ? { ...c, ...(json.data as Company) } : c) }))
//       get().addToast('success', 'อัปเดตบริษัทสำเร็จ')
//       get().closeModal()
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   deleteCompany: async (id) => {
//     const c = get().companies.find(x => x.id === id)
//     try {
//       const res = await apiFetch(`/api/companies/${id}`, { method: 'DELETE', headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ companies: s.companies.filter(x => x.id !== id) }))
//       get().addToast('success', `ลบบริษัท "${c?.name_th}" สำเร็จ`)
//       get().closeModal()
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   toggleCompanyStatus: async (id) => {
//     const c = get().companies.find(x => x.id === id)
//     const next: Status = c?.is_status === 'active' ? 'inactive' : 'active'
//     try {
//       const res = await apiFetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       set(s => ({ companies: s.companies.map(x => x.id === id ? { ...x, is_status: next } : x) }))
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   addCompanyPlant: async (company_id, plant_id) => {
//     try {
//       const res = await apiFetch(`/api/companies/${company_id}/plants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ plant_id }) })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       await get().loadCompanies()
//       get().addToast('success', 'เพิ่มโรงงานในบริษัทสำเร็จ')
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   removeCompanyPlant: async (company_id, plant_id) => {
//     try {
//       const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}`, { method: 'DELETE', headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       await get().loadCompanies()
//       get().addToast('success', 'ลบโรงงานออกจากบริษัทสำเร็จ')
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   addCompanyPlantEmployee: async (company_id, plant_id, employee_id) => {
//     try {
//       const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ employee_id }) })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       await get().loadCompanies()
//       get().addToast('success', 'เพิ่มพนักงานในบริษัทสำเร็จ')
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

//   removeCompanyPlantEmployee: async (company_id, plant_id, employee_id) => {
//     try {
//       const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}/employees/${employee_id}`, { method: 'DELETE', headers: authHeader() })
//       const json = await res.json()
//       if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
//       await get().loadCompanies()
//       get().addToast('success', 'ลบพนักงานออกจากบริษัทสำเร็จ')
//     } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
//   },

  // ── Vendors ───────────────────────────────────────────────────────────────────
  // loadVendors: async () => {
  //   try {
  //     const res = await apiFetch('/api/vendors?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) {
  //       const raw: any[] = json.data?.data ?? json.data ?? []
  //       set({
  //         vendors: raw,
  //         companyVendors: raw.flatMap(v => v.companys_vendors ?? []),
  //         plantVendorServices: raw.flatMap(v => v.plants_vendors_services ?? []),
  //       })
  //     }
  //   } catch { /* keep current state */ }
  // },

  // addVendor: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vendors: [json.data as Vendor, ...s.vendors] }))
  //     get().addToast('success', `เพิ่ม Vendor "${(json.data as Vendor).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateVendor: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, ...(json.data as Vendor) } : v) }))
  //     get().addToast('success', 'อัปเดต Vendor สำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteVendor: async (id) => {
  //   const v = get().vendors.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/vendors/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ vendors: s.vendors.map(x => x.id === id ? { ...x, is_status: 'inactive' as Status } : x) }))
  //     get().addToast('success', `ลบ Vendor "${v?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // assignVendorCompany: async (vendor_id, company_id) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/companies`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ company_id }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'กำหนดบริษัทให้ Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // removeVendorCompany: async (vendor_id) => {
  //   try {
  //     const cv = get().companyVendors.find(x => x.vendor_id === vendor_id)
  //     if (!cv) return
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/companies/${cv.company_id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'ถอดบริษัทออกจาก Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // addVendorPlant: async (vendor_id, plant_id) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/plants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ plant_id }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'เพิ่มโรงงานให้ Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // removeVendorPlant: async (vendor_id, plant_id) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/plants/${plant_id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'ลบโรงงานออกจาก Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // assignVendorDriverVehicle: async (vendor_id, driver_vehicle_id) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ driver_vehicle_id }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'กำหนดรถให้ Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // removeVendorDriverVehicle: async (vendor_id, driver_vehicle_id) => {
  //   try {
  //     const res = await apiFetch(`/api/vendors/${vendor_id}/driver-vehicles/${driver_vehicle_id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     await get().loadVendors()
  //     get().addToast('success', 'ถอดรถออกจาก Vendor สำเร็จ')
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Coordinators ──────────────────────────────────────────────────────────────
  // loadCoordinators: async () => {
  //   try {
  //     const [ctRes, cRes] = await Promise.all([apiFetch('/api/coordinator-types?limit=200', { headers: authHeader() }), apiFetch('/api/coordinators?limit=200', { headers: authHeader() })])
  //     const [ctJson, cJson] = await Promise.all([ctRes.json(), cRes.json()])
  //     if (ctJson.success) set({ coordinatorTypes: ctJson.data?.data ?? ctJson.data ?? [] })
  //     if (cJson.success) set({ coordinators: cJson.data?.data ?? cJson.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addCoordinatorType: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/coordinator-types', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinatorTypes: [json.data as CoordinatorType, ...s.coordinatorTypes] }))
  //     get().addToast('success', `เพิ่มประเภทผู้ประสานงาน "${(json.data as CoordinatorType).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateCoordinatorType: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/coordinator-types/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinatorTypes: s.coordinatorTypes.map(t => t.id === id ? json.data as CoordinatorType : t) }))
  //     get().addToast('success', 'อัปเดตประเภทผู้ประสานงานสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteCoordinatorType: async (id) => {
  //   const ct = get().coordinatorTypes.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/coordinator-types/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinatorTypes: s.coordinatorTypes.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบประเภทผู้ประสานงาน "${ct?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // addCoordinator: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/coordinators', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinators: [json.data as Coordinator, ...s.coordinators] }))
  //     get().addToast('success', `เพิ่มผู้ประสานงาน "${(json.data as Coordinator).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateCoordinator: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/coordinators/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinators: s.coordinators.map(c => c.id === id ? { ...c, ...(json.data as Coordinator) } : c) }))
  //     get().addToast('success', 'อัปเดตผู้ประสานงานสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteCoordinator: async (id) => {
  //   const c = get().coordinators.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/coordinators/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinators: s.coordinators.map(x => x.id === id ? { ...x, is_status: 'inactive' as Status } : x) }))
  //     get().addToast('success', `ลบผู้ประสานงาน "${c?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // toggleCoordinatorStatus: async (id) => {
  //   const c = get().coordinators.find(x => x.id === id)
  //   const next: Status = c?.is_status === 'active' ? 'inactive' : 'active'
  //   try {
  //     const res = await apiFetch(`/api/coordinators/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ coordinators: s.coordinators.map(x => x.id === id ? { ...x, is_status: next } : x) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Job Levels ────────────────────────────────────────────────────────────────
  // loadJobLevels: async () => {
  //   try {
  //     const res = await apiFetch('/api/levels?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ jobLevels: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addJobLevel: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/levels', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ jobLevels: [json.data as JobLevel, ...s.jobLevels] }))
  //     get().addToast('success', `เพิ่มระดับ "${(json.data as JobLevel).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateJobLevel: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/levels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ code: data.code, name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ jobLevels: s.jobLevels.map(l => l.id === id ? { ...l, ...(json.data as JobLevel) } : l) }))
  //     get().addToast('success', 'อัปเดตระดับสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteJobLevel: async (id) => {
  //   const l = get().jobLevels.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/levels/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ jobLevels: s.jobLevels.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบระดับ "${l?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Organization ──────────────────────────────────────────────────────────────
  // loadOrganization: async () => {
  //   try {
  //     const [olRes, ouRes] = await Promise.all([apiFetch('/api/organization-levels?limit=200', { headers: authHeader() }), apiFetch('/api/organization-units?limit=500', { headers: authHeader() })])
  //     const [olJson, ouJson] = await Promise.all([olRes.json(), ouRes.json()])
  //     if (olJson.success) set({ orgLevels: olJson.data?.data ?? olJson.data ?? [] })
  //     if (ouJson.success) set({ orgUnits: ouJson.data?.data ?? ouJson.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addOrgLevel: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/organization-levels', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgLevels: [json.data as OrganizationLevel, ...s.orgLevels] }))
  //     get().addToast('success', `เพิ่มระดับองค์กร "${(json.data as OrganizationLevel).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateOrgLevel: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/organization-levels/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgLevels: s.orgLevels.map(l => l.id === id ? { ...l, ...(json.data as OrganizationLevel) } : l) }))
  //     get().addToast('success', 'อัปเดตระดับองค์กรสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteOrgLevel: async (id) => {
  //   const l = get().orgLevels.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/organization-levels/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgLevels: s.orgLevels.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบระดับองค์กร "${l?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // addOrgUnit: async (data) => {

  //   console.log("org_unit",data);
    
  //   try {


  //         const payload = {
  //     company_plant_id: data.company_plant_id,
  //     level_id: data.organization_level_id,
  //     parent_id: data.parent_id || undefined,
  //     code: data.code?.trim(),
  //     name_th: data.name_th?.trim(),
  //     name_en: data.name_en?.trim() || 'NA',
  //     is_status: data.is_status ?? 'active',
  //   }

  //   console.log('org_unit payload', payload)
  //     const res = await apiFetch('/api/organization-units', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgUnits: [json.data as OrganizationUnit, ...s.orgUnits] }))
  //     get().addToast('success', `เพิ่มหน่วยงาน "${(json.data as OrganizationUnit).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateOrgUnit: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/organization-units/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgUnits: s.orgUnits.map(u => u.id === id ? { ...u, ...(json.data as OrganizationUnit) } : u) }))
  //     get().addToast('success', 'อัปเดตหน่วยงานสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteOrgUnit: async (id) => {
  //   const u = get().orgUnits.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/organization-units/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ orgUnits: s.orgUnits.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบหน่วยงาน "${u?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── User Accounts ─────────────────────────────────────────────────────────────
  // loadUserAccounts: async () => {
  //   try {
  //     const plantIds = isSuperAdmin() ? [] : getPlantIds()
  //     const plantQuery = plantIds.length ? `&company_plant_ids=${plantIds.join(',')}` : ''
  //     const res = await apiFetch(`/api/users?limit=500${plantQuery}`, { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ userAccounts: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addUserAccount: async (data: any) => {
  //   const roleStore = useRoleStore.getState().roles
  //   try {
  //     const isDriver = data.account_type === 'driver'
  //     const endpoint = isDriver ? '/api/users/driver' : '/api/users/employee'
  //     const roleId = data.role ? roleStore.find(r => r.type === data.role)?.id : undefined
  //     const payload = isDriver
  //       ? { driverId: data.driver_id, username: data.username, password: data.password ?? '123456789' }
  //       : { employeeId: data.employee_id, username: data.username, password: data.password ?? '123456789', roleIds: roleId ? [roleId] : undefined }
  //     const res = await apiFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(payload) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ userAccounts: [json.data as UserAccount, ...s.userAccounts] }))
  //     get().addToast('success', `สร้าง Account "${(json.data as UserAccount).username}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // bulkAddUserAccounts: async ({ account_type, ids, role, company_id, username_pattern, custom_prefix, email_domain }) => {
  //   const roleStore = useRoleStore.getState().roles
  //   const {   userAccounts } = get()
  //   const employees = useEmployeeStore.getState().employees
  //       const drivers = useDriverStore.getState().drivers
    
  //   const roleId = role ? roleStore.find(r => r.type === role)?.id : undefined
  //   const existingEmpIds = new Set(userAccounts.map(u => u.employee_id).filter(Boolean))
  //   const existingDrvIds = new Set(userAccounts.map(u => u.driver_id).filter(Boolean))

  //   if (account_type === 'employee') {
  //     const seenUsernames = new Set<string>()
  //     const items = ids
  //       .filter(id => !existingEmpIds.has(id))
  //       .map(id => {
  //         const emp = employees.find(e => e.id === id)
  //         if (!emp) return null
  //         const safeFirstEn = (emp.first_name_en || '').toLowerCase()
  //         const safeLastEn = (emp.last_name_en || '').toLowerCase()
  //         const base = username_pattern === 'code'
  //           ? emp.code.toLowerCase()
  //           : username_pattern === 'firstname'
  //             ? (safeFirstEn && safeLastEn)
  //               ? `${safeFirstEn}.${safeLastEn.charAt(0)}`
  //               : emp.code.toLowerCase()
  //             : `${custom_prefix ?? 'user'}.${emp.code.toLowerCase()}`
  //         if (seenUsernames.has(base)) return null
  //         seenUsernames.add(base)
  //         return { employeeId: emp.id, username: base, password: '123456789', roleIds: roleId ? [roleId] : undefined, language: 'th' }
  //       })
  //       .filter(Boolean)

  //     const skipped = ids.length - items.length
  //     const res = await apiFetch('/api/users/bulk-employees', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', ...authHeader() },
  //       body: JSON.stringify({ items }),
  //     })
  //     const json = await res.json()
  //     const result = json.data ?? { created: 0, skippedHasAccount: 0, skippedUsernameTaken: 0, skippedNotFound: 0, failed: 0 }
  //     const frontendSkipped = ids.length - items.length
  //     const parts: string[] = []
  //     if ((result.skippedHasAccount ?? 0) > 0) parts.push(`มี Account แล้ว ${result.skippedHasAccount} คน`)
  //     if ((result.skippedUsernameTaken ?? 0) > 0) parts.push(`Username ซ้ำ ${result.skippedUsernameTaken} คน`)
  //     if ((result.skippedNotFound ?? 0) > 0) parts.push(`ไม่พบข้อมูล ${result.skippedNotFound} คน`)
  //     if (frontendSkipped > 0) parts.push(`ข้ามซ้ำ ${frontendSkipped} คน`)
  //     if ((result.failed ?? 0) > 0) parts.push(`ผิดพลาด ${result.failed} คน`)
  //     const skipDetail = parts.length > 0 ? ` (${parts.join(', ')})` : ''
  //     get().addToast('success', `สร้าง ${result.created} Account สำเร็จ${skipDetail}`)
  //     await get().loadUserAccounts()
  //   } else {
  //     // driver: still sequential (usually small batch)
  //     let created = 0, skipped = 0
  //     for (const id of ids) {
  //       try {
  //         if (existingDrvIds.has(id)) { skipped++; continue }
  //         const drv = drivers.find(d => d.id === id)
  //         if (!drv) { skipped++; continue }
  //         const firstName = drv.first_name_en?.toLowerCase() || drv.code.toLowerCase()
  //         const lastName = drv.last_name_en?.toLowerCase() || ''
  //         const base = username_pattern === 'code' ? drv.code.toLowerCase() : username_pattern === 'firstname' ? (lastName ? `${firstName}.${lastName.charAt(0)}` : firstName) : `${custom_prefix ?? 'drv'}.${drv.code.toLowerCase()}`
  //         const res = await apiFetch('/api/users/driver', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ driverId: drv.id, username: base, password: '123456789' }) })
  //         const json = await res.json()
  //         if (!json.success) { skipped++; continue }
  //         set(s => ({ userAccounts: [json.data as UserAccount, ...s.userAccounts] }))
  //         existingDrvIds.add(id)
  //         created++
  //       } catch { skipped++ }
  //     }
  //     get().addToast('success', `สร้าง ${created} Account สำเร็จ${skipped > 0 ? ` (ข้าม ${skipped} รายการ)` : ''}`)
  //   }

  //   get().closeModal()
  //   return { created: 0, skipped: 0 }
  // },

  // updateUserAccount: async (id, data: any) => {
  //   try {
  //     const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, ...(json.data as UserAccount) } : a) }))
  //     get().addToast('success', 'อัปเดต Account สำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteUserAccount: async (id) => {
  //   const ua = get().userAccounts.find(a => a.id === id)
  //   try {
  //     const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, is_status: 'inactive' as Status } : a) }))
  //     get().addToast('success', `ปิดใช้งาน Account "${ua?.username}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // resetUserPassword: async (id, newPassword) => {
  //   try {
  //     const res = await apiFetch(`/api/users/${id}/reset-password`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json', ...authHeader() },
  //       body: JSON.stringify({ newPassword }),
  //     })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     get().addToast('success', 'รีเซ็ตรหัสผ่านสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // toggleUserAccountStatus: async (id) => {
  //   const ua = get().userAccounts.find(a => a.id === id)
  //   const next: Status = ua?.is_status === 'active' ? 'inactive' : 'active'
  //   try {
  //     const res = await apiFetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ userAccounts: s.userAccounts.map(a => a.id === id ? { ...a, is_status: next } : a) }))
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // ── Roles ─────────────────────────────────────────────────────────────────────
  // loadRoles: async () => {
  //   try {
  //     const res = await apiFetch('/api/roles?limit=200', { headers: authHeader() })
  //     const json = await res.json()
  //     if (json.success) set({ roles: json.data?.data ?? json.data ?? [] })
  //   } catch { /* keep current state */ }
  // },

  // addRole: async (data) => {
  //   try {
  //     const res = await apiFetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en, type: (data as any).type }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ roles: [json.data as Role, ...s.roles] }))
  //     get().addToast('success', `เพิ่มบทบาท "${(json.data as Role).name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // updateRole: async (id, data) => {
  //   try {
  //     const res = await apiFetch(`/api/roles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ name_th: data.name_th, name_en: data.name_en }) })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ roles: s.roles.map(r => r.id === id ? { ...r, ...(json.data as Role) } : r) }))
  //     get().addToast('success', 'อัปเดตบทบาทสำเร็จ')
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

  // deleteRole: async (id) => {
  //   const r = get().roles.find(x => x.id === id)
  //   try {
  //     const res = await apiFetch(`/api/roles/${id}`, { method: 'DELETE', headers: authHeader() })
  //     const json = await res.json()
  //     if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
  //     set(s => ({ roles: s.roles.filter(x => x.id !== id) }))
  //     get().addToast('success', `ลบบทบาท "${r?.name_th}" สำเร็จ`)
  //     get().closeModal()
  //   } catch (e: any) { get().addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
  // },

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
    const vehicles = useVehiclesStore.getState().vehicles
    const routes = useRoutePointStore.getState().routes
         const attendances = useAttendanceStore.getState().attendances
    const s = get()
    const activeEmployees = employees.filter(e => e.is_status === 'active').length
    const todayReserves = reserves.length
    const todayAttended = attendances.length
    const waitingReserves = reserves.filter(r => r.is_state === 'waiting').length
    const activeVehicles = vehicles.filter(v => v.is_status === 'active').length
    const usageRate = todayReserves > 0 ? Math.round((todayAttended / todayReserves) * 100) : 0
    return { activeEmployees, todayReserves, todayAttended, waitingReserves, activeVehicles, totalVehicles: vehicles.length, totalRoutes: routes.filter(r => r.is_status === 'active').length, totalDrivers:drivers.filter(d => d.is_status === 'active').length, usageRate }
  },
}))