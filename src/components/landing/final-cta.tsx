'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FinalCTA() {
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-[#0A0F1C] overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center border border-slate-800">
          
          {/* Subtle noise texture & glow for the background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          
          {/* Left side: Image / Visual (Larger, Left side, Overflow Hidden by parent) */}
          <div className="w-full lg:w-1/2 relative h-[400px] lg:h-[600px] order-2 lg:order-1 flex items-end justify-center lg:justify-start">
             {/* Decorative glow behind image */}
             <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full"></div>
             
             <motion.img 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                src="/cs-agent.png" 
                alt="Customer Success Agent" 
                className="relative z-10 w-full h-[120%] lg:h-[110%] object-cover object-top lg:object-right-top"
             />
             
             {/* Floating Badge (Kept from previous design, moved to left side of image) */}
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.4 }}
               className="absolute top-1/3 left-6 lg:left-12 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-4 z-20"
             >
               <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
               <div className="text-white">
                 <div className="text-sm font-bold">Tim CS Kami Online</div>
                 <div className="text-xs text-slate-300">Siap membantu Anda</div>
               </div>
             </motion.div>
          </div>

          {/* Right side: Text Content (Order 1 on mobile so text is above image, Order 2 on desktop) */}
          <div className="w-full lg:w-1/2 px-8 py-16 sm:px-12 lg:px-16 lg:py-24 order-1 lg:order-2 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold mb-8 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                KONSULTASI GRATIS
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-[1.15]">
                Siap Bawa Bimbel Anda <br/> <span className="text-blue-500">Naik Kelas?</span>
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
                  Pelajari Fitur <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
