'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-slate-950 overflow-hidden px-6 py-20 sm:px-16 sm:py-24 text-center shadow-2xl">
          
          {/* Subtle radial glow instead of harsh linear gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none transform -translate-y-1/2"></div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
              Siap Tingkatkan Level<br/>Bimbel Anda?
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Bergabunglah dengan ratusan pengelola bimbingan belajar yang telah sukses mengotomatisasi operasional mereka tanpa kerumitan.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href={WA_URL} 
                target="_blank" 
                rel="noreferrer" 
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-slate-950 hover:bg-slate-100 font-semibold text-base py-4 px-8 rounded-full transition-colors duration-200"
              >
                Mulai Uji Coba Gratis
              </a>
              <a 
                href={WA_URL} 
                target="_blank" 
                rel="noreferrer" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white border border-slate-800 font-semibold text-base py-4 px-8 rounded-full transition-colors duration-200"
              >
                Hubungi Tim Sales
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
