// ============================================================
// ENUMS
// ============================================================
export type Status = 'active' | 'inactive'
export type Language = 'en' | 'th'
export type ShiftType = 'regular' | 'overtime'
export type ShiftSchedule = 'day' | 'night'
export type ShiftDirection = 'inbound' | 'outbound'
export type ReserveStatus = 'waiting' | 'approved' | 'canceled' | 'finished'
export type AttendanceStatus = 'reserved' | 'not_reserved' | 'not_found'
export type AttendanceType = 'rfid' | 'gps'
export type CalendarType = 'weekday' | 'holiday'
export type ModuleType = 'admin' | 'driver' | 'passenger'
export type ModuleSettingType = 'main' | 'configuration' | 'advanced_config' | 'report'
export type ActionType = 'insert' | 'update' | 'restore'
export type DeleteType = 'soft' | 'hard' | 'purge'
export type AuthenticationType = 'success' | 'failure'
export type AuthenticationEvent = 'login' | 'logout'
export type DriverEvent = 'start_work' | 'end_work'
export type NotificationType = 'once' | 'daily' | 'daily_until'
export type PlatformType = 'api' | 'mobile' | 'web'
export type DeviceType = 'android' | 'ios' | 'pc'
export type UserRole = 'super_admin' | 'admin' | 'operator' | 'viewer' | 'driver' | 'employee'

// ============================================================
// BASE
// ============================================================
export interface BaseEntity {
  id: string
  is_status: Status
  created_by: string
  created_at: string
  updated_by: string | null
  updated_at: string | null
}

// ============================================================
// GEOGRAPHY
// ============================================================
export interface Province { id: string; code: string; name_th: string; name_en: string; is_status: Status }
export interface District { id: string; province_id: string; province?: Province; code: string; name_th: string; name_en: string; is_status: Status }
export interface Subdistrict { id: string; district_id: string; district?: District; code: string; name_th: string; name_en: string; is_status: Status }
export interface SubdistrictCode { id: string; subdistrict_id: string; subdistrict_code: string; is_status: Status }

// ============================================================
// ORGANIZATION
// ============================================================
export type CompanyType = 'internal' | 'customer' | 'vendor'
export interface Company extends BaseEntity { code: string; name_th: string; name_en: string; address: string | null; logo: string; company_type: CompanyType }
export interface Plant extends BaseEntity { code: string; name_th: string; name_en: string; latitude: number; longitude: number }
export interface PlantCompany extends BaseEntity { plant_id: string; company_id: string; plant?: Plant; company?: Company }
export interface CompanyPlant extends BaseEntity { company_id: string; plant_id: string; company?: Company; plants?: Plant }
export interface CompanyPlantEmployee extends BaseEntity { company_plant_id: string; employee_id: string; company_plant?: CompanyPlant; employee?: Employee }
export interface Role {
  id: string
  name_th: string
  name_en: string
  type: string
  is_status: Status
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string | null
}

export interface JobLevel {
  id: string
  code: string
  name_th: string
  name_en: string
  is_status: Status
  created_at?: string
  updated_at?: string | null
}

export interface OrganizationLevel {
  id: string
  company_plant_id: string
  code: string
  name_th: string
  name_en: string
  level: number
   is_status: Status
  created_by?: string | null
  created_at?: string
  updated_by?: string | null
  updated_at?: string | null
}

export interface OrganizationUnit {
  id: string
  company_plant_id: string
  organization_level_id: string
  parent_id: string | null
  code: string
  name_th: string
  name_en: string
   is_status: Status
  created_by?: string | null
  created_at?: string
  updated_by?: string | null
  updated_at?: string | null
  organization_levels?: OrganizationLevel
}

export interface Division extends BaseEntity { code: string; name_th: string; name_en: string }
export interface Department extends BaseEntity { code: string; name_th: string; name_en: string }
export interface Section extends BaseEntity { code: string; name_th: string; name_en: string }
export interface Line extends BaseEntity { code: string; name_th: string; name_en: string }
export interface CostCenter extends BaseEntity { code: string; name_th: string; name_en: string }
export interface Level extends BaseEntity { code: string; name_th: string; name_en: string }
export interface Zone extends BaseEntity { code: string; name_th: string; name_en: string; routes?: Route[] }
export interface ZoneRoute extends BaseEntity { zone_id: string; route_id: string; zone?: Zone; route?: Route }
export interface PlantCompanyZone extends BaseEntity { plant_company_id: string; zone_id: string; plant_company?: PlantCompany; zone?: Zone }

