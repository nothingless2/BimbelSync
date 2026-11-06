"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { MapPin, User, Clock, Maximize, ScanLine, AlertCircle, ArrowRight } from "lucide-react";
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

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

    // Schedule expiration check every 1 second
    const expirationTimer = setInterval(() => {
      const now = Date.now();
      if (now > endTime) {
        setIsEnded(true);
        setQrData('');
      }
    }, 1000);

    return () => {
      clearInterval(fetchTimer);
      clearInterval(expirationTimer);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 py-3 sm:py-4 px-4 sm:px-8 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center p-1.5 sm:p-2 shrink-0">
            <Image 
              src="/logo.png" 
              alt="BimbelSync Logo" 
              width={36} 
              height={36} 
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate">
              {schedule.program.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
              BimbelSync Attendance System
            </p>
          </div>
        </div>

        <button 
          onClick={toggleFullScreen}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm transition-colors border border-slate-200 cursor-pointer shrink-0"
        >
          <Maximize size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>{isFullScreen ? 'Keluar' : 'Layar Penuh'}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-10 gap-8 lg:gap-14 max-w-7xl mx-auto w-full">
        
        {/* Left Column: QR Code or Expired Notice */}
        <div className="w-full lg:flex-[0.45] xl:flex-[0.42] flex flex-col items-center justify-center">
          <div className="bg-white p-5 sm:p-8 rounded-[1.75rem] sm:rounded-[2rem] shadow-xl sm:shadow-2xl relative flex flex-col items-center w-full max-w-[380px] sm:max-w-md mx-auto">
            
            {isCancelled ? (
              <div className="absolute -top-5 sm:-top-6 bg-red-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-lg flex items-center gap-2">
                <AlertCircle size={18} />
                KELAS DIBATALKAN
              </div>
            ) : isEnded ? (
              <div className="absolute -top-5 sm:-top-6 bg-rose-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-lg flex items-center gap-2">
                <Clock size={18} />
                WAKTU ABSENSI BERAKHIR
              </div>
            ) : (
              <div className="absolute -top-5 sm:-top-6 bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-sm sm:text-base shadow-lg flex items-center gap-2">
                <ScanLine size={18} />
                SCAN DI SINI
              </div>
            )}

            {isCancelled ? (
              <div className="mt-3 sm:mt-4 w-full min-h-[280px] sm:min-h-[340px] bg-red-50/70 border-2 border-dashed border-red-200 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                  <AlertCircle size={28} className="sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Kelas Dibatalkan</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6 leading-relaxed max-w-xs">
                  Sesi kelas ini telah dibatalkan oleh pengajar/admin. Perekaman absensi tidak lagi tersedia.
                </p>
                <Link
                  href={`/${tenantSlug}/dashboard/schedules/${schedule.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm"
                >
                  &larr; Kembali ke Detail Jadwal
                </Link>
              </div>
            ) : isEnded ? (
              <div className="mt-3 sm:mt-4 w-full min-h-[280px] sm:min-h-[340px] bg-rose-50/60 border-2 border-dashed border-rose-200 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                  <Clock size={28} className="sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Sesi Kelas Selesai</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6 leading-relaxed max-w-xs">
                  Waktu pelaksanaan kelas telah berakhir pada pukul <strong className="text-slate-800">{formatTime(schedule.end_time)} WIB</strong>. Sistem telah otomatis menutup penerimaan scan absensi via QR code.
                </p>
                <Link
                  href={`/${tenantSlug}/dashboard/schedules/${schedule.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Lihat Rekap Presensi</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="mt-3 sm:mt-4 border-4 sm:border-8 border-slate-100 rounded-2xl p-2 bg-slate-100 w-full flex items-center justify-center">
                {mounted && qrData ? (
                  <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[340px] md:h-[340px] flex items-center justify-center">
                    <QRCodeSVG 
                      value={qrData} 
                      size={320}
                      className="w-full h-full object-contain" 
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/logo.png",
                        x: undefined,
                        y: undefined,
                        height: 52,
                        width: 52,
                        excavate: true,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] md:w-[340px] md:h-[340px] bg-slate-200 animate-pulse rounded-xl flex items-center justify-center">
                     <p className="text-slate-400 font-medium text-sm">Memuat QR...</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Schedule Info */}
        <div className="w-full lg:flex-[0.55] xl:flex-[0.58] flex flex-col text-slate-700 max-w-xl mx-auto lg:mx-0">
          {isCancelled ? (
            <>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 sm:mb-4 leading-tight tracking-tight text-center lg:text-left">
                Kelas Dibatalkan
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-500 mb-6 sm:mb-8 max-w-lg leading-relaxed text-center lg:text-left mx-auto lg:mx-0">
                Sesi kelas ini berstatus dibatalkan sehingga seluruh aktivitas absensi dinonaktifkan.
              </p>
            </>
          ) : isEnded ? (
            <>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 sm:mb-4 leading-tight tracking-tight text-center lg:text-left">
                Sesi Telah Berakhir
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-500 mb-4 sm:mb-6 max-w-lg leading-relaxed text-center lg:text-left mx-auto lg:mx-0">
                Waktu pelaksanaan kelas telah berakhir. Sistem tidak lagi menerima scan absensi untuk sesi ini.
              </p>
              <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 sm:gap-3.5 text-amber-900 shadow-sm text-left">
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5 sm:w-[22px] sm:h-[22px]" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">Informasi Absensi</h4>
                  <p className="text-[11px] sm:text-xs text-amber-800 mt-1 leading-relaxed">
                    Bagi siswa yang belum sempat memindai kode QR sebelum waktu kelas selesai, kehadiran dapat dicatat secara manual oleh tutor pengajar melalui portal dasbor.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-2 sm:mb-4 leading-tight tracking-tight text-center lg:text-left">
                Persiapkan Diri Anda!
              </h2>
              <p className="text-sm sm:text-lg lg:text-xl text-slate-500 mb-6 sm:mb-8 lg:mb-10 max-w-lg leading-relaxed text-center lg:text-left mx-auto lg:mx-0">
                Buka website BimbelSync di ponsel Anda, masuk ke menu <strong className="text-slate-900">Scan Absen</strong>, dan arahkan kamera ke layar ini.
              </p>
            </>
          )}

          <div className="space-y-4 sm:space-y-6 bg-white p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm w-full">
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${isEnded ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <Clock size={22} className="sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Waktu Pelaksanaan</p>
                  {isEnded && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 shrink-0">
                      Selesai
                    </span>
                  )}
                </div>
                <p className="text-base sm:text-2xl font-bold text-slate-900">
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)} WIB
                </p>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                  {format(schedule.start_time, "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 sm:bg-slate-200"></div>

            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <MapPin size={22} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Ruang Kelas</p>
                <p className="text-base sm:text-2xl font-bold text-slate-900 truncate">
                  {schedule.room.name}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 sm:bg-slate-200"></div>

            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <User size={22} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-0.5 sm:mb-1">Tutor Pengajar</p>
                <p className="text-base sm:text-2xl font-bold text-slate-900 truncate">
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