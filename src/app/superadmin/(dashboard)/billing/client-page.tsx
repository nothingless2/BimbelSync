"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle, Check, Ban, ChevronDown,
  Plus, Building2, Loader2, AlertCircle, X, Trash2, Search, Filter, Eye
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";
import { verifyInvoiceAction, markOverdueAction, voidInvoiceAction, createInvoiceAction, deleteInvoiceAction } from "./actions";
import { Pagination } from "@/components/ui/pagination";

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { label: string; class: string }> = {
  PAID:    { label: "Lunas",       class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  UNPAID:  { label: "Belum Bayar", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  OVERDUE: { label: "Terlambat",   class: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
  VOID:    { label: "Void",        class: "bg-slate-100 dark:bg-slate-700 text-slate-500" },
};

function ActionMenu({ invoice }: { invoice: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hitung posisi fixed saat dropdown dibuka
  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
  };

  // Tutup saat klik di luar (cek btn + dropdown)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Tutup saat scroll
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  // Eksekusi aksi setelah dikonfirmasi
  const execute = async (action: "verify" | "overdue" | "void" | "delete") => {
    setLoading(true);
    setOpen(false);
    let res;
    if (action === "verify") res = await verifyInvoiceAction(invoice.id);
    else if (action === "overdue") res = await markOverdueAction(invoice.id);
    else if (action === "void") res = await voidInvoiceAction(invoice.id);
    else res = await deleteInvoiceAction(invoice.id);

    if (res.error) toast.error(res.error);
    else toast.success(
      action === "verify" ? "Invoice berhasil ditandai Lunas." :
      action === "overdue" ? "Invoice ditandai Terlambat." :
      action === "void" ? "Invoice berhasil di-void." :
      "Invoice berhasil dihapus."
    );
    setLoading(false);
  };

  const handle = (action: "verify" | "overdue" | "void" | "delete") => {
    setOpen(false);

    // Aksi yang butuh konfirmasi
    if (action === "delete" || action === "void") {
      const isDelete = action === "delete";
      toast(
        isDelete ? "Hapus invoice ini?" : "Void invoice ini?",
        {
          description: isDelete
            ? "Invoice akan dihapus permanen dan tidak bisa dikembalikan."
            : "Invoice akan ditandai void. Pastikan ini benar sebelum melanjutkan.",
          duration: 8000,
          action: {
            label: isDelete ? "Ya, Hapus" : "Ya, Void",
            onClick: () => execute(action),
          },
          cancel: {
            label: "Batal",
            onClick: () => {},
          },
        }
      );
      return;
    }

    // Aksi lain langsung dijalankan
    execute(action);
  };

  const canVerify = invoice.payment_status !== "PAID" && invoice.payment_status !== "VOID";
  const canOverdue = invoice.payment_status === "UNPAID";
  const canVoid    = invoice.payment_status !== "PAID" && invoice.payment_status !== "VOID";
  const canDelete  = invoice.payment_status !== "PAID";

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <><span>Aksi</span><ChevronDown size={11} /></>}
      </button>

      {/* Fixed-position dropdown — tidak terhalang overflow tabel */}
      {open && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          {canVerify && (
            <button onClick={() => handle("verify")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-left">
              <Check size={15} /> Tandai Lunas
            </button>
          )}
          {canOverdue && (
            <button onClick={() => handle("overdue")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition text-left">
              <AlertCircle size={15} /> Tandai Overdue
            </button>
          )}
          {canVoid && (
            <button onClick={() => handle("void")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition text-left">
              <Ban size={15} /> Void Invoice
            </button>
          )}
          {canDelete && (
            <button onClick={() => handle("delete")} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left ${(canVerify || canOverdue || canVoid) ? "border-t border-slate-100 dark:border-slate-800" : ""}`}>
              <Trash2 size={15} /> Hapus Invoice
            </button>
          )}
          {!canVerify && !canOverdue && !canVoid && !canDelete && (
            <div className="px-4 py-3 text-xs text-slate-400 italic">Tidak ada aksi tersedia.</div>
          )}
        </div>
      )}
    </>
  );
}



interface InvoiceItem {
  id: string;
  academy: { id: string; name: string; path_url: string; plan: { id: string; name: string; price: number } };
  billing_period: string;
  amount: number;
  duration_months: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  verified_by: { name: string | null; email: string } | null;
  proof_of_payment_url: string | null;
}

interface Props {
  invoices: InvoiceItem[];
  academies: { id: string; name: string; subscription_due_date: string | null; plan: { id: string; name: string; price: number } }[];
}

export default function BillingClientPage({ invoices, academies }: Props) {
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ academyId: "", billingPeriod: "", dueDate: "", amount: "", durationMonths: "1" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID" | "OVERDUE" | "VOID">("ALL");

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch = invoice.academy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        invoice.academy.path_url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "ALL" || invoice.payment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const currentData = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalUnpaid = invoices.filter(i => i.payment_status === "UNPAID").length;
  const totalPaid = invoices.filter(i => i.payment_status === "PAID").length;
  const totalOverdue = invoices.filter(i => i.payment_status === "OVERDUE").length;
  const totalRevenue = invoices.filter(i => i.payment_status === "PAID").reduce((sum, i) => sum + i.amount, 0);

  const selectedAcademy = academies.find(a => a.id === form.academyId);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.academyId || !form.billingPeriod || !form.dueDate || !form.amount) return;
    setIsSubmitting(true);

    const res = await createInvoiceAction(
      form.academyId,
      selectedAcademy!.plan.id,
      parseInt(form.amount),
      form.billingPeriod,
      form.dueDate,
      parseInt(form.durationMonths) || 1
    );

    if (res.error) toast.error(res.error);
    else {
      toast.success("Invoice berhasil dibuat!");
      setCreateModal(false);
      setForm({ academyId: "", billingPeriod: "", dueDate: "", amount: "", durationMonths: "1" });
    }
    setIsSubmitting(false);
  };

  const exportToCSV = () => {
    // Header CSV
    let csv = "Invoice ID,Akademi,Paket,Periode Billing,Jatuh Tempo,Durasi (Bulan),Nominal (Rp),Status,Tanggal Dibayar\n";
    
    invoices.forEach(inv => {
      const academy = `"${inv.academy.name}"`;
      const plan = `"${inv.academy.plan.name}"`;
      const period = `"${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(inv.billing_period))}"`;
      const due = `"${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(inv.due_date))}"`;
      const amount = inv.amount;
      const duration = inv.duration_months;
      const status = `"${inv.payment_status}"`;
      const paid = inv.paid_at ? `"${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(inv.paid_at))}"` : `"-"`;
      
      csv += `${inv.id},${academy},${plan},${period},${due},${duration},${amount},${status},${paid}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Pendapatan_BimbelSync_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Billing</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tagihan langganan bulanan dari seluruh akademi ke BimbelSync.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition"
          >
            Export Laporan
          </button>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-sm shadow-blue-500/20"
          >
            <Plus size={16} /> Buat Invoice Baru
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider">TOTAL REVENUE</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{IDR(totalRevenue)}</h3>
          <p className="text-xs text-emerald-600 mt-1.5">dari tagihan lunas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider">LUNAS</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalPaid}</h3>
          <p className="text-xs text-slate-500 mt-1.5">tagihan terbayar</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider">BELUM BAYAR</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalUnpaid}</h3>
          <p className="text-xs text-amber-600 mt-1.5">menunggu pembayaran</p>
        </div>
        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm ${totalOverdue > 0 ? "border-2 border-red-200 dark:border-red-900/50" : "border border-slate-200 dark:border-slate-800"}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider">TERLAMBAT</span>
            <AlertTriangle size={16} className={totalOverdue > 0 ? "text-red-500" : "text-slate-400"} />
          </div>
          <h3 className={`text-3xl font-bold ${totalOverdue > 0 ? "text-red-600 dark:text-red-500" : "text-slate-800 dark:text-white"}`}>{totalOverdue}</h3>
          <p className={`text-xs mt-1.5 ${totalOverdue > 0 ? "text-red-500" : "text-slate-500"}`}>{totalOverdue > 0 ? "Requires action" : "Semua normal"}</p>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau URL akademi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          
          <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shrink-0 overflow-hidden">
            <button 
              onClick={() => { setFilterStatus("ALL"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "ALL" ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => { setFilterStatus("UNPAID"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "UNPAID" ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Belum Bayar
            </button>
            <button 
              onClick={() => { setFilterStatus("PAID"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "PAID" ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Lunas
            </button>
            <button 
              onClick={() => { setFilterStatus("OVERDUE"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "OVERDUE" ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Terlambat
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 w-16">No.</th>
                <th className="px-6 py-4">Akademi</th>
                <th className="px-6 py-4">Paket</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4">Tgl Lunas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Diverifikasi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Belum ada tagihan platform.
                  </td>
                </tr>
              ) : currentData.map((invoice, index) => {
                const status = statusConfig[invoice.payment_status];
                const isOverdue = invoice.payment_status === "OVERDUE";
                return (
                  <tr key={invoice.id} className={`transition-colors ${isOverdue ? "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/80" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{invoice.academy.name}</p>
                      <p className="text-xs text-slate-500 font-mono">/{invoice.academy.path_url}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded">
                        {invoice.academy.plan.name.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(invoice.billing_period))}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {IDR(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.due_date))}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {invoice.paid_at ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.paid_at)) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
                        {status.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {invoice.verified_by ? (
                        <span className="font-medium">{invoice.verified_by.name || invoice.verified_by.email}</span>
                      ) : (
                        <span className="italic text-slate-300 dark:text-slate-600">–</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.proof_of_payment_url && (
                          <button
                            onClick={() => window.open(invoice.proof_of_payment_url!, '_blank')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                            title="Lihat Bukti Bayar"
                          >
                            <Eye size={14} /> <span className="hidden xl:inline">Bukti</span>
                          </button>
                        )}
                        <ActionMenu invoice={invoice} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredInvoices.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {/* Create Invoice Modal */}
      {createModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Buat Invoice Baru</h2>
              <button onClick={() => setCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Akademi</label>
                <div className="relative">
                  <CustomSelect
                    value={form.academyId}
                    onChange={(value) => {
                      const acad = academies.find(a => a.id === value);
                      let autoDueDate = "";
                      let autoBillingPeriod = "";
                      
                      if (acad && acad.subscription_due_date) {
                        const dateObj = new Date(acad.subscription_due_date);
                        autoDueDate = dateObj.toISOString().split("T")[0];
                        autoBillingPeriod = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
                      } else {
                        const today = new Date();
                        autoBillingPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
                      }
                      
                      setForm({ 
                        ...form, 
                        academyId: value, 
                        amount: acad ? (acad.plan.price * (parseInt(form.durationMonths) || 1)).toString() : "",
                        dueDate: autoDueDate,
                        billingPeriod: autoBillingPeriod
                      });
                    }}
                    placeholder="Pilih Tenant..."
                    options={academies.map(a => ({
                      value: a.id,
                      label: a.name
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Periode Billing</label>
                  <input type="month" required value={form.billingPeriod.slice(0, 7)} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value + "-01" })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Jatuh Tempo</label>
                  <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
                <input type="number" required min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder={selectedAcademy ? `Default: ${IDR(selectedAcademy.plan.price)}` : "0"}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
                {selectedAcademy && <p className="text-xs text-slate-400">Harga paket {selectedAcademy.plan.name}: {IDR(selectedAcademy.plan.price)}/bulan</p>}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Durasi Langganan (Bulan)</label>
                <p className="text-[11px] text-slate-500 mb-3">Tentukan berapa bulan akses yang akan diberikan jika tagihan ini dilunasi.</p>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.durationMonths}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value) || 1;
                    const acad = academies.find(a => a.id === form.academyId);
                    setForm({ 
                      ...form, 
                      durationMonths: e.target.value,
                      amount: acad ? (acad.plan.price * newDuration).toString() : form.amount
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Membuat...</> : "Buat Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
