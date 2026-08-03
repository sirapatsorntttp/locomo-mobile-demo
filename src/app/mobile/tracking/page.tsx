"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bus,
  MapPin,
  Navigation,
  ChevronRight,
  Search,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import type { Reserve } from "@/types";

const fmtTime = (t?: string) => {
  if (!t) return "";
  const d = new Date(t);
  if (!isNaN(d.getTime()))
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return t.slice(0, 5);
};

export default function TrackingPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const openMenu = useUIStore((s) => s.openMenu);
  const { t, lang } = useLang();

  const { profile } = useAuthStore();
  const { employees, loadEmployees } = useEmployeeStore();
  const { reserves, loadReserves } = useReserveStore();

  const currentEmployee = employees.find((e) => e.code === profile?.code);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // โหลดการจองวันนี้ (เฉพาะ active — waiting/approved/finished)
  useEffect(() => {
    if (!currentEmployee?.id) return;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    loadReserves({
      employee_id: currentEmployee.id,
      date_from: key,
      date_to: key,
    });
  }, [currentEmployee?.id, loadReserves]);

  const trips = useMemo(
    () => reserves.filter((r) => r.is_state !== "canceled"),
    [reserves],
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return trips;
    return trips.filter((r) =>
      `${r.route?.code ?? ""} ${r.route?.name_th ?? ""} ${r.route?.name_en ?? ""}`
        .toLowerCase()
        .includes(kw),
    );
  }, [trips, search]);

  const runningCount = trips.filter((r) => r.is_state === "approved").length;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div
        className="relative rounded-b-[40px] px-7 pt-12 pb-16 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-xl font-bold text-white">
              {t("tracking", "title")}
            </h1>
            <p className="mt-1 text-xs text-white/80">
              {t("tracking", "subtitle")}
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

      {/* Search */}
      <div className="px-5 -mt-8 relative z-10">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-5 py-3.5 border border-slate-100">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder={t("tracking", "search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <StatCard
          label={t("tracking", "totalVehicles")}
          value={String(trips.length)}
          color="blue"
          icon={<Bus size={18} />}
        />
        <StatCard
          label={t("tracking", "running")}
          value={String(runningCount)}
          color="green"
          icon={<Navigation size={18} />}
        />
      </div>

      {/* Trip List */}
      <div className="px-5 mt-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">
          {t("tracking", "todayList")}
        </h2>

        <div className="space-y-3">
          {filtered.map((r) => (
            <TripCard
              key={r.id}
              reserve={r}
              lang={lang}
              t={t}
              fmtTime={fmtTime}
              onClick={() => router.push(`/mobile/tracking/${r.id}`)}
            />
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
              <p className="text-sm text-slate-400">
                {t("tracking", "noData")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════ Stat Card ═══════ */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: "blue" | "green";
  icon: React.ReactNode;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/* ═══════ Trip Card ═══════ */
function TripCard({
  reserve,
  lang,
  t,
  fmtTime,
  onClick,
}: {
  reserve: Reserve;
  lang: "th" | "en";
  t: (s: any, k: any) => string;
  fmtTime: (t?: string) => string;
  onClick?: () => void;
}) {
  const isApproved = reserve.is_state === "approved";
  const routeCode = reserve.route?.code ?? "-";
  const routeName =
    (lang === "th" ? reserve.route?.name_th : reserve.route?.name_en) ||
    reserve.route?.name_th ||
    t("tracking", "noData");
  const pointName =
    (lang === "th" ? reserve.point?.name_th : reserve.point?.name_en) || "";
  const time = fmtTime(reserve.shift?.default_time);
  const dir =
    reserve.shift?.trip_direction === "inbound"
      ? t("tracking", "origin")
      : t("tracking", "destination");

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isApproved ? "bg-blue-500" : "bg-slate-400"}`}
        >
          {routeCode}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-800 leading-tight truncate">
            {routeName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
            />
            <p className="text-xs text-slate-500">
              {isApproved
                ? t("tracking", "onRoute")
                : t("tracking", "notStarted")}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-400 flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-200">
        <MapPin size={14} className="text-blue-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 truncate flex-1">
          {pointName}
        </p>
        <p className="text-sm font-bold text-blue-600">{time}</p>
      </div>
    </button>
  );
}
