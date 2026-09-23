'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCTA() {
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800"></div>
      
      {/* Abstract Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl transform rotate-12"></div>
        <div className="absolute -bottom-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl transform -rotate-12"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Transformasi Dimulai Hari Ini
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Siap Tingkatkan Level<br/>Bimbel Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ratusan pengelola bimbingan belajar yang telah sukses mengotomatisasi operasional mereka.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={WA_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-1"
            >
              Mulai Uji Coba Gratis
            </a>
            <a 
              href={WA_URL} 
              target="_blank" 
              rel="noreferrer" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-800/40 hover:bg-blue-800/60 backdrop-blur-md text-white border border-white/20 font-bold text-lg py-4 px-8 rounded-2xl transition-all duration-300"
            >
              Jadwalkan Demo
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
