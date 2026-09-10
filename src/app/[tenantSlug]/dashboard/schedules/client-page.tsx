"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Trash2, Calendar as CalendarIcon, Grid } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteScheduleAction } from "./actions";
import { CancelScheduleModal } from "@/components/modals/cancel-schedule-modal";
import { DaySchedulesModal } from "@/components/modals/day-schedules-modal";
import { Schedule, Program, Staff, Room } from "@prisma/client";
import { useRouter } from "next/navigation";
import { format, addDays, subWeeks, addWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, isSameMonth } from "date-fns";
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
  currentDateStr,
  viewMode
}: { 
  schedules: ScheduleWithRelations[], 
  rooms: Room[],
  tenantSlug: string,
  currentDateStr: string,
  viewMode: string
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<{date: Date, schedules: ScheduleWithRelations[]} | null>(null);

  const currentDate = parseISO(currentDateStr);
  const isMonthly = viewMode === "monthly";

  // Navigation handlers
  const goToPrevious = () => {
    if (isMonthly) {
      const prev = subMonths(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?view=monthly&date=${prev.toISOString()}`);
    } else {
      const prev = subWeeks(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?view=weekly&date=${prev.toISOString()}`);
    }
  };

  const goToNext = () => {
    if (isMonthly) {
      const next = addMonths(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?view=monthly&date=${next.toISOString()}`);
    } else {
      const next = addWeeks(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?view=weekly&date=${next.toISOString()}`);
    }
  };

  const toggleViewMode = (mode: "weekly" | "monthly") => {
    if (mode === viewMode) return;
    router.push(`/${tenantSlug}/dashboard/schedules?view=${mode}&date=${currentDate.toISOString()}`);
  };

  // Weekly calculations
  const weekEnd = addDays(currentDate, 6);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentDate, i));

  // Monthly calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Sunday
  
  const monthDays: Date[] = [];
  let d = calendarStart;
  while (d <= calendarEnd) {
    monthDays.push(d);
    d = addDays(d, 1);
  }

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
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  const handleDayClick = (day: Date, daySchedules: ScheduleWithRelations[]) => {
    if (daySchedules.length > 0) {
      setSelectedDaySchedules({ date: day, schedules: daySchedules });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar & Legend */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
              <button 
                onClick={() => toggleViewMode("weekly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isMonthly ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={16} /> Mingguan
              </button>
              <button 
                onClick={() => toggleViewMode("monthly")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isMonthly ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarIcon size={16} /> Bulanan
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
              <button onClick={goToPrevious} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 font-semibold text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {isMonthly 
                  ? format(monthStart, "MMMM yyyy", { locale: localeId })
                  : `${format(currentDate, "d MMM yyyy", { locale: localeId })} - ${format(weekEnd, "d MMM yyyy", { locale: localeId })}`
                }
              </span>
              <button onClick={goToNext} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
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

        {/* =========================================
            WEEKLY VIEW MATRIX
        ========================================= */}
        {!isMonthly && (
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header Row */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-center divide-x divide-slate-200 dark:divide-slate-800">
                <div className="p-4 text-left font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                  RUANGAN
                </div>
                {weekDays.map((day, idx) => (
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
                      {weekDays.map((day, dayIdx) => {
                        const daySchedules = schedules.filter(sch => 
                          sch.room_id === room.id && isSameDay(new Date(sch.start_time), day)
                        );

                        return (
                          <div key={dayIdx} className="p-1.5 min-h-[100px] max-h-[200px] overflow-y-auto bg-white dark:bg-[#111827] custom-scrollbar">
                            <div className="space-y-1.5">
                              {daySchedules.map((sch) => {
                                const isCancelled = sch.status === 'CANCELLED';
                                return (
                                  <div 
                                    key={sch.id} 
                                    className={`relative group p-2 rounded-lg border text-left cursor-pointer hover:opacity-90 ${
                                      isCancelled 
                                        ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                                        : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'
                                    }`}
                                    onClick={() => router.push(`/${tenantSlug}/dashboard/schedules/${sch.id}`)}
                                  >
                                    <div className="flex items-start justify-between mb-1">
                                      <div className={`text-[10px] font-bold flex items-center gap-1 ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                        <Clock size={10} />
                                        {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                                      </div>

                                      <button 
                                        type="button"
                                        onClick={(e) => toggleDropdown(sch.id, e)}
                                        className="text-slate-400 hover:text-slate-700 -mr-1 -mt-1 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                      >
                                        <MoreVertical size={14} />
                                      </button>

                                      {openDropdownId === sch.id && (
                                        <div className="absolute top-8 right-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                          <button type="button" onClick={(e) => { e.stopPropagation(); router.push(`/${tenantSlug}/dashboard/schedules/${sch.id}`); setOpenDropdownId(null); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300">Lihat Detail & Absensi</button>
                                          {!isCancelled && (
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setCancellingSchedule(sch); setOpenDropdownId(null); }} className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium text-amber-600 dark:text-amber-500">Batalkan Jadwal</button>
                                          )}
                                          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(sch); }} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-red-600 dark:text-red-500 flex items-center justify-between group-hover:text-red-700">
                                            Hapus Permanen <Trash2 size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className={`font-bold text-[12px] leading-tight mb-1 ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                      {sch.program.name}
                                    </div>
                                    
                                    <div className={`text-[10px] font-medium flex flex-wrap gap-x-2 gap-y-1 ${isCancelled ? 'text-red-500/70' : 'text-blue-600/70 dark:text-blue-400/70'}`}>
                                      <div className="flex items-center gap-1">
                                        <User size={10} />
                                        <span className="truncate max-w-[80px]">{sch.tutor.name || sch.tutor.email}</span>
                                      </div>
                                    </div>
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
        )}

        {/* =========================================
            MONTHLY VIEW CALENDAR
        ========================================= */}
        {isMonthly && (
          <div className="bg-slate-50/50 dark:bg-[#111827] overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
              {monthDays.map((day, idx) => {
                const daySchedules = schedules.filter(sch => isSameDay(new Date(sch.start_time), day));
                const inCurrentMonth = isSameMonth(day, monthStart);
                const hasSchedules = daySchedules.length > 0;
                const activeCount = daySchedules.filter(s => s.status !== 'CANCELLED').length;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleDayClick(day, daySchedules)}
                    className={`min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0 transition-colors ${
                      !inCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/20 text-slate-400' : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300'
                    } ${hasSchedules ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
                    style={{ borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                        isSameDay(day, new Date()) ? 'bg-blue-600 text-white shadow-md' : ''
                      }`}>
                        {format(day, "d")}
                      </span>
                    </div>

                    {/* Compact Schedule Badges */}
                    {hasSchedules && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-white bg-blue-500 px-2 py-1 rounded-md shadow-sm">
                          {activeCount} Kelas Terjadwal
                        </div>
                        {daySchedules.length > activeCount && (
                          <div className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-md">
                            {daySchedules.length - activeCount} Dibatalkan
                          </div>
                        )}
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 truncate opacity-70">
                          <span className="truncate">Klik untuk lihat rincian...</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {cancellingSchedule && (
        <CancelScheduleModal 
          schedule={cancellingSchedule}
          tenantSlug={tenantSlug}
          onClose={() => setCancellingSchedule(null)}
        />
      )}

      {selectedDaySchedules && (
        <DaySchedulesModal
          date={selectedDaySchedules.date}
          schedules={selectedDaySchedules.schedules.map(s => ({
            id: s.id,
            program_name: s.program.name,
            room_name: s.room.name,
            tutor_name: s.tutor.name || s.tutor.email,
            start_time: s.start_time,
            end_time: s.end_time,
            status: s.status
          }))}
          onClose={() => setSelectedDaySchedules(null)}
          onNavigateToDetail={(id) => router.push(`/${tenantSlug}/dashboard/schedules/${id}`)}
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
