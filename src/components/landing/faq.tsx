'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';

const faqs = [
  {
    q: 'Berapa lama proses migrasi data dari Excel ke BimbelSync?',
    a: 'Biasanya kurang dari 5 menit. Kami menyediakan fitur import massal via file CSV — tinggal unduh template, isi data, unggah. Ratusan data siswa dan staf langsung masuk.',
  },
  {
    q: 'Apakah saya perlu install aplikasi?',
    a: 'Tidak. BimbelSync 100% berbasis web. Cukup buka browser di laptop, tablet, atau HP — langsung bisa digunakan tanpa instalasi apapun.',
  },
  {
    q: 'Bagaimana kalau internet mati saat siswa scan QR absen?',
    a: 'QR code di-generate di sisi server. Selama perangkat yang menampilkan QR (laptop/tablet tutor) terhubung internet, siswa bisa scan. Siswa hanya butuh koneksi internet singkat saat memindai.',
  },
  {
    q: 'Apakah data siswa saya aman?',
    a: 'Ya. Data disimpan di server cloud dengan enkripsi end-to-end. Backup otomatis berjalan setiap hari. Data Anda tidak akan hilang meskipun laptop Anda rusak.',
  },
  {
    q: 'Saya baru punya 10 siswa. Apakah tetap worth it?',
    a: 'Justru saat bimbel masih kecil adalah waktu terbaik untuk membangun sistem yang rapi. Paket Starter kami dirancang khusus untuk bimbel rintisan — harganya terjangkau dan bisa di-upgrade kapan saja seiring pertumbuhan.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pertanyaan yang sering muncul
          </h2>
        </div>

        <dl className="divide-y divide-slate-200">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i}>
                <dt>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-start justify-between gap-4 py-6 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-base font-semibold leading-snug transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-900 group-hover:text-slate-700'}`}>
                      {faq.q}
                    </span>
                    <Plus
                      className={`w-5 h-5 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-45 text-blue-600' : 'text-slate-400'}`}
                    />
                  </button>
                </dt>
                <AnimatePresence>
                  {isOpen && (
                    <motion.dd
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-slate-600 leading-relaxed pr-12">
                        {faq.a}
                      </p>
                    </motion.dd>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
