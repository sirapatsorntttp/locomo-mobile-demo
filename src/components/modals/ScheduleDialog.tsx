"use client";

import { useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Bus,
  PartyPopper,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";
import type { Reserve, Calendar, ScheduleType } from "@/types";

// นิยาม type เอง ไม่พึ่ง mockData
export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  type: ScheduleType;
  reserve?: Reserve;
  calendar?: Calendar;
}

interface Props {
  item: ScheduleItem;
  onClose: () => void;
}

// icon/สี ตาม type
const typeIcon: Record<ScheduleType, { icon: React.ElementType; bg: string }> =
  {
    holiday: { icon: PartyPopper, bg: "bg-red-500" },
    booking: { icon: Bus, bg: "bg-blue-500" },
    pending: { icon: Bus, bg: "bg-orange-700" },
    cancelled: { icon: Bus, bg: "bg-red-500" },
    event: { icon: CalendarIcon, bg: "bg-amber-500" },
  };

const fmtTime = (t?: string) => {
  if (!t) return "";
  const d = new Date(t);
  if (!isNaN(d.getTime()))
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes(),
    ).padStart(2, "0")}`;
  return t.slice(0, 5);
};

export default function ScheduleDialog({ item, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore();
  const { lang, t } = useLang();

  useEffect(() => {
    openDialog();
    document.body.style.overflow = "hidden";
    return () => {
      closeDialog();
      document.body.style.overflow = "";
    };
  }, [openDialog, closeDialog]);

  const cfg = typeIcon[item.type];
  const typeLabel = t("scheduleDialog", item.type);
  const dateObj = new Date(item.date);

  // ── ดึงข้อมูลจริงจาก reserve / calendar ──
  const reserve = item.reserve;
  const calendar = item.calendar as any;

  // เวลา (จากกะของการจอง)
  const timeText = reserve ? fmtTime(reserve.shift?.default_time) : "";

  // ทิศทาง (ขาเข้า/ขาออก)
  const dirText = reserve
    ? reserve.shift?.trip_direction === "inbound"
      ? t("newFeedback", "dirIn")
      : reserve.shift?.trip_direction === "outbound"
        ? t("newFeedback", "dirOut")
        : ""
    : "";

  // เส้นทาง
  const routeName = reserve
    ? (lang === "th"
        ? reserve.route?.name_th || reserve.route?.name_en
        : reserve.route?.name_en || reserve.route?.name_th) || ""
    : "";
  const routeCode = reserve?.route?.code ?? "";
  const routeText =
    routeCode || routeName ? `${routeCode} ${routeName}`.trim() : "";

  // จุดรับ
  const pointName = reserve
    ? (lang === "th"
        ? reserve.point?.name_th || reserve.point?.name_en
        : reserve.point?.name_en || reserve.point?.name_th) || ""
    : "";

  // พนักงานผู้จอง
  const empName = reserve
    ? lang === "th"
      ? `${reserve.employee?.first_name_th ?? ""} ${reserve.employee?.last_name_th ?? ""}`.trim()
      : `${reserve.employee?.first_name_en ?? ""} ${reserve.employee?.last_name_en ?? ""}`.trim()
    : "";

  // ชื่อวันหยุด (จาก calendar จริง)
  const holidayName = calendar
    ? lang === "th"
      ? calendar.name_th || calendar.name || calendar.title
      : calendar.name_en || calendar.name || calendar.title
    : "";

  const formatDate = () => {
    const days = t("scheduleDialog", "days").split(",");
    const dayName = days[dateObj.getDay()];

    if (lang === "en") {
      const m = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${dayName}, ${dateObj.getDate()} ${m[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }
    const m = [
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
    // "วันจันทร์ที่ 3 พ.ค. 2569"
    return `วัน${dayName}ที่ ${dateObj.getDate()} ${m[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("scheduleDialog", "close")}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
        >
          <X size={16} />
        </button>

        {/* Colored header */}
        <div className={`${cfg.bg} px-6 pb-5 pt-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/25">
              <cfg.icon size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/80">{typeLabel}</p>
              <h2 className="text-lg font-bold text-white">
                {item.type === "holiday"
                  ? holidayName || item.title
                  : item.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <DetailRow
            Icon={CalendarIcon}
            label={t("scheduleDialog", "date")}
            value={formatDate()}
          />

          {/* เวลา + ทิศทาง (การจอง) */}
          {timeText && (
            <DetailRow
              Icon={Clock}
              label={t("scheduleDialog", "time")}
              value={dirText ? `${timeText} · ${dirText}` : timeText}
            />
          )}

          {/* จุดรับ (การจอง) */}
          {pointName && (
            <DetailRow
              Icon={MapPin}
              label={t("scheduleDialog", "detail")}
              value={pointName}
            />
          )}

          {/* เส้นทาง (การจอง) */}
          {routeText && (
            <DetailRow
              Icon={Bus}
              label={t("scheduleDialog", "route")}
              value={routeText}
            />
          )}

          {/* พนักงานผู้จอง (การจอง) */}
          {empName && (
            <DetailRow
              Icon={User}
              label={t("scheduleDialog", "driver")}
              value={empName}
            />
          )}

          {/* หมายเหตุการจอง */}
          {reserve?.remark && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {reserve.remark}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-blue-500" />
      <div className="flex flex-1 items-start justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="text-right text-sm font-medium text-slate-800">
          {value}
        </span>
      </div>
    </div>
  );
}
