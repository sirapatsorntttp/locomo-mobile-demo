// import type {
//   Employee, EmployeeFull, Driver, UserAccount, Vehicle, VehicleType, Vendor,
//   DriverVehicle, DriverVehicleVendor, Route, Trip, Point, Shift, Post,
//   Reserve, Attendance, Plant, Company, PlantCompany, Zone, PlantCompanyZone,
//   Division, Department, Section, Line, CostCenter, Level,
//   Calendar, CalendarGroup, DashboardStats, DailyUsageStat, DailyVehicleStat,
//   Coordinator, CoordinatorType, Notification, AuthenticationLog,
//   Module, BookingPolicy, CompanyVendor, PlantVendorService,
//   CompanyPlant, CompanyPlantEmployee
// } from '@/types'

// // ============================================================
// // GEOGRAPHY (ตัวอย่าง)
// // ============================================================
// export const mockProvinces = [
//   { id: 'pv-1', code: '10', name_th: 'กรุงเทพมหานคร', name_en: 'Bangkok', is_status: 'active' as const },
//   { id: 'pv-2', code: '11', name_th: 'สมุทรปราการ', name_en: 'Samut Prakan', is_status: 'active' as const },
// ]

// // ============================================================
// // ORGANIZATION
// // ============================================================
// export const mockCompanies: Company[] = [
//   { id: 'com-1', code: 'TTTP', name_th: 'ทีทีเทคโนพาร์ค', name_en: 'TT Techno-Park', address: '123 ถนนวิภาวดีรังสิต กรุงเทพฯ', logo: 'https://example.com/logo.png', company_type: 'internal', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'com-2', code: 'NIC', name_th: 'บริษัท นิค แมนูแฟคเจอริ่ง จำกัด', name_en: 'Nic Manufacturing Co., Ltd.', address: '456 นิคมอุตสาหกรรม สมุทรปราการ', logo: '', company_type: 'customer', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'com-3', code: 'META', name_th: 'บริษัท เมต้า อิเล็กทรอนิกส์ จำกัด', name_en: 'Meta Electronics Co., Ltd.', address: '789 ถนนพระราม 2 กรุงเทพฯ', logo: '', company_type: 'customer', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'com-4', code: 'SRK', name_th: 'บริษัท เอสอาร์เค อินดัสเทรียล จำกัด', name_en: 'SRK Industrial Co., Ltd.', address: '321 นิคมอุตสาหกรรม บางปู สมุทรปราการ', logo: '', company_type: 'customer', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'com-5', code: 'TPN', name_th: 'บริษัท ทีพีเอ็น ทรานสปอร์ต จำกัด', name_en: 'TPN Transport Co., Ltd.', address: '99 ถนนสุขุมวิท กรุงเทพฯ', logo: '', company_type: 'vendor', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'com-6', code: 'BNK', name_th: 'บริษัท บางกอก บัส เซอร์วิส จำกัด', name_en: 'Bangkok Bus Service Co., Ltd.', address: '55 ถนนรัชดาภิเษก กรุงเทพฯ', logo: '', company_type: 'vendor', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockPlants: Plant[] = [
//   { id: 'plt-1', code: 'HQ',   name_th: 'สำนักงานใหญ่ TTTP',  name_en: 'TTTP Head Office',   latitude: 13.8361,  longitude: 100.5231, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'plt-2', code: 'GTW',  name_th: 'เกตเวย์ (Gateway)',   name_en: 'Gateway Plant',       latitude: 13.6500,  longitude: 100.6200, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'plt-3', code: 'BPK',  name_th: 'บางปะกง',             name_en: 'Bang Pakong Plant',   latitude: 13.5230,  longitude: 101.0610, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'plt-4', code: 'EISE', name_th: 'EISE',                name_en: 'EISE Plant',          latitude: 13.5800,  longitude: 100.7600, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'plt-5', code: 'IPP',  name_th: 'IPP',                 name_en: 'IPP Plant',           latitude: 13.5500,  longitude: 100.7800, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'plt-6', code: 'META1',name_th: 'เมต้า สาขา 1',        name_en: 'Meta Branch 1',       latitude: 13.6800,  longitude: 100.5900, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockPlantCompanies: PlantCompany[] = [
//   { id: 'pc-1', plant_id: 'plt-1', company_id: 'com-1', plant: mockPlants[0], company: mockCompanies[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockDivisions: Division[] = [
//   { id: 'dvs-1', code: 'DIV-01', name_th: 'ฝ่ายปฏิบัติการ', name_en: 'Operations', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dvs-2', code: 'DIV-02', name_th: 'ฝ่ายการเงิน', name_en: 'Finance', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dvs-3', code: 'DIV-03', name_th: 'ฝ่ายเทคโนโลยีสารสนเทศ', name_en: 'IT', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockDepartments: Department[] = [
//   { id: 'dpm-1', code: 'DPM-01', name_th: 'แผนกทรัพยากรบุคคล', name_en: 'Human Resources', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dpm-2', code: 'DPM-02', name_th: 'แผนกการตลาด', name_en: 'Marketing', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dpm-3', code: 'DPM-03', name_th: 'แผนกวิศวกรรม', name_en: 'Engineering', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockSections: Section[] = [
//   { id: 'sec-1', code: 'SEC-01', name_th: 'แผนกจัดซื้อ', name_en: 'Procurement', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'sec-2', code: 'SEC-02', name_th: 'แผนกบัญชี', name_en: 'Accounting', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockLevels: Level[] = [
//   { id: 'lv-1', code: 'LV-01', name_th: 'ระดับพนักงาน', name_en: 'Staff', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'lv-2', code: 'LV-02', name_th: 'ระดับหัวหน้างาน', name_en: 'Supervisor', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'lv-3', code: 'LV-03', name_th: 'ระดับผู้จัดการ', name_en: 'Manager', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockLines: Line[] = [
//   { id: 'ln-1', code: 'LN-01', name_th: 'ไลน์การผลิต A', name_en: 'Production Line A', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'ln-2', code: 'LN-02', name_th: 'ไลน์การผลิต B', name_en: 'Production Line B', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockZones: Zone[] = [
//   { id: 'zone-1', code: 'Z-01', name_th: 'โซน A', name_en: 'Zone A', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'zone-2', code: 'Z-02', name_th: 'โซน B', name_en: 'Zone B', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]
// // Zone A → RT-A, RT-B | Zone B → RT-C (populated after mockRoutes is defined below)

