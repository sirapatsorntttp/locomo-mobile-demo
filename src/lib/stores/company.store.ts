import { apiFetch } from "@/lib/api-fetch"
import { authHeader } from "@/lib/auth-token"
import { useStore } from "@/lib/store"
import { Company, CompanyPlant, CompanyPlantEmployee, Status } from "@/types"
import { create } from "zustand"

type CompanyState = {
 companies: Company[]
 
  companyPlants: CompanyPlant[]
  companyPlantEmployees: CompanyPlantEmployee[]
  loadCompanies: () => Promise<void>
  addCompany: (data: Partial<Company>) => Promise<void>
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  toggleCompanyStatus: (id: string) => Promise<void>
  addCompanyPlant: (company_id: string, plant_id: string) => Promise<void>
  removeCompanyPlant: (company_id: string, plant_id: string) => Promise<void>
  addCompanyPlantEmployee: (company_id: string, plant_id: string, employee_id: string) => Promise<void>
  removeCompanyPlantEmployee: (company_id: string, plant_id: string, employee_id: string) => Promise<void>
}


export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  companyPlants: [],
  companyPlantEmployees: [],


    loadCompanies: async () => {
  
     
      
      try {
        const res = await apiFetch('/api/companies?limit=200', { headers: authHeader() })
        const json = await res.json()
        
        if (json.success) {
          const raw = json.data?.data ?? json.data ?? []
          set({
            companies: raw,
            companyPlants: raw.flatMap((c: any) => c.companys_plants ?? []),
            companyPlantEmployees: raw.flatMap((c: any) => (c.companys_plants ?? []).flatMap((cp: any) => cp.companys_plants_employees ?? [])),
          })
        }
      } catch { /* keep current state */ }
  
    
      
    },
  
  addCompany: async (data) => {

      const mainStore = useStore.getState()
    try {
      const payload = {
        code: data.code?.trim(),
        company_type: data.company_type,
        name_th: data.name_th?.trim(),
        name_en: data.name_en?.trim() || 'NA',
        address: data.address?.trim() || null,
        is_status: data.is_status ?? 'active',
      }
  
      console.log('company payload', payload)
  
      if (!payload.code) throw new Error('กรุณากรอกรหัสบริษัท')
      if (!payload.name_th) throw new Error('กรุณากรอกชื่อบริษัทภาษาไทย')
      if (!payload.company_type) throw new Error('กรุณาเลือกประเภทบริษัท')
  
      const res = await apiFetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      })
  
      const json = await res.json()
      console.log('create company response', json)
  
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? json.message ?? 'เกิดข้อผิดพลาด')
      }
  
      set(s => ({ companies: [json.data as Company, ...s.companies] }))
     mainStore.addToast('success', `เพิ่มบริษัท "${(json.data as Company).name_th}" สำเร็จ`)
      mainStore.closeModal()
    } catch (e: any) {
     mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`)
    }
  },
  
    updateCompany: async (id, data) => {
      const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        set(s => ({ companies: s.companies.map(c => c.id === id ? { ...c, ...(json.data as Company) } : c) }))
       mainStore.addToast('success', 'อัปเดตบริษัทสำเร็จ')
       mainStore.closeModal()
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    deleteCompany: async (id) => {
      const mainStore = useStore.getState()
      const c = get().companies.find(x => x.id === id)
      try {
        const res = await apiFetch(`/api/companies/${id}`, { method: 'DELETE', headers: authHeader() })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        set(s => ({ companies: s.companies.filter(x => x.id !== id) }))
        mainStore.addToast('success', `ลบบริษัท "${c?.name_th}" สำเร็จ`)
        mainStore.closeModal()
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    toggleCompanyStatus: async (id) => {
      const mainStore = useStore.getState()
      const c = get().companies.find(x => x.id === id)
      const next: Status = c?.is_status === 'active' ? 'inactive' : 'active'
      try {
        const res = await apiFetch(`/api/companies/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ status: next }) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        set(s => ({ companies: s.companies.map(x => x.id === id ? { ...x, is_status: next } : x) }))
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    addCompanyPlant: async (company_id, plant_id) => {
      const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/companies/${company_id}/plants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ plant_id }) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        await get().loadCompanies()
        mainStore.addToast('success', 'เพิ่มโรงงานในบริษัทสำเร็จ')
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    removeCompanyPlant: async (company_id, plant_id) => {
      const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}`, { method: 'DELETE', headers: authHeader() })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        await get().loadCompanies()
        mainStore.addToast('success', 'ลบโรงงานออกจากบริษัทสำเร็จ')
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    addCompanyPlantEmployee: async (company_id, plant_id, employee_id) => {
      const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify({ employee_id }) })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        await get().loadCompanies()
        mainStore.addToast('success', 'เพิ่มพนักงานในบริษัทสำเร็จ')
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    },
  
    removeCompanyPlantEmployee: async (company_id, plant_id, employee_id) => {
      const mainStore = useStore.getState()
      try {
        const res = await apiFetch(`/api/companies/${company_id}/plants/${plant_id}/employees/${employee_id}`, { method: 'DELETE', headers: authHeader() })
        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')
        await get().loadCompanies()
       mainStore.addToast('success', 'ลบพนักงานออกจากบริษัทสำเร็จ')
      } catch (e: any) { mainStore.addToast('error', `เกิดข้อผิดพลาด: ${e.message}`) }
    
    },
}))