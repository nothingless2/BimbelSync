"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, MapPin, User, Clock, BookOpen, Maximize, ScanLine } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Schedule, Program, Room, Staff } from "@prisma/client";

type ScheduleWithRelations = Schedule & {
  program: Program;
  room: Room;
  tutor: Staff;
};

import { generateSecureQrDataAction } from "./actions";

export default function PresentClientPage({
  schedule,
  tenantSlug
}: {
  schedule: ScheduleWithRelations;
  tenantSlug: string;
}) {
  const [qrData, setQrData] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(3); 
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchQr = async () => {
      const secureData = await generateSecureQrDataAction(schedule.id, tenantSlug);
      setQrData(secureData);
    };
    
    // Initial fetch
    fetchQr();

    // Fetch new QR every 3 seconds
    const fetchTimer = setInterval(fetchQr, 3000);

    // UI countdown timer (only updates the number)
    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 3 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(fetchTimer);
      clearInterval(countdownTimer);
    };
  }, [schedule.id, tenantSlug]);

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
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors border border-slate-200"
        >
          <Maximize size={18} />
          {isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8 gap-12 max-w-7xl mx-auto w-full">
        
        {/* Left Column: QR Code */}
        <div className="flex-[0.5] flex flex-col items-center">
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl relative flex flex-col items-center">
            
            <div className="absolute -top-6 bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-xl flex items-center gap-2">
              <ScanLine size={20} />
              SCAN DI SINI
            </div>

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

          </div>
        </div>

        {/* Right Column: Schedule Info */}
        <div className="flex-[0.5] flex flex-col text-slate-700">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
            Persiapkan Diri Anda!
          </h2>
          <p className="text-xl text-slate-500 mb-12 max-w-lg leading-relaxed">
            Buka website BimbelSync di ponsel Anda, masuk ke menu <strong className="text-slate-900">Scan Absen</strong>, dan arahkan kamera ke layar ini.
          </p>

          <div className="space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Waktu Pelaksanaan</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
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
