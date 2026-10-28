"use client";

import { useState } from "react";
import { CheckCircle2, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  price: number;
  max_students: number | null;
  max_staff: number | null;
  max_rooms: number | null;
  allows_installment: boolean;
  allows_automated_email: boolean;
  allows_qr_attendance: boolean;
  allows_erapor: boolean;
  allows_audit_trail: boolean;
  discount_6_months: number;
  discount_12_months: number;
  additional_features: string[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    price: 99000,
    max_students: 50,
    max_staff: 3,
    max_rooms: 3,
    allows_installment: false,
    allows_automated_email: false,
    allows_qr_attendance: false,
    allows_erapor: false,
    allows_audit_trail: false,
    discount_6_months: 10,
    discount_12_months: 17,
    additional_features: [
      "Jadwal Kelas & Kalender",
      "Portal Siswa",
      "Cetak Rekap Laporan PDF",
      "Materi Belajar (Maks. 15 Modul)",
    ],
  },
  {
    id: "plan-growth",
    name: "Growth",
    price: 199000,
    max_students: 200,
    max_staff: 10,
    max_rooms: 6,
    allows_installment: true,
    allows_automated_email: true,
    allows_qr_attendance: true,
    allows_erapor: false,
    allows_audit_trail: false,
    discount_6_months: 10,
    discount_12_months: 17,
    additional_features: [
      "Jadwal Kelas & Kalender",
      "Portal Siswa",
      "Cetak Rekap Laporan PDF",
      "Materi Belajar (Maks. 50 Modul)",
    ],
  },
  {
    id: "plan-pro",
    name: "Pro",
    price: 399000,
    max_students: 500,
    max_staff: 25,
    max_rooms: 15,
    allows_installment: true,
    allows_automated_email: true,
    allows_qr_attendance: true,
    allows_erapor: true,
    allows_audit_trail: true,
    discount_6_months: 10,
    discount_12_months: 17,
    additional_features: [
      "Jadwal Kelas & Kalender",
      "Portal Siswa",
      "Cetak Rekap Laporan PDF",
      "Materi Belajar (Unlimited Modul)",
      "Prioritas Dukungan Teknis",
    ],
  },
];

