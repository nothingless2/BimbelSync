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

export default function PresentClientPage({
  schedule,
  tenantSlug
}: {
  schedule: ScheduleWithRelations;
  tenantSlug: string;
}) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(3); 
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimestamp(Date.now());
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(date));
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bimbelsync.com';
  const qrData = `${baseUrl}/${tenantSlug}/student/scan/${schedule.id}?t=${timestamp}`;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      
      {/* Top Banner */}
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {schedule.program.name}
            </h1>
            <p className="text-blue-400 font-medium">
              BimbelSync Attendance System
            </p>
          </div>
        </div>

        <button 
          onClick={toggleFullScreen}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
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

            <div className="mt-4 border-8 border-slate-50 rounded-2xl p-2 bg-slate-50">
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
            </div>

            <div className="mt-6 flex items-center gap-3 text-lg font-medium text-slate-500 bg-slate-50 px-6 py-3 rounded-full w-full justify-center">
              <RefreshCw size={20} className="animate-spin text-blue-600" style={{ animationDuration: '3s' }} />
              QR diperbarui dalam <span className="text-blue-600 font-bold w-4 text-center">{timeLeft}</span> dtk
            </div>
          </div>
        </div>

        {/* Right Column: Schedule Info */}
        <div className="flex-[0.5] flex flex-col text-slate-300">
          <h2 className="text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Persiapkan Diri Anda!
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-lg leading-relaxed">
            Buka aplikasi BimbelSync di ponsel Anda, masuk ke menu <strong className="text-white">Scan Absen</strong>, dan arahkan kamera ke layar ini.
          </p>

          <div className="space-y-6 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Waktu Pelaksanaan</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                </p>
                <p className="text-slate-400 mt-1">
                  {format(schedule.start_time, "EEEE, d MMMM yyyy", { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <MapPin size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Ruang Kelas</p>
                <p className="text-2xl font-bold text-white">
                  {schedule.room.name}
                </p>
              </div>
            </div>

            <div className="w-full h-px bg-slate-700"></div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <User size={28} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Tutor Pengajar</p>
                <p className="text-2xl font-bold text-white">
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
