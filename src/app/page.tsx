import React from 'react';
import { CheckCircle2, Check, Calendar, QrCode, MessageSquare, CreditCard, ArrowRight, Globe, Mail, X } from 'lucide-react';
import { FadeInView } from '@/components/fade-in-view';
import { LandingHeader } from '@/components/landing-header';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20tertarik%20menggunakan%20platform%20ini.";

export const metadata: Metadata = {
  title: "BimbelSync | Software Manajemen & Operasional Bimbel Terbaik",
  description: "BimbelSync adalah platform orkestrasi untuk bimbingan belajar. Kelola jadwal tutor, presensi QR cerdas, dan tagihan invoice otomatis dengan payment gateway. Coba sekarang!",
  keywords: ["software bimbel", "aplikasi manajemen bimbel", "sistem informasi bimbel", "jadwal bimbel", "presensi siswa", "invoice otomatis"],
  openGraph: {
    title: "BimbelSync | Software Manajemen Bimbel Modern",
    description: "Solusi lengkap kelola operasional, jadwal, dan tagihan bimbingan belajar.",
    url: "https://bimbelsync.com",
    siteName: "BimbelSync",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BimbelSync | Software Manajemen Bimbel Modern",
    description: "Solusi lengkap kelola operasional, jadwal, dan tagihan bimbingan belajar.",
  }
};

