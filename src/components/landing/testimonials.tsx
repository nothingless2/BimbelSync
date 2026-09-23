'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    body: 'Dulu admin saya habiskan setengah hari hanya untuk rekap absensi dan kirim tagihan satu-satu via chat. Sekarang semuanya otomatis. Saya bisa fokus mengembangkan kurikulum.',
    name: 'Budi Santoso',
    title: 'Pemilik Bimbel EduCerdas, Bandung',
  },
  {
    body: 'Yang paling terasa dampaknya itu fitur pengingat tagihan otomatis. Dulu banyak orang tua yang "lupa" bayar, sekarang 90% bayar sebelum jatuh tempo.',
    name: 'Siti Rahmawati',
    title: 'Manajer Operasional, PintarBangsa',
  },
  {
    body: 'Saya punya 4 tutor yang jadwalnya sering bentrok. Sejak pakai BimbelSync, tidak pernah lagi ada double-booking. Siswa dan tutor sama-sama senang.',
    name: 'Andi Wijaya',
    title: 'Koordinator Akademik, JuaraAcademy',
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-sm">
            Testimoni
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cerita nyata dari pengelola bimbel
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-slate-700 leading-relaxed flex-1 mb-6">
                &ldquo;{t.body}&rdquo;
              </p>

              <footer className="border-t border-slate-200 pt-5">
                <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                <div className="text-slate-500 text-sm">{t.title}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
