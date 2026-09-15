"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, User } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function StudentSchedulesClientPage({ schedules, tenantSlug }: any) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    days.push(day);
    day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 min-w-[150px]">
            {format(currentDate, "MMMM yyyy", { locale: localeId })}
          </h2>
          <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition text-slate-600 dark:text-slate-300">
              <ChevronLeft size={18} />
            </button>
            <button onClick={today} className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition text-sm font-medium text-slate-700 dark:text-slate-200">
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition text-slate-600 dark:text-slate-300">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Jadwal Aktif
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400"></span> Dibatalkan
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((dayName) => (
              <div key={dayName} className="p-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, idx) => {
              formattedDate = format(day, dateFormat);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              
              // Filter schedules for this day
              const daySchedules = schedules.filter((s: any) => isSameDay(new Date(s.start_time), day));

              return (
                <div 
                  key={idx} 
                  className={`min-h-[140px] p-2 border-r border-b border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    !isCurrentMonth ? "bg-slate-50/50 dark:bg-slate-900/30 text-slate-400" : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full ${
                      isToday ? "bg-blue-600 text-white shadow-sm" : ""
                    }`}>
                      {formattedDate}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {daySchedules.length} Kelas
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    {daySchedules.map((schedule: any) => {
                      const isCancelled = schedule.status === 'CANCELLED';
                      
                      return (
                        <div 
                          key={schedule.id}
                          className={`p-2 rounded-lg text-xs border ${
                            isCancelled 
                              ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' 
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50'
                          }`}
                        >
                          <div className={`font-bold mb-1 truncate ${isCancelled ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-blue-700 dark:text-blue-400'}`}>
                            {schedule.program.name}
                          </div>
                          <div className={`flex items-center gap-1 mb-0.5 ${isCancelled ? 'text-slate-400' : 'text-blue-600 dark:text-blue-300'}`}>
                            <Clock size={10} />
                            {format(new Date(schedule.start_time), 'HH:mm')} - {format(new Date(schedule.end_time), 'HH:mm')}
                          </div>
                          <div className={`flex flex-col gap-0.5 ${isCancelled ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            <div className="flex items-center gap-1 truncate">
                              <User size={10} /> {schedule.tutor.name}
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <MapPin size={10} /> {schedule.room.name}
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
        </div>
      </div>
    </div>
  );
}
