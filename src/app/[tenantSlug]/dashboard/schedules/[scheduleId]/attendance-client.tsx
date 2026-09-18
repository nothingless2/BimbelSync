"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, User, Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { saveAttendancesAction, AttendancePayload } from "./actions";
import { AttendanceStatus, Student, Attendance } from "@prisma/client";
import { useRouter } from "next/navigation";
import { QrCode, MonitorPlay } from "lucide-react";
import Link from "next/link";

type StudentWithAttendance = {
  student: Student;
  currentStatus: AttendanceStatus | null; // null jika belum diabsen
  isWithdrawn?: boolean; // Marker jika siswa sudah keluar (tapi masih muncul karena kelas ini ada di masa lalu)
};

export function AttendanceClient({
  scheduleId,
  tenantSlug,
  studentsData
}: {
  scheduleId: string;
  tenantSlug: string;
  studentsData: StudentWithAttendance[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // State untuk menyimpan nilai absensi lokal sebelum disimpan ke server
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>(
    studentsData.reduce((acc, curr) => {
      if (curr.currentStatus) {
        acc[curr.student.id] = curr.currentStatus;
      } else {
        acc[curr.student.id] = 'ABSENT';
      }
      return acc;
    }, {} as Record<string, AttendanceStatus>)
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = async () => {
    // Validasi apakah semua siswa sudah diisi (opsional, tapi baik untuk UX)
    const totalStudents = studentsData.length;
    const totalFilled = Object.keys(attendanceState).length;

    if (totalFilled < totalStudents) {
      toast("Masih ada siswa yang belum diabsen.", {
        description: "Pastikan Anda memilih status (Hadir/Izin/Alpa) untuk setiap siswa.",
      });
      return;
    }

    setIsSaving(true);

    const payload: AttendancePayload[] = Object.entries(attendanceState).map(([studentId, status]) => ({
      student_id: studentId,
      status: status
    }));

    const result = await saveAttendancesAction(scheduleId, payload);

    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.message) {
        toast.info(result.message); // Gunakan info
      } else {
        toast.success("Berhasil menyimpan absensi!");
      }
      router.push(`/${tenantSlug}/dashboard/schedules`);
    }

    setIsSaving(false);
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Daftar Kehadiran Siswa</h3>
          <p className="text-sm text-slate-500 mt-1">Pilih status absensi untuk masing-masing siswa, lalu klik Simpan.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/${tenantSlug}/present/${scheduleId}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
          >
            <MonitorPlay size={18} />
            Tampilkan di TV / Layar
          </Link>
          
          <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Statistik:</span>
          <span className="text-emerald-600 font-bold ml-2">Hadir: {Object.values(attendanceState).filter(v => v === 'PRESENT').length}</span>
          <span className="text-amber-600 font-bold ml-2">Izin: {Object.values(attendanceState).filter(v => v === 'EXCUSED').length}</span>
          <span className="text-red-600 font-bold ml-2">Alpa: {Object.values(attendanceState).filter(v => v === 'ABSENT').length}</span>
        </div>
      </div>
    </div>

    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {studentsData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
            Tidak ada siswa aktif yang terdaftar di program ini.
          </div>
        ) : (
          studentsData.map((studentData) => {
            const { student } = studentData;
            const currentVal = attendanceState[student.id];

            return (
              <div key={student.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold shadow-inner">
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {student.full_name}
                      {studentData.isWithdrawn && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          (Diberhentikan)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">@{student.username}</p>
                  </div>
                </div>

                {/* Radio Toggles */}
                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-900">
                  <button
                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      currentVal === 'PRESENT' 
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 size={16} /> Hadir
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      currentVal === 'EXCUSED' 
                        ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <AlertCircle size={16} /> Izin
                  </button>
                  <button
                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      currentVal === 'ABSENT' 
                        ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm ring-1 ring-red-500/20' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <XCircle size={16} /> Alpa
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/${tenantSlug}/dashboard/schedules`)}
          className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          Kembali
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || studentsData.length === 0}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Menyimpan..." : "Simpan Absensi"}
        </button>
      </div>
    </div>
  );
}
