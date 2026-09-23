'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Apakah sistem ini aman untuk data siswa saya?",
      answer: "Tentu. Keamanan data adalah prioritas utama kami. Data Anda disimpan di server cloud dengan enkripsi tingkat tinggi. Kami juga rutin melakukan backup otomatis sehingga data tidak akan hilang."
    },
    {
      question: "Berapa lama proses migrasi data dari Excel ke BimbelSync?",
      answer: "Sangat cepat! Kami menyediakan fitur import massal menggunakan file Excel (.csv). Anda bisa mengunggah ratusan data siswa dan staf hanya dalam hitungan detik."
    },
    {
      question: "Apakah saya perlu menginstal aplikasi di komputer?",
      answer: "Tidak perlu. BimbelSync berbasis cloud (web-based), yang berarti Anda bisa mengaksesnya darimana saja menggunakan browser (Chrome, Safari, Firefox) baik di laptop, tablet, maupun smartphone."
    },
    {
      question: "Bagaimana sistem pembayaran untuk biaya langganan paketnya?",
      answer: "Kami menerima berbagai metode pembayaran termasuk transfer bank (Virtual Account), e-Wallet, dan kartu kredit. Pembayaran akan terverifikasi secara otomatis."
    },
    {
      question: "Apakah ada batasan jumlah staf yang bisa saya tambahkan?",
      answer: "Batasan staf bergantung pada paket yang Anda pilih. Paket Starter memiliki kuota yang cukup untuk bimbel rintisan, sedangkan paket Growth dan Premium memungkinkan Anda menambah jauh lebih banyak staf."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-lg text-slate-600">Temukan jawaban cepat untuk pertanyaan umum mengenai BimbelSync.</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${openIndex === index ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
              >
                <span className={`font-semibold text-lg ${openIndex === index ? 'text-blue-700' : 'text-slate-800'}`}>
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180 text-blue-600' : 'text-slate-400'}`} 
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-blue-100/50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
