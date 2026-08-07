import { apiFetch } from "@/lib/api-fetch";
import { authHeader } from "@/lib/auth-token";
import type { TrackingDetail } from "@/types";
import { create } from "zustand";

type TrackingState = {
  detail: TrackingDetail | null;
  loading: boolean;
  loadedReserveId: string | null;

  loadByReserve: (reserveId: string, force?: boolean) => Promise<void>;

  clear: () => void;
};

// ============================================================
// Request guards
// อยู่นอก Zustand เพื่อไม่ทำให้ component render
// ============================================================

// request ที่กำลังทำงาน แยกตาม reserve
const pendingRequests = new Map<string, Promise<void>>();

// เวลาที่ request ล่าสุดถูกยิง
const lastRequestAt = new Map<string, number>();

// ถ้า backend ส่ง 429 ให้ block จนถึงเวลานี้
const blockedUntil = new Map<string, number>();

// ตอน debug ให้ห่างอย่างน้อย 5 วินาที
const MIN_REQUEST_INTERVAL = 5_000;

export const useTrackingStore = create<TrackingState>((set, get) => ({
  detail: null,
  loading: false,
  loadedReserveId: null,

  loadByReserve: async (reserveId, force = false) => {
    if (!reserveId) return;

    const now = Date.now();

    // ========================================================
    // 1. Backend เคยตอบ 429 และยังไม่ถึงเวลาลองใหม่
    // ========================================================

    const blocked = blockedUntil.get(reserveId) ?? 0;

    if (now < blocked) {
      console.warn(
        `Tracking request blocked for ${Math.ceil((blocked - now) / 1000)}s`,
      );

      return;
    }

    // ========================================================
    // 2. Request เดิมกำลังทำอยู่
    // ========================================================

    const existingRequest = pendingRequests.get(reserveId);

    if (existingRequest) {
      return existingRequest;
    }

    const { detail, loadedReserveId } = get();

    // ========================================================
    // 3. มีข้อมูลแล้ว และไม่ได้ force
    // ========================================================

    if (!force && detail && loadedReserveId === reserveId) {
      return;
    }

    // ========================================================
    // 4. กัน Fast Refresh / React remount ยิงติด ๆ กัน
    // ========================================================

    const last = lastRequestAt.get(reserveId) ?? 0;

    if (now - last < MIN_REQUEST_INTERVAL) {
      console.warn("Skip duplicate tracking request", reserveId);

      return;
    }

    lastRequestAt.set(reserveId, now);

    // ========================================================
    // 5. สร้าง request
    // ========================================================

    const request = (async () => {
      set({
        loading: true,
      });

      try {
        const res = await apiFetch(`/api/tracking/${reserveId}`, {
          headers: authHeader(),
        });

        // ====================================================
        // 429
        // ====================================================

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("Retry-After"));

          const waitMs =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 60_000;

          blockedUntil.set(reserveId, Date.now() + waitMs);

          console.warn(
            `Tracking rate limited. Retry in ${Math.ceil(waitMs / 1000)}s`,
          );

          // อย่า throw สำหรับ 429
          // เพราะ Next dev overlay จะเด้ง
          return;
        }

        const json = await res.json();

        if (!res.ok || !json.success) {
          const message =
            typeof json.error === "string"
              ? json.error
              : typeof json.message === "string"
                ? json.message
                : "โหลดข้อมูลติดตามรถไม่สำเร็จ";

          throw new Error(message);
        }

        console.log(" TRACKING RESPONSE:", json.data);

        console.log(" TRACKING STOPS:", json.data?.stops);

        // request สำเร็จแล้ว
        // reset rate-limit state
        blockedUntil.delete(reserveId);

        set({
          detail: json.data,

          loadedReserveId: reserveId,
        });
      } catch (error) {
        console.error("loadByReserve error:", error);
      } finally {
        pendingRequests.delete(reserveId);

        set({
          loading: false,
        });
      }
    })();

    pendingRequests.set(reserveId, request);

    return request;
  },

  clear: () => {
    set({
      detail: null,
      loading: false,
      loadedReserveId: null,
    });
  },
}));
