"use client";

import { useState } from "react";
import { Receipt, User, MoreVertical, Trash2, CheckCircle2, DollarSign, Clock, Search, Filter } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { deleteInvoiceAction } from "./actions";
import { VerifyPaymentModal } from "@/components/modals/verify-payment-modal";
import { Invoice, Student, InvoiceItem, Staff } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";

type InvoiceWithRelations = Invoice & {
  student: Student;
  items: InvoiceItem[];
  verified_by: Staff | null;
};

export default function FinanceClientPage({ 
  invoices 
}: { 
  invoices: InvoiceWithRelations[] 
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingInvoice, setVerifyingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const tenantSlug = invoices.length > 0 ? invoices[0].academy_id : ""; // We can extract this or just use window.location

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  // Filtering
  const filteredInvoices = invoices.filter(invoice => {
    const invIdSearch = `INV-${invoice.id.substring(0, 6).toUpperCase()}`;
    const matchSearch = invIdSearch.includes(searchQuery.toUpperCase()) || 
                        invoice.student.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === "ALL" || invoice.payment_status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Toolbar Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari ID tagihan atau siswa..."
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
                    Belum ada riwayat tagihan.<br/>Klik "Buat Tagihan" untuk menerbitkan tagihan pertama.
                  </td>
                </tr>
              ) : (
                currentData.map((invoice, index) => {
                  const isPaid = invoice.payment_status === 'PAID';
                  
                  return (
                    <tr key={invoice.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${deletingId === invoice.id ? 'opacity-50' : ''} ${isPaid ? 'bg-emerald-50/20 dark:bg-emerald-900/5' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
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
                                index >= currentData.length - 2 && currentData.length > 2 
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

      {verifyingInvoice && (
        <VerifyPaymentModal 
          invoice={verifyingInvoice} 
          onClose={() => setVerifyingInvoice(null)} 
        />
      )}
    </>
  );
}
