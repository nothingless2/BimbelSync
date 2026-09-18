"use client";

import { useState } from "react";
import {
  Building2, Users, CreditCard, Activity, ArrowLeft, Mail, RefreshCw,
  Trash2, CheckCircle2, ShieldAlert, Key, Edit2, X, Loader2, AlertCircle, Check, Ban, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { UserAvatar } from "@/components/user-avatar";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  deactivateAdminAction, reactivateAdminAction,
  sendResetPasswordLinkAction, inviteAdminAction, updateAcademyAction
} from "./actions";
import { verifyInvoiceAction, markOverdueAction, voidInvoiceAction } from "../../billing/actions";

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { label: string; class: string }> = {
  PAID:    { label: "Lunas",       class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  UNPAID:  { label: "Belum Bayar", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  OVERDUE: { label: "Terlambat",   class: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" },
  VOID:    { label: "Void",        class: "bg-slate-100 dark:bg-slate-700 text-slate-500" },
};

interface InvoiceItem {
  id: string;
  billing_period: string;
  due_date: string;
  paid_at: string | null;
  amount: number;
  payment_status: string;
  plan: { name: string };
  verified_by: { name: string | null; email: string } | null;
}

interface Plan { id: string; name: string; price: number; }

interface Props {
  academy: any;
  plans: Plan[];
  invoices: InvoiceItem[];
  auditLogs: any[];
}

export default function TenantDetailClientPage({ academy, plans, invoices, auditLogs }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "billing" | "logs">("overview");
  
  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit academy modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: academy.name,
    planId: academy.plan.id,
    subscriptionStatus: academy.subscription_status as "TRIAL" | "ACTIVE" | "SUSPENDED",
    subscriptionDueDate: academy.subscription_due_date ? new Date(academy.subscription_due_date).toISOString().slice(0, 10) : "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Pagination & Logs State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((auditLogs || []).length / itemsPerPage);
  const currentLogs = (auditLogs || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsSubmitting(true);
    const res = await inviteAdminAction(inviteEmail, academy.id);
    if (res.error) toast.error(res.error);
    else { toast.success(`Undangan berhasil dikirim ke ${inviteEmail}`); setIsInviteModalOpen(false); setInviteEmail(""); }
    setIsSubmitting(false);
  };

  const handleResetPassword = async (staffId: string) => {
    if (!confirm("Kirim link reset password ke admin ini?")) return;
    const res = await sendResetPasswordLinkAction(staffId, academy.id);
    if (res.error) toast.error(res.error);
    else toast.success(res.message || "Link reset password terkirim");
  };

  const handleToggleActive = async (staffId: string, isDeleted: boolean) => {
    const actionName = isDeleted ? "mengaktifkan" : "menonaktifkan";
    if (!confirm(`Yakin ingin ${actionName} admin ini?`)) return;
    const res = isDeleted
      ? await reactivateAdminAction(staffId, academy.id)
      : await deactivateAdminAction(staffId, academy.id);
    if (res.error) toast.error(res.error);
    else toast.success(`Admin berhasil di${actionName}`);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    const res = await updateAcademyAction(academy.id, {
      name: editForm.name,
      planId: editForm.planId,
      subscriptionStatus: editForm.subscriptionStatus,
      subscriptionDueDate: editForm.subscriptionDueDate || null,
    });
    if (res.error) toast.error(res.error);
    else toast.success("Data akademi berhasil diperbarui!");
    setIsEditSubmitting(false);
    setIsEditModalOpen(false);
  };

  const handleInvoiceAction = async (invoiceId: string, action: "verify" | "overdue" | "void") => {
    let res;
    if (action === "verify") res = await verifyInvoiceAction(invoiceId);
    else if (action === "overdue") res = await markOverdueAction(invoiceId);
    else res = await voidInvoiceAction(invoiceId);
    if (res.error) toast.error(res.error);
    else toast.success(action === "verify" ? "Invoice ditandai Lunas." : action === "overdue" ? "Invoice ditandai Overdue." : "Invoice di-void.");
  };

  const totalRevenue = invoices.filter(i => i.payment_status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalUnpaid = invoices.filter(i => i.payment_status === "UNPAID" || i.payment_status === "OVERDUE").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <Link href="/superadmin/academies" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 transition">
          <ArrowLeft size={16} /> Kembali ke Daftar Akademi
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{academy.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-mono">URL: /{academy.path_url}</span>
                <span>•</span>
                <span>Paket: <span className="font-semibold text-slate-700 dark:text-slate-300">{academy.plan.name}</span></span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  academy.subscription_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  academy.subscription_status === 'TRIAL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {academy.subscription_status}
                </span>
              </div>
            </div>
          </div>
          {/* Edit Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Edit2 size={15} /> Edit Akademi
          </button>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "admins", label: "Admin Bimbel", icon: Users },
          { id: "billing", label: "Billing & Tagihan", icon: CreditCard },
          { id: "logs", label: "Log Aktivitas", icon: ShieldAlert },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="mt-6">
        {/* TAB OVERVIEW */}
        {activeTab === "overview" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-12 text-center text-slate-500">
            <Activity className="mx-auto mb-4 opacity-50" size={48} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ikhtisar Platform (Segera Hadir)</h3>
            <p className="mb-6">Statistik pendaftaran murid dan penggunaan fitur akan ditampilkan di sini.</p>
            <button onClick={() => setActiveTab("logs")} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl transition">
              <ShieldAlert size={16} /> Lihat 100 aktivitas terakhir
            </button>
          </div>
        )}

        {/* TAB ADMINS */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pengelola Tenant</h2>
              <button onClick={() => setIsInviteModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition flex items-center gap-2">
                <Mail size={16} /> Undang Admin
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-500">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {academy.staff.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Belum ada admin terdaftar.</td></tr>
                    ) : academy.staff.map((staff: any) => (
                      <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar id={staff.id} email={staff.email} size={32} />
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{staff.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{staff.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          {staff.deleted_at ? (
                            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-xs"><ShieldAlert size={14} /> Nonaktif</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs"><CheckCircle2 size={14} /> Aktif</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleResetPassword(staff.id)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition" title="Kirim Link Reset Password"><Key size={18} /></button>
                            {staff.deleted_at ? (
                              <button onClick={() => handleToggleActive(staff.id, true)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Aktifkan Akun"><RefreshCw size={18} /></button>
                            ) : (
                              <button onClick={() => handleToggleActive(staff.id, false)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Nonaktifkan Akun"><Trash2 size={18} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB BILLING */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Mini KPI */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">Total Invoice</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{invoices.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">Total Dibayar</p>
                <p className="text-xl font-bold text-emerald-600">{IDR(totalRevenue)}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">Belum Dibayar</p>
                <p className="text-xl font-bold text-amber-600">{IDR(totalUnpaid)}</p>
              </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Periode</th>
                      <th className="px-6 py-4">Paket</th>
                      <th className="px-6 py-4">Nominal</th>
                      <th className="px-6 py-4">Jatuh Tempo</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {invoices.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Belum ada tagihan untuk akademi ini.</td></tr>
                    ) : invoices.map(inv => {
                      const status = statusConfig[inv.payment_status];
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(inv.billing_period))}</td>
                          <td className="px-6 py-4"><span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{inv.plan.name}</span></td>
                          <td className="px-6 py-4 font-semibold">{IDR(inv.amount)}</td>
                          <td className="px-6 py-4 text-slate-500">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(inv.due_date))}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.class}`}>{status.label}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {inv.payment_status !== "PAID" && inv.payment_status !== "VOID" && (
                                <button onClick={() => handleInvoiceAction(inv.id, "verify")} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition" title="Tandai Lunas"><Check size={16} /></button>
                              )}
                              {inv.payment_status === "UNPAID" && (
                                <button onClick={() => handleInvoiceAction(inv.id, "overdue")} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition" title="Tandai Overdue"><AlertCircle size={16} /></button>
                              )}
                              {inv.payment_status !== "PAID" && inv.payment_status !== "VOID" && (
                                <button onClick={() => handleInvoiceAction(inv.id, "void")} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Void Invoice"><Ban size={16} /></button>
                              )}
                              {(inv.payment_status === "PAID" || inv.payment_status === "VOID") && (
                                <span className="text-xs text-slate-300 dark:text-slate-600 italic px-2">–</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Aktivitas Tenant</h2>
                <p className="text-sm text-slate-500">Menampilkan hingga 100 aktivitas terbaru yang dilakukan oleh admin atau tutor di tenant ini.</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-16">No.</th>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4">Pelaku (Admin/Staff)</th>
                      <th className="px-6 py-4">Jenis Aksi</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {currentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          Belum ada catatan aktivitas dari tenant ini.
                        </td>
                      </tr>
                    ) : currentLogs.map((log: any, index: number) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer" onClick={() => toggleExpandLog(log.id)}>
                          <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                            {new Date(log.created_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar id={log.staff_id} email={log.staff?.email} avatarUrl={log.staff?.avatar_url} size={28} />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{log.staff?.name || log.staff?.email || "Unknown"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                              {expandedLogId === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded Payload Row */}
                        {expandedLogId === log.id && (
                          <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                            <td colSpan={5} className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                  <ShieldAlert size={16} className="text-blue-500" /> 
                                  Detail Informasi Aksi
                                </h4>
                                {log.details && Object.keys(log.details).length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                    {Object.entries(log.details).map(([key, value]) => (
                                      <div key={key} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                          {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
                                          {typeof value === 'object' && value !== null 
                                            ? JSON.stringify(value) 
                                            : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-500 italic flex items-center gap-2">
                                    <AlertCircle size={14} /> Tidak ada data payload atau parameter tambahan pada aksi ini.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                  totalItems={auditLogs.length} 
                  itemsPerPage={itemsPerPage} 
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* === INVITE ADMIN MODAL === */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Undang Admin Baru</h2>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sebuah email berisi link pembuatan akun akan dikirimkan ke alamat di bawah ini.</p>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Email Admin</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Batal</button>
                  <button type="submit" disabled={isSubmitting || !inviteEmail} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : "Kirim Undangan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT ACADEMY MODAL === */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Akademi</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={18} className="text-slate-500" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nama Akademi</label>
                <input type="text" required value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL (tidak bisa diubah)</label>
                <input type="text" disabled value={`/${academy.path_url}`}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Paket Langganan</label>
                  <CustomSelect
                    value={editForm.planId}
                    onChange={(value) => setEditForm({...editForm, planId: value})}
                    options={plans.map(p => ({
                      value: p.id,
                      label: p.name
                    }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <CustomSelect
                    value={editForm.subscriptionStatus}
                    onChange={(value) => setEditForm({...editForm, subscriptionStatus: value as any})}
                    options={[
                      { value: "TRIAL", label: "Trial" },
                      { value: "ACTIVE", label: "Active" },
                      { value: "SUSPENDED", label: "Suspended" }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tanggal Jatuh Tempo Langganan</label>
                <input type="date" value={editForm.subscriptionDueDate} onChange={(e) => setEditForm({...editForm, subscriptionDueDate: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">Batal</button>
                <button type="submit" disabled={isEditSubmitting} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70">
                  {isEditSubmitting ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
