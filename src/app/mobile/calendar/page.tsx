"use client";

import { useState, useMemo, useEffect } from "react";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import { useCalendarStore } from "@/lib/stores/useCalendarStore";
import { useLang } from "@/lib/lang-context";
import ScheduleDialog from "@/components/modals/ScheduleDialog";
import BookingDialog from "@/components/modals/BookingDialog";
import type { Reserve, Calendar, ScheduleType } from "@/types";

interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  type: ScheduleType;
  reserve?: Reserve;
  calendar?: Calendar;
}

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
  const { lang, t } = useLang();

  const [viewMonth, setViewMonth] = useState(4);
  const [viewYear, setViewYear] = useState(2026);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
    loadCalendars();
  }, [loadEmployees, loadCalendars]);

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

  const monthNames = t("schedule", "months").split(",");
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

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    const push = (key: string, item: ScheduleItem) => {
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    };

    // วันหยุด
    calendars.forEach((c) => {
      const dateKey = (c.date_at ?? "").slice(0, 10);
      if (!dateKey) return;
      const name =
        lang === "th"
          ? (c as any).name_th || (c as any).name || (c as any).title
          : (c as any).name_en || (c as any).name || (c as any).title;
      push(dateKey, {
        id: `cal-${c.id}`,
        date: dateKey,
        title: name || t("schedule", "holiday"),
        type: "holiday",
        calendar: c,
      });
    });

    // การจอง (รวมที่ยกเลิกแล้ว)
    reserves.forEach((r) => {
      const dateKey = (r.travel_date ?? "").slice(0, 10);
      if (!dateKey) return;

      const isCanceled = r.is_state === "canceled";
      const isPending = r.is_state === "waiting";

      const dir =
        r.shift?.trip_direction === "inbound"
          ? t("schedule", "dirIn")
          : t("schedule", "dirOut");
      const time = fmtTime(r.shift?.default_time);
      const routeCode = r.route?.code ? ` · ${r.route.code}` : "";

      const bookingType: ScheduleType = isCanceled
        ? "cancelled"
        : isPending
          ? "pending"
          : "booking";

      const prefix = isCanceled
        ? `${t("schedule", "cancelled")}: `
        : isPending
          ? `${t("scheduleDialog", "pending")}: `
          : "";

      push(dateKey, {
        id: `res-${r.id}`,

        date: dateKey,

        title: `${prefix}${dir} ${time}${routeCode}`.trim(),

        type: bookingType,

        reserve: r,
      });
    });

    return map;
  }, [calendars, reserves, lang, t]);

  const selected = useMemo(() => {
    for (const list of scheduleMap.values()) {
      const found = list.find((i) => i.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [scheduleMap, selectedId]);

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

  // ปี: th=พ.ศ. / en=ค.ศ.
  const displayYear = lang === "th" ? viewYear + 543 : viewYear;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div
        className="relative rounded-b-[40px] px-7 pt-12 pb-6 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-700/70 to-blue-500/100" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl mb-4 font-bold text-white drop-shadow-md">
                {t("schedule", "title")}
              </h1>
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
              {monthNames[viewMonth]} {displayYear}
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
        <LegendDot color="bg-red-200" label={t("schedule", "holiday")} />
        <LegendDot color="bg-blue-200" label={t("schedule", "booking")} />
        <LegendDot color="bg-red-400" label={t("schedule", "cancelled")} />
        <LegendDot
          color="bg-orange-200"
          label={t("scheduleDialog", "pending")}
        />
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
                      +{items.length - 2} {t("schedule", "more")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog */}
      {selected &&
        (selected.reserve ? (
          // ทุกการจอง (รวมยกเลิก) → BookingDialog เดียวกับหน้า History (ดูอย่างเดียว)
          <BookingDialog
            booking={selected.reserve}
            onClose={() => setSelectedId(null)}
            readOnly
          />
        ) : (
          // วันหยุด → ScheduleDialog เดิม
          <ScheduleDialog item={selected} onClose={() => setSelectedId(null)} />
        ))}
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
    pending: "bg-orange-200 text-orange-700 hover:bg-orange-300",
    cancelled: "bg-red-100 text-red-600  hover:bg-red-200",
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
