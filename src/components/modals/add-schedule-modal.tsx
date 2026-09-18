"use client";

import { useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { createScheduleAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { Program, Room, Staff } from "@prisma/client";

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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="program_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Program
                 <span className="text-red-500">*</span></label>
                <select
                  id="program_id"
                  name="program_id"
                  required
                  defaultValue=""
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none font-medium"
                >
                  <option value="" disabled>Pilih Program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="tutor_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Tutor
                   <span className="text-red-500">*</span></label>
                  <select
                    id="tutor_id"
                    name="tutor_id"
                    required
                    defaultValue=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Pilih Tutor...</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.email} ({t.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="room_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Ruangan
                   <span className="text-red-500">*</span></label>
                  <select
                    id="room_id"
                    name="room_id"
                    required
                    defaultValue=""
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="" disabled>Pilih Ruangan...</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} (Kapasitas: {r.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tanggal Pelaksanaan
                   <span className="text-red-500">*</span></label>
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
                      Jam Mulai
                     <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="end_time" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Jam Selesai
                     <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
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
