"use client";

import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { createScheduleAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { Program, Room, Staff } from "@prisma/client";
import { CustomSelect } from "@/components/ui/custom-select";

export function AddScheduleModal({ 
  programs, 
  rooms, 
  tutors 
}: { 
  programs: Program[],
  rooms: Room[],
  tutors: Staff[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("90");

  const computeEndTime = () => {
    if (!startTime) return "";
    const [h, m] = startTime.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m + parseInt(duration), 0, 0);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };
  const computedEndTime = computeEndTime();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await createScheduleAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setIsOpen(false);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm"
      >
        <Plus size={16} />
        Buat Jadwal
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-visible border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-auto flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Buat Jadwal Baru</h2>
                <p className="text-sm text-slate-500">Tentukan waktu kelas, program, tutor, dan ruangan.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-visible">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="program_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Program</label>
                <CustomSelect
                  id="program_id"
                  name="program_id"
                  required
                  placeholder="Pilih Program..."
                  options={programs.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="tutor_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Tutor</label>
                  <CustomSelect
                    id="tutor_id"
                    name="tutor_id"
                    required
                    placeholder="Pilih Tutor..."
                    options={tutors.map((t) => ({ value: t.id, label: `${t.email} (${t.role})` }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="room_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Ruangan</label>
                  <CustomSelect
                    id="room_id"
                    name="room_id"
                    required
                    placeholder="Pilih Ruangan..."
                    options={rooms.map((r) => ({ value: r.id, label: `${r.name} (Kapasitas: ${r.capacity})` }))}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start_time" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Jam Mulai</label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Durasi Waktu</label>
                    <CustomSelect
                      id="duration"
                      name="duration"
                      required
                      value={duration}
                      onChange={setDuration}
                      options={[
                        { value: "45", label: "45 Menit" },
                        { value: "60", label: "60 Menit (1 Jam)" },
                        { value: "75", label: "75 Menit" },
                        { value: "90", label: "90 Menit (1.5 Jam)" },
                        { value: "120", label: "120 Menit (2 Jam)" },
                        { value: "150", label: "150 Menit (2.5 Jam)" },
                        { value: "180", label: "180 Menit (3 Jam)" },
                        { value: "240", label: "240 Menit (4 Jam)" },
                      ]}
                    />
                    {/* Hidden input for end_time */}
                    <input type="hidden" name="end_time" value={computedEndTime} />
                    {startTime && (
                      <p className="text-xs text-slate-500 mt-1">Selesai: {computedEndTime}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
