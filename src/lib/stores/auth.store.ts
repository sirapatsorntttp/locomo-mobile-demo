import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"

import { AuthenticationLog } from "@/types"
import { create } from "zustand"


type AuthState = {
   authLogs: AuthenticationLog[]
  authLogsTotal: number
  loadAuthLogs: (params?: { result?: string; event?: string; dateFrom?: string; dateTo?: string; page?: number }) => Promise<void>
  
}


export const useAuthStore = create<AuthState>((set, get) => ({

 authLogs: [],
  authLogsTotal: 0,

    loadAuthLogs: async (params = {}) => {
    try {
      const query = new URLSearchParams()
      if (params.result)   query.set('result',    params.result)
      if (params.event)    query.set('event',     params.event)
      if (params.dateFrom) query.set('date_from', params.dateFrom)
      if (params.dateTo)   query.set('date_to',   params.dateTo)
      query.set('limit', '100')
      query.set('page',  String(params.page ?? 1))

      const res  = await apiFetch(`/api/auth-logs?${query}`, { headers: authHeader() })
      const json = await res.json()
      if (json.success) {
        set({ authLogs: json.data.data ?? [], authLogsTotal: json.data.total ?? 0 })
      }
    } catch { /* keep current state */ }
  },

}))