// export const mockPlantCompanyZones: PlantCompanyZone[] = [
//   { id: 'pcz-1', plant_company_id: 'pc-1', zone_id: 'zone-1', zone: mockZones[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pcz-2', plant_company_id: 'pc-1', zone_id: 'zone-2', zone: mockZones[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // TRIPS & ROUTES & POINTS
// // ============================================================
// export const mockTrips: Trip[] = [
//   { id: 'trip-1', name_th: 'เที่ยวเข้า', name_en: 'Inbound', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'trip-2', name_th: 'เที่ยวออก', name_en: 'Outbound', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockRoutes: Route[] = [
//   { id: 'rt-1', code: 'RT-A', name_th: 'สาย A - เส้นทางเหนือ', name_en: 'Route A - North', trip_direction: 'inbound', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'rt-2', code: 'RT-B', name_th: 'สาย B - เส้นทางใต้', name_en: 'Route B - South', trip_direction: 'inbound', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'rt-3', code: 'RT-C', name_th: 'สาย C - เส้นทางตะวันออก', name_en: 'Route C - East', trip_direction: 'outbound', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockPoints: Point[] = [
//   { id: 'pt-1', code: 'PT-01', name_th: 'BTS หมอชิต', name_en: 'BTS Mo Chit', latitude: 13.8025, longitude: 100.5533, queue_default: 1, route_id: 'rt-1', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pt-2', code: 'PT-02', name_th: 'สวนจตุจักร', name_en: 'Chatuchak Park', latitude: 13.7997, longitude: 100.5537, queue_default: 2, route_id: 'rt-1', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pt-3', code: 'PT-03', name_th: 'BTS เอกมัย', name_en: 'BTS Ekkamai', latitude: 13.7202, longitude: 100.5851, queue_default: 1, route_id: 'rt-2', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pt-4', code: 'PT-04', name_th: 'อ่อนนุช', name_en: 'On Nut', latitude: 13.7019, longitude: 100.6001, queue_default: 2, route_id: 'rt-2', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pt-5', code: 'PT-05', name_th: 'มีนบุรี', name_en: 'Minburi', latitude: 13.8161, longitude: 100.7449, queue_default: 1, route_id: 'rt-3', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pt-6', code: 'PT-06', name_th: 'ลาดกระบัง', name_en: 'Lat Krabang', latitude: 13.7297, longitude: 100.7521, queue_default: 2, route_id: 'rt-3', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // Add points to routes
// mockRoutes[0].points = mockPoints.filter(p => p.route_id === 'rt-1')
// mockRoutes[1].points = mockPoints.filter(p => p.route_id === 'rt-2')
// mockRoutes[2].points = mockPoints.filter(p => p.route_id === 'rt-3')

// // Add routes to zones (Zone > Route hierarchy)
// mockZones[0].routes = [mockRoutes[0], mockRoutes[1]]
// mockZones[1].routes = [mockRoutes[2]]

