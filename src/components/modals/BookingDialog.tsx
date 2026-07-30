"use client";

import { useEffect, useMemo, useState } from "react";
import { Bus, Calendar, Navigation, Clock, Car, MapPin } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { useReserveStore } from "@/lib/stores/reserve.store";
import { useShiftStore } from "@/lib/stores/shift.store";
import { CustomSelect } from "./CustomSelect";
import type { Reserve } from "@/types";

interface Props {
  booking: Reserve;
  onClose: () => void;
}

/* default_time เป็น ISO datetime (1970-01-01T08:00:00) → "08:00" */
const fmtTime = (t?: string) => {
  if (!t) return "-";
  const d = new Date(t);
  if (!isNaN(d.getTime())) {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return t.slice(0, 5);
};

/* Date → "YYYY-MM-DD" (local) สำหรับ input type=date */
const toInputDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function BookingDialog({ booking, onClose }: Props) {
  const { openDialog, closeDialog } = useUIStore();
  const { deleteReserve, addReserve } = useReserveStore();
  const { shifts, loadShifts } = useShiftStore();

  const isPending = booking.is_state === "waiting";
  const isApproved =
    booking.is_state === "approved" || booking.is_state === "finished";
  const editable = isPending;

  // ── edit state ──
  const [editDate, setEditDate] = useState(toInputDate(booking.travel_date));
  const [editDir, setEditDir] = useState<"inbound" | "outbound">(
    (booking.shift?.trip_direction as "inbound" | "outbound") ?? "inbound",
  );
  const [editShiftId, setEditShiftId] = useState(booking.shift_id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    openDialog();
    document.body.style.overflow = "hidden";
    return () => {
      closeDialog();
      document.body.style.overflow = "";
    };
  }, [openDialog, closeDialog]);

  useEffect(() => {
    if (editable) loadShifts();
  }, [editable, loadShifts]);

  // ── options ──
  const dirOptions = [
    { value: "inbound", label: "รอบรับเข้า" },
    { value: "outbound", label: "รอบรับออก" },
  ];

  // เวลาของทิศทางที่เลือก
  const timeShifts = useMemo(
    () => shifts.filter((s) => s.trip_direction === editDir),
    [shifts, editDir],
  );
  const timeOptions = useMemo(
    () => timeShifts.map((s) => ({ id: s.id, label: fmtTime(s.default_time) })),
    [timeShifts],
  );
  const timeLabelToId = new Map(timeOptions.map((o) => [o.label, o.id]));

  // เปลี่ยนทิศทาง → รีเซ็ตเวลาเป็นตัวแรกของทิศทางนั้น
  const handleChangeDir = (label: string) => {
    const dir = dirOptions.find((o) => o.label === label)?.value as
      | "inbound"
      | "outbound";
    setEditDir(dir);
    const first = shifts.find((s) => s.trip_direction === dir);
    if (first) setEditShiftId(first.id);
  };

  // ── ค่าที่ใช้แสดง ──
  const selShift = editable
    ? (shifts.find((s) => s.id === editShiftId) ?? booking.shift)
    : booking.shift;

  const formatThaiDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const months = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  };

  const roundText =
    selShift?.trip_direction === "inbound"
      ? "รอบรับเข้า"
      : selShift?.trip_direction === "outbound"
        ? "รอบรับออก"
        : "-";

  const routeText = booking.route
    ? `${booking.route.code ?? ""} ${booking.route.name_th || booking.route.name_en || ""}`.trim()
    : "ยังไม่ได้กำหนดเส้นทาง";
  const pickupText =
    booking.point?.name_th ||
    booking.point?.name_en ||
    "ยังไม่ได้กำหนดจุดรับส่ง";

  const empName =
    `${booking.employee?.first_name_th ?? ""} ${booking.employee?.last_name_th ?? ""}`.trim() ||
    "-";
  const empCode = booking.employee?.code ?? "-";
  const createdText = formatThaiDate(booking.created_at);

  const iconBgColor = isPending
    ? "bg-amber-500"
    : isApproved
      ? "bg-green-500"
      : "bg-red-500";
  const statusText = isPending
    ? { label: "รออนุมัติ", color: "text-amber-500" }
    : isApproved
      ? {
          label: booking.is_state === "finished" ? "เสร็จสิ้น" : "อนุมัติแล้ว",
          color: "text-green-600",
        }
      : { label: "ยกเลิก", color: "text-red-500" };

  // ── actions ──
  const handleCancelBooking = async () => {
    await deleteReserve(booking.id);
    onClose();
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 1) ยกเลิกอันเก่า → is_state = 'canceled'
      await deleteReserve(booking.id);

      // 2) สร้างอันใหม่ → is_state = 'waiting' (รออนุมัติ)
      await addReserve({
        employee_id: booking.employee_id,
        shift_id: editShiftId,
        point_id: booking.point_id,
        travel_date: editDate,
        remark: booking.remark ?? undefined,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-slate-100">
          <p className="absolute top-4 right-5 text-[11px] text-slate-400">
            จองเมื่อ {createdText}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBgColor}`}
            >
              <Bus size={26} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{empName}</h3>
              <p className="text-xs text-slate-500">รหัสพนักงาน: {empCode}</p>
              <p className="text-xs text-slate-500">
                สถานะ:{" "}
                <span className={`font-semibold ${statusText.color}`}>
                  {statusText.label}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* รายละเอียด */}
        <div className="p-5">
          <h4 className="text-sm font-bold text-blue-600 mb-4">รายละเอียด</h4>

          <div className="space-y-3">
            {/* วันที่เดินทาง */}
            <FieldRow
              icon={<Calendar size={18} className="text-blue-500" />}
              label="วันที่เดินทาง"
            >
              {editable ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <TextDisplay value={formatThaiDate(booking.travel_date)} />
              )}
            </FieldRow>

            {/* รอบ (ทิศทาง) */}
            <FieldRow
              icon={<Navigation size={18} className="text-blue-500" />}
              label="รอบ"
            >
              {editable ? (
                <CustomSelect
                  value={
                    dirOptions.find((o) => o.value === editDir)?.label ?? ""
                  }
                  onChange={handleChangeDir}
                  options={dirOptions.map((o) => o.label)}
                />
              ) : (
                <TextDisplay value={roundText} />
              )}
            </FieldRow>

            {/* เวลารับ */}
            <FieldRow
              icon={<Clock size={18} className="text-blue-500" />}
              label="เวลารับ"
            >
              {editable ? (
                <CustomSelect
                  value={
                    timeOptions.find((o) => o.id === editShiftId)?.label ?? ""
                  }
                  onChange={(label) =>
                    setEditShiftId(timeLabelToId.get(label) ?? editShiftId)
                  }
                  options={timeOptions.map((o) => o.label)}
                />
              ) : (
                <TextDisplay value={fmtTime(selShift?.default_time)} />
              )}
            </FieldRow>

            {/* สายรถ — read-only (default emp) */}
            <FieldRow
              icon={<Car size={18} className="text-blue-500" />}
              label="สายรถ"
            >
              <TextDisplay value={routeText} />
            </FieldRow>

            {/* จุดรับส่ง — read-only (default emp) */}
            <FieldRow
              icon={<MapPin size={18} className="text-blue-500" />}
              label="จุดรับส่ง"
            >
              <TextDisplay value={pickupText} />
            </FieldRow>

            {booking.remark && (
              <FieldRow
                icon={<MapPin size={18} className="text-blue-500" />}
                label="หมายเหตุ"
              >
                <TextDisplay value={booking.remark} />
              </FieldRow>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6">
            {isPending ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCancelBooking}
                  disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md disabled:opacity-60"
                >
                  ยกเลิกการจอง
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md disabled:opacity-60"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            ) : isApproved ? (
              <button
                onClick={onClose}
                className="w-full bg-slate-500 hover:bg-slate-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md"
              >
                ปิด
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full bg-slate-500 hover:bg-slate-600 text-white rounded-2xl py-3 font-bold text-base transition-colors shadow-md"
              >
                ปิด
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ Field Row ═══════ */
function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold text-slate-600">{label}</span>
      </div>
      {children}
    </div>
  );
}

/* ═══════ Text Display ═══════ */
function TextDisplay({ value }: { value: string }) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700">
      {value}
    </div>
  );
}
