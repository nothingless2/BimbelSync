'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20tanya%20tentang%20layanan%20Anda.";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-slate-950 overflow-hidden">

          {/* Subtle glow — single, positioned, not over-the-top */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4" />

          <div className="grid grid-cols-1 lg:grid-cols-5 items-end relative z-10">

            {/* Text — takes 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="col-span-3 px-8 py-16 sm:px-12 sm:py-20 lg:py-24"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
                Siap kelola bimbel<br />tanpa pusing?
              </h2>
              <p className="text-base sm:text-lg text-slate-400 mb-8 max-w-md leading-relaxed">
                Konsultasi gratis dengan tim kami. Ceritakan kebutuhan bimbel Anda — kami bantu carikan solusi yang pas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 font-semibold text-sm py-3.5 px-7 rounded-xl transition-colors"
                >
                  Hubungi via WhatsApp
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 font-semibold text-sm py-3.5 px-7 rounded-xl transition-colors"
                >
                  Lihat fitur lengkap
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Image — takes 2 cols, anchored to bottom */}
            <div className="col-span-2 relative hidden lg:flex justify-center items-end min-h-[400px]">
              <motion.img
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                src="/cs-agent-transparent.png"
                alt="Tim konsultan BimbelSync"
                className="w-auto max-h-[420px] object-contain object-bottom drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
