"use client";

import { X, Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ScheduleItem = {
  id: string;
  program_name: string;
  tutor_name: string;
  room_name: string;
  start_time: Date;
  end_time: Date;
  status: string;
};

export function DaySchedulesModal({ 
  date, 
  schedules, 
  onClose,
  onNavigateToDetail
}: { 
  date: Date;
  schedules: ScheduleItem[];
  onClose: () => void;
  onNavigateToDetail: (id: string) => void;
}) {
  const formatTime = (d: Date) => {
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Jadwal Kelas</h2>
            <p className="text-sm text-slate-500 mt-1">{format(date, "EEEE, d MMMM yyyy", { locale: localeId })}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {schedules.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Tidak ada jadwal kelas pada hari ini.
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((sch) => {
                const isCancelled = sch.status === 'CANCELLED';
                return (
                  <div 
                    key={sch.id}
                    onClick={() => onNavigateToDetail(sch.id)}
                    className={`relative p-4 rounded-2xl border text-left cursor-pointer transition-colors group ${
                      isCancelled 
                        ? 'bg-red-50/50 hover:bg-red-50 border-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:border-red-900/30' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${isCancelled ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        <Clock size={14} />
                        {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                      </div>
                      {isCancelled && (
                        <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded w-max">
                          DIBATALKAN
                        </span>
                      )}
                    </div>

                    <h3 className={`font-bold text-base leading-tight mb-3 ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {sch.program_name}
                    </h3>

                    <div className={`flex flex-wrap gap-4 text-xs font-medium ${isCancelled ? 'text-red-500/70' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {sch.room_name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        {sch.tutor_name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
