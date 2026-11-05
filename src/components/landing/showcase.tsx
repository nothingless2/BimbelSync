'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  {
    id: 'admin',
    label: 'Pemilik & Pengelola Bimbel',
    description: 'Satu dasbor terpadu untuk kelola jadwal kelas, laporan keuangan SPP, pemantauan staf, dan operasional bimbel secara real-time.',
    image: '/photo-1.avif',
  },
  {
    id: 'student',
    label: 'Siswa & Wali Murid',
    description: 'Portal mobile responsif untuk scan QR presensi, cek kalender kelas harian, akses materi belajar, dan pantau tagihan SPP.',
    image: '/photo-2.avif',
  },
  {
    id: 'tutor',
    label: 'Tutor & Tenaga Pengajar',
    description: 'Fokus mengajar tanpa beban administratif. Kelola jadwal kelas, input nilai rapor, dan proyeksi QR code langsung dari smartphone.',
    image: '/photo.avif',
  },
];

export function Showcase() {
  const [active, setActive] = useState(0);

  const handleNextTab = () => {
    setActive((prev) => (prev + 1) % tabs.length);
  };

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] border-b border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
          <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-xs">
            Untuk Semua Peran
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Satu platform, tiga pengalaman yang berbeda
          </h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed mt-3">
            Dirancang khusus untuk memenuhi kebutuhan unik setiap pengguna dalam ekosistem bimbingan belajar.
          </p>
        </div>

        {/* Content Showcase Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Left Vertical Tab Buttons */}
          <div className="w-full lg:w-[420px] shrink-0 flex flex-col gap-4 justify-between">
            {tabs.map((tab, i) => {
              const isActive = active === i;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group relative text-left transition-all duration-300 w-full rounded-2xl p-6 sm:p-7 flex flex-col justify-start cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 overflow-hidden ${isActive
                    ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)] border border-slate-200/90 z-10'
                    : 'bg-[#F9FAFB]/80 hover:bg-white/80 border border-slate-200/60'
                    }`}
                >
                  {/* Top Progress Bar Indicator */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200/40 overflow-hidden">
                    {isActive && (
                      <motion.div
                        key={`showcase-timer-${active}`}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{
                          duration: 4.5,
                          ease: 'linear',
                        }}
                        onAnimationComplete={handleNextTab}
                        className="h-full bg-slate-900 rounded-full"
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-base sm:text-lg font-bold tracking-tight transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                  >
                    {tab.label}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm sm:text-[15px] leading-relaxed mt-2 transition-colors duration-200 font-normal ${isActive ? 'text-slate-600' : 'text-slate-500'
                      }`}
                  >
                    {tab.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Visual / Image Area */}
          <div className="flex-1 w-full relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-900/5 min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                src={tabs[active].image}
                alt={tabs[active].label}
                width={1200}
                height={800}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
