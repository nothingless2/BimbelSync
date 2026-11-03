"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle, Check, Ban, ChevronDown,
  Plus, Building2, Loader2, AlertCircle, X, Trash2, Search, Filter, Eye,
  Landmark, Edit3
} from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";
import { 
  verifyInvoiceAction, 
  markOverdueAction, 
  voidInvoiceAction, 
  createInvoiceAction, 
  deleteInvoiceAction,
  updatePlatformBankInfoAction,
  getPlatformInvoiceProofAction
} from "./actions";
import { Pagination } from "@/components/ui/pagination";
import { ViewProofModal } from "@/components/modals/view-proof-modal";
import { calculatePlanPrice } from "@/lib/pricing";

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
  plan_name: string;
  billing_period: string;
  amount: number;
  duration_months: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  verified_by: { name: string | null; email: string } | null;
  has_proof: boolean;
  proof_of_payment_url?: string | null;
}

interface Props {
  invoices: InvoiceItem[];
  academies: { id: string; name: string; subscription_due_date: string | null; plan: { id: string; name: string; price: number } }[];
  plans: { id: string; name: string; price: number; discount_6_months?: number | null; discount_12_months?: number | null }[];
  initialBankInfo?: { bankName: string; bankAccount: string };
}

export default function BillingClientPage({ invoices, academies, plans, initialBankInfo }: Props) {
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({ academyId: "", planId: "", billingPeriod: "", dueDate: "", amount: "", durationMonths: "1" });
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bank Info state
  const [bankInfo, setBankInfo] = useState(
    initialBankInfo || { bankName: "BCA a.n PT BimbelSync Nusantara", bankAccount: "123-456-7890" }
  );
  const [bankModal, setBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: initialBankInfo?.bankName || "BCA a.n PT BimbelSync Nusantara",
    bankAccount: initialBankInfo?.bankAccount || "123-456-7890",
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.bankAccount.trim()) {
      toast.error("Nama bank dan nomor rekening wajib diisi.");
      return;
    }
    setIsSavingBank(true);
    const res = await updatePlatformBankInfoAction(bankForm.bankName, bankForm.bankAccount);
    setIsSavingBank(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Rekening transfer platform berhasil diperbarui!");
      setBankInfo({ bankName: bankForm.bankName.trim(), bankAccount: bankForm.bankAccount.trim() });
      setBankModal(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "NEED_VERIFICATION" | "UNPAID" | "PAID" | "OVERDUE" | "VOID">("ALL");
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<InvoiceItem | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isLoadingProof, setIsLoadingProof] = useState(false);
  const [isVerifyingProof, setIsVerifyingProof] = useState(false);

  const handleOpenProof = async (invoice: InvoiceItem) => {
    setSelectedProofInvoice(invoice);
    setIsLoadingProof(true);
    setProofImageUrl(null);
    const res = await getPlatformInvoiceProofAction(invoice.id);
    setIsLoadingProof(false);
    if (res.error) {
      toast.error(res.error);
      setSelectedProofInvoice(null);
    } else if (res.proof_of_payment_url) {
      setProofImageUrl(res.proof_of_payment_url);
    }
  };

  const totalNeedVerification = invoices.filter(i => i.has_proof && i.payment_status !== "PAID").length;

  const filteredInvoices = invoices.filter(invoice => {
    const matchSearch = invoice.academy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        invoice.academy.path_url.toLowerCase().includes(searchQuery.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "ALL") {
      matchStatus = true;
    } else if (filterStatus === "NEED_VERIFICATION") {
      matchStatus = !!invoice.has_proof && invoice.payment_status !== "PAID";
    } else {
      matchStatus = invoice.payment_status === filterStatus;
    }
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
  const selectedPlan = plans.find(p => p.id === form.planId) || selectedAcademy?.plan;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.academyId || !form.planId || !form.billingPeriod || !form.dueDate || !form.amount) return;
    setIsSubmitting(true);

    const res = await createInvoiceAction(
      form.academyId,
      form.planId,
      parseInt(form.amount),
      form.billingPeriod,
      form.dueDate,
      parseInt(form.durationMonths) || 1
    );

    if (res.error) toast.error(res.error);
    else {
      toast.success("Invoice berhasil dibuat!");
      setCreateModal(false);
      setForm({ academyId: "", planId: "", billingPeriod: "", dueDate: "", amount: "", durationMonths: "1" });
      setIsCustomDuration(false);
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

      {/* Rekening Tujuan Transfer Platform */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Landmark size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Rekening Tujuan Pembayaran BimbelSync</h3>
              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                Aktif di Notifikasi Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rekening ini otomatis ditampilkan pada notifikasi dashboard penyewa bimbel yang memiliki tagihan tertunda.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{bankInfo.bankName}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{bankInfo.bankAccount}</span>
          </div>
          <button
            onClick={() => {
              setBankForm({ bankName: bankInfo.bankName, bankAccount: bankInfo.bankAccount });
              setBankModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition"
          >
            <Edit3 size={13} />
            Edit Rekening
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
              onClick={() => { setFilterStatus("NEED_VERIFICATION"); setCurrentPage(1); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${filterStatus === "NEED_VERIFICATION" ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <span>Verifikasi Bukti</span>
              {totalNeedVerification > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                  {totalNeedVerification}
                </span>
              )}
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
                        {invoice.plan_name.toUpperCase()}
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
                      {invoice.has_proof && invoice.payment_status !== "PAID" ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                          <Clock size={12} />
                          Menunggu Verifikasi
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>
                          {status.label}
                        </div>
                      )}
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
                        {invoice.has_proof && (
                          <button
                            onClick={() => handleOpenProof(invoice)}
                            className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold border border-blue-200 dark:border-blue-800/60"
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

                      const targetPlan = acad ? plans.find(p => p.id === acad.plan.id) : null;
                      const pricing = targetPlan ? calculatePlanPrice(targetPlan, parseInt(form.durationMonths) || 1) : null;
                      
                      setForm({ 
                        ...form, 
                        academyId: value, 
                        planId: acad ? acad.plan.id : "",
                        amount: pricing ? pricing.amount.toString() : "",
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

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Paket Langganan</label>
                <div className="relative">
                  <select
                    value={form.planId}
                    required
                    onChange={(e) => {
                      const value = e.target.value;
                      const plan = plans.find(p => p.id === value);
                      const pricing = plan ? calculatePlanPrice(plan, parseInt(form.durationMonths) || 1) : null;
                      setForm({ 
                        ...form, 
                        planId: value, 
                        amount: pricing ? pricing.amount.toString() : form.amount 
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="" disabled>Pilih Paket...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {IDR(p.price)}/bln</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pilihan Siklus & Durasi Paket Sesuai Landing Page */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Durasi & Siklus Paket
                  </label>
                  {selectedPlan && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Tarif Dasar: {IDR(selectedPlan.price)}/bln
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      const dur = "1";
                      const plan = plans.find(p => p.id === form.planId);
                      const pricing = plan ? calculatePlanPrice(plan, 1) : null;
                      setForm({ ...form, durationMonths: dur, amount: pricing ? pricing.amount.toString() : form.amount });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      !isCustomDuration && form.durationMonths === "1"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-xs font-semibold">1 Bulan</span>
                    <span className="text-[10px] text-slate-400">Bulanan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      const dur = "6";
                      const plan = plans.find(p => p.id === form.planId);
                      const pricing = plan ? calculatePlanPrice(plan, 6) : null;
                      setForm({ ...form, durationMonths: dur, amount: pricing ? pricing.amount.toString() : form.amount });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                      !isCustomDuration && form.durationMonths === "6"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-xs font-semibold">6 Bulan</span>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full font-bold mt-0.5">
                      HEMAT 10%
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDuration(false);
                      const dur = "12";
                      const plan = plans.find(p => p.id === form.planId);
                      const pricing = plan ? calculatePlanPrice(plan, 12) : null;
                      setForm({ ...form, durationMonths: dur, amount: pricing ? pricing.amount.toString() : form.amount });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                      !isCustomDuration && form.durationMonths === "12"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-xs font-semibold">1 Tahun</span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold mt-0.5">
                      HEMAT 2 BLN
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomDuration(!isCustomDuration)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline font-medium"
                  >
                    {isCustomDuration ? "Sembunyikan durasi kustom" : "Atau tentukan durasi kustom (bulan)..."}
                  </button>
                  <span className="text-xs text-slate-400">
                    Akses: <strong>{form.durationMonths} Bulan</strong>
                  </span>
                </div>

                {isCustomDuration && (
                  <div className="pt-1.5 animate-in fade-in duration-200">
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.durationMonths}
                      onChange={(e) => {
                        const val = e.target.value;
                        const months = parseInt(val) || 1;
                        const plan = plans.find(p => p.id === form.planId);
                        const pricing = plan ? calculatePlanPrice(plan, months) : null;
                        setForm({
                          ...form,
                          durationMonths: val,
                          amount: pricing ? pricing.amount.toString() : form.amount,
                        });
                      }}
                      placeholder="Masukkan jumlah bulan akses"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Banner Diskon jika memilih 6 bulan atau 1 tahun */}
              {(() => {
                const currentDuration = parseInt(form.durationMonths) || 1;
                const p = plans.find(x => x.id === form.planId);
                const pricing = p ? calculatePlanPrice(p, currentDuration) : null;
                if (!pricing || pricing.savings <= 0) return null;
                return (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] uppercase font-bold tracking-wider">
                          {pricing.badge}
                        </span>
                        <span>{pricing.label}</span>
                      </span>
                      <span>Hemat {IDR(pricing.savings)}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Harga Normal: <span className="line-through">{IDR(pricing.originalAmount)}</span> → <span className="font-bold text-emerald-900 dark:text-emerald-100">{IDR(pricing.amount)}</span>
                    </p>
                  </div>
                );
              })()}

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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nominal Tagihan (Rp)</label>
                  {(() => {
                    const currentDuration = parseInt(form.durationMonths) || 1;
                    const p = plans.find(x => x.id === form.planId);
                    const pricing = p ? calculatePlanPrice(p, currentDuration) : null;
                    if (!pricing) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, amount: pricing.amount.toString() })}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Pakai Tarif Paket ({IDR(pricing.amount)})
                      </button>
                    );
                  })()}
                </div>
                <input type="number" required min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder={selectedPlan ? `Default: ${IDR(selectedPlan.price)}` : "0"}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none font-semibold text-slate-900 dark:text-white" />
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

      {/* Modal Edit Rekening Bank Platform */}
      {bankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Rekening Pembayaran</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pengaturan rekening tujuan transfer langganan BimbelSync.</p>
                </div>
              </div>
              <button 
                onClick={() => setBankModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBankSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Bank & Atas Nama
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="Contoh: BCA a.n PT BimbelSync Nusantara"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500">
                  Teks ini akan muncul sebagai nama bank penerima di notifikasi dashboard tenant.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bankAccount}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })}
                  placeholder="Contoh: 123-456-7890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white tracking-wider"
                />
                <p className="text-[11px] text-slate-500">
                  Nomor rekening yang dapat disalin dengan satu klik oleh penyewa.
                </p>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview di Notifikasi Tenant</span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                    {bankForm.bankName || "Nama Bank"}
                  </span>
                  <span className="text-xs font-bold font-mono px-2.5 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400">
                    {bankForm.bankAccount || "000-000-0000"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBankModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm shadow-blue-500/20"
                >
                  {isSavingBank ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Lihat Bukti Pembayaran */}
      {selectedProofInvoice && (
        <ViewProofModal
          isOpen={!!selectedProofInvoice}
          onClose={() => {
            setSelectedProofInvoice(null);
            setProofImageUrl(null);
          }}
          imageUrl={proofImageUrl}
          isLoading={isLoadingProof}
          invoiceTitle={`INV-${selectedProofInvoice.id.split("-")[0].toUpperCase()}`}
          academyName={selectedProofInvoice.academy.name}
          invoicePeriod={new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(selectedProofInvoice.billing_period))}
          invoiceAmount={IDR(selectedProofInvoice.amount)}
          isPaid={selectedProofInvoice.payment_status === "PAID"}
          isVerifying={isVerifyingProof}
          onVerify={async () => {
            setIsVerifyingProof(true);
            const res = await verifyInvoiceAction(selectedProofInvoice.id);
            setIsVerifyingProof(false);
            if (res.error) {
              toast.error(res.error);
            } else {
              toast.success(`Tagihan ${selectedProofInvoice.academy.name} berhasil diverifikasi dan ditandai lunas!`);
              setSelectedProofInvoice(null);
            }
          }}
        />
      )}
    </div>
  );
}
