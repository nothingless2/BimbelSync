"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Trash2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteScheduleAction } from "./actions";
import { CancelScheduleModal } from "@/components/modals/cancel-schedule-modal";
import { Schedule, Program, Staff, Room } from "@prisma/client";
import { useRouter } from "next/navigation";
import { format, addDays, subWeeks, addWeeks, isSameDay, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ScheduleWithRelations = Schedule & {
  program: Program;
  tutor: Staff;
  room: Room;
};

export default function SchedulesClientPage({ 
  schedules, 
  rooms,
  tenantSlug,
  currentWeekStart
}: { 
  schedules: ScheduleWithRelations[], 
  rooms: Room[],
  tenantSlug: string,
  currentWeekStart: string
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const weekStart = parseISO(currentWeekStart);
  const weekEnd = addDays(weekStart, 6);

  const goToPreviousWeek = () => {
    const prev = subWeeks(weekStart, 1);
    router.push(`/${tenantSlug}/dashboard/schedules?weekStart=${prev.toISOString()}`);
  };

  const goToNextWeek = () => {
    const next = addWeeks(weekStart, 1);
    router.push(`/${tenantSlug}/dashboard/schedules?weekStart=${next.toISOString()}`);
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openDropdownId === id) setOpenDropdownId(null);
    else setOpenDropdownId(id);
  };

  const handleDelete = (schedule: ScheduleWithRelations) => {
    setOpenDropdownId(null);
    toast(`Hapus Jadwal?`, {
      description: "Data jadwal akan dihapus secara permanen.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(schedule.id);
          const res = await deleteScheduleAction(schedule.id);
          if (res.error) toast.error(res.error);
          else toast.success("Jadwal berhasil dihapus.");
          setDeletingId(null);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  // Generate 7 days array starting from weekStart
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(date));
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar & Legend */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button 
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 font-semibold text-sm text-slate-700 dark:text-slate-300">
              {format(weekStart, "d MMM yyyy", { locale: localeId })} - {format(weekEnd, "d MMM yyyy", { locale: localeId })}
            </span>
            <button 
              onClick={goToNextWeek}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Terjadwal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Dibatalkan</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid Wrapper - Allows horizontal scrolling on small screens */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-center divide-x divide-slate-200 dark:divide-slate-800">
              <div className="p-4 text-left font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                RUANGAN
              </div>
              {days.map((day, idx) => (
                <div key={idx} className="p-4">
                  <div className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">
                    {format(day, "EEEE", { locale: localeId })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {format(day, "d MMM")}
                  </div>
                </div>
              ))}
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {rooms.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Belum ada ruangan yang ditambahkan.
                </div>
              ) : (
                rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-[200px_repeat(7,1fr)] divide-x divide-slate-100 dark:divide-slate-800/60">
                    
                    {/* Room Info Cell */}
                    <div className="p-4 flex flex-col justify-center">
                      <span className="font-bold text-slate-900 dark:text-white">{room.name}</span>
                      <span className="text-xs text-slate-500 mt-1">Kapasitas: {room.capacity}</span>
                    </div>

                    {/* Days Cells */}
                    {days.map((day, dayIdx) => {
                      // Find schedules for this room on this specific day
                      const daySchedules = schedules.filter(sch => 
                        sch.room_id === room.id && isSameDay(new Date(sch.start_time), day)
                      );

                      return (
                        <div key={dayIdx} className="p-2 min-h-[120px] bg-white dark:bg-[#111827]">
                          <div className="space-y-2">
                            {daySchedules.map((sch) => {
                              const isCancelled = sch.status === 'CANCELLED';
                              
                              return (
                                <div 
                                  key={sch.id} 
                                  className={`relative group p-3 rounded-xl border text-left ${
                                    isCancelled 
                                      ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                                      : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'
                                  }`}
                                  onClick={() => router.push(`/${tenantSlug}/dashboard/schedules/${sch.id}`)}
                                >
                                  {deletingId === sch.id && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center rounded-xl z-10 backdrop-blur-[1px]">
                                      <span className="text-xs font-bold animate-pulse">Menghapus...</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-start justify-between mb-1.5">
                                    <div className={`text-[11px] font-bold flex items-center gap-1 ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                      <Clock size={12} />
                                      {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                                    </div>

                                    {/* Action Dropdown Toggle */}
                                    <button 
                                      type="button"
                                      onClick={(e) => toggleDropdown(sch.id, e)}
                                      className="text-slate-400 hover:text-slate-700 -mr-1 -mt-1 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                    >
                                      <MoreVertical size={14} />
                                    </button>

                                    {/* Action Dropdown Menu */}
                                    {openDropdownId === sch.id && (
                                      <div className="absolute top-8 right-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); router.push(`/${tenantSlug}/dashboard/schedules/${sch.id}`); setOpenDropdownId(null); }}
                                          className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300"
                                        >
                                          Lihat Detail & Absensi
                                        </button>
                                        {!isCancelled && (
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setCancellingSchedule(sch); setOpenDropdownId(null); }}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium text-amber-600 dark:text-amber-500"
                                          >
                                            Batalkan Jadwal
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); handleDelete(sch); }}
                                          className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-red-600 dark:text-red-500 flex items-center justify-between group-hover:text-red-700"
                                        >
                                          Hapus Permanen
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className={`font-bold text-sm leading-tight mb-2 ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                    {sch.program.name}
                                  </div>
                                  
                                  <div className={`text-[11px] font-medium flex flex-wrap gap-x-2 gap-y-1 ${isCancelled ? 'text-red-500/70' : 'text-blue-600/70 dark:text-blue-400/70'}`}>
                                    <div className="flex items-center gap-1">
                                      <User size={12} />
                                      <span className="truncate max-w-[80px]">{sch.tutor.name || sch.tutor.email}</span>
                                    </div>
                                  </div>

                                  {isCancelled && (
                                    <div className="mt-2 text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded w-max">
                                      DIBATALKAN
                                    </div>
                                  )}

                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {cancellingSchedule && (
        <CancelScheduleModal 
          schedule={cancellingSchedule}
          tenantSlug={tenantSlug}
          onClose={() => setCancellingSchedule(null)}
        />
      )}

      {/* Close dropdowns when clicking outside */}
      {openDropdownId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdownId(null)}
        />
      )}
    </>
  );
}
