"use client";

import { useState } from "react";
import { Building2, Users, CreditCard, Activity, ArrowLeft, Mail, RefreshCw, Trash2, CheckCircle2, ShieldAlert, Key } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "@/components/ui/sonner";
import { deactivateAdminAction, reactivateAdminAction, sendResetPasswordLinkAction, inviteAdminAction } from "./actions";

export default function TenantDetailClientPage({ academy, logs }: { academy: any, logs: any[] }) {
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "billing" | "logs">("admins");
  
  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    const res = await inviteAdminAction(inviteEmail, academy.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Undangan berhasil dikirim ke ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail("");
    }
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

    let res;
    if (isDeleted) {
      res = await reactivateAdminAction(staffId, academy.id);
    } else {
      res = await deactivateAdminAction(staffId, academy.id);
    }

    if (res.error) toast.error(res.error);
    else toast.success(`Admin berhasil di${actionName}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <Link href="/superadmin/search" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4 transition">
          <ArrowLeft size={16} /> Kembali ke Pencarian
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
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "admins", label: "Admin Bimbel", icon: Users },
          { id: "billing", label: "Billing & Tagihan", icon: CreditCard },
          { id: "logs", label: "Audit Logs", icon: ShieldAlert },
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
            <p>Statistik pendaftaran murid dan penggunaan fitur akan ditampilkan di sini.</p>
          </div>
        )}

        {/* TAB ADMINS */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pengelola Tenant</h2>
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition flex items-center gap-2"
              >
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
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Belum ada admin terdaftar.
                        </td>
                      </tr>
                    ) : academy.staff.map((staff: any) => (
                      <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar id={staff.id} email={staff.email} size={32} />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{staff.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {staff.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {staff.deleted_at ? (
                            <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-xs">
                              <ShieldAlert size={14} /> Nonaktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 size={14} /> Aktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleResetPassword(staff.id)}
                              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                              title="Kirim Link Reset Password"
                            >
                              <Key size={18} />
                            </button>
                            
                            {staff.deleted_at ? (
                              <button 
                                onClick={() => handleToggleActive(staff.id, true)}
                                className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                title="Aktifkan Akun"
                              >
                                <RefreshCw size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleToggleActive(staff.id, false)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Nonaktifkan Akun (Soft Delete)"
                              >
                                <Trash2 size={18} />
                              </button>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-12 text-center text-slate-500">
            <CreditCard className="mx-auto mb-4 opacity-50" size={48} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sistem Tagihan Platform (Segera Hadir)</h3>
            <p>Pengelolaan invoice untuk langganan tenant ini akan dikelola dari tab ini.</p>
          </div>
        )}

        {/* TAB LOGS */}
        {activeTab === "logs" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Log Aktivitas Superadmin</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Belum ada aktivitas tercatat untuk tenant ini.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {logs.map((log: any) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{log.action}</span>
                        <span className="text-xs font-medium text-slate-400">{new Date(log.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Oleh: {log.superadmin?.name || log.superadmin?.email || 'Unknown'}</p>
                      <div className="text-xs bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-400 break-words">
                        {log.details || "-"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Admin Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Undang Admin Baru</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sebuah email berisi link pembuatan akun akan dikirimkan ke alamat di bawah ini.</p>
              
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alamat Email Admin</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsInviteModalOpen(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !inviteEmail}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <span className="flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Mengirim...</span> : "Kirim Undangan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
