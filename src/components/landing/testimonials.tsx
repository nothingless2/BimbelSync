'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      content: "Sejak pakai BimbelSync, admin kami hemat waktu 15 jam seminggu dari urusan rekap absen dan pembayaran manual. Sangat direkomendasikan!",
      author: "Budi Santoso",
      role: "Pemilik, EduCerdas",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
    },
    {
      content: "Fitur tagihan otomatisnya luar biasa. Orang tua siswa jadi jarang terlambat bayar karena notifikasi yang dikirim otomatis. Sangat membantu cash flow.",
      author: "Siti Rahmawati",
      role: "Manajer, PintarBangsa",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
    },
    {
      content: "Sebelumnya kami kewalahan atur jadwal tutor yang sering bentrok. Dengan BimbelSync, jadwal jadi rapi dan tutor bisa cek langsung dari HP mereka.",
      author: "Andi Wijaya",
      role: "Akademik, JuaraAcademy",
      avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Dipercaya oleh Pengelola Bimbel</h2>
          <p className="text-lg text-slate-300">Dengarkan apa kata mereka yang telah beralih ke cara manajemen yang lebih modern.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testi, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl relative"
            >
              <Quote className="w-10 h-10 text-blue-400 mb-6 opacity-50" />
              <p className="text-white text-lg leading-relaxed mb-8 relative z-10">
                "{testi.content}"
              </p>
              <div className="flex items-center gap-4">
                <img src={testi.avatar} alt={testi.author} className="w-12 h-12 rounded-full border-2 border-slate-500" />
                <div>
                  <h4 className="text-white font-bold">{testi.author}</h4>
                  <p className="text-slate-400 text-sm">{testi.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
