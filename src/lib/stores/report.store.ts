import { create } from 'zustand'
import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { useStore } from '@/lib/store'
import type { DailyUsageStat } from '@/types'

type ReportState = {
  dailyUsage: DailyUsageStat[]
  isLoading: boolean

  loadDailyUsage: (from?: string, to?: string) => Promise<void>
}

export const useReportStore = create<ReportState>((set) => ({
  dailyUsage: [],
  isLoading: false,

  loadDailyUsage: async (from, to) => {
    const mainStore = useStore.getState()

    try {
      set({ isLoading: true })

      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)

      const res = await apiFetch(
        `/api/reserves/reports/daily-usage?${query}`,
        { headers: authHeader() },
      )

      const json = await res.json()
console.log("daily",json);

      if (!json.success)
        throw new Error(json.error ?? 'โหลดรายงานไม่สำเร็จ')

      set({ dailyUsage: json.data ?? [] })
    } catch (err: any) {
      mainStore.addToast(
        'error',
        err.message ?? 'โหลดรายงานไม่สำเร็จ',
      )
    } finally {
      set({ isLoading: false })
    }
  },
}))