// // ============================================================
// // SHIFTS
// // ============================================================
// export const mockShifts: Shift[] = [
//   { id: 'sh-1', code: 'SH-D1', name_th: 'กะเช้า (ปกติ)', name_en: 'Morning Shift (Regular)', type: 'regular', schedule: 'day', trip_direction: 'inbound', default_time: '07:00', shift_group_id: null, shift_groups: null, company_plant_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'sh-2', code: 'SH-N1', name_th: 'กะดึก (ปกติ)', name_en: 'Night Shift (Regular)', type: 'regular', schedule: 'night', trip_direction: 'outbound', default_time: '22:00', shift_group_id: null, shift_groups: null, company_plant_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'sh-3', code: 'SH-OT1', name_th: 'กะล่วงเวลาเช้า', name_en: 'Morning Overtime', type: 'overtime', schedule: 'day', trip_direction: 'inbound', default_time: '06:00', shift_group_id: null, shift_groups: null, company_plant_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // VEHICLE TYPES & VEHICLES
// // ============================================================
// export const mockVehicleTypes: VehicleType[] = [
//   { id: 'vt-1', name_th: 'รถตู้', name_en: 'Van', capacity: 12, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'vt-2', name_th: 'มินิบัส', name_en: 'Minibus', capacity: 25, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'vt-3', name_th: 'รถบัส', name_en: 'Bus', capacity: 45, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockVehicles: Vehicle[] = [
//   { id: 'veh-1', vehicle_type_id: 'vt-1', code: 'VEH-001', province: 'กรุงเทพฯ', license: 'กข-1234', capacity: 12, vehicle_type: mockVehicleTypes[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'veh-2', vehicle_type_id: 'vt-2', code: 'VEH-002', province: 'กรุงเทพฯ', license: 'ขค-5678', capacity: 25, vehicle_type: mockVehicleTypes[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'veh-3', vehicle_type_id: 'vt-3', code: 'VEH-003', province: 'กรุงเทพฯ', license: 'คง-9012', capacity: 45, vehicle_type: mockVehicleTypes[2], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'veh-4', vehicle_type_id: 'vt-1', code: 'VEH-004', province: 'กรุงเทพฯ', license: 'งจ-3456', capacity: 12, vehicle_type: mockVehicleTypes[0], is_status: 'inactive', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // DRIVERS
// // ============================================================
// export const mockDrivers: Driver[] = [
//   { id: 'drv-1', code: 'DRV-001', first_name_th: 'สมหมาย', last_name_th: 'วงค์ดี', first_name_en: 'Sommai', last_name_en: 'Wongdi', tel: '0812345678', user_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'drv-2', code: 'DRV-002', first_name_th: 'วิชัย', last_name_th: 'สุขสมบูรณ์', first_name_en: 'Wichai', last_name_en: 'Suksomboon', tel: '0823456789', user_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'drv-3', code: 'DRV-003', first_name_th: 'ประสิทธิ์', last_name_th: 'เจริญสุข', first_name_en: 'Prasit', last_name_en: 'Charoensuk', tel: '0834567890', user_id: null, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // USER ACCOUNTS  (สร้างจาก Employee / Driver ที่มีอยู่)
// // ============================================================
// export const mockUserAccounts: UserAccount[] = [
//   // ── Standalone admins (ไม่ผูกกับ employee/driver) ──────────
//   {
//     id: 'ua-1', username: 'somchai.superadmin', role: 'super_admin',
//     account_type: 'standalone',
//     employee_id: null, employee: undefined,
//     driver_id: null,   driver: undefined,
//     company_id: null,  company: undefined,
//     email: 'somchai@locomo.co.th', tel: '0891234567',
//     is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null,
//   },
//   // ── Employee accounts ───────────────────────────────────────
//   // emp-1 = ดาวนุ่น → role: admin (TTTP)
//   {
//     id: 'ua-2', username: 'daonun.p', role: 'admin',
//     account_type: 'employee',
//     employee_id: 'emp-1', employee: undefined, // resolved at runtime
//     driver_id: null, driver: undefined,
//     company_id: 'com-1', company: mockCompanies[0],
//     email: 'boonrun.ruandee@tttp.co.th', tel: null,
//     is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null,
//   },
//   // emp-2 = มนตรี → role: operator (TTTP)
//   {
//     id: 'ua-3', username: 'montri.w', role: 'operator',
//     account_type: 'employee',
//     employee_id: 'emp-2', employee: undefined,
//     driver_id: null, driver: undefined,
//     company_id: 'com-1', company: mockCompanies[0],
//     email: 'montri.wangsa@tttp.co.th', tel: null,
//     is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null,
//   },
//   // ── Driver accounts ─────────────────────────────────────────
//   // drv-1 = สมหมาย → role: driver
//   {
//     id: 'ua-4', username: 'drv_sommai', role: 'driver',
//     account_type: 'driver',
//     employee_id: null, employee: undefined,
//     driver_id: 'drv-1', driver: undefined,
//     company_id: null, company: undefined,
//     email: null, tel: '0812345678',
//     is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null,
//   },
//   // drv-2 = วิชัย → role: driver
//   {
//     id: 'ua-5', username: 'drv_wichai', role: 'driver',
//     account_type: 'driver',
//     employee_id: null, employee: undefined,
//     driver_id: 'drv-2', driver: undefined,
//     company_id: null, company: undefined,
//     email: null, tel: '0823456789',
//     is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null,
//   },
// ]

