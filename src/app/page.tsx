'use client';

import React from 'react';
import { CheckCircle2, Check, Calendar, QrCode, MessageSquare, CreditCard, Menu, X, ArrowRight, Globe, Mail } from 'lucide-react';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20tertarik%20menggunakan%20platform%20ini.";

function Logo({ className }: { className?: string }) {
  return (
    <img src="/logo.png" alt="BimbelSync Logo" className={`object-contain rounded-[20%] ${className}`} />
  );
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-200 overflow-x-hidden">

      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-slate-900">BimbelSync</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Fitur</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Harga</a>
            <a href="#about" className="hover:text-blue-600 transition">Tentang</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href={WA_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition">
              Konsultasi
            </a>
            <a href={WA_URL} target="_blank" rel="noreferrer" className="text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-sm">
              Hubungi Sales
            </a>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        
        <div className="hidden lg:block absolute left-10 top-32 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce" style={{animationDuration: '3s'}}>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jadwal Kelas</p>
              <p className="text-xl font-bold text-slate-900">327 <span className="text-sm text-green-500 font-medium">+12%</span></p>
              <p className="text-[10px] text-slate-400">Bulan ini</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute right-10 top-40 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
           <div className="text-left mb-2">
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendapatan Bulan Ini</p>
           </div>
           <div className="flex items-end gap-1 h-12">
             <div className="w-4 bg-blue-200 rounded-t-sm h-6"></div>
             <div className="w-4 bg-blue-300 rounded-t-sm h-8"></div>
             <div className="w-4 bg-blue-400 rounded-t-sm h-5"></div>
             <div className="w-4 bg-blue-600 rounded-t-sm h-10"></div>
             <div className="w-4 bg-blue-500 rounded-t-sm h-12"></div>
           </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-sm font-medium mb-8">
          Tingkatkan efisiensi bimbel Anda
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Kelola Bimbel Tanpa Ribet<br className="hidden md:block"/>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Otomasi jadwal, presensi QR, dan tagihan otomatis dalam satu platform bersih dan profesional. Tingkatkan efisiensi operasional dan fokus pada kualitas pengajaran.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <a href={WA_URL} target="_blank" rel="noreferrer" className="bg-slate-900 text-white font-semibold px-8 py-4 rounded-full hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2">
            Mulai Gratis <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
           <img 
             src="/photo.avif" 
             alt="Suasana Kelas Bimbel" 
             className="w-full h-auto object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/50 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Dipercaya oleh ratusan bimbel di Indonesia</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale">
             <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rounded-md"></div> EduCerdas</div>
             <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 rounded-full border-4 border-slate-800"></div> SmartLearn</div>
             <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rotate-45"></div> PintarBangsa</div>
             <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 border-b-4 border-slate-800 rounded-b-full"></div> JuaraAcademy</div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Satu Platform,<br/>Semua Kebutuhan Operasional</h2>
          <p className="text-slate-600">Tingkatkan efisiensi bimbel Anda dengan fitur-fitur yang dirancang khusus untuk mengatasi masalah operasional sehari-hari.</p>
        </div>

        <div className="flex flex-col gap-24">
          
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/calendar-bg.png" alt="Mockup Penjadwalan" className="w-full max-w-md h-auto object-contain drop-shadow-2xl" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Penjadwalan Anti-Bentrok</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Sistem cerdas kami mendeteksi potensi bentrok jadwal tutor dan ruangan secara real-time. Buat jadwal mingguan hanya dalam beberapa klik.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Deteksi konflik otomatis</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Sinkronisasi kalender</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/qr-bg.png" alt="Mockup Presensi QR" className="w-full max-w-sm h-auto object-contain drop-shadow-2xl" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Presensi QR Dinamis</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Tinggalkan absen kertas. Siswa cukup scan QR code dinamis di layar kelas. Data presensi langsung tercatat dan notifikasi terkirim ke orang tua.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> QR code berubah setiap 10 detik</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Anti-titip absen</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/whatsapp-bg.png" alt="Mockup Tagihan WhatsApp" className="w-full max-w-sm h-auto object-contain drop-shadow-2xl" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Tagihan via WhatsApp</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Kirim invoice, pengingat jatuh tempo, dan bukti pembayaran langsung ke WhatsApp orang tua secara otomatis. Tingkatkan persentase pembayaran tepat waktu.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Pengingat otomatis (H-3, H-1)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Template pesan kustom</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/payment-bg.png" alt="Mockup Payment Gateway" className="w-full max-w-sm h-auto object-contain drop-shadow-2xl" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Payment Gateway Terintegrasi</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Terima pembayaran dari berbagai channel: VA, e-Wallet, Kartu Kredit. Status pembayaran otomatis ter-update tanpa perlu cek mutasi bank manual.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Update status seketika</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500"/> Rekonsiliasi instan</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      <section id="about" className="bg-slate-200/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">Fokus Pada Apa Yang Paling Penting.</h2>
              <div className="w-16 h-1 bg-blue-600 mb-6"></div>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Kami membangun BimbelSync karena melihat banyak software manajemen bimbel yang terlalu rumit dan lambat digunakan. Kami percaya sistem administrasi haruslah tidak terlihat, bersih, dan presisi.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Desain kami dirancang untuk kecepatan operasional tinggi, memberdayakan UMKM pendidikan Indonesia untuk fokus pada kualitas layanan mereka.
              </p>
            </div>
            <div className="flex-1 relative">
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl relative">
               
                <img 
                  src="/photo-2.avif" 
                  alt="Siswa Belajar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-600 rounded-full blur-3xl opacity-30 z-[-1]"></div>
            </div>
          </div>
        </div>
      </section>


      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Harga Transparan</h2>
          <p className="text-slate-600">Pilih paket yang sesuai dengan ukuran bimbingan belajar Anda. Tidak ada biaya tersembunyi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
            <p className="text-sm text-slate-500 mb-6">Untuk bimbel baru atau privat kecil</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">Rp 99k</span>
              <span className="text-slate-500">/bulan</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Maksimal 50 Siswa</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Penjadwalan Dasar</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Presensi Manual</li>
              <li className="flex items-center gap-3 text-sm text-slate-400 opacity-60"><X className="w-5 h-5"/> Integrasi WhatsApp</li>
            </ul>
            <a href={WA_URL} target="_blank" rel="noreferrer" className="w-full block text-center py-3 px-4 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              Pilih Starter
            </a>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-blue-600 shadow-xl relative transform md:-translate-y-4 flex flex-col z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Paling Populer
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Growth</h3>
            <p className="text-sm text-slate-500 mb-6">Cocok untuk bimbel menengah yang sedang berkembang</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">Rp 299k</span>
              <span className="text-slate-500">/bulan</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-900 font-medium"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Maksimal 250 Siswa</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Penjadwalan Lanjutan</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Presensi QR Dinamis</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Integrasi WhatsApp</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-600"/> Payment Gateway (Basic)</li>
            </ul>
            <a href={WA_URL} target="_blank" rel="noreferrer" className="w-full block text-center py-3 px-4 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg">
              Pilih Growth
            </a>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
            <p className="text-sm text-slate-500 mb-6">Fitur lengkap untuk jaringan bimbel besar</p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">Rp 599k</span>
              <span className="text-slate-500">/bulan</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Unlimited Siswa</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Multi-cabang Support</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Custom Domain/Branding</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> API Access</li>
              <li className="flex items-center gap-3 text-sm text-slate-700"><CheckCircle2 className="w-5 h-5 text-green-500"/> Priority Support 24/7</li>
            </ul>
            <a href={WA_URL} target="_blank" rel="noreferrer" className="w-full block text-center py-3 px-4 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              Hubungi Sales
            </a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-20 overflow-x-auto">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-[700px] p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-6 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest w-2/5">Fitur</th>
                  <th className="py-6 px-8 text-sm font-bold text-slate-700 text-center w-1/5">Starter</th>
                  <th className="py-6 px-8 text-sm font-bold text-blue-600 text-center w-1/5">Growth</th>
                  <th className="py-6 px-8 text-sm font-bold text-slate-700 text-center w-1/5">Pro</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 text-sm font-medium">
                <tr className="border-b border-slate-100">
                  <td className="py-5 px-8">Manajemen Data Siswa & Tutor</td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-5 px-8">Laporan Keuangan Dasar</td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-5 px-8">Rekap Presensi Otomatis</td>
                  <td className="py-5 px-8 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-5 px-8">Notifikasi WhatsApp Harian</td>
                  <td className="py-5 px-8 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-5 px-8">Manajemen Aset & Ruangan Lanjutan</td>
                  <td className="py-5 px-8 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-5 px-8 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">

          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-12 md:p-20 gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Siap Transformasi <br/><span className="text-blue-400">Operasional Bimbel</span> Anda?
              </h2>
              <p className="text-lg text-slate-300 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Tinggalkan cara manual. Bergabunglah dengan ratusan pemilik bimbel yang telah menghemat waktu dan meningkatkan omzet bersama BimbelSync.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href={WA_URL} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                  Mulai Gratis Sekarang <ArrowRight className="w-5 h-5" />
                </a>
                <a href={WA_URL} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-full backdrop-blur-sm border border-white/10 transition-all flex items-center justify-center">
                  Jadwalkan Demo
                </a>
              </div>
            </div>
            
            <div className="flex-1 w-full relative hidden lg:block">
               <img src="/photo-2.avif" alt="Guru dan Siswa" className="w-full h-80 object-cover rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-700/50 transform rotate-2 hover:rotate-0 transition duration-500" />
               
               <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '4s' }}>
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                   <CheckCircle2 className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-900">100% Siap Pakai</p>
                   <p className="text-xs text-slate-500">Setup selesai dalam 5 menit</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#1E293B] text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="bg-white w-10 h-10 rounded mb-6 flex items-center justify-center">
                 <Logo className="w-6 h-6" />
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                Solusi operasional cerdas untuk bimbingan belajar modern di Indonesia.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold text-sm tracking-widest mb-6 uppercase">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm tracking-widest mb-6 uppercase">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#about" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm tracking-widest mb-6 uppercase">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-700/50 text-sm text-slate-400">
            <p>© 2024 BimbelSync. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
               <Globe className="w-5 h-5 hover:text-white cursor-pointer transition" />
               <Mail className="w-5 h-5 hover:text-white cursor-pointer transition" />
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
