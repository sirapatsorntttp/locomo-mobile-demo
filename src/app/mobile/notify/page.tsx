"use client";

import { useState } from "react";
import { Menu, Bus, Bell, Ticket } from "lucide-react";
import { useUIStore } from "@/lib/store";
import NotifyDialog, { NotifyItem } from "@/components/modals/NotifyDialog";

type TabKey = "all" | "important" | "booking";

const mockData: NotifyItem[] = [
  {
    id: "1",
    type: "booking",
    category: "booking-success",
    title: "การจองของคุณสำเร็จ",
    subtitle: "หมายเลขการจอง: A012553",
    extra: "สาย A01 อ่าวอุดม → บ้านโพธิ์",
    time: "09.41 น.",
    read: false,
    detail: {
      bookingNo: "A012553",
      status: "ยืนยันแล้ว",
      dateTime: "20 พฤษภาคม 2569 09:40 น.",
      route: "สาย A01 อ่าวอุดม - บางโพธิ์",
      pickup: "ป้ายหน้าอาคาร A",
      pickupTime: "07:15 น.",
      user: {
        name: "นายสุขใจ ใจมั่น",
        empCode: "EMP10245",
        department: "ฝ่ายผลิต",
        plant: "Plant 1",
      },
    },
  },
  {
    id: "2",
    type: "important",
    category: "time",
    title: "ถึงเวลาขึ้นรถแล้ว",
    subtitle: "สาย A01 อ่าวอุดม → บ้านโพธิ์",
    extra: "รถจะออกในอีก 5 นาที",
    time: "09.41 น.",
    read: false,
  },
  {
    id: "3",
    type: "booking",
    category: "booking-cancel",
    title: "การจองของคุณถูกยกเลิก",
    subtitle: "หมายเลขการจอง: A012553",
    extra: "ยกเลิกการจองเรียบร้อยแล้ว",
    time: "09.41 น.",
    read: true,
  },
];

export default function NotifyPage() {
  const openMenu = useUIStore((s) => s.openMenu);

  const [tab, setTab] = useState<TabKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = mockData.filter((item) => {
    if (tab === "all") return true;
    if (tab === "important") return item.type === "important";
    if (tab === "booking") return item.type === "booking";
    return true;
  });

  const selected = mockData.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div
        className="relative overflow-hidden rounded-b-[40px] bg-cover bg-center px-7 pb-16 pt-12"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                แจ้งเตือน
              </h1>

              <p className="mt-1 text-xs text-white/90 drop-shadow">
                ประวัติการแจ้งเตือนของคุณ
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

      {/* ─── Tabs: ลอยทับ Header เหมือนหน้า History ─── */}
      <div className="relative z-20 mx-5 -mt-8">
        <div className="flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TabButton
            label="ทั้งหมด"
            active={tab === "all"}
            onClick={() => setTab("all")}
          />

          <TabButton
            label="สำคัญ"
            active={tab === "important"}
            onClick={() => setTab("important")}
          />

          <TabButton
            label="การจอง"
            active={tab === "booking"}
            onClick={() => setTab("booking")}
          />
        </div>
      </div>

      {/* ─── Notification List ─── */}
      <div className="mt-6 space-y-3 px-5">
        {filtered.map((item) => (
          <NotifyCard
            key={item.id}
            item={item}
            onClick={() => setSelectedId(item.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
            <p className="text-sm text-slate-400">ไม่มีการแจ้งเตือน</p>
          </div>
        )}
      </div>

      {/* Dialog */}
      {selected && (
        <NotifyDialog item={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

/* ─── Tab Button ─── */
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
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
        active ? "bg-blue-600 text-white shadow" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Notify Card ─── */
function NotifyCard({
  item,
  onClick,
}: {
  item: NotifyItem;
  onClick: () => void;
}) {
  const iconConfig = getIconConfig(item.category);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
    >
      {/* Icon */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconConfig.bg}`}
      >
        <iconConfig.Icon size={22} className="text-white" />
      </div>

      {/* Text */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">{item.title}</p>
          <div className="flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-400">
            {!item.read && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            )}
            {item.time}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
        {item.extra && (
          <p className="mt-0.5 text-xs text-slate-500">{item.extra}</p>
        )}
      </div>
    </button>
  );
}

function getIconConfig(category: NotifyItem["category"]) {
  switch (category) {
    case "booking-success":
      return { Icon: Bus, bg: "bg-blue-500" };
    case "booking-cancel":
      return { Icon: Ticket, bg: "bg-sky-400" };
    case "time":
      return { Icon: Bell, bg: "bg-green-500" };
    default:
      return { Icon: Bell, bg: "bg-slate-400" };
  }
}