// // ============================================================
// // VENDORS
// // ============================================================
// export const mockVendors: Vendor[] = [
//   { id: 'ven-1', code: 'VEN-001', name_th: 'บริษัท ขนส่ง เอ จำกัด', name_en: 'Transport A Co., Ltd.', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'ven-2', code: 'VEN-002', name_th: 'บริษัท ขนส่ง บี จำกัด', name_en: 'Transport B Co., Ltd.', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // DRIVER VEHICLES & VENDORS (chain)
// // ============================================================
// export const mockDriverVehicles: DriverVehicle[] = [
//   { id: 'dv-1', driver_id: 'drv-1', vehicle_id: 'veh-1', driver: mockDrivers[0], vehicle: mockVehicles[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dv-2', driver_id: 'drv-2', vehicle_id: 'veh-2', driver: mockDrivers[1], vehicle: mockVehicles[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dv-3', driver_id: 'drv-3', vehicle_id: 'veh-3', driver: mockDrivers[2], vehicle: mockVehicles[2], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockDriverVehicleVendors: DriverVehicleVendor[] = [
//   { id: 'dvv-1', driver_vehicle_id: 'dv-1', vendor_id: 'ven-1', driver_vehicle: mockDriverVehicles[0], vendor: mockVendors[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dvv-2', driver_vehicle_id: 'dv-2', vendor_id: 'ven-1', driver_vehicle: mockDriverVehicles[1], vendor: mockVendors[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'dvv-3', driver_vehicle_id: 'dv-3', vendor_id: 'ven-2', driver_vehicle: mockDriverVehicles[2], vendor: mockVendors[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockCompanyVendors: CompanyVendor[] = [
//   { id: 'cv-1', company_id: 'com-1', vendor_id: 'ven-1', company: mockCompanies[0], vendor: mockVendors[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cv-2', company_id: 'com-1', vendor_id: 'ven-2', company: mockCompanies[0], vendor: mockVendors[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockPlantVendorServices: PlantVendorService[] = [
//   { id: 'pvs-1', plant_id: 'plt-1', vendor_id: 'ven-1', plant: mockPlants[0], vendor: mockVendors[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'pvs-2', plant_id: 'plt-1', vendor_id: 'ven-2', plant: mockPlants[0], vendor: mockVendors[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockCompanyPlants: CompanyPlant[] = [
//   { id: 'cp-1', company_id: 'com-1', plant_id: 'plt-1', company: mockCompanies[0], plant: mockPlants[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cp-2', company_id: 'com-2', plant_id: 'plt-2', company: mockCompanies[1], plant: mockPlants[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cp-3', company_id: 'com-2', plant_id: 'plt-3', company: mockCompanies[1], plant: mockPlants[2], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cp-4', company_id: 'com-4', plant_id: 'plt-4', company: mockCompanies[3], plant: mockPlants[3], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cp-5', company_id: 'com-4', plant_id: 'plt-5', company: mockCompanies[3], plant: mockPlants[4], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cp-6', company_id: 'com-3', plant_id: 'plt-6', company: mockCompanies[2], plant: mockPlants[5], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockCompanyPlantEmployees: CompanyPlantEmployee[] = [
//   { id: 'cpe-1', company_plant_id: 'cp-1', employee_id: 'emp-1', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cpe-2', company_plant_id: 'cp-1', employee_id: 'emp-2', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cpe-3', company_plant_id: 'cp-2', employee_id: 'emp-3', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockCoordinatorTypes: CoordinatorType[] = [
//   { id: 'ct-1', name_th: 'โคออร์ดิเนเตอร์ Vendor รถ', name_en: 'Vehicle Vendor Coordinator', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'ct-2', name_th: 'โคออร์ดิเนเตอร์ระบบ Locomo', name_en: 'Locomo System Coordinator', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'ct-3', name_th: 'โคออร์ดิเนเตอร์ HR/GA ลูกค้า', name_en: 'Customer HR/GA Coordinator', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// export const mockCoordinators: Coordinator[] = [
//   { id: 'cdn-1', coordinator_type_id: 'ct-1', company_id: 'com-5', name_th: 'สมศักดิ์ เดินทาง', name_en: 'Somsak Derntang', tel: '0812345678', email: 'somsak@tpn.co.th', coordinator_type: mockCoordinatorTypes[0], company: mockCompanies[4], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cdn-2', coordinator_type_id: 'ct-1', company_id: 'com-6', name_th: 'วิชัย บางกอก', name_en: 'Wichai Bangkok', tel: '0823456789', email: 'wichai@bnk.co.th', coordinator_type: mockCoordinatorTypes[0], company: mockCompanies[5], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cdn-3', coordinator_type_id: 'ct-2', company_id: null, name_th: 'นภา ระบบ', name_en: 'Napa System', tel: '0834567890', email: 'napa@tttp.co.th', coordinator_type: mockCoordinatorTypes[1], company: undefined, is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cdn-4', coordinator_type_id: 'ct-3', company_id: 'com-2', name_th: 'ปัทมา ณิค', name_en: 'Pattama NIC', tel: '0845678901', email: 'pattama@nic.co.th', coordinator_type: mockCoordinatorTypes[2], company: mockCompanies[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'cdn-5', coordinator_type_id: 'ct-3', company_id: 'com-4', name_th: 'อมรรัตน์ เอสอาร์เค', name_en: 'Amornrat SRK', tel: '0856789012', email: 'amornrat@srk.co.th', coordinator_type: mockCoordinatorTypes[2], company: mockCompanies[3], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // POSTS (route + shift + driver_vehicle_vendor)
// // ============================================================
// export const mockPosts: Post[] = [
//   { id: 'post-1', code: 'POST-001', route_id: 'rt-1', shift_id: 'sh-1', driver_vehicle_vendor_id: 'dvv-1', route: mockRoutes[0], shift: mockShifts[0], driver_vehicle_vendor: mockDriverVehicleVendors[0], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'post-2', code: 'POST-002', route_id: 'rt-2', shift_id: 'sh-1', driver_vehicle_vendor_id: 'dvv-2', route: mockRoutes[1], shift: mockShifts[0], driver_vehicle_vendor: mockDriverVehicleVendors[1], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'post-3', code: 'POST-003', route_id: 'rt-3', shift_id: 'sh-2', driver_vehicle_vendor_id: 'dvv-3', route: mockRoutes[2], shift: mockShifts[1], driver_vehicle_vendor: mockDriverVehicleVendors[2], is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // EMPLOYEES
// // ============================================================
// export const mockEmployees: EmployeeFull[] = [
//   {
//     id: 'emp-1', rfid: '9309200001', code: '930920', first_name_th: 'ดาวนุ่น', last_name_th: 'เพรียนดี', first_name_en: 'Daonun', last_name_en: 'Priandee', email: 'boonrun.ruandee@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'daonun.p', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-1', code: 'DPM-1', nameTh: 'ฝ่ายผลิต', nameEn: 'Production', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-2', code: 'LV2', nameTh: 'พนักงานระดับ 2', nameEn: 'Level 2' } }
//   },
//   {
//     id: 'emp-2', rfid: '4520200002', code: '452020', first_name_th: 'มนตรี', last_name_th: 'วังสา', first_name_en: 'Montri', last_name_en: 'Wangsa', email: 'montri.wangsa@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'montri.w', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-2', code: 'DPM-2', nameTh: 'ฝ่ายบริหาร', nameEn: 'Management', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-1', code: 'LV1', nameTh: 'พนักงานระดับ 1', nameEn: 'Level 1' } }
//   },
//   {
//     id: 'emp-3', rfid: '8584160003', code: '858416', first_name_th: 'อำพร', last_name_th: 'อุ้มเงิน', first_name_en: 'Amporn', last_name_en: 'Ux-ngern', email: 'amporn.ux-ngern@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'amporn.u', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-1', code: 'DPM-1', nameTh: 'ฝ่ายผลิต', nameEn: 'Production', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-3', code: 'LV3', nameTh: 'พนักงานระดับ 3', nameEn: 'Level 3' } }
//   },
//   {
//     id: 'emp-4', rfid: '7484460004', code: '748446', first_name_th: 'ปราณี', last_name_th: 'มีนาค', first_name_en: 'Pranee', last_name_en: 'Meenak', email: 'pranee.meenak@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'pranee.m', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-3', code: 'DPM-3', nameTh: 'ฝ่ายบัญชี', nameEn: 'Finance', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-1', code: 'LV1', nameTh: 'พนักงานระดับ 1', nameEn: 'Level 1' } }
//   },
//   {
//     id: 'emp-5', rfid: '2180790005', code: '218079', first_name_th: 'วันทนา', last_name_th: 'เงินเทียง', first_name_en: 'Wanthana', last_name_en: 'Ngerntiang', email: 'wanthana.ngern@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'wanthana.n', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-2', code: 'DPM-2', nameTh: 'ฝ่ายบริหาร', nameEn: 'Management', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-1', code: 'LV1', nameTh: 'พนักงานระดับ 1', nameEn: 'Level 1' } }
//   },
//   {
//     id: 'emp-6', rfid: '1478870006', code: '147887', first_name_th: 'อุไร', last_name_th: 'เงินเทียง', first_name_en: 'Urai', last_name_en: 'Ngerntiang', email: 'urai.ngerntiang@tttp.co.th', address: null, image: 'https://example.com/employee.png', username: 'urai.n', language: 'th', is_status: 'active', created_by: 'sys', created_at: '2026-03-01T00:00:00Z', updated_by: null, updated_at: null,
//     defaults: { organizationUnit: { id: 'dpm-3', code: 'DPM-3', nameTh: 'ฝ่ายบัญชี', nameEn: 'Finance', levelNameTh: 'แผนก', levelNameEn: 'Department' }, level: { id: 'lv-2', code: 'LV2', nameTh: 'พนักงานระดับ 2', nameEn: 'Level 2' } }
//   },
// ]

