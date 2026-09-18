"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, Trash2, Receipt } from "lucide-react";
import { createInvoiceAction } from "@/app/[tenantSlug]/dashboard/finance/actions";
import { Student } from "@prisma/client";
import { CustomSelect } from "@/components/ui/custom-select";

export function AddInvoiceModal({ students }: { students: Student[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Dynamic items state
  const [items, setItems] = useState([{ id: 1, description: "", amount: "" }]);

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

  const totalAmount = items.reduce((acc, curr) => {
    const num = parseInt(curr.amount.replace(/[^0-9]/g, ""), 10) || 0;
    return acc + num;
  }, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await createInvoiceAction(formData);

    if (result?.error) {
      setErrorMsg(result.error);
    } else if (result?.success) {
      setIsOpen(false);
      setItems([{ id: Date.now(), description: "", amount: "" }]); // reset
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

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{formatRupiah(totalAmount)}</span>
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
                  disabled={isLoading || totalAmount === 0}
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
