import { Post } from "@/types"
import { apiFetch } from '@/lib/api-fetch'
import { authHeader } from '@/lib/auth-token'
import { create } from 'zustand'
import { useDriverStore } from "./driver.store"
import { useRoutePointStore } from "./useRoutePointStore"
import { useShiftStore } from "./shift.store"
import { useStore } from '@/lib/store'

type PostState = {
  posts: Post[]
  isLoading: boolean
  loadPost: () => Promise<void>
  addPost: (data: Partial<Post>) => Promise<void>
  updatePost: (id: string, data: Partial<Post>) => void
  deletePost: (id: string) => void
}

const mapPost = (p: any): Post => ({
  ...p,

  route: p.routes,
  shift: p.shifts,

  driver_vehicle_vendor: p.vendors_drivers_vehicles
    ? {
        ...p.vendors_drivers_vehicles,

        vendor: p.vendors_drivers_vehicles.vendors,

        driver_vehicle: {
          ...p.vendors_drivers_vehicles.drivers_vehicles,

          driver:
            p.vendors_drivers_vehicles.drivers_vehicles?.drivers,

          vehicle:
            p.vendors_drivers_vehicles.drivers_vehicles?.vehicles,
        },
      }
    : undefined,
})

export const usePostStore = create<PostState>((set, get) => ({

 posts: [],
 isLoading: false,

  loadPost: async () => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/post?limit=500', { headers: authHeader() })
    
      
      const json = await res.json()
        console.log("post",json);
      if (!json.success) throw new Error(json.error)
     
const posts = (json.data?.data ?? json.data ?? []).map(mapPost)

set({ posts })

    } catch (err: any) { mainStore.addToast('error', err.message ?? 'โหลดข้อมูลขับไม่สำเร็จ')}
  },

  addPost: async (data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
    
const created = mapPost(json.data)

set(s => ({
  posts: [created, ...s.posts]
}))


      mainStore.addToast('success', `เพิ่ม Post "${created.code}" สำเร็จ`)
      mainStore.closeModal()
    } catch (err: any) { mainStore.addToast('error', err.message ?? 'เพิ่ม Post ไม่สำเร็จ') }
  },

  updatePost: async (id, data) => {
    const mainStore = useStore.getState()
    try {
      const res = await apiFetch(`/api/post/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
    
const updated = mapPost(json.data)

set(s => ({
  posts: s.posts.map(p =>
    p.id === id ? updated : p
  )
}))

      mainStore.addToast('success', 'แก้ไข Post สำเร็จ')
      mainStore.closeModal()
    } catch (err: any) { mainStore.addToast('error', err.message ?? 'แก้ไข Post ไม่สำเร็จ') }
  },

  deletePost: async (id) => {
    const mainStore = useStore.getState()
    try {
      const post = get().posts.find(p => p.id === id)
      const res = await apiFetch (`/api/post/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
      set(s => ({ posts: s.posts.filter(p => p.id !== id)}))
      mainStore.addToast('success', `ลบ Post "${post?.code}" สำเร็จ`)
      mainStore.closeModal()
    } catch (err: any) { mainStore.addToast('error', err.message ?? 'ลบ Post ไม่สำเร็จ') }
  } 

}))