// // ============================================================
// // RESERVES
// // ============================================================
// export const mockReserves: Reserve[] = [
//   { id: 'res-1', employee_id: 'emp-1', employee: mockEmployees[0], shift_id: 'sh-1', shift: mockShifts[0], point_id: 'pt-1', point: mockPoints[0], plant_company_zone_id: 'pcz-1', plant_company_zone: mockPlantCompanyZones[0], travel_date: '2026-04-06T00:00:00Z', platform: 'web', device: 'pc', remark: null, is_state: 'approved', policy_id: null, is_status: 'active', created_by: 'emp-1', created_at: '2026-04-05T08:00:00Z', updated_by: null, updated_at: null },
//   { id: 'res-2', employee_id: 'emp-2', employee: mockEmployees[1], shift_id: 'sh-1', shift: mockShifts[0], point_id: 'pt-3', point: mockPoints[2], plant_company_zone_id: 'pcz-1', plant_company_zone: mockPlantCompanyZones[0], travel_date: '2026-04-06T00:00:00Z', platform: 'mobile', device: 'android', remark: null, is_state: 'approved', policy_id: null, is_status: 'active', created_by: 'emp-2', created_at: '2026-04-05T09:00:00Z', updated_by: null, updated_at: null },
//   { id: 'res-3', employee_id: 'emp-3', employee: mockEmployees[2], shift_id: 'sh-1', shift: mockShifts[0], point_id: 'pt-2', point: mockPoints[1], plant_company_zone_id: 'pcz-2', plant_company_zone: mockPlantCompanyZones[1], travel_date: '2026-04-06T00:00:00Z', platform: 'web', device: 'pc', remark: null, is_state: 'waiting', policy_id: null, is_status: 'active', created_by: 'emp-3', created_at: '2026-04-06T06:00:00Z', updated_by: null, updated_at: null },
//   { id: 'res-4', employee_id: 'emp-4', employee: mockEmployees[3], shift_id: 'sh-2', shift: mockShifts[1], point_id: 'pt-5', point: mockPoints[4], plant_company_zone_id: 'pcz-1', plant_company_zone: mockPlantCompanyZones[0], travel_date: '2026-04-06T00:00:00Z', platform: 'mobile', device: 'ios', remark: null, is_state: 'finished', policy_id: null, is_status: 'active', created_by: 'emp-4', created_at: '2026-04-05T10:00:00Z', updated_by: null, updated_at: null },
//   { id: 'res-5', employee_id: 'emp-5', employee: mockEmployees[4], shift_id: 'sh-1', shift: mockShifts[0], point_id: 'pt-4', point: mockPoints[3], plant_company_zone_id: 'pcz-2', plant_company_zone: mockPlantCompanyZones[1], travel_date: '2026-04-06T00:00:00Z', platform: 'web', device: 'pc', remark: null, is_state: 'canceled', policy_id: null, is_status: 'active', created_by: 'emp-5', created_at: '2026-04-05T11:00:00Z', updated_by: null, updated_at: null },
//   { id: 'res-6', employee_id: 'emp-6', employee: mockEmployees[5], shift_id: 'sh-3', shift: mockShifts[2], point_id: 'pt-6', point: mockPoints[5], plant_company_zone_id: 'pcz-1', plant_company_zone: mockPlantCompanyZones[0], travel_date: '2026-04-06T00:00:00Z', platform: 'mobile', device: 'android', remark: 'ต้องการนั่งหน้า', is_state: 'approved', policy_id: null, is_status: 'active', created_by: 'emp-6', created_at: '2026-04-05T07:00:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // ATTENDANCES
// // ============================================================
// export const mockAttendances: Attendance[] = [
//   { id: 'att-1', employee_id: 'emp-1', employee: mockEmployees[0], point_id: 'pt-1', point: mockPoints[0], post_id: 'post-1', post: mockPosts[0], rfid: '9309200001', remark: null, type: 'rfid', is_state: 'reserved', is_status: 'active', created_by: 'sys', created_at: '2026-04-06T06:55:00Z', updated_by: null, updated_at: null },
//   { id: 'att-2', employee_id: 'emp-2', employee: mockEmployees[1], point_id: 'pt-3', point: mockPoints[2], post_id: 'post-2', post: mockPosts[1], rfid: '4520200002', remark: null, type: 'rfid', is_state: 'reserved', is_status: 'active', created_by: 'sys', created_at: '2026-04-06T07:10:00Z', updated_by: null, updated_at: null },
//   { id: 'att-3', employee_id: 'emp-4', employee: mockEmployees[3], point_id: 'pt-5', point: mockPoints[4], post_id: 'post-3', post: mockPosts[2], rfid: '7484460004', remark: null, type: 'qr_code', is_state: 'reserved', is_status: 'active', created_by: 'sys', created_at: '2026-04-06T07:40:00Z', updated_by: null, updated_at: null },
//   { id: 'att-4', employee_id: 'emp-6', employee: mockEmployees[5], point_id: 'pt-6', point: mockPoints[5], post_id: 'post-3', post: mockPosts[2], rfid: '1478870006', remark: null, type: 'rfid', is_state: 'not_reserved', is_status: 'active', created_by: 'sys', created_at: '2026-04-06T07:42:00Z', updated_by: null, updated_at: null },
// ]

