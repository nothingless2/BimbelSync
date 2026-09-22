"use client";

import { useState } from "react";
import { X, AlertCircle, CalendarClock } from "lucide-react";
import { Program } from "@prisma/client";
import { CustomSelect } from "@/components/ui/custom-select";
import { generateSchedulesAction } from "@/app/[tenantSlug]/dashboard/schedules/actions";
import { toast } from "@/components/ui/sonner";

interface Props {
  programs: Program[];
  staffs: { id: string; name: string | null; email: string; role?: string }[];
  rooms: { id: string; name: string; capacity: number }[];
}

export function AutoSchedulerModal({ programs, staffs, rooms }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  
  type DayConfig = { day: number; label: string; startTime: string; duration: string; enabled: boolean };
  const [daysConfig, setDaysConfig] = useState<DayConfig[]>([
    { day: 1, label: "Senin", startTime: "14:00", duration: "90", enabled: false },
    { day: 2, label: "Selasa", startTime: "14:00", duration: "90", enabled: false },
    { day: 3, label: "Rabu", startTime: "14:00", duration: "90", enabled: false },
    { day: 4, label: "Kamis", startTime: "14:00", duration: "90", enabled: false },
    { day: 5, label: "Jumat", startTime: "14:00", duration: "90", enabled: false },
    { day: 6, label: "Sabtu", startTime: "09:00", duration: "90", enabled: false },
    { day: 0, label: "Minggu", startTime: "09:00", duration: "90", enabled: false }
  ]);

  const updateDayConfig = (index: number, updates: Partial<DayConfig>) => {
    const newConfigs = [...daysConfig];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setDaysConfig(newConfigs);
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const handleOpen = () => {
    setIsOpen(true);
    setErrorMsg(null);
    setSelectedProgramId("");
    setDaysConfig(daysConfig.map(c => ({ ...c, enabled: false })));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProgramId) {
      setErrorMsg("Pilih program terlebih dahulu.");
      return;
    }
    
    const activeDays = daysConfig.filter(d => d.enabled);
    if (activeDays.length === 0) {
      setErrorMsg("Pilih minimal satu hari dalam seminggu.");
      return;
    }
    
    if (!selectedProgram?.total_meetings) {
      setErrorMsg("Program ini tidak memiliki batas Total Pertemuan. Silakan edit program ini dan tetapkan Total Pertemuan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    
    // Transform days config for payload
    const payloadConfigs = activeDays.map(d => {
      const [h, m] = d.startTime.split(":").map(Number);
      const endD = new Date();
      endD.setHours(h, m + parseInt(d.duration), 0, 0);
      const endTime = `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`;
      return { day: d.day, startTime: d.startTime, endTime, duration: d.duration };
    });

    formData.append("day_configs", JSON.stringify(payloadConfigs));
    formData.append("program_id", selectedProgramId);
    formData.append("total_meetings", selectedProgram.total_meetings.toString());

    const result = await generateSchedulesAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      toast.success(`Berhasil membuat ${result.count} jadwal untuk program ini.`);
      handleClose();
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm"
      >
        <CalendarClock size={16} />
        Generate Jadwal Otomatis
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm transition-opacity overflow-y-auto p-4 sm:p-6 flex justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 flex flex-col relative my-auto h-fit">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/10 shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CalendarClock size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Auto-Scheduler</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generate jadwal otomatis per program.</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
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
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Program
                </label>
                <CustomSelect
                  name="program_id"
                  required
                  placeholder="-- Pilih Program --"
                  value={selectedProgramId}
                  onChange={setSelectedProgramId}
                  options={programs.map(p => ({
                    value: p.id,
                    label: `${p.name} ${p.total_meetings ? `(${p.total_meetings} Pertemuan)` : '(Tak Terbatas)'}`
                  }))}
                />
              </div>

              {selectedProgram && !selectedProgram.total_meetings && (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-3 rounded-lg text-sm border border-orange-200 dark:border-orange-900/50">
                  Program ini tidak memiliki batas Total Pertemuan. Silakan ubah pengaturan program terlebih dahulu di menu Master Data.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tanggal Mulai Kelas</label>
                <input
                  type="date"
                  name="start_date"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>


              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pengaturan Hari & Waktu
                </label>
                <div className="space-y-2">
                  {daysConfig.map((config, idx) => (
                    <div key={config.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${config.enabled ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
                      <label className="flex items-center gap-3 min-w-[90px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => updateDayConfig(idx, { enabled: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={`text-sm font-bold ${config.enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {config.label}
                        </span>
                      </label>
                      
                      {config.enabled && (
                        <div className="flex flex-1 items-center gap-2 animate-in fade-in slide-in-from-left-2">
                          <input
                            type="time"
                            required
                            value={config.startTime}
                            onChange={(e) => updateDayConfig(idx, { startTime: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <select
                            required
                            value={config.duration}
                            onChange={(e) => updateDayConfig(idx, { duration: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="45">45 Menit</option>
                            <option value="60">60 Menit</option>
                            <option value="75">75 Menit</option>
                            <option value="90">90 Menit</option>
                            <option value="120">120 Menit</option>
                            <option value="150">150 Menit</option>
                            <option value="180">180 Menit</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tutor Pengajar</label>
                <CustomSelect
                  name="tutor_id"
                  required
                  placeholder="-- Pilih Tutor --"
                  options={staffs.map(staff => ({
                    value: staff.id,
                    label: `${staff.name || staff.email} ${staff.role ? `(${staff.role})` : ''}`
                  }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ruang Kelas</label>
                <CustomSelect
                  name="room_id"
                  required
                  placeholder="-- Pilih Ruangan --"
                  options={rooms.map(room => ({
                    value: room.id,
                    label: `${room.name} (Kapasitas: ${room.capacity})`
                  }))}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (selectedProgram && !selectedProgram.total_meetings) || daysConfig.filter(d => d.enabled).length === 0}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "Memproses..." : "Generate Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
