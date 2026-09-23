'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ShieldCheck } from 'lucide-react';

export function Metrics() {
  const metrics = [
    {
      icon: <Clock className="w-5 h-5" />,
      value: "+40%",
      label: "Efisiensi Waktu Admin",
      description: "Tinggalkan rekap manual. Sistem kami mengotomatisasi absensi dan penjadwalan."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      value: "3x Lebih Cepat",
      label: "Dalam Penagihan",
      description: "Kirim tagihan dan resi secara otomatis, pantau status pembayaran secara real-time."
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      value: "99.9%",
      label: "Keamanan & Uptime",
      description: "Data siswa, nilai, dan keuangan tersimpan aman di cloud terenkripsi."
    }
  ];

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Lebih dari Sekadar Fitur</h2>
          <p className="text-xl text-slate-500 font-medium">BimbelSync memberikan dampak nyata pada operasional dan profitabilitas bimbingan belajar Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300"
            >
              <div className="mb-8 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                {metric.icon}
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">{metric.value}</div>
              <div className="text-lg font-bold text-slate-900 mb-3">{metric.label}</div>
              <p className="text-slate-500 leading-relaxed font-medium">{metric.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