// // ============================================================
// // CALENDARS
// // ============================================================
// const SYS = { is_status: 'active' as const, created_by: 'sys', created_at: '2025-12-01T00:00:00Z', updated_by: null, updated_at: null }

// export const mockCalendarGroups: CalendarGroup[] = [
//   // pc-1 groups
//   { id: 'cg-1', plant_company_id: 'pc-1', name: 'ปฏิทินพนักงาน',          color: '#3b82f6', description: 'วันหยุดพนักงานประจำ', ...SYS },
//   { id: 'cg-2', plant_company_id: 'pc-1', name: 'ปฏิทิน Subcontract',    color: '#8b5cf6', description: 'วันหยุดพนักงานรับเหมา', ...SYS },
//   { id: 'cg-3', plant_company_id: 'pc-1', name: 'ปฏิทิน OT',             color: '#f59e0b', description: 'วันทำงานพิเศษล่วงเวลา', ...SYS },
//   // pc-2 groups
//   { id: 'cg-4', plant_company_id: 'pc-2', name: 'พนักงาน NIC',            color: '#10b981', description: 'ปฏิทินพนักงาน NIC', ...SYS },
//   { id: 'cg-5', plant_company_id: 'pc-2', name: 'Subcontract NIC',        color: '#ef4444', description: null, ...SYS },
//   // pc-3 groups
//   { id: 'cg-6', plant_company_id: 'pc-3', name: 'พนักงาน META',           color: '#0ea5e9', description: null, ...SYS },
//   { id: 'cg-7', plant_company_id: 'pc-3', name: 'Subcontract META',       color: '#ec4899', description: 'รับเหมา 5 วัน', ...SYS },
//   { id: 'cg-8', plant_company_id: 'pc-3', name: 'พนักงาน Line B',         color: '#14b8a6', description: 'ไลน์ผลิต B ต่างกัน', ...SYS },
//   // pc-4 groups
//   { id: 'cg-9', plant_company_id: 'pc-4', name: 'พนักงาน SRK',            color: '#6366f1', description: null, ...SYS },
// ]

