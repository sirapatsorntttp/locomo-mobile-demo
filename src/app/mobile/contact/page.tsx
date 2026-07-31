"use client";

import { Menu, Phone, Mail, MapPin, Clock } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useLang } from "@/lib/lang-context";

/* ─── Types ─── */
interface Contact {
  id: string;
  name: string;
  vendor: string;
  phone: string;
  hours: string;
}

export default function ContactPage() {
  const openMenu = useUIStore((s) => s.openMenu);
  const { t } = useLang();

  // hours ใช้ค่าแปลจาก t()
  const hoursText = `${t("contact", "weekdays")}\n${t("contact", "workTime")}`;

  const rideContacts: Contact[] = [
    {
      id: "r1",
      name: "คุณวีรเดช",
      vendor: "vender1",
      phone: "081-xxx-xxxx",
      hours: hoursText,
    },
    {
      id: "r2",
      name: "คุณวีรเดช",
      vendor: "vender2",
      phone: "081-xxx-xxxx",
      hours: hoursText,
    },
  ];

  const systemContacts: Contact[] = [
    {
      id: "s1",
      name: "คุณวีรเดช",
      vendor: "TTTP",
      phone: "081-xxx-xxxx",
      hours: hoursText,
    },
  ];

  const office = {
    name: t("contact", "officeName"),
    company: "TOYOTA Motor Banpho",
    address: "100/2 ม.1 ต.บ้านโพธิ์ อ.บ้านโพธิ์\nจ.ฉะเชิงเทรา 20100",
    hours: [
      { day: t("contact", "weekdays"), time: t("contact", "workTime") },
      { day: t("contact", "weekend"), time: t("contact", "closed") },
    ],
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/-/g, "")}`;
  };

  const handleEmail = () => {
    window.location.href = "mailto:contact@locomo.com";
  };

  const closedLabel = t("contact", "closed");

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-b-[40px] bg-cover bg-center px-7 pb-16 pt-12"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-md">
                {t("contact", "title")}
              </h1>
              <p className="mt-1 text-xs text-white/90 drop-shadow">
                {t("contact", "subtitle")}
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
        {/* ติดต่อเกี่ยวกับการขึ้นรถ */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            {t("contact", "rideContact")}
          </h2>
          <div className="space-y-3">
            {rideContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onCall={() => handleCall(c.phone)}
                onEmail={handleEmail}
                callLabel={t("contact", "labelCall")}
                emailLabel={t("contact", "labelEmail")}
              />
            ))}
          </div>
        </section>

        {/* ติดต่อเกี่ยวกับระบบ */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-800">
            {t("contact", "systemContact")}
          </h2>
          <div className="space-y-3">
            {systemContacts.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onCall={() => handleCall(c.phone)}
                onEmail={handleEmail}
                callLabel={t("contact", "labelCall")}
                emailLabel={t("contact", "labelEmail")}
              />
            ))}
          </div>
        </section>

        {/* สำนักงาน */}
        <section className="rounded-3xl border-2 border-blue-400 bg-white p-5 shadow-sm">
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
              {t("contact", "viewMap")}
            </button>
          </div>

          <hr className="my-4 border-slate-100" />

          {/* เวลาทำการ */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock size={14} className="text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-blue-500">
              {t("contact", "officeHours")}
            </p>
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
                    h.time === closedLabel ? "text-red-500" : "text-slate-700"
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
  callLabel,
  emailLabel,
}: {
  contact: Contact;
  onCall: () => void;
  onEmail: () => void;
  callLabel: string;
  emailLabel: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4 border border-slate-200">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
          {contact.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{contact.vendor}</p>
        <p className="mt-1 text-xs font-bold text-blue-500 whitespace-nowrap">
          {contact.phone}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="whitespace-pre-line text-right text-[10px] leading-[1.35] text-slate-500">
          {contact.hours}
        </p>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onCall}
            aria-label={callLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition hover:bg-green-600 active:scale-95"
          >
            <Phone size={16} fill="white" />
          </button>
          <button
            type="button"
            onClick={onEmail}
            aria-label={emailLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition hover:bg-blue-600 active:scale-95"
          >
            <Mail size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
