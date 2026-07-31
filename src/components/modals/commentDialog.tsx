"use client";

import { useEffect } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";
import type { FeedbackComment } from "@/types";
import type { Lang } from "@/lib/i18n";

interface Props {
  item: FeedbackComment;
  onClose: () => void;
}

// bilingual date + ชื่อวัน
const formatCommentDate = (lang: Lang, daysStr: string, iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const days = daysStr.split(",");

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
    return `${days[d.getDay()]} ${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
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
  return `${days[d.getDay()]} ${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export default function FeedbackDialog({ item, onClose }: Props) {
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

  const route = item.routes;
  const routeName = route
    ? `${(lang === "th" ? route.name_th : route.name_en) || route.name_th || route.name_en || ""} (${route.code ?? ""})`
    : t("feedbackDialog", "noRoute");

  const dateText = formatCommentDate(
    lang,
    t("feedbackDialog", "daysShort"),
    item.date_at,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full rounded-3xl bg-white p-6 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("feedbackDialog", "close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
        >
          <X size={16} />
        </button>

        {/* ชื่อสาย */}
        <h2 className="pr-8 text-lg font-bold text-slate-800">{routeName}</h2>

        {/* วันที่ */}
        <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarIcon size={14} className="text-slate-500" />
          <span>{dateText}</span>
        </div>

        {/* หัวข้อ */}
        {item.subject && (
          <p className="mt-2 text-sm font-semibold text-blue-600">
            {item.subject}
          </p>
        )}

        <hr className="my-4 border-slate-200" />

        {/* รายละเอียด */}
        <h3 className="text-sm font-bold text-slate-800">
          {t("feedbackDialog", "detail")}
        </h3>
        <div className="mt-3 min-h-[180px] rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 whitespace-pre-wrap">
          {item.detail || t("feedbackDialog", "noDetail")}
        </div>
      </div>
    </div>
  );
}