export default async function LandingPage() {
  const plans = await prisma.plan.findMany({
    where: { deleted_at: null, is_active: true },
    orderBy: { price: 'asc' },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-200 overflow-x-hidden">
      <LandingHeader />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
        



        
        <FadeInView direction="up" delay={0.2}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Platform Manajemen Bimbingan Belajar.
        </h1>
        </FadeInView>
        
        <FadeInView direction="up" delay={0.3}>
          <p className="text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          Satu sistem untuk jadwal, presensi QR, dan tagihan. Fokus mengajar, biarkan sistem yang mengurus administrasi.
          </p>
        </FadeInView>
        
        <FadeInView direction="up" delay={0.4}>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <a href={WA_URL} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg transition flex items-center justify-center gap-2">
            Mulai Gratis
          </a>
          <a href="#features" className="bg-white text-slate-700 font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center">
            Pelajari Fitur
          </a>
          </div>
        </FadeInView>

        <FadeInView direction="up" delay={0.6}>
          <div className="relative max-w-5xl mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black">
           <iframe 
             width="100%" 
             height="100%" 
             src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0" 
             title="BimbelSync Demo" 
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
             className="absolute inset-0"
           ></iframe>
          </div>
        </FadeInView>
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

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Satu Platform,<br/>Semua Kebutuhan Operasional</h2>
          <p className="text-slate-600">Tingkatkan efisiensi bimbel Anda dengan fitur-fitur yang dirancang khusus untuk mengatasi masalah operasional sehari-hari.</p>
        </div>

        <div className="flex flex-col gap-24">
          
          <FadeInView direction="up" delay={0.2}>
            <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/calendar-bg.png" alt="Mockup Penjadwalan" className="w-full max-w-md h-auto object-contain drop-shadow-md opacity-90" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Penjadwalan Anti-Bentrok</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Sistem cerdas kami mendeteksi potensi bentrok jadwal tutor dan ruangan secara real-time. Buat jadwal mingguan hanya dalam beberapa klik.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Deteksi konflik otomatis</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Sinkronisasi kalender</li>
              </ul>
              </div>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.2}>
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/qr-bg.png" alt="Mockup Presensi QR" className="w-full max-w-sm h-auto object-contain drop-shadow-md opacity-90" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Presensi QR Dinamis</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Tinggalkan absen kertas. Siswa cukup scan QR code dinamis di layar kelas. Data presensi langsung tercatat dan notifikasi terkirim ke orang tua.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> QR code berubah setiap 10 detik</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Anti-titip absen</li>
              </ul>
              </div>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.2}>
            <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/whatsapp-bg.png" alt="Mockup Tagihan WhatsApp" className="w-full max-w-sm h-auto object-contain drop-shadow-md opacity-90" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Tagihan via WhatsApp</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Kirim invoice, pengingat jatuh tempo, dan bukti pembayaran langsung ke WhatsApp orang tua secara otomatis. Tingkatkan persentase pembayaran tepat waktu.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Pengingat otomatis (H-3, H-1)</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Template pesan kustom</li>
              </ul>
              </div>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.2}>
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/payment-bg.png" alt="Mockup Payment Gateway" className="w-full max-w-sm h-auto object-contain drop-shadow-md opacity-90" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Payment Gateway Terintegrasi</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Terima pembayaran dari berbagai channel: VA, e-Wallet, Kartu Kredit. Status pembayaran otomatis ter-update tanpa perlu cek mutasi bank manual.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Update status seketika</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Rekonsiliasi instan</li>
              </ul>
              </div>
            </div>
          </FadeInView>

        </div>
      </section>

      <section id="about" className="bg-slate-200/50 py-16 md:py-24">
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
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
               
                <img 
                  src="/photo-2.avif" 
                  alt="Siswa Belajar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Harga Transparan</h2>
          <p className="text-slate-600">Pilih paket yang sesuai dengan ukuran bimbingan belajar Anda. Terintegrasi langsung dengan database platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.length === 0 ? (
            <div className="col-span-3 text-center text-slate-500 py-10">
              Belum ada paket tersedia saat ini. Silakan hubungi tim sales.
            </div>
          ) : plans.map((plan, index) => {
            const isPopular = index === 1 || plan.name.toLowerCase() === 'growth'; // Highlight the middle/second plan or "Growth"
            return (
              <div key={plan.id} className={`bg-white rounded-3xl p-8 flex flex-col ${isPopular ? "border-2 border-blue-600 shadow-xl relative transform md:-translate-y-4 z-10" : "border border-slate-200 shadow-sm"}`}>
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Paling Populer
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-6">Sempurna untuk skala bisnis Anda</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price).replace(",00", "")}
                  </span>
                  <span className="text-slate-500">/bulan</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                    Maks {plan.max_students === null ? "Unlimited" : plan.max_students} Siswa
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                    Maks {plan.max_staff === null ? "Unlimited" : plan.max_staff} Staff
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                    Maks {plan.max_rooms === null ? "Unlimited" : plan.max_rooms} Ruangan
                  </li>
                  
                  {plan.allows_payment_gateway ? (
                    <li className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                      Payment Gateway Integrasi
                    </li>
                  ) : (
                    <li className="flex items-center gap-3 text-sm text-slate-400 opacity-60">
                      <X className="w-5 h-5"/> Payment Gateway Integrasi
                    </li>
                  )}
                  
                  {plan.allows_installment ? (
                    <li className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                      Fitur Bayar Cicilan (Installment)
                    </li>
                  ) : (
                    <li className="flex items-center gap-3 text-sm text-slate-400 opacity-60">
                      <X className="w-5 h-5"/> Fitur Bayar Cicilan (Installment)
                    </li>
                  )}
                </ul>
                <a href={WA_URL} target="_blank" rel="noreferrer" className={`w-full block text-center py-3 px-4 rounded-xl font-semibold transition ${isPopular ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  Pilih {plan.name}
                </a>
              </div>
            );
          })}
        </div>

        {/* Dynamic Comparison Table */}
        {plans.length > 0 && (
          <div className="max-w-5xl mx-auto mt-20 overflow-x-auto">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-full md:min-w-[700px] p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 px-2 md:py-6 md:px-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest w-1/4">Fitur</th>
                    {plans.map((plan, i) => (
                      <th key={plan.id} className={`py-4 px-2 md:py-6 md:px-8 text-xs md:text-sm font-bold text-center w-1/4 ${i === 1 || plan.name.toLowerCase() === 'growth' ? "text-blue-600" : "text-slate-700"}`}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-600 text-xs md:text-sm font-medium">
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Siswa</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_students === null ? '∞' : p.max_students}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Staff/Tutor</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_staff === null ? '∞' : p.max_staff}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Ruangan</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_rooms === null ? '∞' : p.max_rooms}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-2 md:py-5 md:px-8">Payment Gateway</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                        {p.allows_payment_gateway ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-2 md:py-5 md:px-8">Sistem Pembayaran Cicilan</td>
                    {plans.map((p) => (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                        {p.allows_installment ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="bg-slate-900 rounded-3xl overflow-hidden p-10 sm:p-16 text-center max-w-5xl mx-auto shadow-sm relative">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight tracking-tight">
              Tingkatkan Kapasitas Bimbel Anda
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tinggalkan cara manual. Bergabunglah dengan ratusan pemilik bimbel yang telah menghemat waktu dan meningkatkan omzet bersama BimbelSync.
            </p>
            <div className="flex justify-center relative w-fit mx-auto">
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 hidden md:block w-32 pointer-events-none" style={{ mixBlendMode: 'lighten' }}>
                 <img src="/cs-agent.png" alt="Konsultan Kami" className="w-full h-auto object-contain rounded-l-3xl" />
              </div>
              <a href={WA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors relative z-20">
                Konsultasi Gratis via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#1E293B] text-slate-300 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="bg-white w-10 h-10 rounded mb-6 flex items-center justify-center">
                 <img src="/logo.png" alt="BimbelSync Logo" className="object-contain rounded-[20%] w-6 h-6" />
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
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm tracking-widest mb-6 uppercase">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-700/50 text-sm text-slate-400">
            <p>© 2026 BimbelSync. All rights reserved.</p>
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
