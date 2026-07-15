import { RouteServiceItem } from "@/types"
import { create } from "zustand"
import { apiFetch } from "../api-fetch"
import { authHeader } from "../auth-token"

type RouteServicesState = {
  items: RouteServiceItem[]
  isLoading: boolean
  error: string | null
  loadByDate: (date: string) => Promise<void>
  reset: () => void
}

export const useRouteServicesStore = create<RouteServicesState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

 
loadByDate: async (date) => {
  set({ isLoading: true, error: null })
  try {
    const res = await apiFetch(`/api/routes/route-services?date=${date}`, {
      headers: { ...authHeader() },
    })
    const json = await res.json()
   
    
    if (!res.ok || !json.success) {
      set({ error: json.error ?? 'เกิดข้อผิดพลาด', items: [] })
      return
    }

    
  
  const raw = json.data?.data?.data ?? json.data?.data ?? json.data ?? []
const items = Array.isArray(raw) ? raw : []

    
    set({ items })


    
  } catch {
    set({ error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', items: [] })
  } finally {
    set({ isLoading: false })
  }
  
},

  reset: () => set({ items: [], error: null, isLoading: false }),
}))
