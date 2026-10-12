'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-[#0A0F1C] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-stretch border border-slate-800">
          
          {/* Subtle noise texture & glow for the background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          
          {/* Left side: Image / Visual (Hidden on mobile/tablet for a cleaner look, visible on desktop) */}
          <div className="hidden lg:flex w-full lg:w-1/2 relative min-h-[400px] order-2 lg:order-1 items-end justify-start">
             {/* Decorative glow behind image */}
             <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full"></div>
             
             <motion.img 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                src="/cs-agent.png" 
                alt="Customer Success Agent" 
                className="relative z-10 w-full h-[120%] lg:h-[110%] object-cover object-bottom"
             />
          </div>

          {/* Right side: Text Content (Full width on mobile/tablet, Half width on desktop) */}
          <div className="w-full lg:w-1/2 px-6 py-12 sm:px-12 lg:px-16 lg:py-24 order-1 lg:order-2 relative z-10 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.15]">
                Siap Bawa Bimbel Anda <br className="hidden md:block"/> <span className="text-blue-500">Naik Kelas?</span>
              </h2>
              
              <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">
                Tinggalkan sistem manual yang menghambat skala bisnis Anda. Mari diskusikan bagaimana BimbelSync dapat disesuaikan untuk kebutuhan spesifik Anda.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a 
                  href="/register" 
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 font-semibold text-sm sm:text-base py-3.5 sm:py-4 px-6 sm:px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 hover:-translate-y-0.5"
                >
                  Mulai Coba Gratis
                </a>
                <a 
                  href={WA_URL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white border border-slate-700 hover:border-slate-500 font-semibold text-sm sm:text-base py-3.5 sm:py-4 px-6 sm:px-8 rounded-full transition-colors duration-200"
                >
                  Konsultasi WhatsApp <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
