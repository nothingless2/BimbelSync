"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { createAcademyAction } from "@/app/superadmin/(dashboard)/actions";

type Plan = { id: string; name: string; price: number };

export function AddAcademyModal({ plans }: { plans: Plan[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [slugPreview, setSlugPreview] = useState("");
  const [status, setStatus] = useState("TRIAL");

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
                <select name="plan_id" required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="">-- Pilih Paket --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(plan.price)}/bln
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status Awal</label>
                  <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jatuh Tempo <span className="text-slate-400 font-normal">(opsional)</span></label>
                  <input type="date" name="subscription_due_date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>

              {status === "ACTIVE" && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Pengaturan Tagihan Awal (Invoice Pertama)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm text-emerald-700 dark:text-emerald-500">Durasi (Bulan)</label>
                      <input type="number" name="duration_months" defaultValue="1" min="1" className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                  </div>
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