// ============================================================
// EMPLOYEES
// ============================================================
export interface Employee extends BaseEntity {
  rfid: string
  code: string
  first_name_th: string
  last_name_th: string
  first_name_en: string
  last_name_en: string
  email: string | null
  address: string | null
  image: string
  username: string
  language: Language
}

export interface EmployeeDefault {
  organizationUnit: {
    id: string
    code: string
    nameTh: string
    nameEn: string
    levelNameTh: string
    levelNameEn: string
  } | null
  level: {
    id: string
    code: string
    nameTh: string
    nameEn: string
  } | null
}

export interface EmployeeTransportDefault {
  id: string
  trip_direction: string
  route_id: string | null
  point_id: string | null
  route?: { id: string; code: string; name_th: string; name_en: string } | null
  point?: { id: string; code: string; name_th: string; name_en: string } | null
}

export interface EmployeeFull extends Employee {
  defaults?: EmployeeDefault
  transport_defaults?: EmployeeTransportDefault[]
  organization_unit_id?: string
level_id?: string
company_plant_id?:string
}
export interface Permission extends BaseEntity { name_th: string; name_en: string }

// ============================================================
// DRIVERS
// ============================================================
export interface DriverRouteDefault {
  id: string
  driver_id: string
  route_id: string
  trip_direction: string
  routes?: { id: string; code: string; name_th: string; name_en: string; trip_direction: string }
}

export interface DriverVehicleNested {
  id: string
  driver_id: string
  vehicle_id: string
  vehicles?: Vehicle & { vehicle_types?: VehicleType }
  vendors_drivers_vehicles?: { id: string; vendor_id: string; vendors?: Vendor } | null
}

export interface Driver extends BaseEntity {
  code: string
  user_id: string | null
  first_name_th: string; last_name_th: string
  first_name_en: string; last_name_en: string
  tel: string | null
 
  driver_route_defaults?: DriverRouteDefault[]
  drivers_vehicles?: DriverVehicleNested | null
}

// ============================================================
// USER ACCOUNTS  (linked to an existing Employee or Driver)
// ============================================================
export type UserAccountType = 'employee' | 'driver' | 'standalone'

export interface UserAccount extends BaseEntity {
  username: string
  role: UserRole
  roles?: { nameTh: string | null; nameEn: string | null; type: string }[]
  account_type: UserAccountType
  // exactly one of these is set (standalone = both null, e.g. super_admin)
  employee_id: string | null;  employee?: Employee
  driver_id:   string | null;  driver?:   Driver
  company_id:  string | null;  company?:  Company
  email: string | null
  tel:   string | null
}

// ============================================================
// VEHICLES & VENDORS
// ============================================================
export interface VehicleType extends BaseEntity { name_th: string; name_en: string; capacity?: number | null }
export interface Vehicle extends BaseEntity { vehicle_type_id: string; code: string; province: string; license: string; capacity: number | null; vehicle_type?: VehicleType }
export interface Vendor extends BaseEntity { code: string; name_th: string; name_en: string }
export interface DriverVehicle extends BaseEntity { driver_id: string; vehicle_id: string; driver?: Driver; vehicle?: Vehicle }
export interface DriverVehicleVendor extends BaseEntity { driver_vehicle_id: string; vendor_id: string; driver_vehicle?: DriverVehicle; vendor?: Vendor }
export interface CompanyVendor extends BaseEntity { company_id: string; vendor_id: string; company?: Company; vendor?: Vendor }
export interface PlantVendorService extends BaseEntity { plant_id: string; vendor_id: string; plant?: Plant; vendor?: Vendor }

// ============================================================
// COORDINATORS
// ============================================================
export interface CoordinatorType extends BaseEntity { name_th: string; name_en: string }
export interface Coordinator extends BaseEntity { coordinator_type_id: string; company_id: string | null; name_th: string; name_en: string; tel: string | null; email: string | null; coordinator_type?: CoordinatorType; company?: Company }

// ============================================================
// ROUTES & TRIPS
// ============================================================
export type TripDirection = 'inbound' | 'outbound' | 'unknown'
export interface Trip extends BaseEntity { name_th: string; name_en: string }
export interface Route extends BaseEntity { code: string; name_th: string; name_en: string; trip_direction: TripDirection; points?: Point[]; zone_id?: string | null; zone?: Zone }
export interface Point extends BaseEntity { code: string; name_th: string; name_en: string; latitude: number; longitude: number; queue_default: number | null; route_id: string; route?: Route }



