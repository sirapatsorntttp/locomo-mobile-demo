'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Menu, Info, ImagePlus, Smartphone } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { useEffect } from 'react'

export default function QRCodePage() {
  const router = useRouter()
const {openDialog,closeDialog} = useUIStore()
const openMenu = useUIStore((s) => s.openMenu)
  useEffect(() =>{
    console.log("QR openDialog");
    
    openDialog()
    return() => {
          console.log("QR close")
        closeDialog()
    }
       

  },[openDialog,closeDialog])

  const handleUpload = () => {
    // TODO: เปิด file picker
    console.log('อัปโหลด QR')
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* ─── Camera Background (placeholder) ───────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900" />

      {/* ─── Header ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-blue-500/95 to-blue-600/80 backdrop-blur-sm rounded-b-[40px] px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md"
          >
            <ChevronLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-white text-xl font-bold">สแกน QRCode</h1>
         
 <button
        type="button"
        onClick={openMenu}
        aria-label="Menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <Menu size={24} />
      </button>

        </div>
      </div>

      {/* ─── Instruction Text ──────────────────────────── */}
      <div className="absolute top-32 left-0 right-0 z-10 text-center px-5">
        <p className="text-white text-lg font-bold drop-shadow-md">
          สแกน QR Code เพื่อเช็คอิน / เช็คเอาท์
        </p>
      </div>

      {/* ─── Scanner Frame (กลางจอ) ─────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="relative w-72 h-96 max-w-[80vw] max-h-[60vh]">
          {/* 4 Corner Brackets */}
          <div className="absolute top-0 left-0 w-14 h-14 border-t-[6px] border-l-[6px] border-blue-400 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-14 h-14 border-t-[6px] border-r-[6px] border-blue-400 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-14 h-14 border-b-[6px] border-l-[6px] border-blue-400 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-14 h-14 border-b-[6px] border-r-[6px] border-blue-400 rounded-br-3xl" />

          {/* Scanning Line Animation */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_5px_rgba(34,211,238,0.6)] animate-scan" />
          </div>
        </div>
      </div>

      {/* ─── Bottom Info Bar ───────────────────────────── */}
      <div className="absolute bottom-10 left-4 right-4 z-20">
        <div className="bg-slate-900/85 backdrop-blur-sm rounded-3xl px-5 py-4 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Info size={18} className="text-white" />
          </div>

          <p className="flex-1 text-white text-sm font-medium">
            วาง QR Code ให้อยู่ในกรอบเพื่อทำการสแกน
          </p>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="flex flex-col items-center gap-0.5 text-white flex-shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
              <ImagePlus size={22} className="text-white" />
            </div>
            <span className="text-[10px] font-medium">อัปโหลด</span>
          </button>
        </div>
      </div>

      {/* ─── Scan Animation Style ──────────────────────── */}
      <style jsx global>{`
        @keyframes scan {
          0%,
          100% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
        }
        .animate-scan {
          animation: scan 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}