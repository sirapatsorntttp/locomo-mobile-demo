"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, ChevronLeft, Bus, Clock, MapPin } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import { useCommentStore } from "@/lib/stores/comment.store";
import { useLang } from "@/lib/lang-context";
import type { Reserve } from "@/types";
import type { Lang } from "@/lib/i18n";

const fmtTime = (t?: string) => {
  if (!t) return "";
  const d = new Date(t);
  if (!isNaN(d.getTime()))
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return t.slice(0, 5);
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// วันนี้ bilingual
const todayDisplay = (lang: Lang) => {
  const d = new Date();
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

export default function NewFeedbackPage() {
  const router = useRouter();
  const openMenu = useUIStore((s) => s.openMenu);

  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { reserves, loadReserves } = useReserveStore();
  const { addComment } = useCommentStore();
  const { lang, t } = useLang();

  const [selectedReserveId, setSelectedReserveId] = useState("");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!currentEmployee?.id) return;
    const today = todayKey();
    loadReserves({
      employee_id: currentEmployee.id,
      is_state: "finished",
      date_from: today,
      date_to: today,
    });
  }, [currentEmployee?.id, loadReserves]);

  const commentableReserves = useMemo(() => {
    const today = todayKey();
    return reserves.filter(
      (r) =>
        r.is_state === "finished" &&
        (r.travel_date ?? "").slice(0, 10) === today,
    );
  }, [reserves]);

  const selectedReserve = commentableReserves.find(
    (r) => r.id === selectedReserveId,
  );

  const canSubmit =
    !!selectedReserve && subject.trim() !== "" && detail.trim() !== "";

  const handleSave = async () => {
    if (!selectedReserve || !currentEmployee?.id) return;
    try {
      setSaving(true);
      await addComment({
        employee_id: currentEmployee.id,
        route_id: selectedReserve.route_id,
        date_at: todayKey(),
        subject: subject.trim(),
        detail: detail.trim(),
      });
      router.push("/mobile/comment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div
        className="relative z-20 rounded-b-[40px] px-5 pt-8 pb-8 overflow-hidden bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-700/70 to-blue-500/90" />

        <div className="relative z-10 flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="back"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-bold drop-shadow-md">
            {t("newFeedback", "title")}
          </h1>

          <button
            type="button"
            onClick={openMenu}
            aria-label="Menu"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-5 px-5">
        {/* วันที่วันนี้ */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            {t("newFeedback", "dateLabel")}
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-800">
            {todayDisplay(lang)}
          </p>
          <p className="mt-1 text-[11px] text-amber-600">
            {t("newFeedback", "dateHint")}
          </p>
        </div>

        {commentableReserves.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bus size={26} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {t("newFeedback", "noTripTitle")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t("newFeedback", "noTripDesc")}
            </p>
          </div>
        ) : (
          <>
            {/* เลือกการเดินทาง */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {t("newFeedback", "selectTrip")}{" "}
                <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {commentableReserves.map((r) => (
                  <ReserveOption
                    key={r.id}
                    reserve={r}
                    selected={r.id === selectedReserveId}
                    onClick={() => setSelectedReserveId(r.id)}
                  />
                ))}
              </div>
            </div>

            {/* ข้อเสนอแนะ */}
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {t("newFeedback", "feedbackLabel")}{" "}
                <span className="text-red-500">*</span>
              </p>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("newFeedback", "subjectPlaceholder")}
                maxLength={100}
                className="w-full rounded-full bg-slate-100 px-5 py-3 text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={7}
                maxLength={255}
                placeholder={t("newFeedback", "detailPlaceholder")}
                className="mt-3 w-full resize-none rounded-2xl bg-slate-100 px-5 py-3 text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">
                {detail.length}/255
              </p>
            </div>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSubmit || saving}
              className="w-full rounded-full bg-blue-600 py-3.5 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? t("newFeedback", "saving") : t("newFeedback", "save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Reserve Option Card ─── */
function ReserveOption({
  reserve,
  selected,
  onClick,
}: {
  reserve: Reserve;
  selected: boolean;
  onClick: () => void;
}) {
  const { lang, t } = useLang();

  const dir =
    reserve.shift?.trip_direction === "inbound"
      ? t("newFeedback", "dirIn")
      : t("newFeedback", "dirOut");
  const time = fmtTime(reserve.shift?.default_time);
  const routeCode = reserve.route?.code ?? "-";
  const routeName =
    (lang === "th"
      ? reserve.route?.name_th || reserve.route?.name_en
      : reserve.route?.name_en || reserve.route?.name_th) ||
    t("newFeedback", "noRoute");
  const pointName =
    (lang === "th"
      ? reserve.point?.name_th || reserve.point?.name_en
      : reserve.point?.name_en || reserve.point?.name_th) || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white ${
          selected ? "bg-blue-600" : "bg-slate-400"
        }`}
      >
        {routeCode}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{routeName}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {dir} {time}
          </span>
          {pointName && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} /> {pointName}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