// export const mockCalendars: Calendar[] = [
//   // cg-1: ปฏิทินพนักงาน (pc-1)
//   { id: 'cal-1',  plant_company_id: 'pc-1', calendar_group_id: 'cg-1', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-1', type: 'holiday',  ...SYS },
//   { id: 'cal-2',  plant_company_id: 'pc-1', calendar_group_id: 'cg-1', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-1', type: 'holiday',  ...SYS },
//   { id: 'cal-3',  plant_company_id: 'pc-1', calendar_group_id: 'cg-1', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-14', direction: 'cg-1', type: 'holiday',  ...SYS },
//   { id: 'cal-4',  plant_company_id: 'pc-1', calendar_group_id: 'cg-1', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-15', direction: 'cg-1', type: 'holiday',  ...SYS },
//   { id: 'cal-5',  plant_company_id: 'pc-1', calendar_group_id: 'cg-1', name_th: 'วันทำงานพิเศษ',      name_en: 'Special Workday',  date_at: '2026-04-04', direction: 'cg-1', type: 'weekday',  ...SYS },
//   // cg-2: ปฏิทิน Subcontract (pc-1)
//   { id: 'cal-6',  plant_company_id: 'pc-1', calendar_group_id: 'cg-2', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-2', type: 'holiday',  ...SYS },
//   { id: 'cal-7',  plant_company_id: 'pc-1', calendar_group_id: 'cg-2', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-2', type: 'holiday',  ...SYS },
//   // cg-3: ปฏิทิน OT (pc-1)
//   { id: 'cal-8',  plant_company_id: 'pc-1', calendar_group_id: 'cg-3', name_th: 'OT วันเสาร์',        name_en: 'Saturday OT',      date_at: '2026-04-05', direction: 'cg-3', type: 'weekday',  ...SYS },
//   { id: 'cal-9',  plant_company_id: 'pc-1', calendar_group_id: 'cg-3', name_th: 'OT วันเสาร์',        name_en: 'Saturday OT',      date_at: '2026-04-12', direction: 'cg-3', type: 'weekday',  ...SYS },
//   // cg-4: พนักงาน NIC (pc-2)
//   { id: 'cal-10', plant_company_id: 'pc-2', calendar_group_id: 'cg-4', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-4', type: 'holiday',  ...SYS },
//   { id: 'cal-11', plant_company_id: 'pc-2', calendar_group_id: 'cg-4', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-4', type: 'holiday',  ...SYS },
//   { id: 'cal-12', plant_company_id: 'pc-2', calendar_group_id: 'cg-4', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-14', direction: 'cg-4', type: 'holiday',  ...SYS },
//   { id: 'cal-13', plant_company_id: 'pc-2', calendar_group_id: 'cg-4', name_th: 'วันทำงานพิเศษ',      name_en: 'Special Workday',  date_at: '2026-04-11', direction: 'cg-4', type: 'weekday',  ...SYS },
//   // cg-5: Subcontract NIC (pc-2)
//   { id: 'cal-14', plant_company_id: 'pc-2', calendar_group_id: 'cg-5', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-5', type: 'holiday',  ...SYS },
//   { id: 'cal-15', plant_company_id: 'pc-2', calendar_group_id: 'cg-5', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-5', type: 'holiday',  ...SYS },
//   // cg-6: พนักงาน META (pc-3)
//   { id: 'cal-16', plant_company_id: 'pc-3', calendar_group_id: 'cg-6', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-6', type: 'holiday',  ...SYS },
//   { id: 'cal-17', plant_company_id: 'pc-3', calendar_group_id: 'cg-6', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-6', type: 'holiday',  ...SYS },
//   { id: 'cal-18', plant_company_id: 'pc-3', calendar_group_id: 'cg-6', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-14', direction: 'cg-6', type: 'holiday',  ...SYS },
//   // cg-7: Subcontract META (pc-3)
//   { id: 'cal-19', plant_company_id: 'pc-3', calendar_group_id: 'cg-7', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-7', type: 'holiday',  ...SYS },
//   { id: 'cal-20', plant_company_id: 'pc-3', calendar_group_id: 'cg-7', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-7', type: 'holiday',  ...SYS },
//   { id: 'cal-21', plant_company_id: 'pc-3', calendar_group_id: 'cg-7', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-14', direction: 'cg-7', type: 'holiday',  ...SYS },
//   { id: 'cal-22', plant_company_id: 'pc-3', calendar_group_id: 'cg-7', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-15', direction: 'cg-7', type: 'holiday',  ...SYS },
//   { id: 'cal-23', plant_company_id: 'pc-3', calendar_group_id: 'cg-7', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-16', direction: 'cg-7', type: 'holiday',  ...SYS },
//   // cg-8: พนักงาน Line B META (pc-3)
//   { id: 'cal-24', plant_company_id: 'pc-3', calendar_group_id: 'cg-8', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-8', type: 'holiday',  ...SYS },
//   { id: 'cal-25', plant_company_id: 'pc-3', calendar_group_id: 'cg-8', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-8', type: 'holiday',  ...SYS },
//   { id: 'cal-26', plant_company_id: 'pc-3', calendar_group_id: 'cg-8', name_th: 'วันทำงาน Line B',    name_en: 'Line B Workday',   date_at: '2026-04-18', direction: 'cg-8', type: 'weekday',  ...SYS },
//   // cg-9: พนักงาน SRK (pc-4)
//   { id: 'cal-27', plant_company_id: 'pc-4', calendar_group_id: 'cg-9', name_th: 'วันจักรี',           name_en: 'Chakri Day',       date_at: '2026-04-06', direction: 'cg-9', type: 'holiday',  ...SYS },
//   { id: 'cal-28', plant_company_id: 'pc-4', calendar_group_id: 'cg-9', name_th: 'วันสงกรานต์',        name_en: 'Songkran',         date_at: '2026-04-13', direction: 'cg-9', type: 'holiday',  ...SYS },
//   { id: 'cal-29', plant_company_id: 'pc-4', calendar_group_id: 'cg-9', name_th: 'วันสงกรานต์ (ต่อ)',  name_en: 'Songkran cont.',   date_at: '2026-04-14', direction: 'cg-9', type: 'holiday',  ...SYS },
// ]