export type ShiftData = {
  shift_number: number
  passenger_in: number | null
  vehicle_in: string | null
  passenger_out: number | null
  vehicle_out: string | null
}

export type RouteServiceItem = {
  id: string
  route_code: string
  route_name_th: string
  route_name_en: string
  service_date: string
  shifts: ShiftData[]
}

// ============================================================
// SHIFTS & POSTS
// ============================================================
export interface ShiftGroup extends BaseEntity {
  code: string; name_th: string; name_en: string
  company_plant_id: string | null
}

export interface Shift extends BaseEntity {
  code: string; name_th: string; name_en: string
  type: ShiftType; schedule: ShiftSchedule
  trip_direction: ShiftDirection; default_time: string
  shift_group_id: string | null; shift_groups?: ShiftGroup | null
  company_plant_id: string | null
}

export interface Post extends BaseEntity {
  code: string
  route_id: string; route?: Route
  shift_id: string; shift?: Shift
  driver_vehicle_vendor_id: string; driver_vehicle_vendor?: DriverVehicleVendor
}

// ============================================================
// RESERVES & ATTENDANCES
// ============================================================
export interface Reserve extends BaseEntity {
  employee_id: string; employee?: Employee
  shift_id: string; shift?: Shift
  point_id: string; point?: Point
  plant_company_zone_id: string; plant_company_zone?: PlantCompanyZone
  working_date?: string
  travel_date: string
  platform: PlatformType; device: DeviceType
  remark: string | null
  is_state: ReserveStatus
  policy_id: string | null; policy?: BookingPolicy
}

export interface Attendance extends BaseEntity {
  employee_id: string; employee?: Employee
  point_id: string; point?: Point
  post_id: string; post?: Post
  rfid: string; remark: string | null
  type: AttendanceType; is_state: AttendanceStatus
}

// ============================================================
// TRACKING & ARRIVALS
// ============================================================
export interface Tracking { id: string; post_id: string; latitude: number; longitude: number; is_status: Status; created_by: string; created_at: string; post?: Post }
export interface Arrival extends BaseEntity { point_id: string; post_id: string; default_time: string; queue_order: number; point?: Point; post?: Post }

// ============================================================
// CALENDAR
// ============================================================
export interface CalendarGroup extends BaseEntity { plant_company_id: string; name: string; color: string; description: string | null; plant_company?: PlantCompany }
export interface Calendar extends BaseEntity { plant_company_id: string; calendar_group_id: string | null; name_th: string; name_en: string; date_at: string; direction: string | null; type: CalendarType; plant_company?: PlantCompany; calendar_group?: CalendarGroup }

// ============================================================
// BOOKING POLICIES (legacy stubs — kept for utils compatibility)
// ============================================================
export type AllowDaysType = 'holiday_only' | 'any'

// ============================================================
// NOTIFICATIONS & COMMENTS
// ============================================================
export interface Notification extends BaseEntity { plant_company_employee_id: string; title: string | null; detail: string | null; image: string; type: NotificationType; date_start: string; date_end: string; time_start: string; time_end: string; remark: string | null }
export interface Comment extends BaseEntity { employee_id: string; date_at: string; subject: string | null; detail: string | null; route_id: string; employee?: Employee; route?: Route; images?: ImageComment[]; feedbacks?: Feedback[] }
export interface ImageComment extends BaseEntity { comment_id: string; image: string }
export interface Feedback extends BaseEntity { employee_id: string; comment_id: string; feedback_commant: string | null; employee?: Employee; images?: ImageFeedback[] }
export interface ImageFeedback extends BaseEntity { feedback_id: string; image: string }

// ============================================================
// MODULES
// ============================================================

export interface Module extends BaseEntity {
  code: string
  name_th: string
  name_en: string
  domain: string

  type?: ModuleType
  setting?: ModuleSettingType | null
}


// ============================================================
// LOGS
// ============================================================
export interface ActionDataLog { id: string; action: ActionType; table_name: string; module_id: string; details: string; remark: string | null; is_status: Status; created_by: string; created_at: string; module?: Module }
export interface AuthenticationLog { id: string; user_id: string | null; result: AuthenticationType; event: AuthenticationEvent; ip: string | null; platform: PlatformType; device: DeviceType; user_agent: string | null; remark: string | null; is_status: Status; created_at: string; users?: { id: string; username: string } | null }
export interface DeleteDataLog { id: string; delete: DeleteType; table_name: string; module_id: string; details: string; remark: string | null; is_status: Status; created_by: string; created_at: string; module?: Module }
export interface ActionDriverLog { id: string; driver_id: string; event: DriverEvent; time_log: string; latitude: number; longitude: number; is_status: Status; created_at: string; driver?: Driver }
export interface ActionDriverLateLog { id: string; post_id: string; time_log: string; remark: string | null; is_status: Status; created_by: string; created_at: string; post?: Post }

