'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ShieldCheck } from 'lucide-react';

export function Metrics() {
  const metrics = [
    {
      icon: <Clock className="w-8 h-8 text-blue-600 mb-4" />,
      value: "+40%",
      label: "Efisiensi Waktu Admin",
      description: "Tinggalkan rekap manual. Sistem kami mengotomatisasi absensi dan penjadwalan."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-emerald-500 mb-4" />,
      value: "3x Lebih Cepat",
      label: "Dalam Penagihan",
      description: "Kirim tagihan dan resi secara otomatis, pantau status pembayaran secara real-time."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-purple-600 mb-4" />,
      value: "99.9%",
      label: "Keamanan & Uptime",
      description: "Data siswa, nilai, dan keuangan tersimpan aman di cloud terenkripsi."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Lebih dari Sekadar Fitur</h2>
          <p className="text-lg text-slate-600">BimbelSync memberikan dampak nyata pada operasional dan profitabilitas bimbingan belajar Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 group-hover:opacity-10 transition-transform duration-500 transform translate-x-4 -translate-y-4">
                {metric.icon}
              </div>
              {metric.icon}
              <div className="text-5xl font-extrabold text-slate-900 mb-2">{metric.value}</div>
              <div className="text-xl font-bold text-slate-800 mb-3">{metric.label}</div>
              <p className="text-slate-600 leading-relaxed">{metric.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
