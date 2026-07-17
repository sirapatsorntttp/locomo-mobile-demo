import { create } from 'zustand'

interface UIState {
  isDialogOpen: boolean
  openDialog: () => void
  closeDialog: () => void

  menuOpen:boolean
  openMenu:() =>void
   closeMenu:() =>void
    toggleMenu:() =>void
}

export const useUIStore = create<UIState>((set) => ({
  isDialogOpen: false,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }),

  
menuOpen: false,
  openMenu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),

}))