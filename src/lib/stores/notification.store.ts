import { apiFetch } from "@/lib/api-fetch";
import { authHeader } from "@/lib/auth-token";
import { AppNotification } from "@/types";
import { create } from "zustand";

type NotificationState = {
  notifications: AppNotification[];
  unreadCount: number;
  loadNotifications: (employeeId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: (employeeId: string) => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  loadNotifications: async (employeeId) => {
    try {
      const query = new URLSearchParams();
      if (employeeId) query.set("employee_id", employeeId);
      const res = await apiFetch(`/api/notifications?${query}`, {
        headers: authHeader(),
      });
      const json = await res.json();
      if (json.success) {
        const list = (json.data?.data ?? json.data ?? []) as AppNotification[];
        set({
          notifications: list,
          unreadCount: list.filter((n) => n.is_status === "unread").length,
        });
      }
    } catch {
      /* keep current state */
    }
  },

  markAsRead: async (id) => {
    try {
      await apiFetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ is_status: "read" }),
      });
      set((s) => {
        const notifications = s.notifications.map((n) =>
          n.id === id ? { ...n, is_status: "read" } : n,
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => n.is_status === "unread")
            .length,
        };
      });
    } catch {
      /* ignore */
    }
  },

  markAllRead: async (employeeId) => {
    try {
      const query = new URLSearchParams();
      if (employeeId) query.set("employee_id", employeeId);
      await apiFetch(`/api/notifications/read-all?${query}`, {
        method: "PATCH",
        headers: authHeader(),
      });
      set((s) => ({
        notifications: s.notifications.map((n) => ({
          ...n,
          is_status: "read",
        })),
        unreadCount: 0,
      }));
    } catch {
      /* ignore */
    }
  },
}));
