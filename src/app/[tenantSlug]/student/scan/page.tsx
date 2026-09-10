"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { usePathname, useRouter } from "next/navigation";
import { processQrScanAction } from "./actions";
import { QrCode, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function StudentScanPage() {
  const pathname = usePathname();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1] || 'Bimbel';

  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('SCANNING');
  const [message, setMessage] = useState('');

  const handleScan = async (detectedCodes: any[]) => {
    if (scanStatus !== 'SCANNING' || detectedCodes.length === 0) return;
    
    const qrData = detectedCodes[0].rawValue;
    if (!qrData) return;

    setScanStatus('PROCESSING');
    setMessage('Memverifikasi QR Code...');

    const result = await processQrScanAction(tenantSlug, qrData);

    if (result.error) {
      setScanStatus('ERROR');
      setMessage(result.error);
    } else {
      setScanStatus('SUCCESS');
      setMessage(result.message || 'Kehadiran berhasil dicatat!');
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/${tenantSlug}/student/dashboard`);
      }, 2000);
    }
  };

  const handleRetry = () => {
    setScanStatus('SCANNING');
    setMessage('');
  };

  return (
    <div className="p-4 sm:p-8 flex flex-col items-center justify-center min-h-[80vh]">
      
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center">
        
        {scanStatus === 'SCANNING' && (
          <>
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-full mb-4">
              <QrCode size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Scan QR Code</h2>
            <p className="text-sm text-slate-500 mb-6">Arahkan kamera ke layar tutor untuk melakukan absensi.</p>
            
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-4 border-slate-100 dark:border-slate-800 relative bg-slate-900">
              <Scanner 
                onScan={handleScan}
                components={{
                  audio: true,
                  onOff: true,
                  torch: true,
                  zoom: true,
                  finder: true,
                }}
              />
            </div>
          </>
        )}

        {scanStatus === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center">
            <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Memproses...</h2>
            <p className="text-sm text-slate-500 mt-2">{message}</p>
          </div>
        )}

        {scanStatus === 'SUCCESS' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Berhasil!</h2>
            <p className="text-slate-500 mb-6">{message}</p>
            <p className="text-sm text-slate-400 animate-pulse">Mengalihkan ke beranda...</p>
          </div>
        )}

        {scanStatus === 'ERROR' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle size={40} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gagal Absen</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
            >
              <AlertCircle size={18} />
              Coba Lagi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
