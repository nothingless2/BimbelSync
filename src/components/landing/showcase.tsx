'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserCog } from 'lucide-react';

const tabs = [
  {
    id: 'admin',
    label: 'Pemilik & Admin',
    icon: LayoutDashboard,
    summary: 'Satu dasbor untuk semua',
    bullets: ['Jadwal, keuangan, dan laporan', 'Kelola staf, siswa, dan ruangan', 'Pantau operasional kapan saja'],
    image: '/photo-1.avif',
  },
  {
    id: 'student',
    label: 'Siswa & Orang Tua',
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
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">Untuk semua peran</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Satu platform, tiga pengalaman yang berbeda
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">

          {/* Tab buttons */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = active === i;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(i)}
                  className={`text-left p-5 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                      {tab.label}
                    </span>
                  </div>

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="text-sm text-slate-500 mb-3">{tab.summary}</p>
                      <ul className="space-y-1.5">
                        {tab.bullets.map((b, j) => (
                          <li key={j} className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="w-1 h-1 bg-blue-600 rounded-full shrink-0" />
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
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 min-h-[360px] sm:min-h-[440px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