// ============================================================
// COMMENTS / FEEDBACK
// ============================================================
export type CommentStatus = 'pending' | 'reviewed' | 'implemented' | 'closed'

export interface FeedbackComment {
  id: string
  employee_id: string
  route_id: string
  date_at: string
  subject: string | null
  detail: string | null
  is_status: CommentStatus
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at?: string | null
  employees?: {
    id: string
    code: string
    first_name_th: string
    last_name_th: string
    companys_plants_employees?: {
      companys_plants?: {
        company_id: string
        companys?: { name_th: string; code: string }
        plants?: { name_th: string }
      }
    }[]
  }
  routes?: { id: string; code: string; name_th: string; name_en: string }
}

// ============================================================
// UI / DASHBOARD HELPERS
// ============================================================
export interface DashboardStats {
  totalActiveEmployees: number
  todayReserves: number
  todayAttendances: number
  waitingReserves: number
  totalVehicles: number
  activeVehicles: number
  totalRoutes: number
  totalDrivers: number
}

export interface DailyUsageStat { date: string; reserves: number; attended: number; not_attended: number }
export interface DailyVehicleStat { date: string; total: number; by_type: Record<string, number> }

export interface PaginatedResult<T> { data: T[]; total: number; page: number; per_page: number; last_page: number }

export interface EmployeeFilters { search?: string; division_id?: string; department_id?: string; section_id?: string; line_id?: string; route_id?: string; level_id?: string; is_status?: Status }
export interface ReserveFilters { date_from?: string; date_to?: string; shift_id?: string; route_id?: string; point_id?: string; is_state?: ReserveStatus; employee_id?: string }
export interface AttendanceFilters { date_from?: string; date_to?: string; post_id?: string; type?: AttendanceType; is_state?: AttendanceStatus }

// ============================================================
// BOOKING POLICIES
// ============================================================
export type BookingMode = 'self_select' | 'assigned'
export type AfterCutoffAction = 'block' | 'allow' | 'require_approval'
export type AllowDays = 'any' | 'weekday' | 'holiday_only' | 'custom'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface BookingPolicyRules {
  id: string
  policy_id: string
  booking_mode: BookingMode
  advance_days_min: number
  advance_days_max: number | null
  cutoff_time: string
  after_cutoff_action: AfterCutoffAction
  cancel_deadline_minutes: number
  allow_days: AllowDays
  max_per_day: number | null
  allow_recurring: boolean
  requires_approval: boolean
  ot_requires_approval: boolean
  holiday_requires_approval: boolean
  allow_employee_edit: boolean
  pre_holiday_cutoff_time: string | null
  pre_holiday_cutoff_action: AfterCutoffAction
  allow_employee_cancel: boolean
  allow_admin_book_others: boolean
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string | null
}

export interface BookingPolicyRoute {
  id: string
  policy_id: string
  route_id: string
  routes?: { id: string; code: string; name_th: string; name_en: string }
}

export interface BookingPolicyOrgUnit {
  id: string
  policy_id: string
  org_unit_id: string
  organization_units?: { id: string; code: string; name_th: string; name_en: string }
}

export interface BookingPolicy {
  id: string
  company_id: string
  name_th: string
  name_en: string
  description: string | null
  priority: number
  is_status: Status
  created_by: string | null
  created_at: string
  updated_by: string | null
  updated_at: string | null
  companys?: { id: string; code: string; name_th: string; name_en: string }
  booking_policy_rules?: BookingPolicyRules
  booking_policy_routes?: BookingPolicyRoute[]
  booking_policy_org_units?: BookingPolicyOrgUnit[]
}

export interface BookingApproval {
  id: string
  reserve_id: string
  policy_id: string
  requested_by: string
  approver_id: string | null
  status: ApprovalStatus
  remark: string | null
  acted_at: string | null
  acted_by: string | null
  created_at: string
  updated_at: string | null
  booking_policies?: { id: string; name_th: string; name_en: string }
  reserves?: { id: string }
  approval_requested_by?: { id: string; code: string; first_name_th: string; last_name_th: string }
  approval_approver?: { id: string; code: string; first_name_th: string; last_name_th: string }
}
