"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Building2,
  User,
  Mail,
  Phone,
  Bus,
  SquarePen,
  Factory,
} from "lucide-react";

import { useUIStore } from "@/lib/store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRoutePointStore } from "@/lib/stores/useRoutePointStore";
import { useCompanyStore } from "@/lib/stores/company.store";
import { usePlantStore } from "@/lib/stores/plant.store";
import { useEmployeeStore } from "@/lib/stores/employee.store";
import { useLang } from "@/lib/lang-context";

import EditRouteDialog, {
  type EditRouteData,
} from "@/components/modals/EditRouteDialog";
import type { EmployeeFull, EmployeeTransportDefault, Language } from "@/types";
import type { Lang } from "@/lib/i18n";

export default function ProfilePage() {
  const router = useRouter();
  const openMenu = useUIStore((state) => state.openMenu);

  const { routes, points, loadRoutesPoints } = useRoutePointStore();
  const { profile, logout, fetchProfile } = useAuthStore();
  const { companyPlants, loadCompanies } = useCompanyStore();
  const { loadPlants } = usePlantStore();
  const { employees, employeeLoading, updateEmployee, loadEmployees } =
    useEmployeeStore();

  const { lang, setLang, t } = useLang(); // lang = 'th' | 'en'

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlants();
    fetchProfile();
    loadCompanies();
    loadEmployees();
    loadRoutesPoints();
  }, []);

  const userPlants = companyPlants.filter((cp) =>
    profile?.plantIds?.includes(cp.id),
  );

  const currentEmployee: EmployeeFull | undefined = employees.find(
    (e) => e.code === profile?.code,
  );

  const transportDefaults: EmployeeTransportDefault[] =
    currentEmployee?.transport_defaults ?? [];

  const inbound = transportDefaults.find((i) => i.trip_direction === "inbound");
  const outbound = transportDefaults.find(
    (i) => i.trip_direction === "outbound",
  );

  const nameOf = (
    item?: { name_th: string; name_en: string } | null,
    fallback = t("profile", "notSet"),
  ) => {
    if (!item) return fallback;
    return lang === "th"
      ? item.name_th || item.name_en || fallback
      : item.name_en || item.name_th || fallback;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleSaveRoute = async (data: EditRouteData) => {
    if (!currentEmployee?.id) return;
    try {
      setSaving(true);
      await updateEmployee(currentEmployee.id, {
        transportDefaults: [
          {
            trip_direction: "inbound",
            route_id: data.tripIn.routeId || undefined,
            point_id: data.tripIn.pointId || undefined,
          },
          {
            trip_direction: "outbound",
            route_id: data.tripOut.routeId || undefined,
            point_id: data.tripOut.pointId || undefined,
          },
        ],
      } as any);
      setEditOpen(false);
    } catch (error) {
      console.error("อัปเดตข้อมูลรถรับส่งไม่สำเร็จ:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div
        className="relative rounded-b-[40px] px-5 pt-12 pb-16 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-700/50 to-blue-500/40" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-md">
              {t("profile", "title")}
            </h1>
            <p className="mt-1 text-xs text-white/90 drop-shadow">
              {t("profile", "subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={openMenu}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Avatar + Language */}
      <div className="relative z-20 -mt-14 px-5">
        <div className="relative flex items-center justify-center">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg">
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-3xl font-bold text-white">
              {profile?.firstName?.charAt(0) ?? "U"}
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <LanguageToggle value={lang} onChange={setLang} />
          </div>
        </div>
      </div>

      <div className="h-6" />

      {/* ข้อมูลส่วนตัว */}
      <div className="px-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          {t("profile", "personalInfo")}
        </h2>
        <div className="divide-y divide-slate-300 border-b border-slate-300">
          <InfoRow
            icon={<Building2 size={22} className="text-slate-700" />}
            value={
              profile?.companyName
                ? profile.companyCode
                  ? `${profile.companyName} (${profile.companyCode})`
                  : profile.companyName
                : "-"
            }
          />
          <InfoRow
            icon={<Factory size={22} className="text-slate-700" />}
            value={
              userPlants.length > 0
                ? userPlants
                    .map((cp) =>
                      lang === "th" ? cp.plants?.name_th : cp.plants?.name_en,
                    )
                    .filter(Boolean)
                    .join(", ")
                : "-"
            }
          />
          <InfoRow
            icon={<User size={22} className="text-slate-700" />}
            value={
              `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
              "-"
            }
          />
          <InfoRow
            icon={<Mail size={22} className="text-slate-700" />}
            value={profile?.email ?? "-"}
          />
          <InfoRow
            icon={<Phone size={22} className="text-slate-700" />}
            value={profile?.tel ?? "-"}
          />
        </div>
      </div>

      {/* ข้อมูลรถรับส่ง */}
      <div className="mt-8 px-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          {t("profile", "transportInfo")}
        </h2>

        {employeeLoading && employees.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            {t("profile", "loading")}
          </div>
        ) : !currentEmployee ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-center shadow-sm">
            <p className="text-sm text-slate-400">
              {t("profile", "noEmployee")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-300 border-b border-slate-300">
            <RouteRow
              label={t("profile", "routeIn")}
              editLabel={t("profile", "edit")}
              code={inbound?.route?.code}
              location={nameOf(inbound?.route)}
              onEdit={() => setEditOpen(true)}
              disabled={employeeLoading}
            />
            <RouteRow
              label={t("profile", "pickupPoint")}
              editLabel={t("profile", "edit")}
              code={inbound?.point?.code}
              location={nameOf(inbound?.point)}
              onEdit={() => setEditOpen(true)}
              disabled={employeeLoading}
            />
            <RouteRow
              label={t("profile", "routeOut")}
              editLabel={t("profile", "edit")}
              code={outbound?.route?.code}
              location={nameOf(outbound?.route)}
              onEdit={() => setEditOpen(true)}
              disabled={employeeLoading}
            />
            <RouteRow
              label={t("profile", "dropoffPoint")}
              editLabel={t("profile", "edit")}
              code={outbound?.point?.code}
              location={nameOf(outbound?.point)}
              onEdit={() => setEditOpen(true)}
              disabled={employeeLoading}
            />
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="mt-8 px-5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl bg-red-500 py-3.5 font-bold text-white shadow-md transition hover:bg-red-600 active:scale-[0.98]"
        >
          {t("profile", "logout")}
        </button>
      </div>

      {/* Edit Dialog */}
      {editOpen && currentEmployee && (
        <EditRouteDialog
          user={{
            name:
              lang === "th"
                ? `${currentEmployee.first_name_th ?? ""} ${currentEmployee.last_name_th ?? ""}`.trim()
                : `${currentEmployee.first_name_en ?? ""} ${currentEmployee.last_name_en ?? ""}`.trim(),
            empCode: currentEmployee.code,
          }}
          routes={routes}
          points={points}
          lang={lang as Language}
          initialData={{
            tripIn: {
              routeId: inbound?.route_id ?? "",
              pointId: inbound?.point_id ?? "",
            },
            tripOut: {
              routeId: outbound?.route_id ?? "",
              pointId: outbound?.point_id ?? "",
            },
          }}
          saving={saving}
          onClose={() => !saving && setEditOpen(false)}
          onSave={handleSaveRoute}
        />
      )}
    </div>
  );
}

/* ─── Language Toggle ─── */
function LanguageToggle({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (v: Lang) => void;
}) {
  return (
    <div className="flex items-center rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
      {(["th", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition-all ${
            value === l ? "bg-[#3956FF] text-white shadow" : "text-slate-600"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ─── Info Row ─── */
function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {icon}
      </div>
      <span className="min-w-0 flex-1 break-words text-base text-slate-700">
        {value}
      </span>
    </div>
  );
}

/* ─── Route Row ─── */
function RouteRow({
  label,
  editLabel,
  code,
  location,
  onEdit,
  disabled = false,
}: {
  label: string;
  editLabel: string;
  code?: string | null;
  location?: string | null;
  onEdit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        <Bus size={26} className="text-slate-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-blue-600">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-400">
          {code && (
            <>
              <span>{code}</span>
              <span className="mx-1.5 text-slate-300">|</span>
            </>
          )}
          <span>{location}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        aria-label={`${editLabel} ${label}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SquarePen size={22} />
      </button>
    </div>
  );
}