// // ============================================================
// // BOOKING POLICIES
// // ============================================================
// export const mockBookingPolicies: BookingPolicy[] = []

// // ============================================================
// // DASHBOARD STATS
// // ============================================================
// export const mockDashboardStats: DashboardStats = {
//   totalActiveEmployees: 114,
//   todayReserves: 964,
//   todayAttendances: 815,
//   waitingReserves: 6,
//   totalVehicles: mockVehicles.length,
//   activeVehicles: mockVehicles.filter(v => v.is_status === 'active').length,
//   totalRoutes: mockRoutes.length,
//   totalDrivers: mockDrivers.length,
// }

// export const mockDailyUsage: DailyUsageStat[] = [
//   { date: '1 เม.ย. 2569', reserves: 1106, attended: 1067, not_attended: 39 },
//   { date: '2 เม.ย. 2569', reserves: 1144, attended: 939, not_attended: 205 },
//   { date: '3 เม.ย. 2569', reserves: 1317, attended: 1106, not_attended: 211 },
//   { date: '4 เม.ย. 2569', reserves: 942, attended: 798, not_attended: 144 },
//   { date: '5 เม.ย. 2569', reserves: 787, attended: 656, not_attended: 131 },
//   { date: '6 เม.ย. 2569', reserves: 964, attended: 815, not_attended: 149 },
// ]

// export const mockDailyVehicles: DailyVehicleStat[] = [
//   { date: '1 เม.ย. 2569', total: 143, by_type: { รถตู้: 7, มินิบัส: 3, รถบัส: 2 } },
//   { date: '2 เม.ย. 2569', total: 109, by_type: { รถตู้: 5, มินิบัส: 2, รถบัส: 2 } },
//   { date: '3 เม.ย. 2569', total: 109, by_type: { รถตู้: 5, มินิบัส: 2, รถบัส: 2 } },
//   { date: '4 เม.ย. 2569', total: 121, by_type: { รถตู้: 6, มินิบัส: 2, รถบัส: 3 } },
//   { date: '5 เม.ย. 2569', total: 159, by_type: { รถตู้: 8, มินิบัส: 4, รถบัส: 3 } },
//   { date: '6 เม.ย. 2569', total: 145, by_type: { รถตู้: 7, มินิบัส: 3, รถบัส: 2 } },
// ]

// // ============================================================
// // AUTH LOGS (sample)
// // ============================================================
// export const mockAuthLogs: AuthenticationLog[] = [
//   { id: 'alog-1', user_id: 'emp-1', result: 'success', event: 'login', ip: '192.168.1.10', platform: 'web', device: 'pc', user_agent: 'Mozilla/5.0', remark: null, is_status: 'active', created_at: '2026-04-06T06:30:00Z' },
//   { id: 'alog-2', user_id: 'emp-2', result: 'success', event: 'login', ip: '192.168.1.11', platform: 'mobile', device: 'android', user_agent: null, remark: null, is_status: 'active', created_at: '2026-04-06T06:45:00Z' },
//   { id: 'alog-3', user_id: null, result: 'failure', event: 'login', ip: '10.0.0.5', platform: 'web', device: 'pc', user_agent: 'Mozilla/5.0', remark: 'Wrong password', is_status: 'active', created_at: '2026-04-06T06:50:00Z' },
// ]

// // ============================================================
// // MODULES (sample)
// // ============================================================
// export const mockModules: Module[] = [
//   { id: 'mod-1', code: 'EMP', name_th: 'จัดการพนักงาน', name_en: 'Employee Management', domain: '/admin/employees', type: 'admin', setting: 'main', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'mod-2', code: 'DRV', name_th: 'จัดการคนขับ', name_en: 'Driver Management', domain: '/admin/drivers', type: 'admin', setting: 'main', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'mod-3', code: 'VEH', name_th: 'จัดการยานพาหนะ', name_en: 'Vehicle Management', domain: '/admin/vehicles', type: 'admin', setting: 'configuration', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'mod-4', code: 'RES', name_th: 'จัดการการจอง', name_en: 'Reserve Management', domain: '/admin/reserves', type: 'admin', setting: 'main', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
//   { id: 'mod-5', code: 'RPT', name_th: 'รายงาน', name_en: 'Reports', domain: '/admin/reports', type: 'admin', setting: 'report', is_status: 'active', created_by: 'sys', created_at: '2025-01-01T00:00:00Z', updated_by: null, updated_at: null },
// ]
