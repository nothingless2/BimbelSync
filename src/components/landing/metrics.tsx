'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ShieldCheck } from 'lucide-react';

export function Metrics() {
  const metrics = [
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      bgIcon: <Clock className="w-32 h-32 text-blue-600" />,
      color: "blue",
      value: "+40%",
      label: "Efisiensi Waktu",
      description: "Otomatisasi absensi dan penjadwalan membebaskan admin Anda dari rekap manual yang melelahkan."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
      bgIcon: <TrendingUp className="w-32 h-32 text-emerald-600" />,
      color: "emerald",
      value: "3x Cepat",
      label: "Siklus Penagihan",
      description: "Kirim invoice dan pengingat otomatis. Pantau pembayaran real-time, tingkatkan arus kas bimbel."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      bgIcon: <ShieldCheck className="w-32 h-32 text-indigo-600" />,
      color: "indigo",
      value: "99.9%",
      label: "Uptime & Sekuriti",
      description: "Infrastruktur cloud modern memastikan data siswa dan keuangan Anda selalu aman dan dapat diakses kapanpun."
    }
  ];

  return (
    <section className="py-24 bg-[#FAFAFA] relative overflow-hidden border-y border-slate-200/50">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Bukan Sekadar Alat,<br className="hidden sm:block" /> Ini Adalah <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Mesin Pertumbuhan.</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              BimbelSync memotong birokrasi operasional agar Anda bisa kembali fokus pada hal terpenting: <span className="text-slate-700 font-semibold">kualitas pendidikan siswa Anda.</span>
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
              {/* Background Watermark Icon */}
              <div className="absolute -right-8 -top-8 opacity-[0.03] transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none">
                {metric.bgIcon}
              </div>

              {/* Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${metric.color === 'blue' ? 'from-blue-400 to-blue-600' : metric.color === 'emerald' ? 'from-emerald-400 to-emerald-600' : 'from-indigo-400 to-indigo-600'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              <div className="relative z-10">
                <div className={`mb-8 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-${metric.color}-50 border border-${metric.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  {metric.icon}
                </div>
                
                <div className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{metric.value}</div>
                <div className="text-xl font-bold text-slate-800 mb-3">{metric.label}</div>
                <p className="text-slate-500 leading-relaxed font-medium">{metric.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
