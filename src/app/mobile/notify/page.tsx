"use client";

import { useState, useMemo, useEffect } from "react";
import { Menu, Bus, Bell, CheckCircle2, XCircle } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useNotificationStore } from "@/lib/stores/notification.store";
import { useLang } from "@/lib/lang-context";
import NotifyDialog, { NotifyItem } from "@/components/modals/NotifyDialog";
import type { AppNotification } from "@/types";
import type { Lang } from "@/lib/i18n";

type TabKey = "all" | "important" | "booking";

const toCategory = (type: string): NotifyItem["category"] => {
  if (type === "approved") return "booking-approved";
  if (type === "canceled") return "booking-cancel";
  if (type === "finished") return "booking-approved";
  if (type === "reminder") return "time";
  return "booking-success";
};

const toTabType = (type: string): "important" | "booking" => {
  if (type === "reminder") return "important";
  return "booking";
};

// map + format time ตามภาษา
const makeToNotifyItem =
  (lang: Lang, timeUnit: string) =>
  (n: AppNotification): NotifyItem => ({
    id: n.id,
    type: toTabType(n.type),
    category: toCategory(n.type),
    title: n.title ?? "",
    subtitle: (n.detail ?? "").split("\n")[0] ?? "",
    extra: (n.detail ?? "").split("\n").slice(1).join("\n"),
    time: n.created_at
      ? new Date(n.created_at).toLocaleTimeString(
          lang === "th" ? "th-TH" : "en-GB",
          { hour: "2-digit", minute: "2-digit" },
        ) + (timeUnit ? ` ${timeUnit}` : "")
      : "",
    read: n.is_status === "read",
  });

export default function NotifyPage() {
  const openMenu = useUIStore((s) => s.openMenu);
  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { notifications, loadNotifications, markAsRead } =
    useNotificationStore();
  const { lang, t } = useLang();

  const [tab, setTab] = useState<TabKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!currentEmployee?.id) return;
    loadNotifications(currentEmployee.id);
    const interval = setInterval(
      () => loadNotifications(currentEmployee.id),
      30000,
    );
    return () => clearInterval(interval);
  }, [currentEmployee?.id, loadNotifications]);

  const items = useMemo(() => {
    const mapper = makeToNotifyItem(lang, t("notify", "timeUnit"));
    return notifications.map(mapper);
  }, [notifications, lang, t]);

  const filtered = items.filter((item) => {
    if (tab === "all") return true;
    if (tab === "important") return item.type === "important";
    if (tab === "booking") return item.type === "booking";
    return true;
  });

  const selected = items.find((n) => n.id === selectedId) ?? null;

  const handleOpen = (id: string) => {
    setSelectedId(id);
    const noti = notifications.find((n) => n.id === id);
    if (noti && noti.is_status === "unread") markAsRead(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div
        className="relative overflow-hidden rounded-b-[40px] bg-cover bg-center px-7 pb-16 pt-12"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                {t("notify", "title")}
              </h1>
              <p className="mt-1 text-xs text-white/90 drop-shadow">
                {t("notify", "subtitle")}
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

      {/* Tabs */}
      <div className="relative z-20 mx-5 -mt-8">
        <div className="flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TabButton
            label={t("notify", "tabAll")}
            active={tab === "all"}
            onClick={() => setTab("all")}
          />
          <TabButton
            label={t("notify", "tabImportant")}
            active={tab === "important"}
            onClick={() => setTab("important")}
          />
          <TabButton
            label={t("notify", "tabBooking")}
            active={tab === "booking"}
            onClick={() => setTab("booking")}
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3 px-5">
        {filtered.map((item) => (
          <NotifyCard
            key={item.id}
            item={item}
            onClick={() => handleOpen(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-sm text-slate-400">{t("notify", "noData")}</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      {selected && (
        <NotifyDialog item={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

/* ─── Tab Button ─── */
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
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
        active ? "bg-blue-600 text-white shadow" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Notify Card ─── */
function NotifyCard({
  item,
  onClick,
}: {
  item: NotifyItem;
  onClick: () => void;
}) {
  const iconConfig = getIconConfig(item.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99] ${
        item.read ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconConfig.bg}`}
      >
        <iconConfig.Icon size={22} className="text-white" />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">{item.title}</p>
          <div className="flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-400">
            {!item.read && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            )}
            {item.time}
          </div>
        </div>
        {item.subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
        )}
        {item.extra && (
          <p className="mt-0.5 text-xs text-slate-500">{item.extra}</p>
        )}
      </div>
    </button>
  );
}

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
