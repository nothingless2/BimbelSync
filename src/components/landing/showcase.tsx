'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserCog } from 'lucide-react';

const tabs = [
  {
    id: 'admin',
    label: 'Pemilik Bimbel',
    icon: LayoutDashboard,
    summary: 'Satu dasbor untuk semua',
    bullets: ['Jadwal, keuangan, dan laporan', 'Kelola staf, siswa, dan ruangan', 'Pantau operasional kapan saja'],
    image: '/photo-1.avif',
  },
  {
    id: 'student',
    label: 'Siswa',
    icon: Users,
    summary: 'Portal khusus siswa',
    bullets: ['Lihat jadwal dan scan QR absen', 'Cek nilai dan riwayat kehadiran', 'Pantau status tagihan'],
    image: '/photo-2.avif',
  },
  {
    id: 'tutor',
    label: 'Tutor & Pengajar',
    icon: UserCog,
    summary: 'Fokus mengajar, bukan admin',
    bullets: ['Jadwal mengajar di satu tempat', 'Input nilai siswa langsung', 'Kelola presensi dari HP'],
    image: '/photo.avif',
  },
];

export function Showcase() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-sm">
            Untuk Semua Peran
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Satu platform, tiga pengalaman yang berbeda
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

          {/* Tab buttons */}
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-2">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = active === i;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(i)}
                  className={`text-left transition-all duration-300 w-full rounded-2xl ${
                    isActive
                      ? 'bg-white shadow-lg shadow-slate-200/50 border border-slate-100 p-6'
                      : 'bg-transparent border-transparent p-6 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[#0052FF] text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-lg font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {tab.label}
                    </span>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-base text-slate-500 mb-4 font-medium">{tab.summary}</p>
                      <ul className="space-y-2.5">
                        {tab.bullets.map((b, j) => (
                          <li key={j} className="text-sm text-[#475569] flex items-center gap-3 font-medium">
                            <span className="w-1.5 h-1.5 bg-[#0052FF] rounded-full shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Image area */}
          <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-2xl min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                src={tabs[active].image}
                alt={tabs[active].label}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
