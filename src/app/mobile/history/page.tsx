"use client";

import { useState } from "react";
import {
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Menu,
} from "lucide-react";
import BookingDialog from "@/components/modals/BookingDialog";
import { useUIStore } from "@/lib/store";
import { mockHistory, type BookingStatus } from "@/lib/mockData";

type TabType = "pending" | "approved" | "cancelled";

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>("approved");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = mockHistory.filter((h) => h.status === tab);
  const selectedBooking = mockHistory.find((h) => h.id === selectedId);
  const openMenu = useUIStore((s) => s.openMenu);

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ─── Header (bg image + overlay) ─── */}
      <div
        className="relative rounded-b-[40px] px-7 pt-12 pb-16 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        {/* Content */}
        <div className="relative z-10">
          {/* Row: Title + Menu */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                ประวัติการจอง
              </h1>
              <p className="mt-1 text-xs text-white/90 drop-shadow">
                รายการจองทั้งหมดของคุณ
              </p>
            </div>

            <button
              type="button"
              onClick={openMenu}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs (ลอยทับ header) ─── */}
      <div className="relative z-20 -mt-8 mx-5">
        <div className="flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TabButton
            label="รออนุมัติ"
            active={tab === "pending"}
            onClick={() => setTab("pending")}
          />
          <TabButton
            label="อนุมัติแล้ว"
            active={tab === "approved"}
            onClick={() => setTab("approved")}
          />
          <TabButton
            label="ยกเลิก"
            active={tab === "cancelled"}
            onClick={() => setTab("cancelled")}
          />
        </div>
      </div>

      {/* ─── Card List ─── */}
      <div className="mt-6 space-y-3 px-5">
        {filtered.map((item) => (
          <BookingCard
            key={item.id}
            item={item}
            onClick={() => setSelectedId(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-sm text-slate-400">ไม่พบข้อมูล</p>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {selectedBooking && (
        <BookingDialog
          booking={selectedBooking}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/* ═══════ Tab Button ═══════ */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

/* ═══════ Booking Card ═══════ */
function BookingCard({
  item,
  onClick,
}: {
  item: (typeof mockHistory)[0];
  onClick?: () => void;
}) {
  const statusConfig = {
    pending: {
      label: "รออนุมัติ",
      icon: <Clock size={12} />,
      className: "bg-amber-100 text-amber-700",
    },
    approved: {
      label: "อนุมัติแล้ว",
      icon: <CheckCircle2 size={12} />,
      className: "bg-green-100 text-green-700",
    },
    cancelled: {
      label: "ยกเลิก",
      icon: <XCircle size={12} />,
      className: "bg-red-100 text-red-600",
    },
  };

  const status = statusConfig[item.status];

  const codeBg = {
    pending: "bg-amber-500",
    approved: "bg-green-500",
    cancelled: "bg-red-500",
  }[item.status];

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-4 text-left 
        hover:shadow-md active:scale-[0.99] transition-all"
    >
      {/* Row 1: Code + Route Name + Status */}
      <div className="flex items-center gap-3">
        {/* Code Badge */}
        <div
          className={`w-12 h-12 rounded-xl ${codeBg} flex items-center justify-center 
            text-white font-bold text-sm flex-shrink-0`}
        >
          {item.routeCode}
        </div>

        {/* Route Name */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800 truncate">
            {item.from} - {item.to}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            รหัสสาย {item.routeCode}
          </p>
        </div>

        {/* Status Badge */}
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${status.className}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-slate-200 my-3" />

      {/* Row 2: Date + Employee */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar size={14} className="flex-shrink-0 text-slate-400" />
          <p className="text-xs ">
            {item.date}
            <span className="ml-2 text-slate-400">•</span>
            <span className="ml-2">{item.time}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-600">
          <User size={14} className="flex-shrink-0 text-slate-400" />

          <p className="text-xs">
            <span>{item.empCode}</span>
            <span className="ml-2">{item.empName}</span>
          </p>
        </div>
      </div>
    </button>
  );
}
