'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp, ShieldCheck } from 'lucide-react';

const items = [
  {
    icon: Clock,
    value: '15 jam',
    caption: 'per minggu',
    label: 'Waktu admin yang dihemat',
    body: 'Rekap absensi, penagihan, dan penjadwalan yang biasanya memakan separuh hari kerja — selesai dalam hitungan menit.',
  },
  {
    icon: TrendingUp,
    value: '3×',
    caption: 'lebih cepat',
    label: 'Siklus tagihan ke pembayaran',
    body: 'Invoice otomatis + pengingat via email = orang tua bayar tepat waktu. Kas bimbel Anda lebih sehat.',
  },
  {
    icon: ShieldCheck,
    value: '0',
    caption: 'data hilang',
    label: 'Backup otomatis setiap hari',
    body: 'Data tersimpan di server cloud terenkripsi. Tidak ada lagi risiko file Excel corrupt atau laptop rusak.',
  },
];

export function Metrics() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">Kenapa BimbelSync?</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bimbel Anda punya masalah operasional.<br className="hidden sm:block" />
            Kami punya solusinya.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="bg-white p-8 md:p-10 flex flex-col"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-slate-700" />
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{item.value}</span>
                  <span className="text-sm font-medium text-slate-500">{item.caption}</span>
                </div>

                <p className="text-sm font-semibold text-slate-800 mb-3">{item.label}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{item.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
