"use client";

import { useEffect } from "react";
import { X, Bus, Bell, CheckCircle2, XCircle } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";

export interface NotifyItem {
  id: string;
  type: "important" | "booking";
  category: "booking-success" | "booking-cancel" | "time" | "booking-approved";
  title: string;
  subtitle: string;
  extra?: string;
  time: string;
  read: boolean;
}

interface Props {
  item: NotifyItem;
  onClose: () => void;
}

export default function NotifyDialog({ item, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore();
  const { t } = useLang();

  useEffect(() => {
    openDialog();
    document.body.style.overflow = "hidden";
    return () => {
      closeDialog();
      document.body.style.overflow = "";
    };
  }, [openDialog, closeDialog]);

  const iconConfig = getIconConfig(item.category);

  // รวม subtitle + extra เป็นรายละเอียดเต็ม
  const detailText = [item.subtitle, item.extra].filter(Boolean).join("\n");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("notifyDialog", "close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto px-6 pb-6 pt-6">
          {/* Head */}
          <div className="flex items-start gap-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconConfig.bg}`}
            >
              <iconConfig.Icon size={26} className="text-white" />
            </div>
            <div className="flex-1 pr-8">
              <p className="text-base font-bold text-slate-800">{item.title}</p>
              <p className="mt-1 text-xs text-slate-400">{item.time}</p>
            </div>
          </div>

          <hr className="my-4 border-slate-100" />

          {/* รายละเอียด */}
          <h3 className="mb-3 text-sm font-bold text-blue-600">
            {t("notifyDialog", "detail")}
          </h3>
          <div className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
            {detailText || t("notifyDialog", "noDetail")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function getIconConfig(category: NotifyItem["category"]) {
  switch (category) {
    case "booking-success":
      return { Icon: Bus, bg: "bg-blue-500" };
    case "booking-approved":
      return { Icon: CheckCircle2, bg: "bg-green-500" };
    case "booking-cancel":
      return { Icon: XCircle, bg: "bg-red-500" };
    case "time":
      return { Icon: Bell, bg: "bg-amber-500" };
    default:
      return { Icon: Bell, bg: "bg-slate-400" };
  }
}
