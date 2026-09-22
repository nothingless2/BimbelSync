"use client";

import { Program, Schedule, Room, Staff } from "@prisma/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarClock, Users2, CalendarDays, Wallet, MapPin, Clock, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/sonner";
import { deleteScheduleAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

type ScheduleWithRelations = Schedule & {
  room: Room;
  tutor: Staff;
};

export default function ProgramDetailClientPage({
  program,
  schedules,
  tenantSlug
}: {
  program: Program;
  schedules: ScheduleWithRelations[];
  tenantSlug: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSchedule = (schedule: ScheduleWithRelations) => {
    toast(`Hapus Jadwal?`, {
      description: "Data jadwal akan dihapus secara permanen.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(schedule.id);
          const res = await deleteScheduleAction(schedule.id);
          if (res.error) toast.error(res.error);
          else {
            toast.success("Jadwal berhasil dihapus.");
            router.refresh();
          }
          setDeletingId(null);
        },
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  return (
    <div className="space-y-6">
      {/* Program Summary Card */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <CalendarClock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Pertemuan</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {program.total_meetings ? `${program.total_meetings} Pertemuan` : 'Tak Terbatas'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Users2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Kapasitas Kelas</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {program.max_capacity} Siswa
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Durasi Program</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {program.duration_months ? `${program.duration_months} Bulan` : 'Reguler (Aktif)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Biaya per Bulan</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(program.monthly_fee)}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CalendarClock size={18} className="text-blue-500" />
            Daftar Jadwal Kelas
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                <th scope="col" className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                <th scope="col" className="px-6 py-4 font-semibold">Ruangan</th>
                <th scope="col" className="px-6 py-4 font-semibold">Tutor Pengajar</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CalendarClock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada jadwal yang terbuat untuk program ini.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule, index) => (
                  <tr key={schedule.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === schedule.id ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      Pertemuan {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {format(new Date(schedule.start_time), "EEEE, d MMMM yyyy", { locale: localeId })}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Clock size={12} />
                          {format(new Date(schedule.start_time), "HH:mm")} - {format(new Date(schedule.end_time), "HH:mm")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        <span>{schedule.room.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users2 size={16} className="text-slate-400" />
                        <span>{schedule.tutor.name || schedule.tutor.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/${tenantSlug}/dashboard/schedules/${schedule.id}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteSchedule(schedule)}
                          disabled={deletingId === schedule.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
