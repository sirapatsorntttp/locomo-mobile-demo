export type Lang = "th" | "en";

const d = (th: string, en: string) => ({ th, en });

export const translations = {
  // ── Mobile: Profile ──────────────────────────────────────────
  profile: {
    title: d("การตั้งค่า", "Settings"),
    subtitle: d(
      "จัดการข้อมูลส่วนตัวของคุณ",
      "Manage your personal information",
    ),
    personalInfo: d("ข้อมูลส่วนตัว", "Personal Information"),
    transportInfo: d("ข้อมูลรถรับส่ง", "Transport Information"),
    routeIn: d("สายรถรับเข้า", "Inbound Route"),
    pickupPoint: d("จุดขึ้นรถ", "Pickup Point"),
    routeOut: d("สายรถรับออก", "Outbound Route"),
    dropoffPoint: d("จุดลงรถ", "Drop-off Point"),
    notSet: d("ยังไม่ได้กำหนด", "Not set"),
    loading: d("กำลังโหลดข้อมูลรถรับส่ง...", "Loading transport info..."),
    noEmployee: d("ไม่พบข้อมูลพนักงาน", "Employee not found"),
    logout: d("ออกจากระบบ", "Sign Out"),
    edit: d("แก้ไข", "Edit"),
  },

  // ── Mobile: History ──────────────────────────────────────────
  history: {
    title: d("ประวัติการจอง", "Booking History"),
    subtitle: d("รายการจองทั้งหมดของคุณ", "All your bookings"),
    tabPending: d("รออนุมัติ", "Pending"),
    tabApproved: d("อนุมัติแล้ว", "Approved"),
    tabCancelled: d("ยกเลิก", "Cancelled"),
    noData: d("ไม่พบข้อมูล", "No data found"),
    // status badge
    statusPending: d("รออนุมัติ", "Pending"),
    statusApproved: d("อนุมัติแล้ว", "Approved"),
    statusFinished: d("เสร็จสิ้น", "Finished"),
    statusCancelled: d("ยกเลิก", "Cancelled"),
    // card
    noRoute: d("ยังไม่ได้กำหนดเส้นทาง", "No route assigned"),
    pickupPrefix: d("จุดรับส่ง", "Stop"),
    routePrefix: d("รหัสสาย", "Route"),
    dirIn: d("รับเข้า", "Inbound"),
    dirOut: d("รับออก", "Outbound"),
  },

  // ── Mobile: Home ─────────────────────────────────────────────
  home: {
    hello: d("สวัสดี", "Hello"),
    welcome: d("ยินดีต้อนรับสู่  LOCOMO", "Welcome To LOCOMO"),
    user: d("ผู้ใช้งาน", "User"),
    search: d("ค้นหา", "Search"),
    loading: d("กำลังโหลด...", "Loading..."),
    // menu
    mainMenu: d("เมนูหลัก", "Main Menu"),
    menuReserve: d("จองรถ", "Reserve"),
    menuHistory: d("ประวัติการจอง", "History"),
    menuFeedback: d("รายงานข้อเสนอแนะ", "Feedback"),
    menuContact: d("ติดต่อเรา", "Contact"),
    // trip
    yourTrip: d("การเดินทางของคุณ", "Your Trip"),
    viewAll: d("ทั้งหมด", "View All"),
    origin: d("ต้นทาง", "Origin"),
    destination: d("ปลายทาง", "Destination"),
    noTrip: d("ยังไม่มีการเดินทาง", "No trips yet"),
  },

  // ── Mobile: Reserve (booking) ────────────────────────────────
  reserve: {
    title: d("การจองรถ", "Reserve"),
    // ประเภทการจอง
    bookingType: d("เลือกประเภทการจอง", "Booking Type"),
    typeNormal: d("รอบปกติ", "Regular"),
    typeOt: d("รอบ OT", "Overtime"),
    // วันที่
    selectDate: d("เลือกวันที่เดินทาง", "Travel Date"),
    startDate: d("วันที่เริ่มต้น", "Start Date"),
    endDate: d("วันที่สิ้นสุด", "End Date"),
    // เส้นทาง
    selectRoute: d("เลือกเส้นทาง", "Route Type"),
    roundTrip: d("จองรถไป-กลับ", "Round Trip"),
    oneWay: d("จองรถขาเดียว", "One Way"),
    // shift
    selectInbound: d("เลือกรอบขาเข้า", "Inbound Shift"),
    selectOutbound: d("เลือกรอบขาออก", "Outbound Shift"),
    dirIn: d("รับเข้า", "Inbound"),
    dirOut: d("รับออก", "Outbound"),
    noShift: d("ยังไม่มีรอบเดินทาง", "No shifts available"),
    // route fields
    routeLabel: d("สายรถ", "Route"),
    pointLabel: d("จุดรับส่ง", "Stop"),
    notSet: d("ยังไม่ได้กำหนด", "Not set"),
    // note
    noteLabel: d("หมายเหตุ (ถ้ามี)", "Note (optional)"),
    notePlaceholder: d(
      "โปรดระบุรายละเอียดเพิ่มเติม",
      "Please provide additional details",
    ),
    // buttons
    save: d("บันทึก", "Save"),
    saving: d("กำลังบันทึก...", "Saving..."),
    cancel: d("ยกเลิก", "Cancel"),
    // day names
    days: d(
      "วันอาทิตย์,วันจันทร์,วันอังคาร,วันพุธ,วันพฤหัสฯ,วันศุกร์,วันเสาร์",
      "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    ),
  },

  // ── Mobile: QR Code scan ─────────────────────────────────────
  qrcode: {
    title: d("สแกน QR Code", "Scan QR Code"),
    instruction: d(
      "สแกน QR Code เพื่อเช็คอิน / เช็คเอาท์",
      "Scan QR Code to check-in / check-out",
    ),
    frameHint: d(
      "วาง QR Code ให้อยู่ในกรอบเพื่อทำการสแกน",
      "Place the QR Code within the frame to scan",
    ),
    upload: d("อัปโหลด", "Upload"),
  },

  // ── Mobile: Schedule (calendar) ──────────────────────────────
  schedule: {
    title: d("ปฏิทินการทำงาน", "Work Calendar"),
    holiday: d("วันหยุด", "Holiday"),
    booking: d("การจอง", "Booking"),
    dirIn: d("รับเข้า", "Inbound"),
    dirOut: d("รับออก", "Outbound"),
    more: d("เพิ่มเติม", "more"),
    // ชื่อเดือน (12 ตัว คั่นด้วย ,)
    months: d(
      "มกราคม,กุมภาพันธ์,มีนาคม,เมษายน,พฤษภาคม,มิถุนายน,กรกฎาคม,สิงหาคม,กันยายน,ตุลาคม,พฤศจิกายน,ธันวาคม",
      "January,February,March,April,May,June,July,August,September,October,November,December",
    ),
  },
  // ── Mobile: Feedback list ────────────────────────────────────
  feedbackList: {
    title: d("รายงานข้อเสนอแนะ", "Feedback Reports"),
    startDate: d("วันที่เริ่มต้น", "Start Date"),
    endDate: d("วันที่สิ้นสุด", "End Date"),
    search: d("ค้นหา", "Search"),
    myReports: d("รายงานของฉัน", "My Reports"),
    all: d("ทั้งหมด", "All"),
    noData: d("ไม่มีข้อมูล", "No data"),
    new: d("เพิ่มใหม่", "New"),
    noSubject: d("(ไม่มีหัวข้อ)", "(No subject)"),
    noRoute: d("ไม่ระบุเส้นทาง", "No route"),
    days: d(
      "วันอาทิตย์,วันจันทร์,วันอังคาร,วันพุธ,วันพฤหัสฯ,วันศุกร์,วันเสาร์",
      "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    ),
    daysShort: d(
      "อาทิตย์,จันทร์,อังคาร,พุธ,พฤหัสบดี,ศุกร์,เสาร์",
      "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    ),
  },

  // ── Mobile: Notification ─────────────────────────────────────
  notify: {
    title: d("แจ้งเตือน", "Notifications"),
    subtitle: d("ประวัติการแจ้งเตือนของคุณ", "Your notification history"),
    tabAll: d("ทั้งหมด", "All"),
    tabImportant: d("สำคัญ", "Important"),
    tabBooking: d("การจอง", "Booking"),
    noData: d("ไม่มีการแจ้งเตือน", "No notifications"),
    timeUnit: d("น.", ""),
  },
  // ── Mobile: Contact ──────────────────────────────────────────
  contact: {
    title: d("ติดต่อเรา", "Contact"),
    subtitle: d(
      "ช่องทางติดต่อและขอความช่วยเหลือ",
      "Contact channels and support",
    ),
    rideContact: d("ติดต่อเกี่ยวกับการขึ้นรถ", "Ride Support"),
    systemContact: d("ติดต่อเกี่ยวกับระบบ", "System Support"),
    viewMap: d("ดูแผนที่", "View Map"),
    officeHours: d("เวลาทำการ", "Office Hours"),
    weekdays: d("จันทร์ - ศุกร์", "Mon - Fri"),
    weekend: d(
      "เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์",
      "Sat-Sun & Public Holidays",
    ),
    workTime: d("8.00 - 17.00 น.", "8:00 - 17:00"),
    closed: d("ปิดทำการ", "Closed"),
    officeName: d("สำนักงานขนส่ง", "Transport Office"),
    labelCall: d("โทร", "Call"),
    labelEmail: d("อีเมล", "Email"),
  },

  // ── Mobile: Tracking ─────────────────────────────────────────
  tracking: {
    title: d("ติดตามรถ", "Tracking"),
    subtitle: d("แสดงตำแหน่งรถแบบเรียลไทม์", "Real-time vehicle location"),
    search: d("ค้นหาสายรถ / เส้นทาง", "Search route / line"),
    totalVehicles: d("รถทั้งหมด", "Total Vehicles"),
    running: d("กำลังวิ่ง", "Running"),
    todayList: d("รายการรถวันนี้", "Today's Vehicles"),
    noData: d("ไม่พบข้อมูล", "No data found"),
    onRoute: d("กำลังวิ่ง", "On route"),
    notStarted: d("ยังไม่ออก", "Not started"),
    origin: d("ต้นทาง", "Origin"),
    destination: d("ปลายทาง", "Destination"),
    progress: d("เดินทาง", "Progress"),
  },

  // ── Mobile: Tracking Detail ──────────────────────────────────
  trackingDetail: {
    title: d("ติดตามรถ", "Track Vehicle"),
    noData: d("ไม่พบข้อมูล", "No data found"),
    back: d("กลับ", "Back"),
    etaComing: d("รถกำลังจะมาเวลา", "Vehicle arriving at"),
    etaUnit: d("น.", ""),
    etaMinutes: d("นาที", "min"),
    etaPrepare: d(
      "โปรดเตรียมตัว ณ จุดขึ้นรถก่อนเวลา 5 นาที",
      "Please be ready at the pickup point 5 minutes early",
    ),
    bookingDetail: d("รายละเอียดการจอง", "Booking Details"),
    route: d("สาย", "Route"),
    tripType: d("ประเภทการเดินทาง", "Trip Type"),
    bookingDate: d("วันที่จอง", "Booking Date"),
    time: d("เวลา", "Time"),
    vehicleNo: d("รถคันที่", "Vehicle No."),
    cancelBooking: d("ยกเลิกการจอง", "Cancel Booking"),
  },

  // ── Mobile: Booking Dialog ───────────────────────────────────
  bookingDialog: {
    bookedAt: d("จองเมื่อ", "Booked on"),
    empCode: d("รหัสพนักงาน", "Employee Code"),
    status: d("สถานะ", "Status"),
    statusPending: d("รออนุมัติ", "Pending"),
    statusApproved: d("อนุมัติแล้ว", "Approved"),
    statusFinished: d("เสร็จสิ้น", "Finished"),
    statusCancelled: d("ยกเลิก", "Cancelled"),
    detail: d("รายละเอียด", "Details"),
    travelDate: d("วันที่เดินทาง", "Travel Date"),
    round: d("รอบ", "Round"),
    pickupTime: d("เวลารับ", "Pickup Time"),
    route: d("สายรถ", "Route"),
    pickupPoint: d("จุดรับส่ง", "Stop"),
    note: d("หมายเหตุ", "Note"),
    roundIn: d("รอบรับเข้า", "Inbound"),
    roundOut: d("รอบรับออก", "Outbound"),
    noRoute: d("ยังไม่ได้กำหนดเส้นทาง", "No route assigned"),
    noPoint: d("ยังไม่ได้กำหนดจุดรับส่ง", "No stop assigned"),
    cancelBooking: d("ยกเลิกการจอง", "Cancel Booking"),
    save: d("บันทึก", "Save"),
    saving: d("กำลังบันทึก...", "Saving..."),
    close: d("ปิด", "Close"),
  },

  // ── Mobile: New Feedback ─────────────────────────────────────
  newFeedback: {
    title: d("รายงานข้อเสนอแนะ", "Feedback"),
    dateLabel: d("วันที่แสดงความคิดเห็น", "Comment Date"),
    dateHint: d(
      "* แสดงความคิดเห็นได้เฉพาะการเดินทางที่เสร็จสิ้นในวันนี้เท่านั้น",
      "* You can only comment on trips completed today",
    ),
    noTripTitle: d(
      "ยังไม่มีการเดินทางที่เสร็จสิ้นในวันนี้",
      "No completed trips today",
    ),
    noTripDesc: d(
      "สามารถแสดงความคิดเห็นได้หลังจากการเดินทางเสร็จสิ้นแล้ว และภายในวันเดียวกันเท่านั้น",
      "You can comment only after a trip is completed, and within the same day",
    ),
    selectTrip: d("เลือกการเดินทาง", "Select Trip"),
    feedbackLabel: d("ข้อเสนอแนะ", "Feedback"),
    subjectPlaceholder: d("หัวเรื่อง", "Subject"),
    detailPlaceholder: d("รายละเอียด.....", "Details....."),
    save: d("บันทึก", "Save"),
    saving: d("กำลังบันทึก...", "Saving..."),
    dirIn: d("รับเข้า", "Inbound"),
    dirOut: d("รับออก", "Outbound"),
    noRoute: d("ยังไม่ได้กำหนดเส้นทาง", "No route assigned"),
  },

  // ── Mobile: Calendar Dialog ──────────────────────────────────
  calendarDialog: {
    booked: d("มีการจองแล้ว", "Booked"),
    cancelledBooking: d("ยกเลิกการจอง", "Cancelled"),
    cancel: d("ยกเลิก", "Cancel"),
    confirm: d("บันทึก", "Confirm"),
    months: d(
      "มกราคม,กุมภาพันธ์,มีนาคม,เมษายน,พฤษภาคม,มิถุนายน,กรกฎาคม,สิงหาคม,กันยายน,ตุลาคม,พฤศจิกายน,ธันวาคม",
      "January,February,March,April,May,June,July,August,September,October,November,December",
    ),
    dayNames: d("อา,จ,อ,พ,พฤ,ศ,ส", "Sun,Mon,Tue,Wed,Thu,Fri,Sat"),
  },

  // ── Mobile: Feedback Dialog ──────────────────────────────────
  feedbackDialog: {
    detail: d("รายละเอียด", "Details"),
    noRoute: d("ไม่ระบุเส้นทาง", "No route"),
    noDetail: d("(ไม่มีรายละเอียด)", "(No details)"),
    close: d("ปิด", "Close"),
    daysShort: d(
      "อาทิตย์,จันทร์,อังคาร,พุธ,พฤหัสบดี,ศุกร์,เสาร์",
      "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    ),
  },

  // ── Mobile: Custom Select ────────────────────────────────────
  customSelect: {
    placeholder: d("เลือกข้อมูล", "Select"),
    noOptions: d("ไม่มีตัวเลือก", "No options"),
  },

  // ── Mobile: Edit Route Dialog ────────────────────────────────
  editRoute: {
    empCode: d("รหัสพนักงาน", "Employee Code"),
    tripIn: d("Trip In (ขาเข้า)", "Trip In (Inbound)"),
    tripOut: d("Trip Out (ขาออก)", "Trip Out (Outbound)"),
    route: d("สายรถ", "Route"),
    noRoute: d("ไม่มีสายรถ", "No routes"),
    pickupPoint: d("จุดรับส่ง", "Pickup Point"),
    selectPoint: d("เลือกจุดรับส่ง", "Select stop"),
    selectRouteFirst: d("กรุณาเลือกสายรถก่อน", "Please select a route first"),
    cancel: d("ยกเลิก", "Cancel"),
    save: d("บันทึก", "Save"),
    saving: d("กำลังบันทึก...", "Saving..."),
  },

  // ── Mobile: Notify Dialog ────────────────────────────────────
  notifyDialog: {
    detail: d("รายละเอียด", "Details"),
    noDetail: d("ไม่มีรายละเอียดเพิ่มเติม", "No additional details"),
    close: d("ปิด", "Close"),
  },

  // ── Mobile: Schedule Dialog ──────────────────────────────────
  scheduleDialog: {
    holiday: d("วันหยุด", "Holiday"),
    booking: d("การจอง", "Booking"),
    event: d("กิจกรรม", "Event"),
    date: d("วันที่", "Date"),
    time: d("เวลา", "Time"),
    detail: d("รายละเอียด", "Details"),
    route: d("สายรถ", "Route"),
    driver: d("คนขับ", "Driver"),
    viewBooking: d("ดูรายละเอียดการจอง", "View Booking Details"),
    close: d("ปิด", "Close"),
    datePrefix: d("วัน", ""),
    dateSuffix: d("ที่", ""),
    days: d(
      "อาทิตย์,จันทร์,อังคาร,พุธ,พฤหัสบดี,ศุกร์,เสาร์",
      "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    ),
  },

  // ── Mobile: Side Menu ────────────────────────────────────────
  menu: {
    home: d("หน้าหลัก", "Home"),
    calendar: d("ปฏิทิน", "Calendar"),
    reserve: d("จองรถ", "Reserve"),
    history: d("ประวัติการจอง", "History"),
    qrcode: d("สแกน QR CODE", "QR Code"),
    tracking: d("ติดตามรถ", "Tracking"),
    comment: d("รายงานข้อเสนอแนะ", "Feedback"),
    notify: d("การแจ้งเตือน", "Notifications"),
    contact: d("ติดต่อเรา", "Contact"),
    settings: d("การตั้งค่า", "Settings"),
    logout: d("ออกจากระบบ", "Sign Out"),
  },

  // ── Login ────────────────────────────────────────────────────
  login: {
    heroTitle1: d("จัดการกองรถ", "Smart Fleet"),
    heroTitle2: d("อัจฉริยะ", "Management"),
    heroTitle3: d("ครบวงจร", "All-in-One"),
    heroDesc: d(
      "ระบบบริหารรถรับ-ส่งพนักงานแบบ real-time พร้อม AI optimizing เส้นทาง, GPS tracking, และการจัดการกองรถในที่เดียว",
      "Real-time employee shuttle management with AI route optimization, GPS tracking, and fleet management in one platform.",
    ),
    statVehicles: d("ยานพาหนะ", "Vehicles"),
    statEmployees: d("พนักงาน", "Employees"),
    featureControlTower: d("ติดตามเที่ยวรถ real-time", "Track trips real-time"),
    featureFleet: d("ซ่อมบำรุง · ประวัติรถ", "Maintenance · History"),
    descAdmin: d("จัดการทั้งระบบ", "Full system admin"),
    descManager: d("จัดการกองรถ & เส้นทาง", "Manage fleet & routes"),
    descDriver: d("คนขับรถ · เข้าดูเที่ยวรถ", "Driver · View trips"),
    welcomeBack: d("ยินดีต้อนรับ", "Welcome Back"),
    loginSubtitle: d(
      "เข้าสู่ระบบเพื่อจัดการการจองรถของคุณ",
      "Sign in to manage your fleet",
    ),
    orFillManually: d("หรือกรอกข้อมูลเอง", "Or fill in manually"),
    usernamePlaceholder: d("กรอก username", "Enter username"),
    passwordPlaceholder: d("กรอก password", "Enter password"),
    forgotPassword: d("ลืมรหัสผ่าน?", "Forgot password?"),
    rememberMe: d("จดจำการเข้าสู่ระบบ", "Remember me"),
    signingIn: d("กำลังเข้าสู่ระบบ...", "Signing in..."),
    signIn: d("เข้าสู่ระบบ", "Sign In"),
    usernameRequired: d("กรุณากรอก Username", "Please enter your username"),
    passwordRequired: d("กรุณากรอก Password", "Please enter your password"),
  },
} as const;

export type Translations = typeof translations;
