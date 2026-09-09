"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, User, MoreVertical, Trash2, XCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteScheduleAction } from "./actions";
import { CancelScheduleModal } from "@/components/modals/cancel-schedule-modal";
import { Schedule, Program, Staff, Room } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

type ScheduleWithRelations = Schedule & {
  program: Program;
  tutor: Staff;
  room: Room;
};

export default function SchedulesClientPage({ 
  schedules, 
  tenantSlug 
}: { 
  schedules: ScheduleWithRelations[], 
  tenantSlug: string 
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingSchedule, setCancellingSchedule] = useState<ScheduleWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(schedules.length / itemsPerPage);
  const currentData = schedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleDropdown = (id: string) => {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(date));
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Waktu Pelaksanaan</th>
                <th scope="col" className="px-6 py-4 font-semibold">Detail Kelas</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <CalendarIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada jadwal kelas.<br/>Klik "Buat Jadwal" untuk mengatur pertemuan kelas.
                  </td>
                </tr>
              ) : (
                currentData.map((schedule, index) => {
                  const isCancelled = schedule.status === 'CANCELLED';
                  
                  return (
                    <tr key={schedule.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === schedule.id ? 'opacity-50' : ''} ${isCancelled ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                            <CalendarIcon size={14} className="text-blue-500" />
                            {formatDate(schedule.start_time)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={14} className="text-slate-400" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{schedule.program.name}</span>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><User size={12} /> {schedule.tutor.email.split('@')[0]}</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {schedule.room.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCancelled ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
                              Dibatalkan
                            </span>
                            <span className="text-xs text-red-500 italic max-w-[200px] truncate" title={schedule.cancelled_reason || ""}>
                              {schedule.cancelled_reason}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                            Terjadwal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => toggleDropdown(schedule.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openDropdownId === schedule.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="py-1">
                                  {!isCancelled && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setOpenDropdownId(null);
                                          router.push(`/${tenantSlug}/dashboard/schedules/${schedule.id}`);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 font-medium"
                                      >
                                        <User size={16} />
                                        Presensi Kelas
                                      </button>
                                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                      <button
                                        onClick={() => { setCancellingSchedule(schedule); setOpenDropdownId(null); }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"
                                      >
                                        <XCircle size={16} />
                                        Batalkan Kelas
                                      </button>
                                    </>
                                  )}
                                  
                                  {isCancelled && <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>}
                                  
                                  <button
                                    onClick={() => handleDelete(schedule)}
                                    disabled={deletingId === schedule.id}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                    Hapus Permanen
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={schedules.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {cancellingSchedule && (
        <CancelScheduleModal 
          schedule={cancellingSchedule} 
          tenantSlug={tenantSlug} 
          onClose={() => setCancellingSchedule(null)} 
        />
      )}
    </>
  );
}
