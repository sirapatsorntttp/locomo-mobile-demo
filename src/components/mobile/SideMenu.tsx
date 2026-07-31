"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Home,
  Bus,
  Car,
  Clock,
  ScanLine,
  MapPin,
  MessageSquareWarning,
  Bell,
  Phone,
  Settings,
  Calendar,
} from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLang } from "@/lib/lang-context";
import type { Translations } from "@/lib/i18n";
interface Props {
  open: boolean;
  onClose: () => void;
}

const menuItems: {
  href: string;

  key: keyof Translations["menu"];

  icon: React.ElementType;
}[] = [
  { href: "/mobile/home", key: "home", icon: Home },

  { href: "/mobile/calendar", key: "calendar", icon: Calendar },

  { href: "/mobile/reserve", key: "reserve", icon: Car },

  { href: "/mobile/history", key: "history", icon: Clock },

  { href: "/mobile/qrcode", key: "qrcode", icon: ScanLine },

  { href: "/mobile/tracking", key: "tracking", icon: MapPin },

  { href: "/mobile/comment", key: "comment", icon: MessageSquareWarning },

  { href: "/mobile/notify", key: "notify", icon: Bell },
  { href: "/mobile/contact", key: "contact", icon: Phone },

  { href: "/mobile/profile", key: "settings", icon: Settings },
];

export default function SideMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { openDialog, closeDialog } = useUIStore();
  const { logout } = useAuthStore();
  const { t } = useLang();
  //  ซ่อน BottomNav + Lock scroll ตอนเปิด
  useEffect(() => {
    if (open) {
      openDialog();
      document.body.style.overflow = "hidden";
    } else {
      closeDialog();
      document.body.style.overflow = "";
    }
    return () => {
      closeDialog();
      document.body.style.overflow = "";
    };
  }, [open, openDialog, closeDialog]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* ═══ Backdrop ═══ */}
      <div
        className={`fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* ═══ Drawer ═══ */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-white z-[95] shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header: LOCOMO Logo + Close */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-blue-100">
          <h2 className="text-2xl font-black text-blue-600 tracking-wide">
            LOCOMO
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
          flex items-center gap-4
          px-4 py-3 rounded-xl
          transition-all
          ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }
        `}
              >
                <Icon size={22} />

                <span className="font-medium">{t("menu", item.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-3.5 font-bold text-base transition-colors shadow-md"
          >
            {t("menu", "logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
