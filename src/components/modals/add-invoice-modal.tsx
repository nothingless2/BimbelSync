"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, Trash2, Receipt, Ticket, CheckCircle2, Loader2 } from "lucide-react";
import { createInvoiceAction } from "@/app/[tenantSlug]/dashboard/finance/actions";
import { validateVoucherAction } from "@/app/[tenantSlug]/dashboard/finance/voucher-actions";
import { Student } from "@prisma/client";
import { CustomSelect } from "@/components/ui/custom-select";

export function AddInvoiceModal({ students }: { students: Student[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Dynamic items state
  const [items, setItems] = useState([{ id: 1, description: "", amount: "" }]);

  // Voucher state
  const [voucherInput, setVoucherInput] = useState("");
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    maxDiscount?: number | null;
  } | null>(null);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", amount: "" }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: 'description' | 'amount', value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((acc, curr) => {
    const num = parseInt(curr.amount.replace(/[^0-9]/g, ""), 10) || 0;
    return acc + num;
  }, 0);

  // Hitung diskon aktif secara dinamis terhadap subtotal terkini
  let dynamicDiscount = 0;
  if (appliedVoucher && subtotal > 0) {
    if (appliedVoucher.discountType === "PERCENTAGE") {
      dynamicDiscount = Math.round((subtotal * appliedVoucher.discountValue) / 100);
      if (appliedVoucher.maxDiscount && dynamicDiscount > appliedVoucher.maxDiscount) {
        dynamicDiscount = appliedVoucher.maxDiscount;
      }
    } else {
      dynamicDiscount = appliedVoucher.discountValue;
    }
    dynamicDiscount = Math.min(dynamicDiscount, subtotal);
  }

  const finalTotal = Math.max(0, subtotal - dynamicDiscount);

  const handleApplyVoucher = async () => {
    const cleanCode = voucherInput.trim().toUpperCase();
    if (!cleanCode) return;
    if (subtotal <= 0) {
      setVoucherError("Isi rincian item tagihan terlebih dahulu sebelum menerapkan voucher.");
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    const res = await validateVoucherAction(cleanCode, subtotal);
    setIsValidatingVoucher(false);

    if (res.error) {
      setVoucherError(res.error);
    } else if (res.success && res.voucher) {
      setAppliedVoucher({
        code: res.voucher.code,
        name: res.voucher.name,
        discountType: res.voucher.discountType,
        discountValue: res.voucher.discountValue,
        maxDiscount: res.voucher.maxDiscount,
      });
      setVoucherError(null);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherError(null);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    if (appliedVoucher) {
      formData.set("voucher_code", appliedVoucher.code);
    }

    const result = await createInvoiceAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setIsOpen(false);
      setItems([{ id: Date.now(), description: "", amount: "" }]); // reset
      setAppliedVoucher(null);
      setVoucherInput("");
      setVoucherError(null);
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm transition-colors text-sm"
      >
        <Plus size={16} />
        Buat Tagihan (Invoice)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 my-auto mt-10 mb-10">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Buat Tagihan Baru</h2>
                  <p className="text-sm text-slate-500">Tagihan akan menggunakan skema Pembayaran Penuh (FULL).</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex gap-3 items-start text-sm border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="student_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pilih Siswa</label>
                <CustomSelect
                  id="student_id"
                  name="student_id"
                  required
                  placeholder="Pilih Siswa..."
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.full_name} (@${s.username})`
                  }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Rincian Item Tagihan
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Plus size={14} /> Tambah Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          name="item_description[]"
                          placeholder="Deskripsi (mis: SPP Bulan September)"
                          required
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="w-1/3 space-y-1 relative">
                        <span className="absolute left-3 top-2 text-sm text-slate-400">Rp</span>
                        <input
                          type="number"
                          name="item_amount[]"
                          placeholder="0"
                          min="0"
                          required
                          value={item.amount}
                          onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-0.5"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Voucher Promo Section */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Ticket size={15} className="text-blue-600 dark:text-blue-400" />
                    <span>Kode Voucher Promo (Opsional)</span>
                  </div>
                  {appliedVoucher && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} /> Tersambung
                    </span>
                  )}
                </div>

                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800">
                          {appliedVoucher.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {appliedVoucher.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Potongan diskon {formatRupiah(dynamicDiscount)} berhasil diterapkan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 font-medium transition-colors"
                    >
                      Batal Gunakan
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: UTBK-HEMAT"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase().replace(/\s+/g, "-"))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyVoucher();
                          }
                        }}
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={isValidatingVoucher || !voucherInput.trim() || subtotal <= 0}
                        className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {isValidatingVoucher ? <Loader2 size={13} className="animate-spin" /> : "Gunakan"}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        {voucherError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Rincian Ringkasan & Grand Total */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                {appliedVoucher && dynamicDiscount > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>Subtotal Tagihan</span>
                      <span className="font-mono font-medium">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Potongan Diskon ({appliedVoucher.code})</span>
                      <span className="font-mono font-bold">- {formatRupiah(dynamicDiscount)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Tagihan Bersih</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{formatRupiah(finalTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grand Total</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{formatRupiah(subtotal)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || subtotal === 0}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "Menyimpan..." : "Terbitkan Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
