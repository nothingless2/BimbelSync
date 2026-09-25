import React from 'react';
import { CheckCircle2, Check, Calendar, QrCode, CreditCard, Mail, X } from 'lucide-react';
import Link from 'next/link';
import { FadeInView } from '@/components/fade-in-view';
import { LandingHeader } from '@/components/landing-header';
import { Metrics } from '@/components/landing/metrics';
import { Testimonials } from '@/components/landing/testimonials';
import { Showcase } from '@/components/landing/showcase';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { PricingSection } from '@/components/landing/pricing-section';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { TextRotator } from '@/components/ui/text-rotator';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { TextReveal } from '@/components/ui/text-reveal';
import { ParallaxElement } from '@/components/ui/parallax-element';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20tertarik%20menggunakan%20platform%20ini.";

export const metadata: Metadata = {
  title: "BimbelSync | Software Manajemen & Operasional Bimbel Terbaik",
  description: "BimbelSync adalah platform orkestrasi untuk bimbingan belajar. Kelola jadwal tutor, presensi QR cerdas, dan tagihan invoice otomatis dengan verifikasi pembayaran mudah. Coba sekarang!",
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
      <CustomCursor />
      <LandingHeader />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        
        {/* Parallax Background Elements */}
        <ParallaxElement offset={80} className="absolute top-20 left-10 hidden lg:block opacity-20 pointer-events-none">
           <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-transparent blur-2xl"></div>
        </ParallaxElement>
        <ParallaxElement offset={-60} className="absolute bottom-40 right-10 hidden lg:block opacity-20 pointer-events-none">
           <div className="w-48 h-48 rounded-full bg-gradient-to-tl from-emerald-400 to-transparent blur-3xl"></div>
        </ParallaxElement>

        <FadeInView direction="up" delay={0.15}>
          <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 tracking-wide shadow-sm">
            Software Manajemen Bimbel #1
          </div>
        </FadeInView>

        <div className="mb-6 max-w-3xl mx-auto text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.12]">
          <TextReveal text="Kelola Jadwal, Absensi dan Tagihan Bimbel Anda" delay={0.3} className="inline-flex mr-2" />
          <TextRotator 
            words={["dengan Mudah.", "tanpa Ribet.", "lebih Cepat.", "Otomatis."]} 
          />
        </div>

        <FadeInView direction="up" delay={0.35}>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Tinggalkan cara manual yang merepotkan. BimbelSync otomatiskan operasional harian agar Anda leluasa mengajar dan mengembangkan bisnis.
          </p>
        </FadeInView>

        <FadeInView direction="up" delay={0.8}>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <MagneticButton>
              <a href={WA_URL} target="_blank" rel="noreferrer" className="block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-7 rounded-xl transition-colors text-sm shadow-md">
                Coba Gratis Sekarang
              </a>
            </MagneticButton>
            <MagneticButton strength={10}>
              <a href="#features" className="block bg-white text-slate-700 font-semibold py-3.5 px-7 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm shadow-sm">
                Lihat Fitur
              </a>
            </MagneticButton>
          </div>
        </FadeInView>

        <FadeInView direction="up" delay={0.6}>
          <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-lg aspect-video bg-black">
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

      <section className="border-y border-slate-200 bg-white/50 py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dipercaya oleh ratusan bimbel di Indonesia</p>
        </div>
        
        <div 
          className="relative w-full max-w-5xl mx-auto overflow-hidden flex whitespace-nowrap"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
        >
          <style>{`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: scroll 30s linear infinite;
            }
          `}</style>
          
          <div className="animate-marquee flex items-center opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {/* Set 1 */}
            <div className="flex items-center gap-x-16 pr-16 shrink-0">
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rounded-md"></div> EduCerdas</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 rounded-full border-4 border-slate-800"></div> SmartLearn</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rotate-45"></div> PintarBangsa</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 border-b-4 border-slate-800 rounded-b-full"></div> JuaraAcademy</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rounded-md"></div> FokusIlmu</div>
            </div>
            {/* Set 2 (Duplicate) */}
            <div className="flex items-center gap-x-16 pr-16 shrink-0">
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rounded-md"></div> EduCerdas</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 rounded-full border-4 border-slate-800"></div> SmartLearn</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rotate-45"></div> PintarBangsa</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 border-b-4 border-slate-800 rounded-b-full"></div> JuaraAcademy</div>
              <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 bg-slate-800 rounded-md"></div> FokusIlmu</div>
            </div>
          </div>
        </div>
      </section>

      <Metrics />

      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-sm">
            Fitur Utama
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Empat fitur yang menyelesaikan<br/>masalah operasional harian</h2>
          <p className="text-slate-500 leading-relaxed">Setiap fitur dirancang berdasarkan masalah nyata yang dihadapi pengelola bimbel di lapangan.</p>
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
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Tinggalkan absen kertas. Siswa cukup scan QR code dinamis di layar kelas. Data presensi langsung tercatat dan notifikasi langsung terkirim.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> QR code berubah setiap 10 detik</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Anti-titip absen</li>
              </ul>
              </div>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.4}>
            <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/whatsapp-bg.png" alt="Mockup Tagihan Email" className="w-full max-w-sm h-auto object-contain drop-shadow-md opacity-90 hue-rotate-180" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Tagihan via Email</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Kirim invoice, pengingat jatuh tempo, dan resi pembayaran langsung ke email secara otomatis. Tingkatkan persentase pembayaran tepat waktu.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Pengingat otomatis (H-3, H-1)</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Lampiran PDF Profesional</li>
              </ul>
              </div>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.6}>
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="flex-1 w-full flex justify-center">
               <div className="relative">
                  <img src="/features/payment-bg.png" alt="Mockup Pembayaran & Bukti Transfer" className="w-full max-w-sm h-auto object-contain drop-shadow-md opacity-90" />
               </div>
            </div>
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Pencatatan & Verifikasi Pembayaran</h3>
              <p className="text-slate-600 mb-6 text-lg leading-relaxed">Kelola seluruh pembayaran kursus secara praktis. Tinggal unggah resi transfer, admin memverifikasinya dalam satu dasbor tagihan.</p>
              <ul className="space-y-3 text-slate-700 font-medium">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Unggah bukti transfer & resi pembayaran</li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-slate-400"/> Verifikasi cepat & pantau status tagihan</li>
              </ul>
              </div>
            </div>
          </FadeInView>

        </div>
      </section>

      <Showcase />
      <Testimonials />

      <section id="about" className="py-20 md:py-28 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1">
              <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 tracking-wide shadow-sm">
                Tentang Kami
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">Dibuat oleh orang yang paham masalah bimbel.</h2>
              <p className="text-slate-500 mb-4 leading-relaxed">
                Kebanyakan software manajemen pendidikan dibuat terlalu rumit, seolah-olah penggunanya adalah perusahaan besar dengan tim IT sendiri. Kenyataannya, bimbel di Indonesia dikelola oleh 1-3 orang yang merangkap segalanya.
              </p>
              <p className="text-slate-500 leading-relaxed">
                BimbelSync dirancang untuk realita itu. Antarmuka yang bersih, alur kerja yang singkat, dan harga yang masuk akal untuk UMKM pendidikan.
              </p>
            </div>
            <div className="flex-1">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src="/photo-2.avif"
                  alt="Suasana belajar di bimbingan belajar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection plans={plans} />

      <FAQ />

      <FinalCTA />

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
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-700/50 text-sm text-slate-400">
            <p>© 2026 BimbelSync. All rights reserved.</p>
            <div className="flex gap-5 mt-4 md:mt-0">
               <a href="#" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] transition">
                 <span className="sr-only">WhatsApp</span>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
               </a>
               <a href="#" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#E1306C] transition">
                 <span className="sr-only">Instagram</span>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
               </a>
               <a href="#" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition">
                 <span className="sr-only">TikTok</span>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.2 1.88-5.32 2.62-8.15 2-2.92-.64-5.34-2.63-6.44-5.36-1.12-2.8-1.01-6.1.28-8.79 1.35-2.78 4.2-4.8 7.32-5.26 1.46-.21 2.98-.13 4.38.31v4.21c-1.6-.57-3.46-.43-4.89.47-1.46.91-2.39 2.59-2.45 4.3-.06 1.75.84 3.44 2.29 4.39 1.52.99 3.53 1.13 5.17.38 1.66-.75 2.76-2.42 2.79-4.27.05-4.84.02-9.67.04-14.51h-.09z"/></svg>
               </a>
               <a href="#" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#FF0000] transition">
                 <span className="sr-only">YouTube</span>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
               </a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
