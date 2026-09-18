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
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
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

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setErrorMsg(null);
    setSelectedProgramId("");
    setSelectedDays([]);
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
    if (selectedDays.length === 0) {
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
    
    // Append selected days to formData
    formData.append("days", JSON.stringify(selectedDays));
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-visible border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-auto flex flex-col max-h-[90vh]">
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

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-visible">
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


              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Jam Mulai</label>
                    <input
                      type="time"
                      name="start_time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Durasi Waktu</label>
                    <CustomSelect
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Hari Rutin
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 1, label: "Sen" },
                    { id: 2, label: "Sel" },
                    { id: 3, label: "Rab" },
                    { id: 4, label: "Kam" },
                    { id: 5, label: "Jum" },
                    { id: 6, label: "Sab" },
                    { id: 0, label: "Min" },
                  ].map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        selectedDays.includes(day.id) 
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {day.label}
                    </button>
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
                  disabled={isLoading || (selectedProgram && !selectedProgram.total_meetings) || selectedDays.length === 0}
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
