"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function StudentSchedulesClientPage({ schedules, tenantSlug }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDaySchedules = schedules.filter((s: any) => isSameDay(new Date(s.start_time), selectedDate));

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 min-w-[130px] capitalize">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </h2>
            <div className="flex bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition text-slate-600 dark:text-slate-300">
                <ChevronLeft size={18} />
              </button>
              <button onClick={today} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                Hari Ini
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition text-slate-600 dark:text-slate-300">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Desktop Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Aktif
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Batal
            </div>
          </div>
        </div>

        {/* Responsive Calendar Grid */}
        <div className="p-2 sm:p-4 bg-slate-50/30 dark:bg-slate-950/30">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((dayName) => (
              <div key={dayName} className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 py-2">
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day, idx) => {
              const formattedDate = format(day, dateFormat);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              
              const daySchedules = schedules.filter((s: any) => isSameDay(new Date(s.start_time), day));
              const hasActive = daySchedules.some((s: any) => s.status !== 'CANCELLED');
              const hasCancelled = daySchedules.some((s: any) => s.status === 'CANCELLED');

              return (
                <button 
                  key={idx} 
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all aspect-square sm:aspect-auto sm:min-h-[90px] border ${
                    !isCurrentMonth ? "opacity-40" : "opacity-100"
                  } ${
                    isSelected 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 z-10" 
                      : "bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className={`text-sm sm:text-base font-bold ${isToday && !isSelected ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {formattedDate}
                  </span>

                  {/* Dots for Mobile */}
                  <div className="flex sm:hidden gap-1 mt-1">
                    {hasActive && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>}
                    {hasCancelled && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-200' : 'bg-slate-300'}`}></span>}
                  </div>

                  {/* Text for Desktop */}
                  <div className="hidden sm:flex flex-col gap-1 mt-2 w-full px-1">
                    {daySchedules.slice(0, 2).map((s: any, i: number) => (
                      <div key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${
                        s.status === 'CANCELLED' 
                          ? (isSelected ? 'bg-blue-700/50 text-blue-200 line-through' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 line-through') 
                          : (isSelected ? 'bg-white text-blue-700' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300')
                      }`}>
                        {format(new Date(s.start_time), 'HH:mm')}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-center ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                        +{daySchedules.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Details (Visible primarily on Mobile, but looks good on Desktop too) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <CalendarIcon size={20} className="text-blue-500" />
          Jadwal {format(selectedDate, "d MMMM yyyy", { locale: localeId })}
        </h3>

        {selectedDaySchedules.length > 0 ? (
          <div className="space-y-3">
            {selectedDaySchedules.map((schedule: any) => {
              const isCancelled = schedule.status === 'CANCELLED';
              return (
                <div 
                  key={schedule.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 sm:items-center ${
                    isCancelled 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                      : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold text-base ${isCancelled ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {schedule.program.name}
                      </h4>
                      {isCancelled && <span className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">DIBATALKAN</span>}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                      <div className={`flex items-center gap-1.5 text-sm font-medium ${isCancelled ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        <Clock size={16} className={isCancelled ? "text-slate-400" : "text-blue-500"} />
                        {format(new Date(schedule.start_time), 'HH:mm')} - {format(new Date(schedule.end_time), 'HH:mm')}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <User size={16} /> {schedule.tutor.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <MapPin size={16} /> {schedule.room.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">Tidak ada kelas pada tanggal ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
