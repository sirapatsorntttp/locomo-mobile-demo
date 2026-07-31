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
import type { ScheduleItem, ScheduleType } from "@/lib/mockData";
import type { Lang } from "@/lib/i18n";

interface Props {
  item: ScheduleItem;
  onClose: () => void;
}

// icon/สี ตาม type (label ดึงจาก t() แยก)
const typeIcon: Record<ScheduleType, { icon: React.ElementType; bg: string }> =
  {
    holiday: { icon: PartyPopper, bg: "bg-red-500" },
    booking: { icon: Bus, bg: "bg-blue-500" },
    event: { icon: CalendarIcon, bg: "bg-amber-500" },
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
  const typeLabel = t("scheduleDialog", item.type); // holiday/booking/event
  const dateObj = new Date(item.date);

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
              <h2 className="text-lg font-bold text-white">{item.title}</h2>
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

          {item.time && (
            <DetailRow
              Icon={Clock}
              label={t("scheduleDialog", "time")}
              value={item.time}
            />
          )}

          {item.subtitle && (
            <DetailRow
              Icon={MapPin}
              label={t("scheduleDialog", "detail")}
              value={item.subtitle}
            />
          )}

          {item.routeCode && (
            <DetailRow
              Icon={Bus}
              label={t("scheduleDialog", "route")}
              value={item.routeCode}
            />
          )}

          {item.driver && (
            <DetailRow
              Icon={User}
              label={t("scheduleDialog", "driver")}
              value={item.driver}
            />
          )}

          {item.detail && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {item.detail}
            </div>
          )}

          {/* Action */}
          {item.type === "booking" && (
            <button
              type="button"
              className="mt-2 w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
            >
              {t("scheduleDialog", "viewBooking")}
            </button>
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
