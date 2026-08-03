import { apiFetch } from "@/lib/api-fetch";
import { authHeader } from "@/lib/auth-token";
import { TrackingDetail } from "@/types";
import { create } from "zustand";

type TrackingState = {
  detail: TrackingDetail | null;
  loading: boolean;
  loadByReserve: (reserveId: string) => Promise<void>;
  clear: () => void;
};

export const useTrackingStore = create<TrackingState>((set) => ({
  detail: null,
  loading: false,

  loadByReserve: async (reserveId) => {
    set({ loading: true });
    try {
      const res = await apiFetch(`/api/tracking/${reserveId}`, {
        headers: authHeader(),
      });
      const json = await res.json();
      if (json.success) set({ detail: json.data });
    } catch {
      /* keep */
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ detail: null }),
}));
