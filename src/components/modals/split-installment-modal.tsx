"use client";

import { useState } from "react";
import { Invoice } from "@prisma/client";
import { X, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { splitInstallmentsAction } from "@/app/[tenantSlug]/dashboard/finance/actions";
import { useRouter } from "next/navigation";

export function SplitInstallmentModal({
  invoice,
  isOpen,
  onClose
}: {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Default: dibagi 2
  const [installments, setInstallments] = useState([
    { amount: Math.floor(invoice.total_amount / 2), due_date: "" },
    { amount: Math.ceil(invoice.total_amount / 2), due_date: "" }
  ]);

  if (!isOpen) return null;

  const totalAssigned = installments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remaining = invoice.total_amount - totalAssigned;

  const handleAdd = () => {
    setInstallments([...installments, { amount: remaining > 0 ? remaining : 0, due_date: "" }]);
  };

  const handleRemove = (idx: number) => {
    const newInst = [...installments];
    newInst.splice(idx, 1);
    setInstallments(newInst);
  };

  const handleUpdate = (idx: number, field: "amount" | "due_date", val: string) => {
    const newInst = [...installments];
    if (field === "amount") {
      const num = parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
      newInst[idx].amount = num;
    } else {
      newInst[idx].due_date = val;
    }
    setInstallments(newInst);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remaining !== 0) {
      toast.error("Total cicilan harus sama persis dengan total tagihan.");
      return;
    }
    if (installments.some(i => !i.due_date)) {
      toast.error("Semua tanggal jatuh tempo harus diisi.");
      return;
    }

    setIsSubmitting(true);
    const result = await splitInstallmentsAction(invoice.id, installments);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Berhasil memecah tagihan menjadi cicilan!");
      onClose();
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ubah ke Cicilan</h2>
            <p className="text-sm text-slate-500">Maks. {formatRupiah(invoice.total_amount)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {installments.map((inst, idx) => (
              <div key={idx} className="flex gap-3 items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal Termin {idx + 1}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                      <input
                        type="text"
                        required
                        value={inst.amount === 0 ? "" : inst.amount.toLocaleString("id-ID")}
                        onChange={(e) => handleUpdate(idx, "amount", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Jatuh Tempo</label>
                    <input
                      type="date"
                      required
                      value={inst.due_date}
                      onChange={(e) => handleUpdate(idx, "due_date", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                {installments.length > 2 && (
                  <button type="button" onClick={() => handleRemove(idx)} className="p-2 mt-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAdd}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-sm font-semibold"
          >
            <Plus size={16} /> Tambah Termin
          </button>

          <div className={`mt-6 p-4 rounded-xl flex items-center justify-between text-sm font-bold ${
            remaining === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>Sisa Belum Dialokasikan:</span>
            <span>{formatRupiah(remaining)}</span>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || remaining !== 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Simpan Cicilan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
