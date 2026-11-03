"use client";

import { useState } from "react";
import { Building, X, AlertCircle, Eye, EyeOff, Plus, Check } from "lucide-react";
import { createAcademyAction } from "@/app/superadmin/(dashboard)/actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { calculatePlanPrice } from "@/lib/pricing";

type Plan = { 
  id: string; 
  name: string; 
  price: number; 
  discount_6_months?: number | null; 
  discount_12_months?: number | null; 
};

export function AddAcademyModal({ plans }: { plans: Plan[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [slugPreview, setSlugPreview] = useState("");
  const [status, setStatus] = useState("TRIAL");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [durationMonths, setDurationMonths] = useState<number>(1);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const pricing = selectedPlan ? calculatePlanPrice(selectedPlan, durationMonths) : null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSlugPreview(slug);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await createAcademyAction(formData);
    if (result?.error) {
      setErrorMsg(result.error);
    } else {
      setIsOpen(false);
      setSlugPreview("");
      setStatus("TRIAL");
      setSelectedPlanId("");
      setDurationMonths(1);
      (e.target as HTMLFormElement).reset();
    }
    setIsLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm whitespace-nowrap">
        <Plus size={16} /> Tambah Akademi Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Onboarding Akademi Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftarkan bimbel baru ke platform BimbelSync</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex gap-2 items-start text-sm border border-red-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /><p>{errorMsg}</p>
                </div>
              )}

              {/* Informasi Akademi */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Bimbel</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Bimbel</label>
                <input name="name" required onChange={handleNameChange} placeholder="Contoh: Bimbel Sukses Mandiri" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Slug URL <span className="text-slate-400 font-normal">(untuk akses: domain.com/<strong>slug</strong>/login)</span></label>
                <input name="path_url" required value={slugPreview} onChange={(e) => setSlugPreview(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="bimbel-sukses-mandiri" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono" />
                {slugPreview && (
                  <p className="text-xs text-slate-500">Preview: <span className="text-blue-600 font-medium">localhost:3000/{slugPreview}/login</span></p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Paket Berlangganan</label>
                <CustomSelect
                  name="plan_id"
                  required
                  value={selectedPlanId}
                  onChange={(val) => setSelectedPlanId(val)}
                  placeholder="-- Pilih Paket --"
                  options={plans.map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} — ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price)}/bln`
                  }))}
                />
              </div>

              {/* Pilihan Siklus Paket & Diskon */}
              {selectedPlan && (
                <div className="space-y-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Pilihan Siklus Paket & Diskon
                    </label>
                    <span className="text-xs font-medium text-slate-500">
                      Normal: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(selectedPlan.price)}/bln
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationMonths(1)}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                        durationMonths === 1
                          ? "border-blue-600 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs ring-1 ring-blue-500/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs font-semibold">1 Bulan</span>
                      <span className="text-[10px] text-slate-400">Bulanan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationMonths(6)}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center relative ${
                        durationMonths === 6
                          ? "border-blue-600 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-xs ring-1 ring-blue-500/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs font-semibold">6 Bulan</span>
                      <span className="text-[9px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full font-bold mt-0.5">
                        HEMAT 10%
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationMonths(12)}
                      className={`py-2 px-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center relative ${
                        durationMonths === 12
                          ? "border-emerald-600 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs ring-1 ring-emerald-500/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40"
                      }`}
                    >
                      <span className="text-xs font-semibold">1 Tahun</span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold mt-0.5">
                        HEMAT 2 BLN
                      </span>
                    </button>
                  </div>

                  {pricing && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Total Biaya ({pricing.label}):
                      </span>
                      <div className="text-right">
                        {pricing.savings > 0 && (
                          <span className="line-through text-slate-400 text-[11px] mr-1.5">
                            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pricing.originalAmount)}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pricing.amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Awal</label>
                  <CustomSelect
                    name="status"
                    required
                    value={status}
                    onChange={setStatus}
                    placeholder="Pilih Status..."
                    options={[
                      { value: "TRIAL", label: "Trial" },
                      { value: "ACTIVE", label: "Active" },
                      { value: "SUSPENDED", label: "Suspended" }
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jatuh Tempo <span className="text-slate-400 font-normal">(opsional)</span></label>
                  <input type="date" name="subscription_due_date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              {status === "ACTIVE" && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Pengaturan Tagihan Awal (Invoice Pertama)</p>
                    {pricing && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(pricing.amount)}
                      </span>
                    )}
                  </div>

                  <input type="hidden" name="duration_months" value={durationMonths} />

                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Durasi akses: <strong>{pricing?.label || `${durationMonths} Bulan`}</strong>. Tagihan perdana otomatis dihitung sesuai diskon paket landing page.
                  </p>

                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" name="is_paid" value="true" className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">Langsung tandai Lunas (Klien sudah transfer)</span>
                  </label>
                </div>
              )}

              {/* Akun Admin */}
              <div className="pt-2 space-y-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Akun Admin Bimbel</p>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Admin</label>
                  <input type="email" name="admin_email" required placeholder="admin@namabimbel.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Awal Admin</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="admin_password" required placeholder="Min. 8 karakter" minLength={8} className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Password ini akan diberikan ke pemilik bimbel untuk login pertama kali.</p>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
                  {isLoading ? "Mendaftarkan..." : "Daftarkan Akademi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
