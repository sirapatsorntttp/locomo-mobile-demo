"use client";

import { useState, useMemo, useEffect } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";

import ScheduleDialog from "@/components/modals/ScheduleDialog";
import type { Reserve, Calendar } from "@/types";
import { useCalendarStore } from "@/lib/stores/useCalendarStore";

type ScheduleType = "holiday" | "booking" | "event";

interface ScheduleItem {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  type: ScheduleType;
  reserve?: Reserve;
  calendar?: Calendar;
}

// default_time (ISO datetime) → "08:00"
const fmtTime = (t?: string) => {
  if (!t) return "";
  const d = new Date(t);
  if (!isNaN(d.getTime()))
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return t.slice(0, 5);
};

export default function SchedulePage() {
  const openMenu = useUIStore((s) => s.openMenu);
  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { reserves, loadReserves } = useReserveStore();
  const { calendars, loadCalendars } = useCalendarStore();

  const [viewMonth, setViewMonth] = useState(4); // May
  const [viewYear, setViewYear] = useState(2026);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
    loadCalendars(); // วันหยุด (master data — ควรมี guard ใน store)
  }, [loadEmployees, loadCalendars]);

  // โหลดการจองของเดือนที่ดูอยู่ (เฉพาะของ emp ตัวเอง)
  useEffect(() => {
    if (!currentEmployee?.id) return;
    const mm = String(viewMonth + 1).padStart(2, "0");
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    loadReserves({
      employee_id: currentEmployee.id,
      date_from: `${viewYear}-${mm}-01`,
      date_to: `${viewYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
    });
  }, [currentEmployee?.id, viewMonth, viewYear, loadReserves]);

  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const toKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // ── รวม วันหยุด + การจอง เป็น schedule items ──
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    const push = (key: string, item: ScheduleItem) => {
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    };

    // 1) วันหยุด (holiday) จาก calendars
    calendars.forEach((c) => {
      const dateKey = (c.date_at ?? "").slice(0, 10);
      if (!dateKey) return;
      push(dateKey, {
        id: `cal-${c.id}`,
        date: dateKey,
        title: (c as any).name || (c as any).title || "วันหยุด",
        type: "holiday",
        calendar: c,
      });
    });

    // 2) การจอง (booking) จาก reserves — ข้ามที่ยกเลิก
    reserves.forEach((r) => {
      if (r.is_state === "canceled") return;
      const dateKey = (r.travel_date ?? "").slice(0, 10);
      if (!dateKey) return;

      const dir = r.shift?.trip_direction === "inbound" ? "รับเข้า" : "รับออก";
      const time = fmtTime(r.shift?.default_time);
      const routeCode = r.route?.code ? ` · ${r.route.code}` : "";

      push(dateKey, {
        id: `res-${r.id}`,
        date: dateKey,
        title: `${dir} ${time}${routeCode}`.trim(),
        type: "booking",
        reserve: r,
      });
    });

    return map;
  }, [calendars, reserves]);

  const selected = useMemo(() => {
    for (const list of scheduleMap.values()) {
      const found = list.find((i) => i.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [scheduleMap, selectedId]);

  /* grid 6×7 */
  const totalCells = 42;
  const cells = Array.from({ length: totalCells }).map((_, idx) => {
    const dayNum = idx - firstDayOfMonth + 1;
    if (dayNum < 1)
      return { day: daysInPrevMonth + dayNum, currentMonth: false, key: "" };
    if (dayNum > daysInMonth)
      return { day: dayNum - daysInMonth, currentMonth: false, key: "" };
    return {
      day: dayNum,
      currentMonth: true,
      key: toKey(viewYear, viewMonth, dayNum),
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}

      <div
        className="relative rounded-b-[40px] px-7 pt-12 pb-6 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-700/70 to-blue-500/100" />

        <div className="relative z-10">
          {/* Title + Menu */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                ปฏิทินการทำงาน
              </h1>
              <p className="mt-1 mb-4 text-xs text-white/90 drop-shadow">
                ตารางการเดินทางและวันหยุดของคุณ
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

          {/* Month switcher */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="min-w-[180px] text-center text-lg font-bold text-white drop-shadow">
              {monthNames[viewMonth]} {viewYear + 543}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 mx-5 flex items-center justify-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
        <LegendDot color="bg-red-200" label="วันหยุด" />
        <LegendDot color="bg-blue-200" label="การจอง" />
      </div>

      {/* Calendar Grid */}
      <div className="mt-4 mx-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 bg-blue-500">
          {dayNames.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-[10px] font-bold ${
                i === 0 || i === 6 ? "text-red-100" : "text-white"
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const items = cell.currentMonth
              ? (scheduleMap.get(cell.key) ?? [])
              : [];
            const dow = idx % 7;
            const isWeekend = dow === 0 || dow === 6;
            const isHoliday = items.some((i) => i.type === "holiday");
            const hasBooking = items.some((i) => i.type === "booking");

            return (
              <div
                key={idx}
                className={`min-h-[80px] border-b border-r border-slate-200 p-1 ${
                  !cell.currentMonth
                    ? "bg-slate-50 text-slate-300"
                    : isHoliday
                      ? "bg-red-50"
                      : hasBooking
                        ? "bg-blue-100"
                        : "bg-white"
                }`}
              >
                <div
                  className={`px-1 text-xs font-semibold ${
                    !cell.currentMonth
                      ? "text-slate-300"
                      : isHoliday || isWeekend
                        ? "text-red-400"
                        : "text-slate-700"
                  }`}
                >
                  {cell.day}
                </div>

                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 2).map((item) => (
                    <EventPill
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))}
                  {items.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(items[2].id)}
                      className="w-full text-left text-[9px] font-semibold text-slate-500 hover:underline"
                    >
                      +{items.length - 2} เพิ่มเติม
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog */}
      {selected && (
        <ScheduleDialog item={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

/* ─── Sub Components ─── */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  );
}

function EventPill({
  item,
  onClick,
}: {
  item: ScheduleItem;
  onClick: () => void;
}) {
  const styles: Record<ScheduleType, string> = {
    holiday: "bg-red-100 text-red-700 hover:bg-red-200",
    booking: "bg-blue-200 text-blue-700 hover:bg-blue-200",
    event: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-semibold transition ${styles[item.type]}`}
    >
      {item.title}
    </button>
  );
}
