import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"

import { AuthenticationLog, FeedbackComment } from "@/types"
import { create } from "zustand"


type CommentState = {
   comments: FeedbackComment[]
  commentsTotal: number
  loadComments: (params?: { status?: string; route_id?: string; page?: number }) => Promise<void>
  addComment: (data: { employee_id: string; route_id: string; date_at: string; subject?: string; detail?: string; status?: string }) => Promise<void>
  updateComment: (id: string, data: { subject?: string; detail?: string; status?: string }) => Promise<void>
  deleteComment: (id: string) => Promise<void>
  
}


export const useCommentStore = create<CommentState>((set, get) => ({

  comments: [],
  commentsTotal: 0,

    loadComments: async (params = {}) => {
      try {
        const query = new URLSearchParams()
        if (params.status)   query.set('status',   params.status)
        if (params.route_id) query.set('route_id', params.route_id)
        query.set('limit', '200')
        query.set('page',  String(params.page ?? 1))
        const res  = await apiFetch(`/api/comments?${query}`, { headers: authHeader() })
        const json = await res.json()
        if (json.success) set({ comments: json.data?.data ?? json.data ?? [], commentsTotal: json.data?.total ?? 0 })
      } catch { /* keep current state */ }
    },
  
  
  
    addComment: async (data) => {
         const mainStore = useStore.getState()
      try {
        const res  = await apiFetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
        set(s => ({ comments: [json.data as FeedbackComment, ...s.comments], commentsTotal: s.commentsTotal + 1 }))
       mainStore.addToast('success', 'เพิ่ม Comment สำเร็จ')
        mainStore.closeModal()
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    updateComment: async (id, data) => {
        const mainStore = useStore.getState()
      try {
        const res  = await apiFetch(`/api/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
        set(s => ({ comments: s.comments.map(c => c.id === id ? { ...c, ...(json.data as FeedbackComment) } : c) }))
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    deleteComment: async (id) => {
        const mainStore = useStore.getState()
      try {
        const res  = await apiFetch(`/api/comments/${id}`, { method: 'DELETE', headers: authHeader() })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
        set(s => ({ comments: s.comments.filter(c => c.id !== id), commentsTotal: s.commentsTotal - 1 }))
       mainStore.addToast('success', 'ลบ Comment สำเร็จ')
      mainStore.closeModal()
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
}))