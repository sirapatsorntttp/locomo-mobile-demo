"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useCommentStore } from "@/lib/stores/comment.store";
import { useLang } from "@/lib/lang-context";
import FeedbackDialog from "@/components/modals/commentDialog";
import CalendarDialog from "@/components/modals/CalendarDialog";
import type { FeedbackComment } from "@/types";
import type { Lang } from "@/lib/i18n";

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// bilingual date formatters
const makeFormatDate = (lang: Lang) => (d: Date) => {
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
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
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
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export default function FeedbackPage() {
  const router = useRouter();
  const openMenu = useUIStore((s) => s.openMenu);

  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { comments, loadComments } = useCommentStore();
  const { lang, t } = useLang();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date>(new Date(2026, 4, 1));
  const [endDate, setEndDate] = useState<Date>(new Date(2026, 8, 1));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
    loadComments();
  }, [loadEmployees, loadComments]);

  const formatDate = makeFormatDate(lang);

  const dayOfWeek = (d: Date) => {
    const days = t("feedbackList", "days").split(",");
    return days[d.getDay()];
  };

  // format วันที่ในการ์ด (มีชื่อวัน)
  const formatCommentDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const days = t("feedbackList", "daysShort").split(",");
    const dateStr = formatDate(d);
    return `${days[d.getDay()]} ${dateStr}`;
  };

  const filtered = useMemo(() => {
    const kw = search.trim();
    const from = toKey(startDate);
    const to = toKey(endDate);

    return comments.filter((c) => {
      if (c.employee_id !== currentEmployee?.id) return false;
      const dateKey = (c.date_at ?? "").slice(0, 10);
      if (dateKey < from || dateKey > to) return false;
      if (kw) {
        const hit =
          (c.subject ?? "").includes(kw) ||
          (c.detail ?? "").includes(kw) ||
          (c.routes?.code ?? "").includes(kw) ||
          (c.routes?.name_th ?? "").includes(kw) ||
          (c.routes?.name_en ?? "").includes(kw);
        if (!hit) return false;
      }
      return true;
    });
  }, [comments, currentEmployee?.id, startDate, endDate, search]);

  const selected = comments.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div
        className="relative rounded-b-[40px] px-8 pt-10 pb-10 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-700/70 to-blue-500/90" />
        <div className="relative flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {t("feedbackList", "title")}
          </h1>
          <button
            type="button"
            onClick={openMenu}
            aria-label="Menu"
            className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-5 space-y-4 px-5">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <DateCard
            label={t("feedbackList", "startDate")}
            date={formatDate(startDate)}
            day={dayOfWeek(startDate)}
            onClick={() => setCalendarOpen(true)}
          />
          <DateCard
            label={t("feedbackList", "endDate")}
            onClick={() => setCalendarOpen(true)}
            date={formatDate(endDate)}
            day={dayOfWeek(endDate)}
          />
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("feedbackList", "search")}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-slate-800">
            {t("feedbackList", "myReports")}
          </h2>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-slate-500"
          >
            {t("feedbackList", "all")}
            <ChevronDown size={14} />
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              formatDate={formatCommentDate}
              onClick={() => setSelectedId(item.id)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
              <p className="text-sm text-slate-400">
                {t("feedbackList", "noData")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAB Add */}
      <button
        type="button"
        onClick={() => router.push("/mobile/comment/new")}
        aria-label={t("feedbackList", "new")}
        className="fixed bottom-28 left-5 right-5 z-30 flex items-center justify-center gap-2 rounded-full bg-amber-500 py-2 font-bold text-white shadow-lg transition hover:bg-orange-600 active:scale-[0.98]"
      >
        <Plus size={20} strokeWidth={2} />
        <span className="text-base">{t("feedbackList", "new")}</span>
      </button>

      {/* Detail Dialog */}
      {selected && (
        <FeedbackDialog item={selected} onClose={() => setSelectedId(null)} />
      )}

      {/* Calendar Dialog */}
      {calendarOpen && (
        <CalendarDialog
          startDate={startDate}
          endDate={endDate}
          onClose={() => setCalendarOpen(false)}
          onConfirm={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setCalendarOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub Components ─── */
function DateCard({
  label,
  date,
  day,
  onClick,
}: {
  label: string;
  date: string;
  day: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-left transition hover:border-blue-400"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
        <CalendarIcon size={16} className="text-white" />
      </div>
      <div className="flex-1 leading-tight space-y-1">
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-[13px] font-bold text-slate-800">{date}</p>
        <p className="text-[11px] text-slate-500">{day}</p>
      </div>
    </button>
  );
}

function FeedbackCard({
  item,
  formatDate,
  onClick,
}: {
  item: FeedbackComment;
  formatDate: (iso?: string) => string;
  onClick: () => void;
}) {
  const { lang, t } = useLang();
  const route = item.routes;
  const routeName = route
    ? `${(lang === "th" ? route.name_th : route.name_en) || route.name_th || route.name_en || ""} (${route.code ?? ""})`
    : t("feedbackList", "noRoute");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-600">
        {route?.code ?? "—"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-slate-800">
          {item.subject || t("feedbackList", "noSubject")}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{routeName}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <CalendarIcon size={11} />
          <span>{formatDate(item.date_at)}</span>
        </div>
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  );
}
