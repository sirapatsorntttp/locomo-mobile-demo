# 🚌 LOCOMO — ระบบจัดการรถรับ-ส่งพนักงาน

Next.js 15 · TypeScript · Tailwind CSS · Recharts

---

## 🚀 เริ่มต้นใช้งาน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment
cp .env.example .env.local
# แก้ไข BACKEND_URL ให้ตรงกับ PHP backend

# 3. รัน dev server
npm run dev
# เปิด http://localhost:3000
```

---

## 🗂️ โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx                  ← หน้าแรก (overview)
│   │   ├── employees/                ← employees + employees_defaults
│   │   ├── drivers/                  ← drivers → vehicles → vendors
│   │   ├── vehicles/                 ← vehicles + vehicle_types
│   │   ├── vendors/                  ← vendors + coordinators
│   │   ├── routes/                   ← routes + trips + points
│   │   ├── shifts/                   ← shifts + posts
│   │   ├── reserves/                 ← reserves (การจอง)
│   │   ├── attendances/              ← attendances (RFID/QR scan)
│   │   ├── tracking/                 ← trackings (GPS)
│   │   ├── calendar/                 ← calendars (วันทำงาน/หยุด)
│   │   ├── organization/             ← divisions/departments/sections/lines/levels
│   │   ├── notifications/            ← notifications
│   │   ├── settings/                 ← modules + permissions
│   │   └── reports/
│   │       ├── usage/                ← สถิติ reserves vs attendances
│   │       └── auth/                 ← authentication_logs
│   └── api/                          ← Next.js API routes (proxy to PHP)
│       ├── auth/login/               ← POST login
│       ├── employees/                ← GET list, POST create
│       ├── vehicles/
│       ├── routes/
│       ├── reserves/                 ← GET list, POST create
│       ├── attendances/              ← GET list, POST scan
│       └── dashboard/               ← GET stats
├── components/
│   ├── layout/ (Sidebar, Header)
│   ├── dashboard/ (tables, charts)
│   └── ui/ (Button, Badge, Card, Table, StatCard)
├── lib/
│   ├── mock-data.ts                  ← ข้อมูลทดสอบตรงกับ DB schema
│   ├── utils.ts                      ← helpers + label maps
│   └── api-config.ts                 ← backendFetch wrapper
└── types/index.ts                    ← TypeScript types ครบทุก table
```

---

## 🗄️ DB Schema → หน้า Mapping

| DB Table(s) | หน้า | URL |
|-------------|------|-----|
| `employees` + `employees_defaults` | พนักงาน | `/dashboard/employees` |
| `drivers` → `drivers_vehicles` → `drivers_vehicles_vendors` | คนขับ | `/dashboard/drivers` |
| `vehicles` + `vehicle_types` | ยานพาหนะ | `/dashboard/vehicles` |
| `vendors` + `coordinators` + `coordinator_types` | Vendors | `/dashboard/vendors` |
| `routes` + `trips` + `points` | เส้นทาง | `/dashboard/routes` |
| `shifts` + `posts` | กะ & Posts | `/dashboard/shifts` |
| `reserves` | การจอง | `/dashboard/reserves` |
| `attendances` | สแกนขึ้นรถ | `/dashboard/attendances` |
| `trackings` | GPS | `/dashboard/tracking` |
| `calendars` | ปฏิทิน | `/dashboard/calendar` |
| `divisions` + `departments` + `sections` + `lines` + `levels` | องค์กร | `/dashboard/organization` |
| `notifications` | แจ้งเตือน | `/dashboard/notifications` |
| `modules` + `permissions` | ตั้งค่า | `/dashboard/settings` |
| `authentication_logs` | บันทึก Login | `/dashboard/reports/auth` |

---

## 🔌 เชื่อมต่อ PHP Backend

ตั้งค่า `.env.local`:
```
BACKEND_URL=http://your-php-backend.com
```

API routes ใน `src/app/api/` ทำหน้าที่ proxy ไปยัง PHP backend อัตโนมัติ

---

## ✅ TypeScript Enums ที่ครอบคลุม

Status, Language, ShiftType, ShiftSchedule, ShiftDirection,
ReserveStatus, AttendanceStatus, AttendanceType, CalendarType,
ModuleType, ModuleSettingType, ActionType, DeleteType,
AuthenticationType, AuthenticationEvent, DriverEvent,
NotificationType, PlatformType, DeviceType
