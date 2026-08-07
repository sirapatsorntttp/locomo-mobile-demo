"use client";

import { use, useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { ChevronLeft, Menu, Clock, Bus, Maximize2, X } from "lucide-react";

import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";
import { useTrackingStore } from "@/lib/stores/tracking.store";

const LONGDO_KEY = process.env.NEXT_PUBLIC_LONGDO_KEY;

const fmtTime = (value?: string | Date | null) => {
  if (!value) return "-";

  const d = new Date(value);

  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes(),
    ).padStart(2, "0")}`;
  }

  return String(value).slice(0, 5);
};

const makePinMarker = (
  longdo: any,
  lon: number,
  lat: number,
  color: string,
  title: string,
) => {
  return new longdo.Marker(
    {
      lon,
      lat,
    },
    {
      title,

      icon: {
        html: `
          <div
            style="
              display:flex;
              flex-direction:column;
              align-items:center;
              pointer-events:none;
            "
          >
            <div
              style="
                width:24px;
                height:24px;

                position:relative;

                background:${color};

                border:3px solid #ffffff;

                border-radius:
                  50% 50% 50% 0;

                transform:
                  rotate(-45deg);

                box-shadow:
                  0 3px 10px
                  rgba(0,0,0,0.25);
              "
            >
              <div
                style="
                  position:absolute;

                  width:7px;
                  height:7px;

                  left:6px;
                  top:6px;

                  background:#ffffff;

                  border-radius:50%;
                "
              ></div>
            </div>

            <div
              style="
                margin-top:7px;

                max-width:140px;

                padding:3px 8px;

                overflow:hidden;

                white-space:nowrap;

                text-overflow:
                  ellipsis;

                background:
                  rgba(
                    255,
                    255,
                    255,
                    0.96
                  );

                border:
                  1px solid
                  rgba(
                    148,
                    163,
                    184,
                    0.35
                  );

                border-radius:8px;

                color:#334155;

                font-size:10px;
                font-weight:600;

                box-shadow:
                  0 2px 6px
                  rgba(0,0,0,0.12);
              "
            >
              ${title}
            </div>
          </div>
        `,

        offset: {
          x: 12,
          y: 24,
        },
      },
    },
  );
};

const makeVehicleMarker = (
  longdo: any,
  lon: number,
  lat: number,
  title: string,
) => {
  return new longdo.Marker(
    {
      lon,
      lat,
    },
    {
      title,

      icon: {
        html: `
          <div
            style="
              width:18px;
              height:18px;

              background:#2563eb;

              border:
                3px solid
                #ffffff;

              border-radius:50%;

              box-shadow:
                0 3px 12px
                rgba(
                  37,
                  99,
                  235,
                  0.45
                );
            "
          ></div>
        `,

        offset: {
          x: 9,
          y: 9,
        },
      },
    },
  );
};

export default function TrackingDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const openMenu = useUIStore((s) => s.openMenu);

  const { t, lang } = useLang();

  const detail = useTrackingStore((s) => s.detail);

  const loading = useTrackingStore((s) => s.loading);

  const loadByReserve = useTrackingStore((s) => s.loadByReserve);

  const [fullscreen, setFullscreen] = useState(false);

  // ============================================================
  // Map refs
  // ============================================================

  const mapEl = useRef<HTMLDivElement>(null);

  const mapObj = useRef<any>(null);

  const busMarker = useRef<any>(null);

  // ============================================================
  // Load Tracking
  //
  // ตอนนี้ยังไม่ polling
  // เพื่อแก้ 429 ก่อน
  // ============================================================

  useEffect(() => {
    if (!id) return;

    void loadByReserve(id);
  }, [id, loadByReserve]);

  // ============================================================
  // Init Map
  // ============================================================

  useEffect(() => {
    if (!detail || !mapEl.current || (detail.stops?.length ?? 0) < 2) {
      return;
    }

    let disposed = false;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // ==========================================================
    // Init
    // ==========================================================

    const initMap = () => {
      if (disposed || mapObj.current) {
        return;
      }

      const longdo = window.longdo;

      if (!longdo || !mapEl.current) {
        retryTimer = setTimeout(initMap, 200);

        return;
      }

      // ========================================================
      // จุดที่ผู้ใช้จอง
      // ========================================================

      const myPickupId =
        detail.reserve?.point?.id ?? detail.reserve?.pickup?.id ?? null;

      // ========================================================
      // Stops
      // ========================================================

      const validStops = [...(detail.stops ?? [])]
        .filter((stop) => {
          const lat = Number(stop.latitude);

          const lon = Number(stop.longitude);

          return (
            Number.isFinite(lat) &&
            Number.isFinite(lon) &&
            lat !== 0 &&
            lon !== 0
          );
        })
        .sort((a, b) => {
          const aOrder = Number(a.queue_default ?? 0);

          const bOrder = Number(b.queue_default ?? 0);

          return aOrder - bOrder;
        });

      console.log(" validStops:", validStops);

      const currentPosition = detail.current
        ? {
            lon: Number(detail.current.longitude),

            lat: Number(detail.current.latitude),
          }
        : validStops[0]
          ? {
              lon: Number(validStops[0].longitude),

              lat: Number(validStops[0].latitude),
            }
          : {
              lon: 100.5018,
              lat: 13.7563,
            };

      // ========================================================
      // Create Longdo map
      // ========================================================

      const map = new longdo.Map({
        placeholder: mapEl.current,

        layer: [longdo.Layers.LIGHT],

        zoom: 14,

        zoomRange: {
          min: 8,
          max: 18,
        },

        location: currentPosition,

        ui: longdo.UiComponent.None,

        lastView: false,
      });

      mapObj.current = map;

      // ========================================================
      // Map ready
      // ========================================================

      map.Event.bind("ready", () => {
        if (disposed) {
          return;
        }

        map.resize();

        // ไม่ต้อง clear layer
        // set base อย่างเดียวพอ
        try {
          map.Layers.setBase(longdo.Layers.LIGHT);
        } catch {
          // ignore
        }

        validStops.forEach((stop, index) => {
          const stopName =
            (lang === "th" ? stop.name_th : stop.name_en) ||
            stop.name_th ||
            stop.name_en ||
            `Stop ${index + 1}`;

          const lat = Number(stop.latitude);

          const lon = Number(stop.longitude);

          const isOrigin = stop.point_type === "origin";

          const isMyStop = myPickupId !== null && stop.id === myPickupId;

          let color = "#dc2626";

          // เริ่มต้น = เขียว
          if (isOrigin) {
            color = "#16a34a";
          }

          // จุดตัวเอง = ส้ม
          //
          // ถ้าจุดตัวเองเป็น origin ด้วย
          // ให้ origin เขียวเป็น priority
          else if (isMyStop) {
            color = "#f59e0b";
          }

          // จุดอื่น = แดง
          else {
            color = "#dc2626";
          }

          const marker = makePinMarker(longdo, lon, lat, color, stopName);

          map.Overlays.add(marker);
        });

        // ====================================================
        // Vehicle marker
        // ====================================================

        if (detail.current) {
          const lat = Number(detail.current.latitude);

          const lon = Number(detail.current.longitude);

          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            busMarker.current = makeVehicleMarker(
              longdo,
              lon,
              lat,

              lang === "th" ? "ตำแหน่งรถ" : "Vehicle",
            );

            map.Overlays.add(busMarker.current);
          }
        }

        const routePoints = validStops.map((stop) => ({
          lon: Number(stop.longitude),

          lat: Number(stop.latitude),
        }));

        console.log("routePoints:", routePoints);

        // ====================================================
        // Draw Routex
        // ====================================================

        if (routePoints.length >= 2) {
          const route = map.Route as any;

          route.clear();

          try {
            route.auto = false;

            route.guide = false;

            route.label = false;
          } catch {
            // บาง version ไม่มี
          }

          // ================================================
          // Waypoints
          // ================================================

          routePoints.forEach((point) => {
            route.add(
              new longdo.Marker(
                {
                  lon: point.lon,

                  lat: point.lat,
                },
                {
                  draggable: false,

                  clickable: false,

                  // ซ่อน waypoint ของ Route
                  // เพราะเรามี marker ของเราเองแล้ว
                  icon: {
                    html: `
                          <div
                            style="
                              width:0;
                              height:0;
                            "
                          ></div>
                        `,

                    offset: {
                      x: 0,
                      y: 0,
                    },
                  },
                },
              ),
            );
          });

          // ================================================
          // Route events
          // ================================================

          try {
            longdo.Event.bind(route, "ready", () => {
              console.log(" Longdo Route ready");
            });

            longdo.Event.bind(route, "error", () => {
              console.error(" Longdo Route error");
            });
          } catch {
            // ignore
          }

          route.search();
        } else {
          console.warn("จุดไม่พอสำหรับลากเส้น", routePoints);
        }

        // ====================================================
        // Focus
        // ====================================================

        map.location(currentPosition, true);

        window.setTimeout(() => {
          map.resize();
        }, 300);
      });
    };

    // ==========================================================
    // Load Longdo
    // ==========================================================

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

      try {
        if (mapObj.current) {
          // ล้าง route เดิม
          try {
            mapObj.current.Route?.clear();
          } catch {}

          // ล้าง marker เดิม
          try {
            mapObj.current.Overlays?.clear();
          } catch {}
        }
      } catch {}

      // สำคัญ
      busMarker.current = null;
      mapObj.current = null;

      // เคลียร์ DOM ของ map เก่า
      if (mapEl.current) {
        mapEl.current.innerHTML = "";
      }
    };
  }, [detail?.reserve?.route?.id, detail?.stops, id, lang]);

  useEffect(() => {
    if (!detail?.current || !mapObj.current) {
      return;
    }

    const longdo = window.longdo;

    if (!longdo) {
      return;
    }

    const lat = Number(detail.current.latitude);

    const lon = Number(detail.current.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    // ==========================================================
    // marker ยังไม่เคยสร้าง
    // ==========================================================

    if (!busMarker.current) {
      busMarker.current = makeVehicleMarker(
        longdo,
        lon,
        lat,

        lang === "th" ? "ตำแหน่งรถ" : "Vehicle",
      );

      mapObj.current.Overlays.add(busMarker.current);

      return;
    }

    // ==========================================================
    // ขยับ marker
    // ==========================================================

    try {
      busMarker.current.location({
        lon,
        lat,
      });
    } catch (error) {
      console.warn("update bus marker failed:", error);
    }
  }, [detail?.current?.latitude, detail?.current?.longitude, lang]);

  // ============================================================
  // Fullscreen resize
  // ============================================================

  useEffect(() => {
    if (!mapObj.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      mapObj.current?.resize();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fullscreen]);

  // ============================================================
  // Lock scroll
  // ============================================================

  useEffect(() => {
    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // ============================================================
  // Loading
  // ============================================================

  if (loading && !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        {t("trackingDetail", "title")}
      </div>
    );
  }

  // ============================================================
  // No data
  // ============================================================

  if (!detail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">{t("trackingDetail", "noData")}</p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-blue-600 font-semibold text-sm"
          >
            ← {t("trackingDetail", "back")}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Data
  // ============================================================

  const { reserve, current, has_gps, driver, vehicle } = detail;

  const routeName =
    (lang === "th" ? reserve.route?.name_th : reserve.route?.name_en) ||
    reserve.route?.name_th ||
    "-";

  const time = fmtTime(reserve.shift?.default_time);

  const empName =
    lang === "th"
      ? `${reserve.employee?.first_name_th ?? ""} ${
          reserve.employee?.last_name_th ?? ""
        }`.trim()
      : `${reserve.employee?.first_name_en ?? ""} ${
          reserve.employee?.last_name_en ?? ""
        }`.trim();

  // ============================================================
  // Date
  // ============================================================

  const formatDate = (iso?: string) => {
    if (!iso) {
      return "-";
    }

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
      return "-";
    }

    if (lang === "en") {
      const months = [
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

      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    const months = [
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

    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50">
      <div
        className={`relative w-full flex-shrink-0 ${
          fullscreen ? "fixed inset-0 z-[100] h-screen" : "h-[35vh]"
        }`}
      >
        <div
          ref={mapEl}
          className="absolute inset-0 h-full w-full bg-slate-200"
          style={{
            touchAction: "none",
          }}
        />

        {!has_gps && (
          <div className="absolute left-4 bottom-4 z-20 max-w-[75%] rounded-full bg-white/95 px-3 py-2 text-[11px] font-medium text-amber-600 shadow-md pointer-events-none">
            ยังไม่มีสัญญาณ GPS — แสดงรถที่จุดเริ่มต้น
          </div>
        )}

        {!fullscreen && (
          <>
            <div className="absolute top-0 left-0 right-0 z-20 px-5 pt-12 pb-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
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

        <button
          type="button"
          onClick={() => setFullscreen((value) => !value)}
          className="absolute bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-50 active:scale-95 transition"
          aria-label={fullscreen ? "ย่อแผนที่" : "ขยายแผนที่"}
        >
          {fullscreen ? <X size={20} /> : <Maximize2 size={20} />}
        </button>

        {fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute top-12 left-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {!fullscreen && (
        <div className="flex-1 overflow-y-auto rounded-t-[32px] bg-slate-50 px-5 pt-6 pb-32">
          <div
            className={`rounded-2xl border p-4 flex items-start gap-3 ${
              has_gps
                ? "bg-blue-50 border-blue-100"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <Clock
                size={20}
                className={has_gps ? "text-blue-600" : "text-amber-500"}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {has_gps && current
                  ? `${Number(current.latitude).toFixed(4)}, ${Number(
                      current.longitude,
                    ).toFixed(4)}`
                  : "ยังไม่มีสัญญาณ GPS"}
              </p>

              <p
                className={`text-xs mt-1 ${
                  has_gps ? "text-blue-600" : "text-amber-600"
                }`}
              >
                {has_gps && current
                  ? `อัปเดตล่าสุด ${fmtTime(current.created_at)}`
                  : "รถจะแสดงที่จุดเริ่มต้นจนกว่าจะได้รับ GPS"}
              </p>
            </div>
          </div>

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

          {reserve.point && (
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
              <p className="text-xs text-slate-400">
                {lang === "th" ? "จุดขึ้นรถของคุณ" : "Your pickup point"}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {(lang === "th"
                  ? reserve.point.name_th
                  : reserve.point.name_en) ||
                  reserve.point.name_th ||
                  "-"}
              </p>
            </div>
          )}

          {vehicle && (
            <div className="mt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800">
                    {t("trackingDetail", "vehicleNo")} {vehicle.code}
                  </h3>

                  <p className="text-slate-600 mt-1">
                    {vehicle.license || "-"}
                  </p>

                  <p className="text-slate-600">{vehicle.province || "-"}</p>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-32 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Bus size={40} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(driver
                  ? lang === "th"
                    ? driver.first_name_th
                    : driver.first_name_en
                  : empName
                )?.charAt(0) || "U"}
              </div>

              <div className="min-w-0">
                {driver ? (
                  <>
                    <p className="text-base font-bold text-slate-800 truncate">
                      {lang === "th"
                        ? `${driver.first_name_th ?? ""} ${
                            driver.last_name_th ?? ""
                          }`.trim()
                        : `${driver.first_name_en ?? ""} ${
                            driver.last_name_en ?? ""
                          }`.trim()}
                    </p>

                    <p className="text-sm text-slate-500 font-mono">
                      {driver.tel ?? "-"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-slate-800 truncate">
                      {empName || "-"}
                    </p>

                    <p className="text-sm text-slate-500 font-mono">
                      {reserve.employee?.code ?? "-"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

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

// ============================================================
// Detail Row
// ============================================================

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
      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
        !isLast ? "border-b border-slate-100" : ""
      }`}
    >
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>

      <span className="text-sm font-semibold text-slate-800 text-right">
        {value}
      </span>
    </div>
  );
}
