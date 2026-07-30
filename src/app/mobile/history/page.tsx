"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
} from "lucide-react";
import BookingDialog from "@/components/modals/BookingDialog";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import type { Reserve } from "@/types";

type TabType = "pending" | "approved" | "cancelled";

// map tab (UI) -> is_state (DB)
const tabToStates: Record<TabType, string[]> = {
  pending: ["waiting"],
  approved: ["approved", "finished"],
  cancelled: ["canceled"],
};

// map is_state (DB) -> tab (UI) สำหรับ badge
const stateToTab = (state: string): TabType => {
  if (state === "waiting") return "pending";
  if (state === "approved" || state === "finished") return "approved";
  return "cancelled"; // canceled
};

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openMenu = useUIStore((s) => s.openMenu);
  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { reserves, loadReserves } = useReserveStore();

  // หา employee ตัวเองจาก code
  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // โหลด reserve เฉพาะของ employee ตัวเอง (ยิงเมื่อรู้ id แล้ว)
  useEffect(() => {
    if (currentEmployee?.id) {
      loadReserves({ employee_id: currentEmployee.id });
    }
  }, [currentEmployee?.id, loadReserves]);

  const filtered = useMemo(
    () => reserves.filter((r) => tabToStates[tab].includes(r.is_state)),
    [reserves, tab],
  );

  const selectedBooking = reserves.find((r) => r.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ─── Header ─── */}
      <div
        className="relative rounded-b-[40px] px-7 pt-12 pb-16 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                ประวัติการจอง
              </h1>
              <p className="mt-1 text-xs text-white/90 drop-shadow">
                รายการจองทั้งหมดของคุณ
              </p>
            </div>

            <button
              type="button"
              onClick={openMenu}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="relative z-20 -mt-8 mx-5">
        <div className="flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TabButton
            label="รออนุมัติ"
            active={tab === "pending"}
            onClick={() => setTab("pending")}
          />
          <TabButton
            label="อนุมัติแล้ว"
            active={tab === "approved"}
            onClick={() => setTab("approved")}
          />
          <TabButton
            label="ยกเลิก"
            active={tab === "cancelled"}
            onClick={() => setTab("cancelled")}
          />
        </div>
      </div>

      {/* ─── Card List ─── */}
      <div className="mt-6 space-y-3 px-5">
        {filtered.map((item) => (
          <BookingCard
            key={item.id}
            item={item}
            onClick={() => setSelectedId(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-sm text-slate-400">ไม่พบข้อมูล</p>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {selectedBooking && (
        <BookingDialog
          booking={selectedBooking}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/* ═══════ Tab Button ═══════ */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

/* ═══════ Booking Card ═══════ */
function BookingCard({
  item,
  onClick,
}: {
  item: Reserve;
  onClick?: () => void;
}) {
  const uiTab = stateToTab(item.is_state);

  const statusConfig = {
    pending: {
      label: "รออนุมัติ",
      icon: <Clock size={12} />,
      className: "bg-amber-100 text-amber-700",
    },
    approved: {
      label: item.is_state === "finished" ? "เสร็จสิ้น" : "อนุมัติแล้ว",
      icon: <CheckCircle2 size={12} />,
      className: "bg-green-100 text-green-700",
    },
    cancelled: {
      label: "ยกเลิก",
      icon: <XCircle size={12} />,
      className: "bg-red-100 text-red-600",
    },
  };
  const status = statusConfig[uiTab];

  const codeBg = {
    pending: "bg-amber-500",
    approved: "bg-green-500",
    cancelled: "bg-red-500",
  }[uiTab];

  // route ดึงผ่าน point (Reserve ไม่มี field route ตรงๆ)
  const route = item.route;
  const routeCode = route?.code ?? "-";
  const routeName = route?.name_th || route?.name_en || "ยังไม่ได้กำหนดเส้นทาง";
  const pointName = item.point?.name_th || item.point?.name_en || "";

  // travel_date -> "3 พ.ค. 2569"
  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const fmtTime = (t?: string) => {
    if (!t) return "";
    const d = new Date(t);
    if (!isNaN(d.getTime())) {
      return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    }
    return t.slice(0, 5);
  };

  const timeText = fmtTime(item.shift?.default_time);
  const dirText =
    item.shift?.trip_direction === "inbound"
      ? "รับเข้า"
      : item.shift?.trip_direction === "outbound"
        ? "รับออก"
        : "";

  const empCode = item.employee?.code ?? "";
  const empName =
    `${item.employee?.first_name_th ?? ""} ${item.employee?.last_name_th ?? ""}`.trim();

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-4 text-left 
        hover:shadow-md active:scale-[0.99] transition-all"
    >
      {/* Row 1: Code + Route Name + Status */}
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl ${codeBg} flex items-center justify-center 
            text-white font-bold text-[12px] flex-shrink-0`}
        >
          {routeCode}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800 truncate">
            {routeName}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {pointName ? `จุดรับส่ง ${pointName}` : `รหัสสาย ${routeCode}`}
          </p>
        </div>

        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${status.className}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-slate-200 my-3" />

      {/* Row 2: Date + Employee */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={14} className="flex-shrink-0 text-slate-400" />
          <p className="text-xs">
            {formatDate(item.travel_date)}
            {timeText && (
              <>
                <span className="ml-2 text-slate-400">•</span>
                <span className="ml-2">{timeText}</span>
              </>
            )}
            {dirText && (
              <>
                <span className="ml-2 text-slate-400">•</span>
                <span className="ml-2 text-orange-500">{dirText}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <User size={14} className="flex-shrink-0 text-slate-400" />
          <p className="text-xs">
            <span>{empCode}</span>
            <span className="ml-2">{empName}</span>
          </p>
        </div>
      </div>
    </button>
  );
}