export function PricingSection({ plans }: { plans: Plan[] }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester" | "yearly">("monthly");
  
  const rawPlans = plans && plans.length > 0 ? plans : DEFAULT_PLANS;
  
  // Sanitasi kontrak kuota dan fitur kanonikal (mencegah duplikasi visual)
  const displayPlans = rawPlans.map((p) => {
    const name = p.name.trim().toLowerCase();
    const isPro = name === "pro";
    const isGrowth = name === "growth";
    const isStarter = name === "starter";

    const defaultFeatures = isStarter
      ? [
          "Jadwal Kelas & Kalender",
          "Portal Siswa",
          "Cetak Rekap Laporan PDF",
          "Materi Belajar (Maks. 15 Modul)",
        ]
      : isGrowth
      ? [
          "Jadwal Kelas & Kalender",
          "Portal Siswa",
          "Cetak Rekap Laporan PDF",
          "Materi Belajar (Maks. 50 Modul)",
        ]
      : [
          "Jadwal Kelas & Kalender",
          "Portal Siswa",
          "Cetak Rekap Laporan PDF",
          "Materi Belajar (Unlimited Modul)",
          "Prioritas Dukungan Teknis",
        ];

    // Filter fitur dari additional_features yang bentrok/duplikat dengan toggleableFeatures
    const rawList = p.additional_features && p.additional_features.length > 0 ? p.additional_features : defaultFeatures;
    const sanitizedAdditional = rawList.filter((feat) => {
      const lower = feat.toLowerCase();
      return (
        !lower.includes("absensi qr") &&
        !lower.includes("e-rapor") &&
        !lower.includes("cicilan") &&
        !lower.includes("audit trail") &&
        !lower.includes("email") &&
        !lower.includes("honor") &&
        !lower.includes("payroll")
      );
    });

    return {
      ...p,
      max_students: p.max_students ?? (isPro ? 500 : p.max_students),
      max_staff: p.max_staff ?? (isPro ? 25 : p.max_staff),
      max_rooms: p.max_rooms ?? (isPro ? 15 : isStarter ? 3 : p.max_rooms),
      allows_installment: isGrowth || isPro ? true : p.allows_installment,
      allows_erapor: isPro ? true : false,
      additional_features: sanitizedAdditional,
    };
  });
  
  // Replace with actual WA URL
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20berlangganan%20paket%20BimbelSync.";

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-sm">
          Harga Terjangkau
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Pilih paket sesuai skala bimbel Anda</h2>
        <p className="text-slate-500 leading-relaxed mb-8">Investasi cerdas mulai dari seharga 1 SPP siswa. Upgrade atau downgrade kapan saja.</p>
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex flex-row justify-center bg-slate-100 p-1 rounded-full border border-slate-200 relative w-fit mx-auto max-w-full overflow-x-auto md:overflow-visible">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${billingCycle === "monthly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setBillingCycle("semester")}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${billingCycle === "semester" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Semester <span className="hidden sm:inline">(6 Bulan)</span> <span className="hidden sm:inline-block ml-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">HEMAT 10%</span>
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${billingCycle === "yearly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Tahunan <span className="hidden sm:inline-block ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">HEMAT 2 BULAN</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">Kas bimbel sedang ketat? Tersedia opsi bayar per-semester untuk menyesuaikan arus kas Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-sm lg:max-w-5xl mx-auto">
        {displayPlans.map((plan, index) => {
          const isStarter = plan.name.toLowerCase().includes('starter');
          const isGrowth = plan.name.toLowerCase().includes('growth');
          const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium');
          const isPopular = isGrowth || index === 1;

          let angle = "Sempurna untuk skala bisnis Anda.";
          if (isStarter) angle = "Langkah pertama digitalisasi bimbel Anda.";
          else if (isGrowth) angle = "Tampil lebih profesional & otomatiskan operasional.";
          else if (isPro) angle = "Skala tanpa batas, kontrol penuh, & fitur mahir.";

          let displayPrice = plan.price;
          let billingSuffix = "/bulan";
          
          if (billingCycle === "semester") {
            const rawSemesterPrice = plan.price * 6 * (1 - (plan.discount_6_months || 0) / 100);
            // Bulatkan ke ribuan genap agar tidak ada embel ratusan di belakangnya
            displayPrice = Math.floor(rawSemesterPrice / 1000) * 1000;
            billingSuffix = "/6 bulan";
          } else if (billingCycle === "yearly") {
            // Diskon tahunan: bayar 10 bulan (hemat 2 bulan) dibulatkan ke ribuan genap
            const rawYearlyPrice = plan.discount_12_months === 17
              ? plan.price * 10
              : plan.price * 12 * (1 - (plan.discount_12_months || 0) / 100);
            displayPrice = Math.round(rawYearlyPrice / 1000) * 1000;
            billingSuffix = "/tahun";
          }

          const formattedPrice = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
            .format(displayPrice)
            .replace(",00", "");

          return (
            <div key={plan.id} className={isPopular ? "relative z-10 lg:-translate-y-4" : "relative z-0"}>
              <motion.div 
                key={`${plan.id}-${billingCycle}`}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.03, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`bg-white rounded-3xl p-8 flex flex-col h-full ${isPopular ? "border-2 border-blue-600 shadow-xl" : "border border-slate-200 shadow-sm"}`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Paling Populer
                  </div>
                )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{angle}</p>
              
              <div className="mb-6 flex flex-wrap items-baseline gap-x-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {formattedPrice}
                </span>
                <span className="text-slate-500 whitespace-nowrap">{billingSuffix}</span>
                {billingCycle !== "monthly" && (
                  <div className="w-full mt-1">
                    <p className="text-xs text-emerald-600 font-semibold">
                      Setara {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
                        .format(Math.round(displayPrice / (billingCycle === 'semester' ? 6 : 12) / 1000) * 1000)
                        .replace(",00", "")}/bln
                    </p>
                  </div>
                )}
              </div>
              
              {(() => {
                const name = plan.name.trim().toLowerCase();
                const isStarter = name === "starter";
                const isGrowth = name === "growth";
                const isPro = name === "pro";

                const starterFeatures: string[] = [
                  "Jadwal Kelas & Kalender Interaktif",
                  "Portal Siswa",
                  "Cetak Rekap Laporan PDF",
                  "Materi Belajar (Maks. 15 Modul)",
                  "Presensi Manual & Pembayaran Lunas",
                ];

                const growthAdditions: string[] = [
                  "Presensi Absensi QR Dinamis di Kelas",
                  "Email & Notifikasi Tagihan Otomatis",
                  "Manajemen Cicilan Tagihan (Maks. 3 Termin)",
                  "Materi Belajar hingga 50 Modul",
                  "Kwitansi Digital & Pengingat SPP",
                ];

                const proAdditions: string[] = [
                  "Sistem E-Rapor & Evaluasi Belajar Siswa",
                  "Broadcast Pengumuman Masal via Email",
                  "Audit Trail Keamanan & Multi-Akses",
                  "Materi Belajar Bebas (Unlimited Modul)",
                  "Cicilan Tagihan Bebas (Unlimited Termin)",
                  "Prioritas Dukungan Teknis 24/7",
                ];

                const activeList: string[] = isStarter ? starterFeatures : isGrowth ? growthAdditions : proAdditions;

                return (
                  <div className="flex-1 flex flex-col justify-between mb-8">
                    <ul className="space-y-3.5">
                      {/* 1. Banner Hirarki Fitur di Paling Atas */}
                      {isStarter && (
                        <li className="pb-1">
                          <div className="w-full py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center">
                            <span>Fitur esensial operasional bimbel:</span>
                          </div>
                        </li>
                      )}

                      {isGrowth && (
                        <li className="pb-1">
                          <div className="w-full py-1.5 px-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold flex items-center">
                            <span>Termasuk semua fitur Starter, ditambah:</span>
                          </div>
                        </li>
                      )}

                      {isPro && (
                        <li className="pb-1">
                          <div className="w-full py-1.5 px-3 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center">
                            <span>Termasuk semua fitur Growth, ditambah:</span>
                          </div>
                        </li>
                      )}

                      {/* 2. Kapasitas & Limit */}
                      <li className="flex items-center gap-3 text-sm text-slate-700 font-medium pt-1">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? "text-blue-600" : "text-emerald-500"}`}/> 
                        <span>Maks. <strong>{plan.max_students ?? (isPro ? 500 : isGrowth ? 200 : 50)}</strong> Siswa</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-slate-700 font-medium pb-3 border-b border-slate-100">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${isPopular ? "text-blue-600" : "text-emerald-500"}`}/> 
                        <span>Maks. <strong>{plan.max_staff ?? (isPro ? 25 : isGrowth ? 10 : 3)}</strong> Staff & <strong>{plan.max_rooms ?? (isPro ? 15 : isGrowth ? 6 : 3)}</strong> Ruang</span>
                      </li>

                      {/* 3. Daftar Fitur Unggulan */}
                      {activeList.map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-snug">
                          <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isPopular ? "text-blue-600" : "text-emerald-500"}`}/>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
              <div className="space-y-3">
                {isPro ? (
                  <a 
                    href={WA_URL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full block text-center py-3.5 px-4 rounded-xl font-bold transition border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Konsultasi Tim Sales
                  </a>
                ) : (
                  <Link 
                    href="/register" 
                    className={`w-full block text-center py-3.5 px-4 rounded-xl font-bold transition ${isPopular ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    Coba Gratis 14 Hari
                  </Link>
                )}
                {!isPro && !isPopular && (
                  <p className="text-center text-xs text-slate-400 font-medium">Tanpa kartu kredit.</p>
                )}
                {isPopular && (
                  <p className="text-center text-xs text-blue-600/70 font-medium">Pilihan favorit bimbel berkembang.</p>
                )}
              </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Comparison Table */}
      {displayPlans.length > 0 && (
        <div className="max-w-5xl mx-auto mt-20 overflow-x-auto">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-full md:min-w-[700px] p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-2 md:py-6 md:px-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest w-1/4">Fitur</th>
                  {displayPlans.map((plan, i) => (
                    <th key={plan.id} className={`py-4 px-2 md:py-6 md:px-8 text-xs md:text-sm font-bold text-center w-1/4 ${i === 1 || plan.name.toLowerCase().includes('growth') ? "text-blue-600" : "text-slate-700"}`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-600 text-xs md:text-sm font-medium">
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Siswa</td>
                  {displayPlans.map((p) => {
                    const isPro = p.name.trim().toLowerCase() === "pro";
                    const val = p.max_students ?? (isPro ? 500 : null);
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{val === null ? '∞' : val}</td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Staff/Tutor</td>
                  {displayPlans.map((p) => {
                    const isPro = p.name.trim().toLowerCase() === "pro";
                    const val = p.max_staff ?? (isPro ? 25 : null);
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{val === null ? '∞' : val}</td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Ruangan</td>
                  {displayPlans.map((p) => {
                    const isPro = p.name.trim().toLowerCase() === "pro";
                    const val = p.max_rooms ?? (isPro ? 15 : null);
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{val === null ? '∞' : val}</td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Jadwal Kelas & Kalender</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Portal Siswa</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Cetak Laporan PDF</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Presensi QR Dinamis Layar</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_qr_attendance ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Email Tagihan & Kwitansi Otomatis</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_automated_email ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Broadcast Pengumuman Masal Email</td>
                  {displayPlans.map((p) => {
                    const isPro = p.name.trim().toLowerCase() === "pro";
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                        {isPro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">E-Rapor & Evaluasi Belajar</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_erapor ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Materi Pembelajaran Digital</td>
                  {displayPlans.map((p) => {
                    const name = p.name.trim().toLowerCase();
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center font-medium text-xs md:text-sm text-slate-700">
                        {name === "starter" ? "Maks. 15 Modul" : name === "growth" ? "Maks. 50 Modul" : "Unlimited Modul"}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Manajemen Cicilan Tagihan (Termin)</td>
                  {displayPlans.map((p) => {
                    const name = p.name.trim().toLowerCase();
                    if (name === "starter") {
                      return (
                        <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        </td>
                      );
                    }
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center font-medium text-xs md:text-sm text-slate-700">
                        {name === "growth" ? "Maks. 3 Termin" : "Unlimited"}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Audit Trail Keamanan Data</td>
                  {displayPlans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_audit_trail ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2 md:py-5 md:px-8">Prioritas Dukungan Teknis 24/7</td>
                  {displayPlans.map((p) => {
                    const isPro = p.name.trim().toLowerCase() === "pro";
                    return (
                      <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                        {isPro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
