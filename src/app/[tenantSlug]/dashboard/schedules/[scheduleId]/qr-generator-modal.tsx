"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, RefreshCw } from "lucide-react";

export function QrGeneratorModal({ 
  scheduleId, 
  tenantSlug,
  isOpen, 
  onClose 
}: { 
  scheduleId: string;
  tenantSlug: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(3); // 3 seconds refresh

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

  // Data that will be embedded in the QR Code
  // Create a direct URL for scanning so students can use native camera apps
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bimbelsync.com';
  const qrData = `${baseUrl}/${tenantSlug}/student/scan/${scheduleId}?t=${timestamp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Scan QR untuk Absen</h2>
          <p className="text-sm text-slate-500 mb-8">
            Minta siswa membuka aplikasi BimbelSync di HP mereka dan melakukan scan pada kode ini.
          </p>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 relative">
            <QRCodeSVG 
              value={qrData} 
              size={240} 
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
            <RefreshCw size={16} className="animate-spin text-blue-600" style={{ animationDuration: '3s' }} />
            QR berubah dalam <span className="text-blue-600 font-bold w-4 text-center">{timeLeft}</span> detik
          </div>
        </div>
      </div>
    </div>
  );
}
