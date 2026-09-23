'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCTA() {
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-2xl border border-slate-800">
          
          {/* Subtle noise texture & glow */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Left side: Text Content */}
            <div className="px-8 py-16 sm:px-16 sm:py-20 lg:py-24 lg:pr-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-6 tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  KONSULTASI GRATIS
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.15]">
                  Siap Bawa Bimbel Anda <br/> <span className="text-blue-400">Naik Kelas?</span>
                </h2>
                
                <p className="text-lg text-slate-400 mb-10 max-w-lg font-medium leading-relaxed">
                  Tinggalkan sistem manual yang menghambat skala bisnis Anda. Mari diskusikan bagaimana BimbelSync dapat disesuaikan untuk kebutuhan spesifik Anda.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <a 
                    href={WA_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 font-semibold text-base py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/50 hover:shadow-blue-900/80 hover:-translate-y-0.5"
                  >
                    Hubungi via WhatsApp
                  </a>
                  <a 
                    href="#features" 
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white border border-slate-700 hover:border-slate-500 font-semibold text-base py-4 px-8 rounded-full transition-colors duration-200"
                  >
                    Pelajari Fitur
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right side: Image / Visual */}
            <div className="relative h-full hidden lg:block">
               {/* Decorative elements behind image */}
               <div className="absolute right-12 bottom-12 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full"></div>
               
               <motion.img 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  src="/cs-agent.png" 
                  alt="Customer Success Agent" 
                  className="absolute bottom-0 right-10 w-auto h-[110%] object-contain object-bottom drop-shadow-2xl"
                  style={{ maxHeight: 'calc(100% + 40px)' }}
               />
               
               {/* Floating Badge */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.6, delay: 0.6 }}
                 className="absolute top-1/4 right-1/2 translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-4"
               >
                 <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                 <div className="text-white">
                   <div className="text-sm font-bold">Tim CS Kami Online</div>
                   <div className="text-xs text-slate-300">Siap membantu Anda</div>
                 </div>
               </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
