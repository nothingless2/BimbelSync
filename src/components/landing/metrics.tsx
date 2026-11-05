'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Metrics() {
  const [activeTab, setActiveTab] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const items = [
    {
      title: "Efisiensi Waktu Admin",
      description: "Otomatisasi absensi dan penjadwalan membebaskan admin Anda dari rekap manual yang melelahkan.",
    },
    {
      title: "Siklus Penagihan Cepat",
      description: "Kirim invoice dan pengingat otomatis. Pantau pembayaran real-time, tingkatkan arus kas bimbel.",
    },
    {
      title: "99.9% Uptime & Keamanan Cloud",
      description: "Infrastruktur cloud modern memastikan data siswa dan keuangan Anda selalu aman dan dapat diakses.",
    },
  ];

  // Auto-play timer: 5 detik per tab, berganti otomatis
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, activeTab, items.length]);

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] relative overflow-hidden border-y border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">
              Fokus mengajar, biar sistem yang<br className="hidden sm:block" /> urus <span className="text-blue-600">administrasinya.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
              BimbelSync memotong pekerjaan berulang agar Anda bisa kembali fokus pada hal terpenting: mendampingi siswa belajar.
            </p>
          </motion.div>
        </div>

        {/* 3-Segment Interactive Feature Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative border border-slate-200/90 rounded-2xl md:rounded-3xl overflow-hidden bg-slate-50/50 shadow-xs"
        >
          <div className="flex items-stretch">
            {/* Left Technical Hatch Pattern (Blueprint Accent) */}
            <div
              className="hidden sm:block w-5 md:w-10 shrink-0 border-r border-slate-200/80 bg-[repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0_1.5px,transparent_1.5px,transparent_7px)] opacity-60"
              aria-hidden="true"
            />

            {/* 3 Interactive Cards Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
              {items.map((item, index) => {
                const isActive = activeTab === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={`group relative p-6 sm:p-8 md:p-10 flex flex-col justify-start text-left cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isActive
                        ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] z-10'
                        : 'bg-[#F9FAFB]/80 hover:bg-white/70'
                    }`}
                  >
                    {/* Top Progress Bar / Indicator */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-200/40 overflow-hidden">
                      {isActive && (
                        <motion.div
                          key={`timer-${activeTab}`}
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{
                            duration: isPaused ? 0 : 5,
                            ease: 'linear',
                          }}
                          className="h-full bg-slate-900 rounded-full"
                        />
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-base sm:text-lg md:text-xl font-bold tracking-tight transition-colors duration-200 ${
                        isActive
                          ? 'text-slate-900'
                          : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-sm sm:text-[15px] leading-relaxed mt-2.5 transition-colors duration-200 font-normal ${
                        isActive
                          ? 'text-slate-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Right Technical Hatch Pattern (Blueprint Accent) */}
            <div
              className="hidden sm:block w-5 md:w-10 shrink-0 border-l border-slate-200/80 bg-[repeating-linear-gradient(45deg,#e2e8f0,#e2e8f0_1.5px,transparent_1.5px,transparent_7px)] opacity-60"
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
