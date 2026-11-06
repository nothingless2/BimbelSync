"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, User, Clock, BookOpen, Maximize, ScanLine, AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Schedule, Program, Room, Staff } from "@prisma/client";
import Link from "next/link";
import { generateSecureQrDataAction } from "./actions";

type ScheduleWithRelations = Schedule & {
  program: Program;
  room: Room;
  tutor: Staff;
};

export default function PresentClientPage({
  schedule,
  tenantSlug
}: {
  schedule: ScheduleWithRelations;
  tenantSlug: string;
}) {
  const endTime = new Date(schedule.end_time).getTime();
  const isCancelled = schedule.status === 'CANCELLED';

  const [isEnded, setIsEnded] = useState(() => Date.now() > endTime);
  const [qrData, setQrData] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(3); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hitung sisa menit pelaksanaan kelas
  const getMinutesRemaining = () => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (60 * 1000));
  };
  const [minutesRemaining, setMinutesRemaining] = useState(getMinutesRemaining);

  useEffect(() => {
    setMounted(true);
    
    // Jika jadwal dibatalkan atau waktu sudah lewat, jangan buat interval fetch QR
    if (isCancelled || isEnded) {
      setQrData('');
      return;
    }

    const fetchQr = async () => {
      if (Date.now() > endTime) {
        setIsEnded(true);
        setQrData('');
        return;
      }

      const secureData = await generateSecureQrDataAction(schedule.id, tenantSlug);
      if (!secureData) {
        if (Date.now() > endTime) {
          setIsEnded(true);
        }
        setQrData('');
      } else {
        setQrData(secureData);
      }
    };
    
    // Initial fetch
    fetchQr();

    // Fetch new QR every 3 seconds
    const fetchTimer = setInterval(fetchQr, 3000);

    // UI countdown timer & schedule expiration check every 1 second
    const countdownTimer = setInterval(() => {
      const now = Date.now();
      if (now > endTime) {
        setIsEnded(true);
        setQrData('');
      } else {
        setTimeLeft((prev) => (prev <= 1 ? 3 : prev - 1));
        setMinutesRemaining(Math.ceil((endTime - now) / (60 * 1000)));
      }
    }, 1000);

    return () => {
      clearInterval(fetchTimer);
      clearInterval(countdownTimer);
    };
  }, [schedule.id, tenantSlug, isCancelled, isEnded, endTime]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {schedule.program.name}
            </h1>
            <p className="text-blue-600 font-medium">
              BimbelSync Attendance System
            </p>
          </div>
        </div>

        <button 
          onClick={toggleFullScreen}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors border border-slate-200 cursor-pointer"
        >
          <Maximize size={18} />
          {isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 gap-12 max-w-7xl mx-auto w-full">
        
        {/* Left Column: QR Code or Expired Notice */}
        <div className="flex-[0.5] flex flex-col items-center">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl relative flex flex-col items-center w-full max-w-md">
            
            {isCancelled ? (
              <div className="absolute -top-6 bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
                <AlertCircle size={20} />
                KELAS DIBATALKAN
              </div>
            ) : isEnded ? (
              <div className="absolute -top-6 bg-rose-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
                <Clock size={20} />
                WAKTU ABSENSI BERAKHIR
              </div>
            ) : (
              <div className="absolute -top-6 bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
                <ScanLine size={20} />
                SCAN DI SINI
              </div>
            )}

            {isCancelled ? (
              <div className="mt-4 w-full min-h-[340px] bg-red-50/70 border-2 border-dashed border-red-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Kelas Dibatalkan</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Sesi kelas ini telah dibatalkan oleh pengajar/admin. Perekaman absensi tidak lagi tersedia.
                </p>
                <Link
                  href={`/${tenantSlug}/dashboard/schedules/${schedule.id}`}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  &larr; Kembali ke Detail Jadwal
                </Link>
              </div>
            ) : isEnded ? (
              <div className="mt-4 w-full min-h-[340px] bg-rose-50/60 border-2 border-dashed border-rose-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
                  <Clock size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sesi Kelas Selesai</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Waktu pelaksanaan kelas telah berakhir pada pukul <strong className="text-slate-800">{formatTime(schedule.end_time)} WIB</strong>. Sistem telah otomatis menutup penerimaan scan absensi via QR code.
                </p>
                <Link
                  href={`/${tenantSlug}/dashboard/schedules/${schedule.id}`}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Lihat Rekap Presensi</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="mt-4 border-8 border-slate-100 rounded-2xl p-2 bg-slate-100">
                {mounted && qrData ? (
                  <QRCodeSVG 
                    value={qrData} 
                    size={340} 
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "/logo.png",
                      x: undefined,
                      y: undefined,
                      height: 60,
                      width: 60,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="w-[340px] h-[340px] bg-slate-200 animate-pulse rounded-xl flex items-center justify-center">
                     <p className="text-slate-400 font-medium">Memuat QR...</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Schedule Info */}
        <div className="flex-[0.5] flex flex-col text-slate-700">
          {isCancelled ? (
            <>
              <h2 className="text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                Kelas Dibatalkan
              </h2>
              <p className="text-xl text-slate-500 mb-8 max-w-lg leading-relaxed">
                Sesi kelas ini berstatus dibatalkan sehingga seluruh aktivitas absensi dinonaktifkan.
              </p>
            </>
          ) : isEnded ? (
            <>
              <h2 className="text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                Sesi Telah Berakhir
              </h2>
              <p className="text-xl text-slate-500 mb-6 max-w-lg leading-relaxed">
                Waktu pelaksanaan kelas telah berakhir. Sistem tidak lagi menerima scan absensi untuk sesi ini.
              </p>
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-900 shadow-sm">
                <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">Informasi Absensi</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Bagi siswa yang belum sempat memindai kode QR sebelum waktu kelas selesai, kehadiran dapat dicatat secara manual oleh tutor pengajar melalui portal dasbor.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                Persiapkan Diri Anda!
              </h2>
              <p className="text-xl text-slate-500 mb-12 max-w-lg leading-relaxed">
                Buka website BimbelSync di ponsel Anda, masuk ke menu <strong className="text-slate-900">Scan Absen</strong>, dan arahkan kamera ke layar ini.
              </p>
            </>
          )}

          <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isEnded ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <Clock size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Waktu Pelaksanaan</p>
                  {isEnded ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                      Selesai
                    </span>
                  ) : !isCancelled && minutesRemaining > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      Sisa {minutesRemaining} menit
                    </span>
                  ) : null}
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)} WIB
                </p>
                <p className="text-slate-500 mt-1">
                  {format(schedule.start_time, "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-200"></div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <MapPin size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Ruang Kelas</p>
                <p className="text-2xl font-bold text-slate-900">
                  {schedule.room.name}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-200"></div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <User size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tutor Pengajar</p>
                <p className="text-2xl font-bold text-slate-900">
                  {schedule.tutor.name || schedule.tutor.email}
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}