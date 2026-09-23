'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, UserCog } from 'lucide-react';

export function Showcase() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'admin',
      label: 'Admin & Staf',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Dasbor pusat kontrol untuk mengelola seluruh aspek bimbel, mulai dari pendaftaran, jadwal, hingga laporan keuangan.',
      image: '/photo-1.avif' // Fallback to existing images
    },
    {
      id: 'student',
      label: 'Siswa / Orang Tua',
      icon: <Users className="w-5 h-5" />,
      description: 'Akses mudah ke jadwal kelas, nilai, absensi, dan riwayat tagihan dari portal khusus siswa.',
      image: '/photo-2.avif'
    },
    {
      id: 'tutor',
      label: 'Tutor / Pengajar',
      icon: <UserCog className="w-5 h-5" />,
      description: 'Lihat jadwal mengajar, input nilai siswa, dan presensi dengan mudah melalui HP.',
      image: '/photo-3.avif'
    }
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Pengalaman Terbaik untuk Semua</h2>
          <p className="text-lg text-slate-600">Antarmuka yang dirancang khusus untuk memenuhi kebutuhan masing-masing peran di bimbel Anda.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Tabs Menu */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`text-left p-6 rounded-2xl transition-all duration-300 border-2 ${
                  activeTab === index 
                    ? 'border-blue-600 bg-white shadow-lg shadow-blue-900/5' 
                    : 'border-transparent bg-transparent hover:bg-white/60 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-2 rounded-xl ${activeTab === index ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.icon}
                  </div>
                  <h3 className={`text-xl font-bold ${activeTab === index ? 'text-slate-900' : 'text-slate-600'}`}>
                    {tab.label}
                  </h3>
                </div>
                <p className={`text-sm leading-relaxed ${activeTab === index ? 'text-slate-600' : 'text-slate-500'}`}>
                  {tab.description}
                </p>
              </button>
            ))}
          </div>

          {/* Interactive Image Showcase */}
          <div className="w-full lg:w-2/3 h-[400px] sm:h-[500px] lg:h-[600px] relative rounded-3xl overflow-hidden shadow-2xl bg-slate-200 border border-slate-200">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4 }}
                src={tabs[activeTab].image}
                alt={tabs[activeTab].label}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            
            {/* UI Overlay subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
