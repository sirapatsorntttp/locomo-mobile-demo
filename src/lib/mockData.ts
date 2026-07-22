export type BookingStatus = 'pending' | 'approved' | 'cancelled'

export interface Booking {
  id: string
  routeCode: string
  from: string
  to: string
  date: string
  time: string
  empCode: string
  empName: string
  status: BookingStatus
  bookingDate: string
  bookingTime: string
  // ✅ วันที่จริงสำหรับเทียบในปฏิทิน
  startDate: string // 'YYYY-MM-DD'
  endDate: string
}

export const mockHistory: Booking[] = [
  {
    id: 'B001',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 4 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved',
    bookingDate: '04/05/69',
    bookingTime: '09:45 น.',
    startDate: '2026-05-04',
    endDate: '2026-05-06',
  },
  {
    id: 'B002',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 11 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved',
    bookingDate: '11/05/69',
    bookingTime: '09:45 น.',
    startDate: '2026-05-11',
    endDate: '2026-05-13',
  },
  {
    id: 'B003',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 18 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'approved',
    bookingDate: '18/05/69',
    bookingTime: '09:45 น.',
    startDate: '2026-05-18',
    endDate: '2026-05-20',
  },
  {
    id: 'B004',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 25 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'pending',
    bookingDate: '25/05/69',
    bookingTime: '09:45 น.',
    startDate: '2026-05-25',
    endDate: '2026-05-25',
  },
  {
    id: 'B005',
    routeCode: 'A01',
    from: 'ตลาดบ้านโพธิ์',
    to: 'โรงงาน',
    date: 'วันจันทร์ที่ 28 พ.ค. 2569',
    time: '09:45 น.',
    empCode: 'EMP12754',
    empName: 'สมชาย ใจดี',
    status: 'cancelled',
    bookingDate: '28/05/69',
    bookingTime: '09:45 น.',
    startDate: '2026-05-28',
    endDate: '2026-05-28',
  },
]

/* ─── Helper: แปลง Booking → ExistingBooking (สำหรับ Calendar) ─── */
export function toExistingBookings(bookings: Booking[]) {
  return bookings
    .filter((b) => b.status !== 'pending') // เอาเฉพาะที่อนุมัติ/ยกเลิก
    .map((b) => ({
      id: b.id,
      startDate: b.startDate,
      endDate: b.endDate,
      status:
        b.status === 'approved'
          ? ('booked' as const)
          : ('cancelled' as const),
    }))
}


export type ScheduleType = 'holiday' | 'booking' | 'event'

export interface ScheduleItem {
  id: string
  date: string // 'YYYY-MM-DD'
  type: ScheduleType
  title: string
  subtitle?: string
  detail?: string
  time?: string
  routeCode?: string
  driver?: string
}

export const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    date: '2026-05-01',
    type: 'holiday',
    title: 'วันแรงงานแห่งชาติ',
    subtitle: 'วันหยุดนักขัตฤกษ์',
  },
  {
    id: '2',
    date: '2026-05-04',
    type: 'booking',
    title: 'จองรถ A01',
    subtitle: 'ตลาดบ้านโพธิ์ → โรงงาน',
    time: '07:15 น.',
    routeCode: 'A01',
    driver: 'คุณสมชาย ใจดี',
    detail: 'รถออกตรงเวลา หากมาไม่ทันจะข้ามรอบ',
  },
  {
    id: '3',
    date: '2026-05-08',
    type: 'booking',
    title: 'จองรถ A02',
    subtitle: 'ตลาดบ้านโพธิ์ → โรงงาน',
    time: '17:30 น.',
    routeCode: 'A02',
    driver: 'คุณวิทยา สายรุ้ง',
  },
  {
    id: '4',
    date: '2026-05-11',
    type: 'event',
    title: 'ประชุมประจำเดือน',
    subtitle: 'ห้องประชุมใหญ่ ชั้น 3',
    time: '13:00 น.',
  },
  {
    id: '5',
    date: '2026-05-14',
    type: 'booking',
    title: 'จองรถ A01',
    subtitle: 'ตลาดบ้านโพธิ์ → โรงงาน',
    time: '07:15 น.',
    routeCode: 'A01',
    driver: 'คุณสมชาย ใจดี',
  },
  {
    id: '6',
    date: '2026-05-18',
    type: 'booking',
    title: 'จองรถ A03',
    subtitle: 'ตลาดบ้านโพธิ์ → โรงงาน',
    time: '07:15 น.',
    routeCode: 'A03',
    driver: 'คุณอนันต์ ยิ้มแย้ม',
  },
  {
    id: '7',
    date: '2026-05-20',
    type: 'holiday',
    title: 'วันวิสาขบูชา',
    subtitle: 'วันหยุดนักขัตฤกษ์',
  },
  {
    id: '8',
    date: '2026-05-25',
    type: 'booking',
    title: 'จองรถ A01',
    subtitle: 'ตลาดบ้านโพธิ์ → โรงงาน',
    time: '07:15 น.',
    routeCode: 'A01',
    driver: 'คุณสมชาย ใจดี',
  },
]


export const mockRoutes = [
  {
    id: 'A01',
    routeCode: 'A01',
    routeName: 'ตลาดบ้านโพธิ์-โรงงาน',
    tripType: 'ไป-กลับ',
    status: 'on-route',
    from: 'หน้าหมู่บ้านโคโนฮะ',
    to: 'โรงงาน',
    startTime: '07:20',
    endTime: '08:15',
    bookingDate: '14 พฤษภาคม 2569',
    bookingTime: '10:30 น.',
    driver: 'พี่สมชาย ใจดี',
    phone: '081-xxx-xxxx',
    vehicleNo: 'C12',
    vehicleName: 'Rolls-Royce',
    plateNo: '30-1234 ชลบุรี',
    currentStop: 'ป้ายกาญจนา',
    progress: 65,
    etaMinutes: 10,
    etaTime: '07:50',
  },
  {
    id: 'A02',
    routeCode: 'B02',
    routeName: 'ตลาดคลองสวน-โรงงาน',
    tripType: 'ไป-กลับ',
    status: 'waiting',
    from: 'หน้าปั๊มปตท.',
    to: 'โรงงาน',
    startTime: '08:00',
    endTime: '08:45',
    bookingDate: '14 พฤษภาคม 2569',
    bookingTime: '11:00 น.',
    driver: 'พี่สมศักดิ์ ขับดี',
    phone: '082-xxx-xxxx',
    vehicleNo: 'C08',
    vehicleName: 'Toyota Commuter',
    plateNo: '30-5050 ชลบุรี',
    currentStop: 'ยังไม่ออก',
    progress: 0,
    etaMinutes: 30,
    etaTime: '08:00',
  },
]