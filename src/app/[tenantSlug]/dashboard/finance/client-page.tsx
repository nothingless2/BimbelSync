"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  Receipt, User, MoreVertical, Trash2, CheckCircle2, DollarSign, Clock, Search, Filter,
  Landmark, Edit3, X, Loader2, Ticket, Copy, Check, Percent, Sparkles, Plus, Power, Tag, Award
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteInvoiceAction, updateAcademyBankInfoAction } from "./actions";
import { toggleVoucherStatusAction, deleteVoucherAction } from "./voucher-actions";
import { VerifyPaymentModal } from "@/components/modals/verify-payment-modal";
import { AddVoucherModal } from "@/components/modals/add-voucher-modal";
import { Invoice, Student, InvoiceItem, Staff } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface SerializedVoucher {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxDiscount: number | null;
  minPurchase: number | null;
  startDate: string;
  endDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  programId: string | null;
  programName: string;
  createdAt: string;
}

export interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  totalUsedVouchers: number;
  totalDiscountGiven: number;
}

type InvoiceWithRelations = Invoice & {
  student: Student;
  items: InvoiceItem[];
  verified_by: Staff | null;
};

export default function FinanceClientPage({ 
  invoices,
  initialBankInfo,
  vouchers = [],
  programs = [],
  voucherStats = { totalVouchers: 0, activeVouchers: 0, totalUsedVouchers: 0, totalDiscountGiven: 0 }
}: { 
  invoices: InvoiceWithRelations[],
  initialBankInfo?: {
    bankName: string;
    bankAccount: string;
    academyName: string;
  },
  vouchers?: SerializedVoucher[],
  programs?: { id: string; name: string }[],
  voucherStats?: VoucherStats
}) {
  const router = useRouter();

  // Active Tab: Invoices vs Vouchers
  const [activeTab, setActiveTab] = useState<"invoices" | "vouchers">("invoices");

  // Voucher Management State
  const [vouchersList, setVouchersList] = useState<SerializedVoucher[]>(vouchers);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherFilterStatus, setVoucherFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingVoucherId, setTogglingVoucherId] = useState<string | null>(null);

  useEffect(() => {
    setVouchersList(vouchers);
  }, [vouchers]);

  // Academy Bank Settings State
  const [bankInfo, setBankInfo] = useState(
    initialBankInfo || { bankName: "", bankAccount: "", academyName: "Bimbel" }
  );
  const [bankModal, setBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: initialBankInfo?.bankName || "",
    bankAccount: initialBankInfo?.bankAccount || "",
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.bankAccount.trim()) {
      toast.error("Nama bank dan nomor rekening wajib diisi.");
      return;
    }
    setIsSavingBank(true);
    const res = await updateAcademyBankInfoAction(bankForm.bankName, bankForm.bankAccount);
    setIsSavingBank(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Rekening transfer bimbel berhasil diperbarui!");
      setBankInfo(prev => ({
        ...prev,
        bankName: bankForm.bankName.trim(),
        bankAccount: bankForm.bankAccount.trim(),
      }));
      setBankModal(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingInvoice, setVerifyingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 100% Client-Side State murni seperti Superadmin Billing (Filter & Search instan 0ms)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInvoices = invoices.filter(invoice => {
    const studentName = invoice.student?.full_name?.toLowerCase() || "";
    const invoiceId = invoice.id.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = query === "" || studentName.includes(query) || invoiceId.includes(query);
    const matchStatus = filterStatus === "ALL" || invoice.payment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const currentData = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleDropdown = (id: string) => {
    if (openDropdownId === id) setOpenDropdownId(null);
    else setOpenDropdownId(id);
  };

  const handleDelete = (invoice: InvoiceWithRelations) => {
    setOpenDropdownId(null);
    toast(`Hapus Tagihan?`, {
      description: "Tagihan ini akan dihapus secara permanen.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          setDeletingId(invoice.id);
          const res = await deleteInvoiceAction(invoice.id);
          if (res.error) toast.error(res.error);
          else toast.success("Tagihan berhasil dihapus.");
          setDeletingId(null);
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  // Copy voucher code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode voucher "${code}" berhasil disalin!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Toggle active status handler with optimistic update
  const handleToggleVoucher = async (voucher: SerializedVoucher) => {
    const newStatus = !voucher.isActive;
    setTogglingVoucherId(voucher.id);

    // Optimistic update
    setVouchersList(prev => prev.map(v => v.id === voucher.id ? { ...v, isActive: newStatus } : v));

    const res = await toggleVoucherStatusAction(voucher.id, newStatus);
    setTogglingVoucherId(null);

    if (res.error) {
      // Revert if error
      setVouchersList(prev => prev.map(v => v.id === voucher.id ? { ...v, isActive: !newStatus } : v));
      toast.error(res.error);
    } else {
      toast.success(`Voucher "${voucher.code}" sekarang ${newStatus ? "Aktif" : "Nonaktif"}.`);
    }
  };

  // Delete voucher handler
  const handleDeleteVoucher = (voucher: SerializedVoucher) => {
    toast(`Hapus Voucher "${voucher.code}"?`, {
      description: "Voucher ini tidak akan bisa digunakan lagi oleh siswa.",
      duration: 8000,
      action: {
        label: "Ya, Hapus",
        onClick: async () => {
          // Optimistic remove
          setVouchersList(prev => prev.filter(v => v.id !== voucher.id));
          const res = await deleteVoucherAction(voucher.id);
          if (res.error) {
            toast.error(res.error);
            router.refresh();
          } else {
            toast.success(`Voucher "${voucher.code}" berhasil dihapus.`);
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      }
    });
  };

  // Filter vouchers
  const filteredVouchers = vouchersList.filter(v => {
    const query = voucherSearch.toLowerCase().trim();
    const matchSearch = query === "" || v.code.toLowerCase().includes(query) || v.name.toLowerCase().includes(query);
    const matchStatus = 
      voucherFilterStatus === "ALL" ? true :
      voucherFilterStatus === "ACTIVE" ? v.isActive :
      !v.isActive;
    return matchSearch && matchStatus;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Selamanya";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  };

  return (
    <>
      {/* Navigation Tabs: Tagihan vs Voucher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "invoices"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Receipt size={16} />
          <span>Daftar Tagihan Siswa</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'invoices' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {invoices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "vouchers"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Ticket size={16} />
          <span>Voucher & Promo Diskon</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'vouchers' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {vouchersList.length}
          </span>
        </button>
      </div>

      {activeTab === "invoices" ? (
        <div className="space-y-6">
          {/* Rekening Pembayaran SPP / Les Card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                <Landmark size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Rekening Transfer Pembayaran SPP Siswa</h3>
                  {bankInfo.bankAccount ? (
                    <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                      Aktif di Portal Siswa
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
                      Belum Disetel
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rekening ini otomatis ditampilkan pada banner notifikasi dashboard murid/siswa yang memiliki tagihan belum lunas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {bankInfo.bankAccount ? (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{bankInfo.bankName || "Bank"}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{bankInfo.bankAccount}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Belum ada rekening disetel</span>
              )}
              <button
                onClick={() => {
                  setBankForm({ bankName: bankInfo.bankName, bankAccount: bankInfo.bankAccount });
                  setBankModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold transition"
              >
                <Edit3 size={13} />
                {bankInfo.bankAccount ? "Edit Rekening" : "Atur Rekening"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Toolbar Filter */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari ID tagihan atau nama siswa..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shrink-0 overflow-hidden">
                <button 
                  onClick={() => { setFilterStatus("ALL"); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "ALL" ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Semua
                </button>
                <button 
                  onClick={() => { setFilterStatus("UNPAID"); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "UNPAID" ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Belum Dibayar
                </button>
                <button 
                  onClick={() => { setFilterStatus("PAID"); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filterStatus === "PAID" ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Lunas
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold w-16">No.</th>
                    <th scope="col" className="px-6 py-4 font-semibold">ID Tagihan</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Siswa</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Total Tagihan</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <Receipt className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                        Belum ada riwayat tagihan atau tidak ada hasil pencarian.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((invoice, index) => {
                      const isPaid = invoice.payment_status === 'PAID';
                      
                      return (
                        <tr key={invoice.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === invoice.id ? 'opacity-50' : ''} ${isPaid ? 'bg-emerald-50/20 dark:bg-emerald-900/5' : ''}`}>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            {(currentPage - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">
                                INV-{invoice.id.substring(0, 6).toUpperCase()}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{invoice.items.length} Item(s)</span>
                                {invoice.billing_period && (
                                  <span className="text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                    {invoice.billing_period}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shadow-inner">
                                {invoice.student.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.student.full_name}</span>
                                <span className="text-xs text-slate-500">@{invoice.student.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-900 dark:text-slate-100">
                                {formatRupiah(invoice.total_amount)}
                              </span>
                              {invoice.payment_option === 'INSTALLMENT' ? (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded w-fit">CICILAN</span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded w-fit">FULL (BAYAR DIMUKA)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isPaid ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                  LUNAS
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">via {invoice.payment_method}</span>
                              </div>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                BELUM DIBAYAR
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left">
                              <button 
                                onClick={() => toggleDropdown(invoice.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openDropdownId === invoice.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                                  <div className={`absolute right-0 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in duration-200 ${
                                    index >= invoices.length - 2 && invoices.length > 2 
                                      ? 'bottom-full mb-2 slide-in-from-bottom-2' 
                                      : 'top-full mt-2 slide-in-from-top-2'
                                  }`}>
                                    <div className="py-1">
                                      <Link 
                                        href={`./finance/${invoice.id}`}
                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                                      >
                                        <Receipt size={16} />
                                        Lihat Detail Tagihan
                                      </Link>
                                      <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                      {!isPaid ? (
                                        <>
                                          <button
                                            onClick={() => { setVerifyingInvoice(invoice); setOpenDropdownId(null); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 font-medium"
                                          >
                                            <CheckCircle2 size={16} />
                                            Konfirmasi Lunas
                                          </button>
                                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                          <button
                                            onClick={() => handleDelete(invoice)}
                                            disabled={deletingId === invoice.id}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                                          >
                                            <Trash2 size={16} />
                                            Hapus / Batalkan
                                          </button>
                                        </>
                                      ) : (
                                        <div className="px-4 py-3 text-xs text-slate-500 italic text-center">
                                          Tagihan Lunas tidak dapat dimodifikasi.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
        </div>
      ) : (
        /* ================= VOUCHER & PROMO MANAGEMENT VIEW ================= */
        <div className="space-y-6">
          {/* Voucher Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Voucher</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{voucherStats.totalVouchers}</p>
                <p className="text-[11px] text-slate-400">Semua kupon dibuat</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Voucher Aktif</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{voucherStats.activeVouchers}</p>
                <p className="text-[11px] text-slate-400">Siap digunakan siswa</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Terpakai</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{voucherStats.totalUsedVouchers}</p>
                <p className="text-[11px] text-slate-400">Transaksi berdiskon</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Percent size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Diskon Diberikan</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{formatRupiah(voucherStats.totalDiscountGiven)}</p>
                <p className="text-[11px] text-slate-400">Hemat bagi siswa</p>
              </div>
            </div>
          </div>

          {/* Voucher Toolbar */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode kupon atau nama promo..."
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setVoucherFilterStatus("ALL")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    voucherFilterStatus === "ALL"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Semua ({vouchersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherFilterStatus("ACTIVE")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    voucherFilterStatus === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Aktif ({vouchersList.filter((v) => v.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherFilterStatus("INACTIVE")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    voucherFilterStatus === "INACTIVE"
                      ? "bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Nonaktif ({vouchersList.filter((v) => !v.isActive).length})
                </button>
              </div>
            </div>

            <AddVoucherModal
              programs={programs}
              onSuccess={() => router.refresh()}
            />
          </div>

          {/* Vouchers Cards Grid */}
          {filteredVouchers.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
              <Ticket className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada voucher promo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {voucherSearch || voucherFilterStatus !== "ALL"
                  ? "Tidak ada voucher yang cocok dengan filter atau kata kunci pencarian Anda."
                  : "Mulai buat voucher diskon pertama Anda untuk memikat pendaftar baru atau memberikan potongan harga khusus."}
              </p>
              <div className="mt-5 flex justify-center">
                <AddVoucherModal
                  programs={programs}
                  onSuccess={() => router.refresh()}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVouchers.map((voucher) => {
                const isToggling = togglingVoucherId === voucher.id;
                const usagePercent = voucher.usageLimit 
                  ? Math.min(100, Math.round((voucher.usedCount / voucher.usageLimit) * 100))
                  : null;

                return (
                  <div
                    key={voucher.id}
                    className={`bg-white dark:bg-[#111827] rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                      voucher.isActive
                        ? "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
                        : "border-slate-200 dark:border-slate-800/60 opacity-75 bg-slate-50/50 dark:bg-slate-900/30"
                    }`}
                  >
                    <div className="p-5 space-y-4">
                      {/* Top Row: Code Badge & Status Toggle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                          <span>{voucher.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(voucher.code)}
                            title="Salin Kode Voucher"
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 transition-colors p-0.5 cursor-pointer ml-1"
                          >
                            {copiedCode === voucher.code ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        {/* Status Switch Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleVoucher(voucher)}
                          disabled={isToggling}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                            voucher.isActive
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${voucher.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          )}
                          <span>{voucher.isActive ? "Aktif" : "Nonaktif"}</span>
                        </button>
                      </div>

                      {/* Promo Title & Program Target */}
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">
                          {voucher.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Tag size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{voucher.programName}</span>
                        </div>
                      </div>

                      {/* Discount Highlight Banner */}
                      <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                            {voucher.discountType === "PERCENTAGE" 
                              ? `${voucher.discountValue}% OFF` 
                              : `${formatRupiah(voucher.discountValue)} OFF`}
                          </span>
                        </div>
                        {voucher.discountType === "PERCENTAGE" && voucher.maxDiscount && (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
                            Maksimal potongan {formatRupiah(voucher.maxDiscount)}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {voucher.minPurchase ? `Min. tagihan ${formatRupiah(voucher.minPurchase)}` : "Tanpa minimal tagihan"}
                        </p>
                      </div>

                      {/* Validity & Usage Quota */}
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> Masa Berlaku:
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(voucher.startDate)} s/d {formatDate(voucher.endDate)}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                            <span>Kuota Terpakai:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {voucher.usageLimit 
                                ? `${voucher.usedCount} / ${voucher.usageLimit} (${usagePercent}%)`
                                : `${voucher.usedCount} kali (Tanpa Batas)`}
                            </span>
                          </div>
                          {voucher.usageLimit && (
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  (usagePercent || 0) >= 100 ? "bg-rose-500" : "bg-blue-600"
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Dibuat {formatDate(voucher.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVoucher(voucher)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Hapus Voucher"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {verifyingInvoice && (
        <VerifyPaymentModal 
          invoice={verifyingInvoice} 
          onClose={() => setVerifyingInvoice(null)} 
        />
      )}

      {/* Modal Edit Rekening Bimbel */}
      {bankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Landmark size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Rekening Pembayaran SPP</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur rekening tujuan transfer untuk siswa/murid.</p>
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
                  placeholder={`Contoh: BCA a.n ${bankInfo.academyName || "Bimbel"}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-500">
                  Nama bank dan nama pemilik rekening resmi bimbel.
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
                  placeholder="Contoh: 527-1234-567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white tracking-wider"
                />
                <p className="text-[11px] text-slate-500">
                  Nomor rekening yang dapat disalin dengan 1 klik oleh murid/orang tua.
                </p>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview di Portal Siswa</span>
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
    </>
  );
}
