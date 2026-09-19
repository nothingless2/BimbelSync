"use client";

import { useState } from "react";
import { X, AlertCircle, Calendar } from "lucide-react";
import { rescheduleScheduleAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { Schedule, Program, Room, Staff } from "@prisma/client";
import { format } from "date-fns";

export function RescheduleModal({ 
  schedule, 
  rooms,
  onClose 
}: { 
  schedule: Schedule & { program: Program, tutor: Staff }, 
  rooms: Room[],
  onClose: () => void 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await rescheduleScheduleAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      onClose();
    }
    
    setIsLoading(false);
  };

  const currentStartDateStr = format(new Date(schedule.start_time), "yyyy-MM-dd");
  const currentStartTimeStr = format(new Date(schedule.start_time), "HH:mm");
  const currentEndTimeStr = format(new Date(schedule.end_time), "HH:mm");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">
          <div>
            <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Calendar size={18} /> Reschedule Jadwal
            </h2>
            <p className="text-sm text-slate-500 truncate max-w-[250px]">
              {schedule.program.name} ({schedule.tutor.name || schedule.tutor.email})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input type="hidden" name="schedule_id" value={schedule.id} />

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="date" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tanggal Baru <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              defaultValue={currentStartDateStr}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="start_time" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Waktu Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                required
                defaultValue={currentStartTimeStr}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="end_time" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Waktu Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                required
                defaultValue={currentEndTimeStr}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="room_id" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Ruangan <span className="text-red-500">*</span>
            </label>
            <select
              id="room_id"
              name="room_id"
              required
              defaultValue={schedule.room_id}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Pilih Ruangan</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name} (Kapasitas: {room.capacity})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Memproses..." : "Simpan Jadwal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
