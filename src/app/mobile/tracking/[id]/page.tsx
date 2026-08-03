"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Menu, Clock, Bus, Maximize2, X } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";
import { useTrackingStore } from "@/lib/stores/tracking.store";

const LONGDO_KEY = process.env.NEXT_PUBLIC_LONGDO_KEY;

const fmtTime = (t?: string) => {
  if (!t) return "-";
  const d = new Date(t);
  if (!isNaN(d.getTime()))
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes(),
    ).padStart(2, "0")}`;
  return t.slice(0, 5);
};

export default function TrackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params); // id = reserveId
  const router = useRouter();
  const openMenu = useUIStore((s) => s.openMenu);
  const { t, lang } = useLang();
  const { detail, loading, loadByReserve, clear } = useTrackingStore();
  const [fullscreen, setFullscreen] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const busMarker = useRef<any>(null);

  useEffect(() => {
    loadByReserve(id);
    const interval = setInterval(() => loadByReserve(id), 40000);
    return () => {
      clearInterval(interval);
      clear();
    };
  }, [id, loadByReserve, clear]);

  useEffect(() => {
    if (!detail || !mapEl.current || mapObj.current) return;

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const initMap = () => {
      if (disposed || mapObj.current) return;

      const longdo = window.longdo;

      if (!longdo || !mapEl.current) {
        retryTimer = setTimeout(initMap, 200);
        return;
      }

      const currentPosition = detail.current
        ? {
            lon: Number(detail.current.longitude),
            lat: Number(detail.current.latitude),
          }
        : detail.stops[0]
          ? {
              lon: Number(detail.stops[0].longitude),
              lat: Number(detail.stops[0].latitude),
            }
          : {
              lon: 100.5018,
              lat: 13.7563,
            };

      const map = new longdo.Map({
        placeholder: mapEl.current,

        // เลเยอร์ "สว่าง" (LIGHT) โทนขาว-เทา
        layer: [longdo.Layers.LIGHT],

        zoom: 14,

        // ⚠️ zoom(14) ต้องอยู่ในช่วง min-max ไม่งั้นโดน clamp
        zoomRange: {
          min: 11,
          max: 16,
        },

        location: currentPosition,

        ui: longdo.UiComponent.None,

        lastView: false,
      });

      mapObj.current = map;

      map.Event.bind("ready", () => {
        if (disposed) return;

        map.resize();

        map.Layers.clear();
        map.Layers.setBase(longdo.Layers.LIGHT);

        // ── helper: สร้างหมุดสีเอง (วงกลม + ป้ายชื่อ) ──
        const makePinMarker = (
          lon: number,
          lat: number,
          color: string,
          label: string,
          title: string,
        ) =>
          new longdo.Marker(
            { lon, lat },
            {
              title,
              icon: {
                html: `
                  <div style="
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    white-space:nowrap;
                  ">
                    <div style="
                      width:26px;
                      height:26px;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      background:${color};
                      border:3px solid #ffffff;
                      border-radius:50%;
                      color:#ffffff;
                      font-size:11px;
                      font-weight:700;
                      box-shadow:0 3px 10px rgba(0,0,0,0.35);
                    ">${label}</div>
                    <div style="
                      margin-top:4px;
                      max-width:120px;
                      padding:3px 6px;
                      overflow:hidden;
                      text-overflow:ellipsis;
                      border:1px solid rgba(148,163,184,0.5);
                      border-radius:7px;
                      background:rgba(255,255,255,0.92);
                      color:#334155;
                      font-size:9px;
                      font-weight:600;
                      box-shadow:0 2px 6px rgba(0,0,0,0.15);
                    ">${title}</div>
                  </div>
                `,
                offset: { x: 13, y: 13 },
              },
            },
          );

        // ═══════════════════════════════════════
        // เตรียมจุดจอด (เรียงลำดับถ้ามี field seq/order)
        // ═══════════════════════════════════════
        const validStops = detail.stops
          .filter((stop) => {
            const lat = Number(stop.latitude);
            const lon = Number(stop.longitude);
            return Number.isFinite(lat) && Number.isFinite(lon);
          })
          .sort((a, b) => {
            const oa = Number((a as any).seq ?? (a as any).order ?? 0);
            const ob = Number((b as any).seq ?? (b as any).order ?? 0);
            return oa - ob;
          });

        // ─── 🔵 หมุดต้นทาง = ตำแหน่งรถ (น้ำเงิน) ───
        if (detail.current) {
          const lat = Number(detail.current.latitude);
          const lon = Number(detail.current.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            map.Overlays.add(
              makePinMarker(
                lon,
                lat,
                "#2563eb",
                "●",
                lang === "th" ? "ตำแหน่งรถ" : "Vehicle",
              ),
            );
          }
        }

        // ─── 🔴 หมุดจุดจอด (แดง) เรียงลำดับ 1,2,3... ───
        validStops.forEach((stop, index) => {
          const stopName =
            (lang === "th" ? stop.name_th : stop.name_en) ||
            stop.name_th ||
            stop.name_en ||
            `Stop ${index + 1}`;

          map.Overlays.add(
            makePinMarker(
              Number(stop.longitude),
              Number(stop.latitude),
              "#dc2626",
              `${index + 1}`,
              stopName,
            ),
          );
        });

        // ═══════════════════════════════════════
        // เส้นทางตามถนน วิ่งผ่านทุกจุดตามลำดับ
        // 🔵 รถ → 🔴 จุด1 → 🔴 จุด2 → ... → ปลายทาง
        // ═══════════════════════════════════════
        const routePoints: { lon: number; lat: number }[] = [];

        // จุดเริ่ม = ตำแหน่งรถ
        if (detail.current) {
          const lat = Number(detail.current.latitude);
          const lon = Number(detail.current.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            routePoints.push({ lon, lat });
          }
        }

        // ตามด้วยจุดจอดทุกจุด (ตามลำดับ)
        validStops.forEach((stop) => {
          routePoints.push({
            lon: Number(stop.longitude),
            lat: Number(stop.latitude),
          });
        });

        console.log("🛣️ routePoints (ตามลำดับ):", routePoints);

        if (routePoints.length > 1) {
          const route = map.Route as any;

          route.clear();

          // ปิด popup/panel default ของ Route
          try {
            route.auto = false;
            route.guide = false;
            route.label = false;
          } catch {
            /* บาง build ไม่มี property พวกนี้ */
          }

          /*
           * add ทุกจุดตามลำดับ → Route ลากเส้นตามถนนเชื่อมทีละช่วง
           * ใส่ icon โปร่งใส กันหมุด default ("จุดหมายที่ 1") ซ้ำกับหมุดสีเรา
           */
          routePoints.forEach((p) => {
            route.add(
              new longdo.Marker(
                { lon: p.lon, lat: p.lat },
                {
                  draggable: false,
                  clickable: false,
                  icon: {
                    html: '<div style="width:0;height:0;"></div>',
                    offset: { x: 0, y: 0 },
                  },
                },
              ),
            );
          });

          try {
            longdo.Event.bind(route, "ready", () => {
              console.log("✅ Route ready — เส้นผ่านทุกจุดตามถนนแล้ว");
            });
            longdo.Event.bind(route, "error", () => {
              console.log("❌ Route error — เช็คสิทธิ์ Route API ของ key");
            });
          } catch {
            /* ข้าม */
          }

          route.search();
        } else {
          console.warn("⚠️ จุดไม่พอสำหรับลากเส้น");
        }

        // จัดมุมมองไปที่ตำแหน่งรถ (ถ้ามี)
        if (detail.current) {
          const lat = Number(detail.current.latitude);
          const lon = Number(detail.current.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            map.location({ lon, lat }, true);
          }
        }

        setTimeout(() => {
          map.resize();
        }, 250);
      });
    };

    if (window.longdo) {
      initMap();
    } else {
      const scriptId = "longdo-map-script";

      const existingScript = document.getElementById(
        scriptId,
      ) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", initMap, {
          once: true,
        });
      } else {
        const script = document.createElement("script");

        script.id = scriptId;
        script.src = `https://api.longdo.com/map3/?key=${LONGDO_KEY}`;
        script.async = true;
        script.onload = initMap;
        script.onerror = () => {
          console.error("ไม่สามารถโหลด Longdo Map ได้");
        };

        document.head.appendChild(script);
      }
    }

    return () => {
      disposed = true;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [detail, lang]);

  // resize map เมื่อสลับ fullscreen
  useEffect(() => {
    if (!mapObj.current) return;
    const timer = setTimeout(() => {
      mapObj.current?.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, [fullscreen]);

  // lock body scroll ทั้งหน้า
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (loading && !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        {t("trackingDetail", "title")}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">{t("trackingDetail", "noData")}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 font-semibold text-sm"
          >
            ← {t("trackingDetail", "back")}
          </button>
        </div>
      </div>
    );
  }

  const { reserve, current } = detail;
  const routeName =
    (lang === "th" ? reserve.route?.name_th : reserve.route?.name_en) || "-";
  const time = fmtTime(reserve.shift?.default_time);
  const empName =
    lang === "th"
      ? `${reserve.employee?.first_name_th ?? ""} ${reserve.employee?.last_name_th ?? ""}`.trim()
      : `${reserve.employee?.first_name_en ?? ""} ${reserve.employee?.last_name_en ?? ""}`.trim();

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
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

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50">
      <div
        className={`relative w-full flex-shrink-0 ${fullscreen ? "fixed inset-0 z-[100] h-screen" : "h-[35vh]"}`}
      >
        <div
          ref={mapEl}
          className="absolute inset-0 h-full w-full bg-slate-200"
          style={{ touchAction: "none" }}
        />

        {!current && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 text-xs text-slate-400 pointer-events-none">
            ยังไม่มีสัญญาณ GPS
          </div>
        )}

        {/* Header ลอยทับ (ซ่อนตอน fullscreen) */}
        {!fullscreen && (
          <>
            <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md"
                >
                  <ChevronLeft size={20} className="text-slate-700" />
                </button>
                <h1 className="text-white text-lg font-bold drop-shadow-lg">
                  {t("trackingDetail", "title")}
                </h1>
                <button
                  type="button"
                  onClick={openMenu}
                  aria-label="Menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
          </>
        )}

        {/* ปุ่มขยาย / ย่อ */}
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="absolute bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-50 active:scale-95 transition"
          aria-label={fullscreen ? "ย่อแผนที่" : "ขยายแผนที่"}
        >
          {fullscreen ? <X size={20} /> : <Maximize2 size={20} />}
        </button>

        {/* ปุ่มกลับ (เฉพาะตอน fullscreen) */}
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-12 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* ═══ Content (ซ่อนตอน fullscreen) ═══ */}
      {!fullscreen && (
        <div className="flex-1 overflow-y-auto rounded-t-[32px] bg-slate-50 px-5 pt-6 pb-32">
          {/* ETA / GPS status */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">
                {current
                  ? `${Number(current.latitude).toFixed(4)}, ${Number(current.longitude).toFixed(4)}`
                  : "ยังไม่มีสัญญาณ GPS"}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {current
                  ? `อัปเดตล่าสุด ${fmtTime(current.created_at)}`
                  : t("trackingDetail", "etaPrepare")}
              </p>
            </div>
          </div>

          {/* รายละเอียดการจอง */}
          <div className="mt-6">
            <h2 className="text-base font-bold text-slate-800 mb-3">
              {t("trackingDetail", "bookingDetail")}
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <DetailRow
                label={t("trackingDetail", "route")}
                value={`${reserve.route?.code ?? ""} ${routeName}`}
              />
              <DetailRow label={t("trackingDetail", "time")} value={time} />
              <DetailRow
                label={t("trackingDetail", "bookingDate")}
                value={formatDate(reserve.travel_date)}
                isLast
              />
            </div>
          </div>

          {/* รถคันที่ (ถ้ามี) */}
          {(detail as any).vehicle && (
            <div className="mt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">
                    {t("trackingDetail", "vehicleNo")}{" "}
                    {(detail as any).vehicle.code}
                  </h3>
                  <p className="text-slate-600 mt-1">
                    {(detail as any).vehicle.license}
                  </p>
                  <p className="text-slate-600">
                    {(detail as any).vehicle.province}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-32 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Bus size={40} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* คนขับ / พนักงาน */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {((detail as any).driver
                  ? lang === "th"
                    ? (detail as any).driver.first_name_th
                    : (detail as any).driver.first_name_en
                  : empName
                )?.charAt(0) || "U"}
              </div>
              <div>
                {(detail as any).driver ? (
                  <>
                    <p className="text-base font-bold text-slate-800">
                      {lang === "th"
                        ? `${(detail as any).driver.first_name_th ?? ""} ${(detail as any).driver.last_name_th ?? ""}`.trim()
                        : `${(detail as any).driver.first_name_en ?? ""} ${(detail as any).driver.last_name_en ?? ""}`.trim()}
                    </p>
                    <p className="text-sm text-slate-500 font-mono">
                      {(detail as any).driver.tel ?? "-"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-slate-800">
                      {empName || "-"}
                    </p>
                    <p className="text-sm text-slate-500 font-mono">
                      {reserve.employee?.code}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ปุ่มยกเลิกการจอง */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-8 w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 font-bold text-base transition-colors shadow-md"
          >
            {t("trackingDetail", "cancelBooking")}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════ Detail Row ═══════ */
function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3.5 ${!isLast ? "border-b border-slate-100" : ""}`}
    >
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right">
        {value}
      </span>
    </div>
  );
}
