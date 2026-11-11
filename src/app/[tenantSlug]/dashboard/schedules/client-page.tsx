"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Trash2, Calendar as CalendarIcon, Grid, ArrowRight, Search, Filter, Loader2, ClipboardCheck, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteScheduleAction, bulkDeleteSchedulesAction } from "./actions";
import { CancelScheduleModal } from "@/components/modals/cancel-schedule-modal";
import { RescheduleModal } from "@/components/modals/reschedule-modal";
import { DaySchedulesModal } from "@/components/modals/day-schedules-modal";
import { Schedule, Program, Staff, Room } from "@prisma/client";
import { useRouter } from "next/navigation";
import { format, addDays, subWeeks, addWeeks, isSameDay, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, addMonths, isSameMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";

type ScheduleWithRelations = Schedule & {
  program: Program;
  tutor: Staff;
  room: Room;
  attendances?: { id: string }[];
};

export default function SchedulesClientPage({ 
  schedules, 
  rooms,
  tenantSlug,
  currentDateStr,
  viewMode,
  isTutor,
  pendingCount = 0,
  headerActions
}: { 
  schedules: ScheduleWithRelations[], 
  rooms: Room[],
  tenantSlug: string,
  currentDateStr: string,
  viewMode: string,
  isTutor?: boolean,
  pendingCount?: number,
  headerActions?: React.ReactNode
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [reschedulingSchedule, setReschedulingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<{date: Date, schedules: ScheduleWithRelations[]} | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  // Mode Mingguan / Bulanan dikontrol 100% oleh useState client-side murni (instan 0ms)
  const [currentViewMode, setCurrentViewMode] = useState<"weekly" | "monthly">((viewMode as "weekly" | "monthly") || "weekly");
  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(() => new Date());

  const currentDate = parseISO(currentDateStr);
  const isMonthly = currentViewMode === "monthly";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "SCHEDULED" | "CANCELLED">("ALL");

  // Filtering
  const filteredSchedules = schedules.filter(schedule => {
    const matchSearch = (schedule.tutor.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        schedule.program.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "ALL" || schedule.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Navigation handlers: ganti tanggal bulan/minggu
  const goToPrevious = () => {
    if (isMonthly) {
      const prev = subMonths(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?date=${prev.toISOString()}`);
    } else {
      const prev = subWeeks(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?date=${prev.toISOString()}`);
    }
  };

  const goToNext = () => {
    if (isMonthly) {
      const next = addMonths(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?date=${next.toISOString()}`);
    } else {
      const next = addWeeks(currentDate, 1);
      router.push(`/${tenantSlug}/dashboard/schedules?date=${next.toISOString()}`);
    }
  };

  // Toggle mode 100% Client-Side State tanpa network request
  const toggleViewMode = (mode: "weekly" | "monthly") => {
    setCurrentViewMode(mode);
  };

  // Weekly calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Active day for mobile agenda view
  const activeMobileDay = weekDays.some(d => isSameDay(d, selectedMobileDay)) ? selectedMobileDay : weekDays[0];
  const mobileDaySchedules = filteredSchedules.filter(sch => isSameDay(new Date(sch.start_time), activeMobileDay));

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

  const toggleSelectSchedule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSchedules(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectDay = (daySchedules: ScheduleWithRelations[], e: React.MouseEvent) => {
    e.stopPropagation();
    const dayIds = daySchedules.map(s => s.id);
    const allSelected = dayIds.every(id => selectedSchedules.includes(id));
    
    if (allSelected) {
      setSelectedSchedules(prev => prev.filter(id => !dayIds.includes(id)));
    } else {
      setSelectedSchedules(prev => {
        const newSelection = [...prev];
        dayIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleBulkDelete = () => {
    toast(`Hapus ${selectedSchedules.length} Jadwal?`, {
      description: "Data jadwal yang dipilih akan dihapus secara permanen.",
      duration: 8000,
      action: {
        label: "Ya, Hapus Semua",
        onClick: async () => {
          const res = await bulkDeleteSchedulesAction(selectedSchedules);
          if (res.error) toast.error(res.error);
          else {
            toast.success(`${res.count} Jadwal berhasil dihapus.`);
            setSelectedSchedules([]);
          }
        },
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
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
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  const handleDayClick = (day: Date, daySchedules: ScheduleWithRelations[]) => {
    if (daySchedules.length > 0) {
      setSelectedDaySchedules({ date: day, schedules: daySchedules });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {}}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 shadow-xs"
          >
            <CalendarIcon size={15} />
            <span className="truncate">Kalender Kelas</span>
          </button>
          <Link
            href={`/${tenantSlug}/dashboard/schedules/attendance`}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
          >
            <ClipboardCheck size={15} />
            <span className="truncate">Monitoring Presensi</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-500 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {pendingCount > 0 && (
          <Link
            href={`/${tenantSlug}/dashboard/schedules/attendance?filter=PENDING`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 transition border border-rose-200 dark:border-rose-900/40 w-full sm:w-auto text-center"
          >
            <AlertTriangle size={13} />
            Ada {pendingCount} Sesi Lupa Diabsen &rarr;
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Jadwal Kelas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isTutor 
              ? "Lihat jadwal mengajar Anda."
              : "Kelola perencanaan kelas reguler maupun pertemuan intensif di bimbel Anda."}
          </p>
        </div>
        
        {!isTutor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedSchedules([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                isSelectMode 
                  ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-red-400'
              }`}
            >
              <Trash2 size={16} />
              {isSelectMode ? 'Batal Hapus' : 'Hapus Jadwal'}
            </button>
            {headerActions}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar & Legend */}
        <div className="p-3 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            {/* View Mode Toggle */}
            <div className="grid grid-cols-2 sm:flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
              <button 
                onClick={() => toggleViewMode("weekly")}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${currentViewMode === "weekly" ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Grid size={15} /> Mingguan
              </button>
              <button 
                onClick={() => toggleViewMode("monthly")}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${currentViewMode === "monthly" ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarIcon size={15} /> Bulanan
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
              <button onClick={goToPrevious} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 sm:px-4 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-center truncate">
                {isMonthly 
                  ? format(monthStart, "MMMM yyyy", { locale: localeId })
                  : `${format(weekStart, "d MMM", { locale: localeId })} - ${format(weekEnd, "d MMM yyyy", { locale: localeId })}`
                }
              </span>
              <button onClick={goToNext} className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex items-center gap-2 sm:gap-3 text-xs font-semibold shrink-0">
            {/* Search Input */}
            <div className="relative w-full xl:w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari tutor / program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 sm:py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative w-full xl:w-auto">
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as any)}
                options={[
                  { value: "ALL", label: "Semua Status" },
                  { value: "SCHEDULED", label: "Terjadwal" },
                  { value: "CANCELLED", label: "Dibatalkan" }
                ]}
              />
            </div>

            <div className="hidden md:flex items-center gap-4 ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-600 dark:text-slate-400">Terjadwal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-slate-600 dark:text-slate-400">Dibatalkan</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            WEEKLY VIEW
        ========================================= */}
        {!isMonthly && (
          <>
            {/* 1. Mobile Agenda View (block md:hidden) */}
            <div className="block md:hidden">
              {/* Day Selector Strip */}
              <div className="grid grid-cols-7 gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-center">
                {weekDays.map((day, idx) => {
                  const isSelected = isSameDay(day, activeMobileDay);
                  const isCurrentDay = isSameDay(day, new Date());
                  const daySchedules = filteredSchedules.filter(sch => isSameDay(new Date(sch.start_time), day));
                  const hasSchedules = daySchedules.length > 0;
                  const hasPending = daySchedules.some(sch => sch.status === 'SCHEDULED' && new Date(sch.end_time) < new Date() && sch.attendances?.length === 0);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMobileDay(day)}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl transition relative ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isCurrentDay
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/40'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold">
                        {format(day, "EEE", { locale: localeId })}
                      </span>
                      <span className="text-xs font-black mt-0.5">
                        {format(day, "d")}
                      </span>
                      {hasSchedules && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          hasPending 
                            ? 'bg-rose-500 animate-pulse' 
                            : isSelected 
                            ? 'bg-white' 
                            : 'bg-blue-500'
                        }`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Schedules for the Selected Day */}
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Jadwal {format(activeMobileDay, "EEEE, d MMM yyyy", { locale: localeId })}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {mobileDaySchedules.length} Kelas
                  </span>
                </div>

                {mobileDaySchedules.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <CalendarIcon size={30} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada kelas terjadwal</p>
                    <p className="text-[11px] mt-0.5">Pilih tanggal lain pada bilah hari di atas untuk melihat jadwal.</p>
                  </div>
                ) : (
                  mobileDaySchedules.map((sch) => {
                    const isCancelled = sch.status === 'CANCELLED';
                    const isPast = new Date(sch.end_time) < new Date();
                    const isOngoing = new Date(sch.start_time) <= new Date() && new Date(sch.end_time) >= new Date();
                    const isPending = !isCancelled && isPast && sch.attendances?.length === 0;
                    const isAttended = !isCancelled && sch.attendances && sch.attendances.length > 0;

                    return (
                      <div
                        key={sch.id}
                        onClick={() => router.push(`/${tenantSlug}/dashboard/schedules/${sch.id}`)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition shadow-xs ${
                          isPending
                            ? 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40'
                            : isCancelled
                            ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 opacity-60'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock size={13} className="text-blue-500" />
                            {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                          </span>

                          {isPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                              ⚠️ Lupa Absen
                            </span>
                          ) : isAttended ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ Presensi Terisi
                            </span>
                          ) : isOngoing ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                              Sedang Berlangsung
                            </span>
                          ) : isCancelled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 line-through">
                              Dibatalkan
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Mendatang
                            </span>
                          )}
                        </div>

                        <h4 className={`font-bold text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {sch.program.name}
                        </h4>

                        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {sch.room.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            {sch.tutor.name || sch.tutor.email}
                          </span>
                        </div>

                        <div className="mt-2.5">
                          {isPending ? (
                            <span className="w-full text-center py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                              <ClipboardCheck size={14} />
                              Isi Presensi Sekarang &rarr;
                            </span>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                              <span>Buka Presensi / Detail</span>
                              <ChevronRight size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Desktop Matrix View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header Row */}
              <div className="grid grid-cols-[200px_repeat(7,1fr)] bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-center divide-x divide-slate-200 dark:divide-slate-800">
                <div className="p-4 text-left font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center">
                  RUANGAN
                </div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className="p-2 sm:p-4">
                    <div className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm uppercase">
                      {format(day, "EEEE", { locale: localeId })}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
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
                      <div className="p-3 sm:p-4 flex flex-col justify-center">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{room.name}</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 mt-1">Kapasitas: {room.capacity}</span>
                      </div>

                      {/* Days Cells */}
                      {weekDays.map((day, dayIdx) => {
                        const daySchedules = filteredSchedules.filter(sch => 
                          sch.room_id === room.id && isSameDay(new Date(sch.start_time), day)
                        );

                        return (
                          <div key={dayIdx} className="p-1 sm:p-1.5 min-h-[80px] sm:min-h-[100px] max-h-[200px] overflow-y-auto bg-white dark:bg-[#111827] custom-scrollbar">
                            <div className="space-y-1 sm:space-y-1.5">
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
                                        {!isTutor && isSelectMode && (
                                          <input 
                                            type="checkbox" 
                                            checked={selectedSchedules.includes(sch.id)}
                                            onChange={(e) => toggleSelectSchedule(sch.id, e as any)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="mr-0.5 w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          />
                                        )}
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

                                    {!isCancelled && new Date(sch.end_time) < new Date() && (
                                      <div className="mt-1">
                                        {sch.attendances && sch.attendances.length === 0 ? (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white animate-pulse">
                                            ⚠️ Belum Absen
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            ✓ Absen Terisi
                                          </span>
                                        )}
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
          </>
        )}

        {/* =========================================
            MONTHLY VIEW CALENDAR
        ========================================= */}
        {isMonthly && (
          <div className="bg-slate-50/50 dark:bg-[#111827] overflow-hidden">
            {/* Month Calendar Grid */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm text-xs sm:text-sm">
              {/* Header Days */}
              <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                  <div key={d} className="p-2 sm:p-3 text-center font-bold text-slate-500 dark:text-slate-400">
                    {d}
                  </div>
                ))}
              </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
              {monthDays.map((day, idx) => {
                const daySchedules = filteredSchedules.filter(sch => isSameDay(new Date(sch.start_time), day));
                const inCurrentMonth = isSameMonth(day, currentDate);
                const hasSchedules = daySchedules.length > 0;
                const activeCount = daySchedules.filter(s => s.status !== 'CANCELLED').length;
                
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleDayClick(day, daySchedules)}
                    className={`min-h-[55px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0 transition-colors ${
                      !inCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/20 text-slate-400' : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300'
                    } ${hasSchedules ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}`}
                    style={{ borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined }}
                  >
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <span className={`text-xs sm:text-sm font-semibold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                        isSameDay(day, new Date()) ? 'bg-blue-600 text-white shadow-md' : ''
                      }`}>
                        {format(day, "d")}
                      </span>
                      {isSelectMode && !isTutor && hasSchedules && (
                        <input
                          type="checkbox"
                          checked={daySchedules.every(s => selectedSchedules.includes(s.id))}
                          onChange={(e) => toggleSelectDay(daySchedules, e as any)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-0.5 mt-0.5 sm:mr-1 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Schedule Indicators: Dots on Mobile, Badges on Desktop */}
                    {hasSchedules && (
                      <>
                        <div className="flex sm:hidden items-center justify-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {daySchedules.some(s => s.status === 'SCHEDULED' && new Date(s.end_time) < new Date() && s.attendances?.length === 0) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </div>

                        <div className="hidden sm:block space-y-1">
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>
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

      {reschedulingSchedule && (
        <RescheduleModal 
          schedule={reschedulingSchedule}
          rooms={rooms}
          onClose={() => setReschedulingSchedule(null)}
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
          isSelectMode={!isTutor && isSelectMode}
          selectedSchedules={selectedSchedules}
          onToggleSelect={toggleSelectSchedule}
        />
      )}

      {/* Action Menu Modal (replaces inline dropdown to prevent clipping) */}
      {openDropdownId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setOpenDropdownId(null)}
          />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Opsi Jadwal</h3>
              <button onClick={() => setOpenDropdownId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                &times;
              </button>
            </div>
            
            {(() => {
              const activeSch = schedules.find(s => s.id === openDropdownId);
              if (!activeSch) return null;
              
              const isCancelled = activeSch.status === 'CANCELLED';
              
              return (
                <div className="flex flex-col">
                  <button 
                    type="button" 
                    onClick={() => { router.push(`/${tenantSlug}/dashboard/schedules/${activeSch.id}`); setOpenDropdownId(null); }} 
                    className="w-full text-left px-5 py-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium text-slate-700 dark:text-slate-200 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ArrowRight size={16} />
                    </div>
                    Lihat Detail & Absensi
                  </button>
                  
                  {!isCancelled && !isTutor && (
                    <button 
                      type="button" 
                      onClick={() => { setReschedulingSchedule(activeSch); setOpenDropdownId(null); }} 
                      className="w-full text-left px-5 py-4 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium text-blue-700 dark:text-blue-400 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      Ubah Waktu & Ruangan
                    </button>
                  )}
                  
                  {!isCancelled && !isTutor && (
                    <button 
                      type="button" 
                      onClick={() => { setCancellingSchedule(activeSch); setOpenDropdownId(null); }} 
                      className="w-full text-left px-5 py-4 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium text-amber-600 dark:text-amber-500 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <MoreVertical size={16} />
                      </div>
                      Batalkan Jadwal
                    </button>
                  )}
                  
                  {!isTutor && (
                    <button 
                      type="button" 
                      onClick={() => { handleDelete(activeSch); }} 
                      className="w-full text-left px-5 py-4 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-red-600 dark:text-red-500 flex items-center gap-3 transition-colors group border-t border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                        <Trash2 size={16} />
                      </div>
                      Hapus Permanen
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {selectedSchedules.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-full px-6 py-3 flex items-center gap-6 z-[60] animate-in slide-in-from-bottom-5">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {selectedSchedules.length} jadwal dipilih
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setSelectedSchedules([]);
                setIsSelectMode(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              Batal
            </button>
            <button 
              onClick={handleBulkDelete}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full flex items-center gap-2"
            >
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
