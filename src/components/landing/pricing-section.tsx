"use client";

import { useState } from "react";
import { CheckCircle2, X, Check } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  max_students: number | null;
  max_staff: number | null;
  max_rooms: number | null;
  allows_payment_gateway: boolean;
  allows_installment: boolean;
  allows_automated_email: boolean;
  allows_qr_attendance: boolean;
  allows_erapor: boolean;
  allows_audit_trail: boolean;
  discount_6_months: number;
  discount_12_months: number;
  additional_features: string[];
}

export function PricingSection({ plans }: { plans: Plan[] }) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester" | "yearly">("monthly");
  
  // Replace with actual WA URL
  const WA_URL = "https://wa.me/6281234567890?text=Halo%20tim%20BimbelSync,%20saya%20ingin%20mencoba%20gratis%20aplikasi%20ini.";

  return (
    <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block bg-white border border-slate-200 text-slate-600 rounded-full px-4 py-1.5 text-xs font-semibold mb-4 tracking-wide shadow-sm">
          Harga
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Pilih paket sesuai skala bimbel Anda</h2>
        <p className="text-slate-500 leading-relaxed mb-8">Tanpa biaya tersembunyi. Upgrade atau downgrade kapan saja.</p>
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200 relative">
            <button 
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "monthly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setBillingCycle("semester")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "semester" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Semester (6 Bulan) <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">HEMAT 10%</span>
            </button>
            <button 
              onClick={() => setBillingCycle("yearly")}
              className={`hidden sm:inline-block px-5 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === "yearly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              Tahunan <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">HEMAT 2 BULAN</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">Kas bimbel sedang ketat? Tersedia opsi bayar per-semester untuk menyesuaikan arus kas Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.length === 0 ? (
          <div className="col-span-3 text-center text-slate-500 py-10">
            Belum ada paket tersedia saat ini. Silakan hubungi tim sales.
          </div>
        ) : plans.map((plan, index) => {
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
            displayPrice = Math.round(plan.price * 6 * (1 - (plan.discount_6_months || 0) / 100));
            billingSuffix = "/6 bulan";
          } else if (billingCycle === "yearly") {
            displayPrice = Math.round(plan.price * 12 * (1 - (plan.discount_12_months || 0) / 100));
            billingSuffix = "/tahun";
          }

          const formattedPrice = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
            .format(displayPrice)
            .replace(",00", "");

          return (
            <div key={plan.id} className={`bg-white rounded-3xl p-8 flex flex-col ${isPopular ? "border-2 border-blue-600 shadow-xl relative transform md:-translate-y-4 z-10" : "border border-slate-200 shadow-sm"}`}>
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Paling Populer
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{angle}</p>
              
              <div className="mb-6">
                {isPro ? (
                  <span className="text-3xl font-extrabold text-slate-900">Custom</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formattedPrice}
                    </span>
                    <span className="text-slate-500">{billingSuffix}</span>
                    {billingCycle !== "monthly" && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        Setara {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(displayPrice / (billingCycle === 'semester' ? 6 : 12))).replace(",00", "")}/bln
                      </p>
                    )}
                  </>
                )}
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                  Maks {plan.max_students === null ? "Unlimited" : plan.max_students} Siswa
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700 font-medium pb-2 border-b border-slate-100">
                  <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> 
                  Maks {plan.max_staff === null ? "Unlimited" : plan.max_staff} Staff & {plan.max_rooms === null ? "Unlimited" : plan.max_rooms} Ruang
                </li>
                
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  {plan.allows_automated_email ? <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> : <X className="w-5 h-5 text-slate-300"/>}
                  <span className={plan.allows_automated_email ? (isPopular ? "font-bold text-slate-900" : "") : "text-slate-400 opacity-60"}>
                    Email & Pengingat Otomatis
                  </span>
                </li>

                <li className="flex items-center gap-3 text-sm text-slate-700">
                  {plan.allows_qr_attendance ? <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> : <X className="w-5 h-5 text-slate-300"/>}
                  <span className={plan.allows_qr_attendance ? (isPopular ? "font-bold text-slate-900" : "") : "text-slate-400 opacity-60"}>
                    Absensi QR Dinamis
                  </span>
                </li>

                <li className="flex items-center gap-3 text-sm text-slate-700">
                  {plan.allows_erapor ? <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/> : <X className="w-5 h-5 text-slate-300"/>}
                  <span className={plan.allows_erapor ? "" : "text-slate-400 opacity-60"}>
                    E-Rapor & Evaluasi Siswa
                  </span>
                </li>

                <li className="flex items-center gap-3 text-sm text-slate-700">
                  {plan.allows_installment ? <CheckCircle2 className={`w-5 h-5 ${isPro ? "text-green-500 font-bold" : "text-green-500"}`}/> : <X className="w-5 h-5 text-slate-300"/>}
                  <span className={plan.allows_installment ? (isPro ? "font-bold text-slate-900" : "") : "text-slate-400 opacity-60"}>
                    Sistem Tagihan Cicilan
                  </span>
                </li>

                <li className="flex items-center gap-3 text-sm text-slate-700">
                  {plan.allows_audit_trail ? <CheckCircle2 className={`w-5 h-5 text-green-500`}/> : <X className="w-5 h-5 text-slate-300"/>}
                  <span className={plan.allows_audit_trail ? "font-bold text-slate-900" : "text-slate-400 opacity-60"}>
                    Audit Trail Keamanan
                  </span>
                </li>

                {plan.additional_features && plan.additional_features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <CheckCircle2 className={`w-5 h-5 ${isPopular ? "text-blue-600" : "text-green-500"}`}/>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <a href={WA_URL} target="_blank" rel="noreferrer" className={`w-full block text-center py-3.5 px-4 rounded-xl font-bold transition ${isPopular ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  {isPro ? "Hubungi Sales" : "Coba Gratis 14 Hari"}
                </a>
                {!isPro && !isPopular && (
                  <p className="text-center text-xs text-slate-400 font-medium">Tanpa kartu kredit.</p>
                )}
                {isPopular && (
                  <p className="text-center text-xs text-blue-600/70 font-medium">Akses semua fitur Growth.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Comparison Table */}
      {plans.length > 0 && (
        <div className="max-w-5xl mx-auto mt-20 overflow-x-auto">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-w-full md:min-w-[700px] p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-2 md:py-6 md:px-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest w-1/4">Fitur</th>
                  {plans.map((plan, i) => (
                    <th key={plan.id} className={`py-4 px-2 md:py-6 md:px-8 text-xs md:text-sm font-bold text-center w-1/4 ${i === 1 || plan.name.toLowerCase().includes('growth') ? "text-blue-600" : "text-slate-700"}`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-600 text-xs md:text-sm font-medium">
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Siswa</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_students === null ? '∞' : p.max_students}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Staff/Tutor</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_staff === null ? '∞' : p.max_staff}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Kapasitas Ruangan</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">{p.max_rooms === null ? '∞' : p.max_rooms}</td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Email & Pengingat Otomatis</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_automated_email ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Absensi QR Dinamis</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_qr_attendance ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">E-Rapor & Evaluasi Siswa</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_erapor ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-2 md:py-5 md:px-8">Manajemen Cicilan Bertahap</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_installment ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2 md:py-5 md:px-8">Audit Trail Keamanan</td>
                  {plans.map((p) => (
                    <td key={p.id} className="py-3 px-2 md:py-5 md:px-8 text-center">
                      {p.allows_audit_trail ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
