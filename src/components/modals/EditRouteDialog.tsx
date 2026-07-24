"use client";

import { useEffect, useState } from "react";
import { Bus, MapPin, Check } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { CustomSelect } from "./CustomSelect";
import type { Route, Point, Language } from "@/types";

/* ─── Types ─── */
export interface EditRouteData {
  tripIn: { routeId: string; pointId: string };
  tripOut: { routeId: string; pointId: string };
}

interface Props {
  user: { name: string; empCode: string };
  initialData: EditRouteData;
  routes: Route[];
  points: Point[];
  lang?: Language;
  onClose: () => void;
  onSave: (data: EditRouteData) => void;
  saving?: boolean;
}

/* ─── Component ─── */
export default function EditRouteDialog({
  user,
  initialData,
  routes,
  points,
  lang = "th",
  onClose,
  onSave,
  saving = false,
}: Props) {
  const { openDialog, closeDialog } = useUIStore();

  const [tripIn, setTripIn] = useState(initialData.tripIn);
  const [tripOut, setTripOut] = useState(initialData.tripOut);

  useEffect(() => {
    openDialog();
    document.body.style.overflow = "hidden";
    return () => {
      closeDialog();
      document.body.style.overflow = "";
    };
  }, [openDialog, closeDialog]);

  // แยกสายตามทิศทาง
  const inboundRoutes = routes.filter((r) => r.trip_direction === "inbound");
  const outboundRoutes = routes.filter((r) => r.trip_direction === "outbound");

  const handleSave = () => onSave({ tripIn, tripOut });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
          {/* User Head */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 shadow-md">
              <Bus size={26} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{user.name}</p>
              <p className="text-sm text-slate-500">
                รหัสพนักงาน: {user.empCode}
              </p>
            </div>
          </div>

          <hr className="my-4 border-slate-200" />

          {/* Trip In */}
          <TripSection
            title="Trip In (ขาเข้า)"
            titleColor="text-blue-500"
            iconColor="text-blue-500"
            selectedColor="blue"
            routes={inboundRoutes}
            points={points}
            lang={lang}
            selectedRouteId={tripIn.routeId}
            selectedPointId={tripIn.pointId}
            onSelectRoute={(id) => setTripIn({ routeId: id, pointId: "" })}
            onSelectPoint={(id) => setTripIn((s) => ({ ...s, pointId: id }))}
          />

          <div className="h-6" />

          {/* Trip Out */}
          <TripSection
            title="Trip Out (ขาออก)"
            titleColor="text-orange-500"
            iconColor="text-orange-500"
            selectedColor="orange"
            routes={outboundRoutes}
            points={points}
            lang={lang}
            selectedRouteId={tripOut.routeId}
            selectedPointId={tripOut.pointId}
            onSelectRoute={(id) => setTripOut({ routeId: id, pointId: "" })}
            onSelectPoint={(id) => setTripOut((s) => ({ ...s, pointId: id }))}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-w-[110px] rounded-2xl bg-red-500 py-3 font-bold text-white shadow-md transition hover:bg-red-600 active:scale-[0.98] disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-w-[110px] rounded-2xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trip Section ─── */
function TripSection({
  title,
  titleColor,
  iconColor,
  selectedColor,
  routes,
  points,
  lang,
  selectedRouteId,
  selectedPointId,
  onSelectRoute,
  onSelectPoint,
}: {
  title: string;
  titleColor: string;
  iconColor: string;
  selectedColor: "blue" | "orange";
  routes: Route[];
  points: Point[];
  lang: Language;
  selectedRouteId: string;
  selectedPointId: string;
  onSelectRoute: (id: string) => void;
  onSelectPoint: (id: string) => void;
}) {
  // filter จุดตามสายที่เลือก
  const filteredPoints = points.filter((p) => p.route_id === selectedRouteId);
  const pointNames = filteredPoints.map((p) =>
    lang === "th" ? p.name_th : p.name_en,
  );
  const selectedPoint = filteredPoints.find((p) => p.id === selectedPointId);
  const selectedPointName = selectedPoint
    ? lang === "th"
      ? selectedPoint.name_th
      : selectedPoint.name_en
    : "";

  return (
    <section>
      <h3 className={`mb-3 text-base font-bold ${titleColor}`}>{title}</h3>

      {/* สายรถ */}
      <div className={`mb-2 flex items-center gap-2 ${iconColor}`}>
        <Bus size={18} />
        <span className="text-sm font-semibold text-slate-700">สายรถ</span>
      </div>

      <div
        className="max-h-[168px] space-y-2 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {routes.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">ไม่มีสายรถ</p>
        )}
        {routes.map((r) => (
          <RouteRadio
            key={r.id}
            code={r.code}
            name={lang === "th" ? r.name_th : r.name_en}
            selected={selectedRouteId === r.id}
            color={selectedColor}
            onClick={() => onSelectRoute(r.id)}
          />
        ))}
      </div>

      {/* จุดรับส่ง */}
      <div className={`mb-2 mt-4 flex items-center gap-2 ${iconColor}`}>
        <MapPin size={18} />
        <span className="text-sm font-semibold text-slate-700">จุดรับส่ง</span>
      </div>

      <CustomSelect
        value={selectedPointName}
        options={pointNames}
        disabled={!selectedRouteId}
        placeholder={selectedRouteId ? "เลือกจุดรับส่ง" : "กรุณาเลือกสายรถก่อน"}
        onChange={(name) => {
          const point = filteredPoints.find(
            (p) => (lang === "th" ? p.name_th : p.name_en) === name,
          );
          if (point) onSelectPoint(point.id);
        }}
      />
    </section>
  );
}

/* ─── Route Radio ─── */
function RouteRadio({
  code,
  name,
  selected,
  color,
  onClick,
}: {
  code: string;
  name: string;
  selected: boolean;
  color: "blue" | "orange";
  onClick: () => void;
}) {
  const activeColors = { blue: "text-blue-500", orange: "text-orange-500" };
  const activeBg = { blue: "bg-blue-500", orange: "bg-orange-500" };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-slate-300"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
          selected ? activeBg[color] : "border-2 border-slate-300"
        }`}
      >
        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>

      <span
        className={`text-base font-bold ${
          selected ? activeColors[color] : "text-slate-700"
        }`}
      >
        {code}
      </span>

      <span className="text-slate-300">|</span>

      <span className="flex-1 text-sm text-slate-700">{name}</span>
    </button>
  );
}
