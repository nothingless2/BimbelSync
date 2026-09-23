'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';

export function Metrics() {
  const metrics = [
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      bgClass: "bg-blue-50",
      title: "Efisiensi Waktu Admin",
      description: "Otomatisasi absensi dan penjadwalan membebaskan admin Anda dari rekap manual yang melelahkan."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      bgClass: "bg-blue-50",
      title: "Siklus Penagihan Cepat",
      description: "Kirim invoice dan pengingat otomatis. Pantau pembayaran real-time, tingkatkan arus kas bimbel."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      bgClass: "bg-white/20",
      title: "99.9% Uptime & Sekuriti",
      description: "Infrastruktur cloud modern memastikan data siswa dan keuangan Anda selalu aman dan dapat diakses.",
      highlight: true
    }
  ];

  return (
    <section className="py-24 bg-[#F8FAFC] relative overflow-hidden border-y border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Fokus mengajar, biar sistem yang<br />urus <span className="text-blue-600">administrasinya.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
              BimbelSync memotong pekerjaan berulang agar Anda bisa kembali fokus pada hal terpenting: mendampingi siswa belajar.
            </p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {metrics.map((metric, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`group relative p-6 md:p-8 rounded-[1.5rem] transition-all duration-300 flex flex-col h-full ${
                metric.highlight 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-white border border-slate-200/60 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Highlight Card Ornaments */}
              {metric.highlight && (
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-[2rem] pointer-events-none">
                   <div className="absolute -top-12 -right-12 w-48 h-48 bg-white opacity-5 rounded-full blur-2xl"></div>
                   <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500 opacity-20 blur-xl"></div>
                </div>
              )}

              <div className="relative z-10 flex-1 flex flex-col">
                <div className={`mb-6 inline-flex items-center justify-center w-10 h-10 rounded-xl ${metric.bgClass}`}>
                  {metric.icon}
                </div>
                
                <h3 className={`text-lg font-bold mb-3 ${metric.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {metric.title}
                </h3>
                
                <p className={`text-sm leading-relaxed font-medium mb-8 flex-1 ${metric.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                  {metric.description}
                </p>

                <div className={`mt-auto inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  metric.highlight 
                    ? 'bg-white/10 text-white group-hover:bg-white/20' 
                    : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                }`}>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
