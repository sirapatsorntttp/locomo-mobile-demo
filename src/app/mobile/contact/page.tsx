"use client";

import { Menu, Phone, Mail, MapPin, Clock } from "lucide-react";
import { useUIStore } from "@/lib/store";

/* ─── Types ─── */
interface Contact {
  id: string;
  name: string;
  vendor: string;
  phone: string;
  hours: string;
  avatar?: string;
}

/* ─── Mock ─── */
const rideContacts: Contact[] = [
  {
    id: "r1",
    name: "คุณวีรเดช",
    vendor: "vender1",
    phone: "081-xxx-xxxx",
    hours: "จันทร์ - ศุกร์\n8.00 - 17.00 น.",
  },
  {
    id: "r2",
    name: "คุณวีรเดช",
    vendor: "vender2",
    phone: "081-xxx-xxxx",
    hours: "จันทร์ - ศุกร์\n8.00 - 17.00 น.",
  },
];

const systemContacts: Contact[] = [
  {
    id: "s1",
    name: "คุณวีรเดช",
    vendor: "TTTP",
    phone: "081-xxx-xxxx",
    hours: "จันทร์ - ศุกร์\n8.00 - 17.00 น.",
  },
];

const office = {
  name: "สำนักงานขนส่ง",
  company: "TOYOTA Moter Banpho",
  address: "100/2 ม.1 ต.บ้านโพธิ์ อ.บ้านโพธิ์\nจ.ฉะเชิงเทรา 20100",
  hours: [
    { day: "จันทร์ - ศุกร์", time: "8.00 - 17.00 น." },
    { day: "เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์", time: "ปิดทำการ" },
  ],
};

export default function ContactPage() {
  const openMenu = useUIStore((s) => s.openMenu);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/-/g, "")}`;
  };

  const handleEmail = () => {
    window.location.href = "mailto:contact@locomo.com";
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      {/* ─── Header: เหมือนหน้า History ─── */}
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
                ติดต่อเรา
              </h1>

              <p className="mt-1 text-xs text-white/90 drop-shadow">
                ช่องทางติดต่อและขอความช่วยเหลือ
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
      {/* Body */}
      <div className="relative z-20 -mt-8 space-y-6 px-5">
        {/* ─── ติดต่อเกี่ยวกับการขึ้นรถ ─── */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            ติดต่อเกี่ยวกับการขึ้นรถ
          </h2>
          <div className="space-y-3">
            {rideContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onCall={() => handleCall(c.phone)}
                onEmail={handleEmail}
              />
            ))}
          </div>
        </section>

        {/* ─── ติดต่อเกี่ยวกับระบบ ─── */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            ติดต่อเกี่ยวกับระบบ
          </h2>
          <div className="space-y-3">
            {systemContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onCall={() => handleCall(c.phone)}
                onEmail={handleEmail}
              />
            ))}
          </div>
        </section>

        {/* ─── สำนักงาน ─── */}
        <section className="rounded-3xl border-2 border-blue-400 bg-white p-5 shadow-sm">
          {/* Head */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {office.name}
                </h3>
                <p className="mt-1 text-sm text-slate-700">{office.company}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">
                  {office.address}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="whitespace-nowrap text-xs font-semibold text-blue-500 hover:underline"
            >
              ดูแผนที่
            </button>
          </div>

          <hr className="my-4 border-slate-100" />

          {/* เวลาทำการ */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock size={14} className="text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-blue-500">เวลาทำการ</p>
          </div>

          <div className="mt-3 space-y-2 pl-10">
            {office.hours.map((h, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 text-[11px]"
              >
                <span className="text-slate-600">{h.day}</span>
                <span
                  className={
                    h.time === "ปิดทำการ" ? "text-red-500" : "text-slate-700"
                  }
                >
                  {h.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Contact Card ─── */
function ContactCard({
  contact,
  onCall,
  onEmail,
}: {
  contact: Contact;
  onCall: () => void;
  onEmail: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4  border border-slate-200">
      {/* Avatar */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200" />

      {/* Info (ชื่อ + vendor + เบอร์) */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
          {contact.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{contact.vendor}</p>
        <p className="mt-1 text-xs font-bold text-blue-500 whitespace-nowrap">
          {contact.phone}
        </p>
      </div>

      {/* Right side: hours (top) + buttons (bottom) */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {/* Hours */}
        <p className="whitespace-pre-line text-right text-[10px] leading-[1.35] text-slate-500">
          {contact.hours}
        </p>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onCall}
            aria-label="โทร"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition hover:bg-green-600 active:scale-95"
          >
            <Phone size={16} fill="white" />
          </button>
          <button
            type="button"
            onClick={onEmail}
            aria-label="อีเมล"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition hover:bg-blue-600 active:scale-95"
          >
            <Mail size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
