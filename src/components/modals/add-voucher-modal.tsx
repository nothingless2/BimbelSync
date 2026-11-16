"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, Ticket, Percent, DollarSign, Calendar, Sparkles } from "lucide-react";
import { createVoucherAction, CreateVoucherInput } from "@/app/[tenantSlug]/dashboard/finance/voucher-actions";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";

interface AddVoucherModalProps {
  programs: { id: string; name: string }[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddVoucherModal({ programs, onSuccess, trigger }: AddVoucherModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [programId, setProgramId] = useState("ALL");

  const resetForm = () => {
    setCode("");
    setName("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMaxDiscount("");
    setMinPurchase("");
    setStartDate(todayStr);
    setEndDate("");
    setUsageLimit("");
    setProgramId("ALL");
    setErrorMsg(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Otomatis ubah ke huruf kapital dan ganti spasi dengan tanda minus
    const clean = e.target.value.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9_-]/g, "");
    setCode(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg("Kode voucher wajib diisi.");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Nama promo wajib diisi.");
      return;
    }

    const valNum = Number(discountValue);
    if (isNaN(valNum) || valNum <= 0) {
      setErrorMsg("Nilai diskon harus lebih besar dari 0.");
      return;
    }

    if (discountType === "PERCENTAGE" && valNum > 100) {
      setErrorMsg("Diskon persentase maksimal 100%.");
      return;
    }

    setIsLoading(true);

    const inputData: CreateVoucherInput = {
      code: code.trim(),
      name: name.trim(),
      discount_type: discountType,
      discount_value: valNum,
      max_discount: maxDiscount ? Number(maxDiscount) : null,
      min_purchase: minPurchase ? Number(minPurchase) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      program_id: programId === "ALL" ? null : programId,
    };

    const res = await createVoucherAction(inputData);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      toast.success(`Voucher promo "${code.trim()}" berhasil dibuat!`);
      resetForm();
      setIsOpen(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm"
        >
          <Plus size={16} />
          Buat Voucher Promo
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 my-auto mt-8 mb-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Ticket size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Buat Voucher Promo Baru</h2>
                  <p className="text-xs text-slate-500">Kupon diskon yang dapat diterapkan pada invoice tagihan siswa.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl flex gap-3 items-start text-xs border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Kode Voucher & Nama Promo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Kode Kupon / Voucher <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="CONTOH: UTBK-HEMAT"
                      value={code}
                      onChange={handleCodeChange}
                      required
                      maxLength={24}
                      className="w-full px-3 py-2 text-sm font-mono font-bold tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Otomatis huruf besar tanpa spasi.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nama Promo / Kampanye <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="mis: Promo Pendaftaran Awal Tahun"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Tipe Diskon & Besaran Diskon */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Skema Diskon <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                      discountType === "PERCENTAGE"
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      <Percent size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Persentase (%)</div>
                      <div className="text-[10px] text-slate-500">Potongan persen dari total</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED_AMOUNT")}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                      discountType === "FIXED_AMOUNT"
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Nominal Tetap (Rp)</div>
                      <div className="text-[10px] text-slate-500">Potongan nominal rupiah</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nilai Diskon & Maksimal Potongan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nilai Diskon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {discountType === "FIXED_AMOUNT" && (
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    )}
                    <input
                      type="number"
                      placeholder={discountType === "PERCENTAGE" ? "mis: 15" : "mis: 50000"}
                      min="1"
                      max={discountType === "PERCENTAGE" ? 100 : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      required
                      className={`w-full py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${
                        discountType === "FIXED_AMOUNT" ? "pl-9 pr-3" : "pl-3 pr-8"
                      }`}
                    />
                    {discountType === "PERCENTAGE" && (
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                    )}
                  </div>
                </div>

                {discountType === "PERCENTAGE" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Maksimal Diskon (Opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        placeholder="mis: 100000 (Kosong = tanpa batas)"
                        min="0"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Minimal Pembelian (Opsional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        placeholder="mis: 300000 (Kosong = tanpa min.)"
                        min="0"
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {discountType === "PERCENTAGE" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Minimal Nilai Tagihan (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      placeholder="mis: 250000 (Kosong = tanpa minimal)"
                      min="0"
                      value={minPurchase}
                      onChange={(e) => setMinPurchase(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Periode Berlaku */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tanggal Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Kosongkan jika voucher berlaku selamanya.</p>
                </div>
              </div>

              {/* Batas Kuota & Target Program */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Batas Kuota Pemakaian
                  </label>
                  <input
                    type="number"
                    placeholder="mis: 50 (Kosong = tanpa batas)"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Target Program
                  </label>
                  <CustomSelect
                    value={programId}
                    onChange={(val) => setProgramId(val)}
                    placeholder="Pilih Program..."
                    options={[
                      { value: "ALL", label: "🌟 Berlaku untuk Semua Program" },
                      ...programs.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isLoading ? "Menyimpan..." : "Simpan & Terbitkan Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

