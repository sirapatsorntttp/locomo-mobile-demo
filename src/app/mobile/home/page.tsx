// src/app/mobile/home/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Search,
  CarFront,
  Clock,
  MessageSquareWarning,
  Phone,
  PhoneCall,
  MoveRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import { useTrackingStore } from "@/lib/stores/tracking.store";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";

export default function MobileHome() {
  const router = useRouter();

  const { profile, isAuthenticated, loadProfile } = useAuthStore();
  const [checked, setChecked] = useState(false);

  const openMenu = useUIStore((s) => s.openMenu);
  const { t, lang } = useLang();

  const employees = useEmployeeStore((s) => s.employees);
  const loadEmployees = useEmployeeStore((s) => s.loadEmployees);

  const reserves = useReserveStore((s) => s.reserves);
  const loadReserves = useReserveStore((s) => s.loadReserves);

  // ── ดึง driver/vehicle จากแหล่งเดียวกับหน้า Tracking ──
  const trackingDetail = useTrackingStore((s) => s.detail);
  const loadByReserve = useTrackingStore((s) => s.loadByReserve);

  // ── โหลด Profile + Employees ตอนเข้าหน้า ──
  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([loadProfile(), loadEmployees()]);
      } finally {
        setChecked(true);
      }
    };

    initialize();
  }, [loadProfile, loadEmployees]);

  // ── ยังไม่ login เด้งไปหน้า login ──
  useEffect(() => {
    if (checked && !isAuthenticated) {
      router.replace("/login");
    }
  }, [checked, isAuthenticated, router]);

  // ── หา employee ของผู้ใช้ที่ login ──
  const currentEmployee = useMemo(
    () => employees.find((employee) => employee.code === profile?.code),
    [employees, profile?.code],
  );

  // ── โหลด reserve จริงของพนักงาน + polling ──
  useEffect(() => {
    const employeeId = currentEmployee?.id;

    if (!employeeId) return;

    loadReserves({ employee_id: employeeId });

    // อัปเดตเมื่อ Admin approve ขณะที่ผู้ใช้ยังอยู่หน้า Home
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;

      loadReserves({ employee_id: employeeId, force: true });
    }, 10_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentEmployee?.id, loadReserves]);

  // ── helper แปลงวันที่ / เวลา ──
  const formatDate = (iso?: string | Date | null) => {
    if (!iso) return "-";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";

    if (lang === "en") {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (value?: string | Date | null) => {
    if (!value) return "-";

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
        date.getUTCMinutes(),
      ).padStart(2, "0")}`;
    }

    return String(value).slice(0, 5);
  };

  // ── เลือกทริปที่จะแสดง (approved/waiting ที่ใกล้ที่สุด) ──
  const currentReserve = useMemo(() => {
    const activeStates = ["approved", "waiting"];

    return reserves
      .filter((reserve) => activeStates.includes(reserve.is_state))
      .sort((a, b) => {
        const dateA = new Date(a.travel_date ?? 0).getTime();
        const dateB = new Date(b.travel_date ?? 0).getTime();
        return dateA - dateB;
      })[0];
  }, [reserves]);

  // ── โหลด tracking (driver/vehicle) ของทริปที่จะโชว์ ──
  useEffect(() => {
    if (currentReserve?.id) {
      loadByReserve(currentReserve.id);
    }
  }, [currentReserve?.id, loadByReserve]);

  // ── แปลง reserve → ข้อมูลสำหรับ Card (โครงเดิม) ──
  const route = useMemo(() => {
    if (!currentReserve) return null;

    const reserve = currentReserve as any;
    const routeData = reserve.route;
    const shift = reserve.shift;
    const point = reserve.point;
    const employee = reserve.employee;

    // ✅ driver/vehicle มาจาก tracking store (แหล่งเดียวกับหน้า Tracking)
    //    เช็ค id ให้ตรงกัน กัน detail ค้างจากทริปก่อนหน้า
    const isSameReserve =
      (trackingDetail as any)?.reserve?.id === currentReserve.id;

    const driver = isSameReserve ? (trackingDetail as any)?.driver : null;
    const vehicle = isSameReserve ? (trackingDetail as any)?.vehicle : null;

    const routeName =
      (lang === "th"
        ? routeData?.name_th || routeData?.name_en
        : routeData?.name_en || routeData?.name_th) || "-";

    const pointName =
      (lang === "th"
        ? point?.name_th || point?.name_en
        : point?.name_en || point?.name_th) || "-";

    const originName =
      (lang === "th"
        ? routeData?.origin_name_th ||
          routeData?.start_name_th ||
          routeData?.name_th
        : routeData?.origin_name_en ||
          routeData?.start_name_en ||
          routeData?.name_en) || routeName;

    const destinationName =
      (lang === "th"
        ? routeData?.destination_name_th || routeData?.end_name_th
        : routeData?.destination_name_en || routeData?.end_name_en) ||
      pointName;

    // ชื่อคนขับ (ถ้ามีจาก tracking)
    const driverName = driver
      ? lang === "th"
        ? `${driver.first_name_th ?? ""} ${driver.last_name_th ?? ""}`.trim()
        : `${driver.first_name_en ?? ""} ${driver.last_name_en ?? ""}`.trim()
      : "";

    // ชื่อพนักงานผู้จอง (fallback เหมือนหน้า Tracking)
    const empName =
      lang === "th"
        ? `${employee?.first_name_th ?? ""} ${employee?.last_name_th ?? ""}`.trim()
        : `${employee?.first_name_en ?? ""} ${employee?.last_name_en ?? ""}`.trim();

    const tripType =
      shift?.trip_direction === "inbound"
        ? t("home", "dirIn")
        : shift?.trip_direction === "outbound"
          ? t("home", "dirOut")
          : "";

    return {
      // ต้องเป็น reserve.id เพราะ tracking/[id] รับ reserveId
      id: currentReserve.id,

      routeCode: routeData?.code ?? "-",
      routeName,
      bookingDate: formatDate(currentReserve.travel_date),
      tripType,

      startTime: formatTime(shift?.default_time),
      endTime: formatTime(
        shift?.end_time ?? shift?.arrival_time ?? shift?.default_time,
      ),

      from: originName,
      to: destinationName,

      // มี driver → คนขับ, ไม่มี → พนักงานผู้จอง (เหมือน Tracking)
      driver: driver ? driverName : empName || "-",
      phone: driver
        ? (driver.tel ?? driver.phone ?? "-")
        : (employee?.code ?? "-"),

      vehicleNo: vehicle?.code ?? vehicle?.vehicle_no ?? "-",
      plateNo:
        vehicle?.license ?? vehicle?.license_plate ?? vehicle?.plate_no ?? "-",
    };
  }, [currentReserve, trackingDetail, lang, t]);

  // ── กันจอกระพริบ ──
  if (!checked || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">{t("home", "loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 ">
      {/* Header */}
      <div
        className="relative rounded-b-[40px] px-5 pt-12 pb-16 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-white/40 bg-white/20 overflow-hidden flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                {profile?.firstName?.charAt(0) ?? "U"}
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight drop-shadow-md">
                  {t("home", "hello")},{" "}
                  {profile?.firstName ?? t("home", "user")}
                </p>
                <p className="text-white/90 text-xs mt-0.5 drop-shadow">
                  {t("home", "welcome")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/mobile/notify")}
                aria-label={t("home", "menuHistory")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <Bell size={18} className="text-slate-700" />
              </button>

              <button
                type="button"
                onClick={openMenu}
                aria-label="Menu"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-5 py-3.5 border border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={t("home", "search")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* เมนูหลัก */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">
          {t("home", "mainMenu")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MenuCard
            icon={
              <CarFront className="text-blue-600" size={35} strokeWidth={1.8} />
            }
            label={t("home", "menuReserve")}
            onClick={() => router.push("/mobile/reserve")}
          />
          <MenuCard
            icon={
              <Clock className="text-blue-600" size={35} strokeWidth={1.8} />
            }
            label={t("home", "menuHistory")}
            onClick={() => router.push("/mobile/history")}
          />
          <MenuCard
            icon={
              <MessageSquareWarning
                className="text-blue-600"
                size={35}
                strokeWidth={1.8}
              />
            }
            label={t("home", "menuFeedback")}
            onClick={() => router.push("/mobile/comment")}
          />
          <MenuCard
            icon={
              <Phone className="text-blue-600" size={35} strokeWidth={1.8} />
            }
            label={t("home", "menuContact")}
            onClick={() => router.push("/mobile/contact")}
          />
        </div>
      </div>

      {/* การเดินทางของคุณ */}
      <div className="px-5 mt-7 ">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-800">
            {t("home", "yourTrip")}
          </h2>
          <button
            onClick={() => router.push("/mobile/tracking")}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            {t("home", "viewAll")}
          </button>
        </div>

        {route ? (
          /* Trip Card */
          <div
            onClick={() => router.push(`/mobile/tracking/${route.id}`)}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {route.routeCode}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{route.bookingDate}</p>
                <h3 className="text-md font-bold text-slate-800 leading-tight mt-1">
                  {route.routeName}
                </h3>
              </div>
              <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">
                {route.tripType}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 flex justify-center min-w-0">
                <div className="inline-block max-w-full">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-[10px] text-slate-400">
                      {t("home", "origin")}
                    </p>
                    <p className="text-[14px] font-bold text-blue-600">
                      {route.startTime}
                    </p>
                  </div>
                  <div className="bg-[#CDD6DE] rounded-full px-3 py-1">
                    <p className="text-[12px] text-center text-slate-700 font-medium truncate">
                      {route.from}
                    </p>
                  </div>
                </div>
              </div>

              <MoveRight
                size={20}
                className="text-slate-700 flex-shrink-0"
                strokeWidth={2.5}
              />

              <div className="flex-1 flex justify-center min-w-0">
                <div className="inline-block max-w-full">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-[10px] text-slate-400">
                      {t("home", "destination")}
                    </p>
                    <p className="text-[14px] font-bold text-blue-600">
                      {route.endTime}
                    </p>
                  </div>
                  <div className="bg-[#06345C] rounded-full px-3 py-1">
                    <p className="text-[12px] text-center text-white font-medium truncate">
                      {route.to}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-slate-200 my-4" />

            {/* Driver */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <PhoneCall size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  {route.driver}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {route.phone} • {route.vehicleNo} • {route.plateNo}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <CarFront
              size={36}
              strokeWidth={1.5}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {lang === "th" ? "ยังไม่มีการเดินทาง" : "No upcoming trip"}
            </p>
            <button
              type="button"
              onClick={() => router.push("/mobile/reserve")}
              className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white"
            >
              {t("home", "menuReserve")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════ Menu Card Component ═══════ */
function MenuCard({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl shadow-xl border border-slate-200 hover:shadow-md active:scale-[0.98] transition-all p-3 flex flex-col items-center justify-center gap-2 aspect-[5/3]"
    >
      {icon}
      <p className="text-sm font-bold text-slate-800">{label}</p>
    </button>
  );
}
