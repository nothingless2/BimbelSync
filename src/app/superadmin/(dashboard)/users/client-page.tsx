"use client";

import { useState } from "react";
import {
  UserPlus, Shield, CheckCircle2, Key, Trash2, Search,
  Building2, GraduationCap, UserCheck, ExternalLink, X, Loader2,
  Sparkles, Eye, EyeOff, ShieldAlert, Users as UsersIcon, Edit2,
  RotateCcw, AlertTriangle, UserX
} from "lucide-react";
import Link from "next/link";
import { AddSuperadminModal } from "@/components/modals/add-superadmin-modal";
import { EditSuperadminModal } from "@/components/modals/edit-superadmin-modal";
import { DeleteSuperadminModal } from "@/components/modals/delete-superadmin-modal";
import { UserAvatar } from "@/components/user-avatar";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  resetTenantUserPasswordAction,
  toggleTenantUserStatusAction,
  hardDeleteTenantUserAction,
  triggerManualPurgeAction,
} from "./actions";

export interface TenantUser {
  id: string;
  name: string;
  identifier: string;
  email: string | null;
  phone: string | null;
  userType: "STAFF" | "STUDENT";
  role: string;
  rawRole: string;
  academyId: string | null;
  academyName: string;
  academySlug: string;
  deletedAt?: string | null;
  isDeleted: boolean;
  userDeleted?: boolean;
  academyDeleted?: boolean;
}

export interface SuperadminUser {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  deleted_at: Date | null;
}

interface Props {
  currentSuperadminId?: string;
  superadmins: SuperadminUser[];
  tenantUsers: TenantUser[];
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "Semua Role" },
  { value: "ADMIN", label: "Admin Bimbel" },
  { value: "TUTOR", label: "Tutor" },
  { value: "STUDENT", label: "Siswa" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export default function SystemUsersClient({ currentSuperadminId, superadmins, tenantUsers }: Props) {
  const [activeTab, setActiveTab] = useState<"tenants" | "internal">("tenants");

  // === Superadmin Internal Management State ===
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSuperadmin, setSelectedSuperadmin] = useState<any>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalPage, setInternalPage] = useState(1);

  // === Tenant Users Filter State ===
  const [tenantSearchQuery, setTenantSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tenantPage, setTenantPage] = useState(1);

  // === Reset Password Modal State for Tenant Users ===
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<TenantUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // === Toggle Status Modal State for Tenant Users (Soft Delete / Grace Period) ===
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<TenantUser | null>(null);
  const [statusTargetAction, setStatusTargetAction] = useState<"DEACTIVATE" | "ACTIVATE">("DEACTIVATE");
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // === Hard Delete Modal State for Tenant Users (Instant Physical Purge) ===
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<TenantUser | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // === Manual Purge State (30-day Retention Cleanup) ===
  const [isPurging, setIsPurging] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // Counts for KPI
  const adminCount = tenantUsers.filter(u => u.rawRole === "ADMIN").length;
  const tutorCount = tenantUsers.filter(u => u.rawRole === "TUTOR").length;
  const studentCount = tenantUsers.filter(u => u.rawRole === "STUDENT").length;

  // Count expired accounts (>30 days inactive)
  const expiredCount = tenantUsers.filter(
    (u) =>
      u.userDeleted &&
      u.deletedAt &&
      Date.now() - new Date(u.deletedAt).getTime() >= 30 * 24 * 60 * 60 * 1000
  ).length;

  // Filter Tenant Users
  const filteredTenantUsers = tenantUsers.filter(user => {
    // 1. Role filter
    if (roleFilter !== "ALL" && user.rawRole !== roleFilter) return false;

    // 2. Status filter
    if (statusFilter === "ACTIVE" && user.isDeleted) return false;
    if (statusFilter === "INACTIVE" && !user.isDeleted) return false;

    // 3. Search query
    if (tenantSearchQuery.trim()) {
      const q = tenantSearchQuery.toLowerCase();
      const matchName = (user.name || "").toLowerCase().includes(q);
      const matchIdentifier = (user.identifier || "").toLowerCase().includes(q);
      const matchEmail = (user.email || "").toLowerCase().includes(q);
      const matchPhone = (user.phone || "").toLowerCase().includes(q);
      const matchAcademy = (user.academyName || "").toLowerCase().includes(q);
      return matchName || matchIdentifier || matchEmail || matchPhone || matchAcademy;
    }

    return true;
  });

  // Filter Superadmins
  const filteredSuperadmins = superadmins.filter(user => {
    if (!internalSearchQuery.trim()) return true;
    const q = internalSearchQuery.toLowerCase();
    const matchName = (user.name || "").toLowerCase().includes(q);
    const matchEmail = (user.email || "").toLowerCase().includes(q);
    return matchName || matchEmail;
  });

  // Pagination calculations
  const tenantItemsPerPage = 10;
  const totalTenantPages = Math.ceil(filteredTenantUsers.length / tenantItemsPerPage);
  const currentTenantData = filteredTenantUsers.slice(
    (tenantPage - 1) * tenantItemsPerPage,
    tenantPage * tenantItemsPerPage
  );

  const internalItemsPerPage = 10;
  const totalInternalPages = Math.ceil(filteredSuperadmins.length / internalItemsPerPage);
  const currentInternalData = filteredSuperadmins.slice(
    (internalPage - 1) * internalItemsPerPage,
    internalPage * internalItemsPerPage
  );

  // Modal Handlers
  const openResetPasswordModal = (user: TenantUser) => {
    setSelectedUserForPassword(user);
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setIsPasswordModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "BimbelSync#";
    for (let i = 0; i < 4; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmNewPassword(pwd);
    navigator.clipboard?.writeText(pwd);
    toast.success("Password acak digenerate dan disalin ke clipboard!");
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;

    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setIsResetSubmitting(true);
    const res = await resetTenantUserPasswordAction(
      selectedUserForPassword.id,
      selectedUserForPassword.userType,
      newPassword
    );

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || "Password pengguna berhasil diperbarui.");
      setIsPasswordModalOpen(false);
      setSelectedUserForPassword(null);
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setIsResetSubmitting(false);
  };

  const openStatusModal = (user: TenantUser, action: "DEACTIVATE" | "ACTIVATE") => {
    setSelectedUserForStatus(user);
    setStatusTargetAction(action);
    setIsStatusModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedUserForStatus) return;
    setIsStatusSubmitting(true);
    try {
      const res = await toggleTenantUserStatusAction(
        selectedUserForStatus.id,
        selectedUserForStatus.userType,
        statusTargetAction
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Status pengguna berhasil diperbarui.");
        setIsStatusModalOpen(false);
        setSelectedUserForStatus(null);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const openDeleteTenantModal = (user: TenantUser) => {
    setSelectedUserForDelete(user);
    setIsDeleteTenantModalOpen(true);
  };

  const handleHardDeleteTenantUser = async () => {
    if (!selectedUserForDelete) return;
    setIsDeleteSubmitting(true);
    try {
      const res = await hardDeleteTenantUserAction(
        selectedUserForDelete.id,
        selectedUserForDelete.userType
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Akun pengguna berhasil dihapus permanen.");
        setIsDeleteTenantModalOpen(false);
        setSelectedUserForDelete(null);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleTriggerManualPurge = async () => {
    setIsPurging(true);
    try {
      const res = await triggerManualPurgeAction();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Pembersihan akun selesai.");
        setIsPurgeModalOpen(false);
      }
    } catch {
      toast.error("Gagal menjalankan pembersihan akun kedaluwarsa.");
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Direktori seluruh pengguna bimbel (Admin, Tutor, Siswa) dan tim internal Superadmin.
          </p>
        </div>
        {activeTab === "internal" && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={18} />
            Tambah Anggota Superadmin
          </button>
        )}
      </div>

      {/* Mini KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengguna Bimbel</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <UsersIcon size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{tenantUsers.length}</p>
          <span className="text-xs text-slate-400 mt-1 block">Seluruh akun tenant aktif</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Bimbel</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
              <Shield size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{adminCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Pemilik & admin lembaga</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tutor / Pengajar</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{tutorCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Staf pengajar terdaftar</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Terdaftar</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <GraduationCap size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{studentCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">Murid di seluruh bimbel</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("tenants")}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "tenants"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Building2 size={16} />
          <span>Pengguna Bimbel</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {tenantUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("internal")}
          className={`flex items-center gap-2.5 px-5 py-3 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === "internal"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Shield size={16} />
          <span>Tim Superadmin</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {superadmins.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENGGUNA BIMBEL (TENANT DIRECTORY) */}
      {activeTab === "tenants" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col relative">
          {/* Banner jika ada akun yang telah kedaluwarsa > 30 hari */}
          {expiredCount > 0 && (
            <div className="mx-4 mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                <span>
                  Terdapat <strong>{expiredCount} akun</strong> yang telah berstatus nonaktif lebih dari 30 hari dan siap dibersihkan permanen oleh sistem.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(true)}
                disabled={isPurging}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-70 whitespace-nowrap"
              >
                {isPurging ? (
                  <><Loader2 size={13} className="animate-spin" /> Membersihkan...</>
                ) : (
                  <><Trash2 size={13} /> Bersihkan Sekarang</>
                )}
              </button>
            </div>
          )}

          {/* Toolbar Search & Filter */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-t-2xl relative z-20">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama, email, username, no HP, atau bimbel..."
                value={tenantSearchQuery}
                onChange={(e) => {
                  setTenantSearchQuery(e.target.value);
                  setTenantPage(1);
                }}
                className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filter Role */}
              <CustomSelect
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val);
                  setTenantPage(1);
                }}
                options={ROLE_OPTIONS}
                className="w-full sm:w-44 text-sm"
              />

              {/* Filter Status */}
              <CustomSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setTenantPage(1);
                }}
                options={STATUS_OPTIONS}
                className="w-full sm:w-40 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto relative z-10 rounded-b-2xl">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4 w-14">No.</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Asal Bimbel</th>
                  <th className="px-6 py-4">Kontak (Email / No. HP)</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {currentTenantData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada pengguna bimbel yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  currentTenantData.map((user, index) => (
                    <tr key={`${user.userType}-${user.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                        {(tenantPage - 1) * tenantItemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar id={user.id} email={user.email || user.identifier} size={32} />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs text-slate-500 font-mono truncate max-w-[180px]">{user.identifier}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          user.rawRole === "ADMIN" 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : user.rawRole === "TUTOR"
                            ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.academyId ? (
                          <Link 
                            href={`/superadmin/academies/${user.academyId}`}
                            className="inline-flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline text-xs"
                          >
                            <Building2 size={13} className="shrink-0" />
                            <span className="truncate max-w-[150px]">{user.academyName}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum terhubung</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          {user.email && user.email !== "-" ? (
                            <p className="truncate max-w-[170px]">{user.email}</p>
                          ) : (
                            <p className="text-slate-400 font-mono">User: {user.identifier}</p>
                          )}
                          {user.phone && user.phone !== "-" && (
                            <p className="text-slate-400 mt-0.5">{user.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.academyDeleted ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                            title="Akademi bimbel akun ini sedang dinonaktifkan/diarsipkan"
                          >
                            <Building2 size={13} className="shrink-0" />
                            Akademi Diarsipkan
                          </span>
                        ) : user.userDeleted ? (
                          (() => {
                            const daysElapsed = user.deletedAt
                              ? Math.floor((Date.now() - new Date(user.deletedAt).getTime()) / (1000 * 60 * 60 * 24))
                              : 0;
                            const daysRemaining = Math.max(0, 30 - daysElapsed);
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 whitespace-nowrap"
                                title={`Akun dinonaktifkan. Akan otomatis dihapus permanen oleh sistem dalam ${daysRemaining} hari jika tidak dipulihkan.`}
                              >
                                <UserX size={13} className="shrink-0" />
                                <span>Nonaktif</span>
                                <span className="text-[10px] opacity-80 font-normal">({daysRemaining > 0 ? `${daysRemaining} hr` : "Kedaluwarsa"})</span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap">
                            <CheckCircle2 size={13} className="shrink-0" />
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ubah Password */}
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition cursor-pointer"
                            title="Ubah Password Pengguna"
                          >
                            <Key size={17} />
                          </button>

                          {/* Tombol Nonaktifkan ATAU Pulihkan */}
                          {user.userDeleted ? (
                            <button
                              onClick={() => openStatusModal(user, "ACTIVATE")}
                              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition cursor-pointer"
                              title="Pulihkan Akun (Aktifkan Kembali)"
                            >
                              <RotateCcw size={17} />
                            </button>
                          ) : (
                            <button
                              onClick={() => openStatusModal(user, "DEACTIVATE")}
                              disabled={user.academyDeleted}
                              className={`p-2 rounded-lg transition ${
                                user.academyDeleted
                                  ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                  : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                              }`}
                              title={
                                user.academyDeleted
                                  ? "Akademi berada di tempat sampah"
                                  : "Nonaktifkan Akun (Masa Tenggang 30 Hari)"
                              }
                            >
                              <UserX size={17} />
                            </button>
                          )}

                          {/* Tombol Hapus Permanen (Hard Delete Langsung) */}
                          <button
                            onClick={() => openDeleteTenantModal(user)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition cursor-pointer"
                            title="Hapus Permanen Akun (Hard Delete Seketika)"
                          >
                            <Trash2 size={17} />
                          </button>

                          {user.academyId && (
                            <Link
                              href={`/superadmin/academies/${user.academyId}`}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Buka Detail Akademi"
                            >
                              <ExternalLink size={17} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalTenantPages > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
              <Pagination
                currentPage={tenantPage}
                totalPages={totalTenantPages}
                onPageChange={setTenantPage}
                totalItems={filteredTenantUsers.length}
                itemsPerPage={tenantItemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIM SUPERADMIN (INTERNAL) */}
      {activeTab === "internal" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar Filter */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama atau email superadmin..."
                value={internalSearchQuery}
                onChange={(e) => {
                  setInternalSearchQuery(e.target.value);
                  setInternalPage(1);
                }}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4 w-16">No.</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {currentInternalData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada akun Superadmin yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  currentInternalData.map((user, index) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {(internalPage - 1) * internalItemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar id={user.id} email={user.email} avatarUrl={user.avatar_url} size={32} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name || user.email}</p>
                              {currentSuperadminId === user.id && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Shield size={12} />
                          SUPERADMIN
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 size={14} />
                          Aktif
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSuperadmin(user);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Password"
                        >
                          <Key size={16} />
                        </button>
                        {/* Cegah Superadmin menghapus akun dirinya sendiri */}
                        {currentSuperadminId === user.id ? (
                          <span
                            className="inline-block p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            title="Anda tidak dapat menghapus akun Anda sendiri"
                          >
                            <Trash2 size={16} />
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSuperadmin(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Hapus Superadmin"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalInternalPages > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Pagination
                currentPage={internalPage}
                totalPages={totalInternalPages}
                onPageChange={setInternalPage}
                totalItems={filteredSuperadmins.length}
                itemsPerPage={internalItemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {/* === MODAL RESET PASSWORD TENANT USER === */}
      {isPasswordModalOpen && selectedUserForPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ubah Password Pengguna</h2>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-[240px]">
                    {selectedUserForPassword.name} ({selectedUserForPassword.identifier})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Bimbel:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedUserForPassword.academyName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Peran:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedUserForPassword.role}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Atur password baru secara langsung</span>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  Acak Password
                </button>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 karakter (huruf, angka, simbol)"
                    className="w-full pl-3.5 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ulangi Password Baru</label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full pl-3.5 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Minimal 8 karakter (kombinasi huruf besar, kecil, angka, dan simbol).</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting || !newPassword}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {isResetSubmitting ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nonaktifkan / Pulihkan Akun (Tenant User - Retensi 30 Hari) */}
      {isStatusModalOpen && selectedUserForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    statusTargetAction === "DEACTIVATE"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                  }`}
                >
                  {statusTargetAction === "DEACTIVATE" ? (
                    <UserX size={20} />
                  ) : (
                    <RotateCcw size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {statusTargetAction === "DEACTIVATE"
                      ? "Nonaktifkan Akun Pengguna?"
                      : "Pulihkan Akun Pengguna?"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {statusTargetAction === "DEACTIVATE"
                      ? "Masa tenggang retensi 30 hari"
                      : "Kembalikan status pengguna menjadi aktif"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedUserForStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User preview card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                <UserAvatar
                  id={selectedUserForStatus.id}
                  email={selectedUserForStatus.email || selectedUserForStatus.identifier}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {selectedUserForStatus.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {selectedUserForStatus.identifier}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {selectedUserForStatus.role}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {selectedUserForStatus.academyName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail Penjelasan */}
              {statusTargetAction === "DEACTIVATE" ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-300 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>Kebijakan Masa Tenggang 30 Hari:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                      <li>Pengguna <strong>tidak akan dapat login lagi</strong> ke portal bimbel.</li>
                      <li>Seluruh data historis (jadwal, nilai evaluasi, absensi, tagihan) tetap <strong>aman tersimpan</strong>.</li>
                      <li>Anda dapat <strong>memulihkan (*restore*)</strong> akun ini kapan saja dalam kurun waktu 30 hari.</li>
                      <li>Jika tidak dipulihkan setelah 30 hari, sistem akan <strong>menghapusnya secara permanen otomatis</strong> via cron.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    Akun ini akan diaktifkan kembali. Pengguna dapat login kembali menggunakan kredensial yang sama, dan masa tenggang penghapusan otomatis 30 hari akan dibatalkan.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedUserForStatus(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isStatusSubmitting}
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm ${
                    statusTargetAction === "DEACTIVATE"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isStatusSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                  ) : statusTargetAction === "DEACTIVATE" ? (
                    "Ya, Nonaktifkan Akun"
                  ) : (
                    "Ya, Pulihkan Akun"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirmation Modal (Tenant User - Instant Physical Purge) */}
      {isDeleteTenantModalOpen && selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Hapus Permanen Akun?
                  </h3>
                  <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteTenantModalOpen(false);
                  setSelectedUserForDelete(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User preview card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                <UserAvatar
                  id={selectedUserForDelete.id}
                  email={selectedUserForDelete.email || selectedUserForDelete.identifier}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {selectedUserForDelete.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {selectedUserForDelete.identifier}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {selectedUserForDelete.role}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {selectedUserForDelete.academyName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning or Explanation */}
              <div className="space-y-3">
                {selectedUserForDelete.rawRole === "ADMIN" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold mb-0.5">Peringatan: Admin Lembaga</strong>
                      Pengguna ini adalah Admin Bimbel. Jika dihapus permanen, pastikan ada akun admin lain untuk mengelola bimbel ini.
                    </div>
                  </div>
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Akun pengguna ini akan <strong>dihapus permanen (Hard Delete) seketika</strong> dari database sistem tanpa menunggu masa tenggang 30 hari. Seluruh data terkait (pendaftaran kelas, riwayat absensi, evaluasi, dan tagihan) akan dibersihkan dan akun ini <strong>tidak dapat dipulihkan kembali</strong>.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteTenantModalOpen(false);
                    setSelectedUserForDelete(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleHardDeleteTenantUser}
                  disabled={isDeleteSubmitting}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {isDeleteSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Menghapus...</>
                  ) : (
                    "Ya, Hapus Permanen"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Bersihkan Akun Kedaluwarsa (>30 Hari) */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Bersihkan Akun Kedaluwarsa?
                  </h3>
                  <p className="text-xs text-slate-500">Pembersihan akun nonaktif &gt; 30 hari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                  <span>Konfirmasi Penghapusan Permanen</span>
                </div>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  Terdapat <strong>{expiredCount} akun pengguna</strong> yang telah berstatus nonaktif lebih dari 30 hari. Seluruh akun tersebut akan <strong>dihapus secara permanen (Hard Delete)</strong> beserta riwayat kelas, jadwal, evaluasi, absensi, dan tagihan terkait.
                </p>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Akun yang dihapus tidak dapat dipulihkan kembali ke dalam sistem.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurgeModalOpen(false)}
                  disabled={isPurging}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleTriggerManualPurge}
                  disabled={isPurging}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {isPurging ? (
                    <><Loader2 size={16} className="animate-spin" /> Membersihkan...</>
                  ) : (
                    "Ya, Bersihkan Sekarang"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Superadmin Modals */}
      <AddSuperadminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {selectedSuperadmin && (
        <EditSuperadminModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSuperadmin(null);
          }}
          user={selectedSuperadmin}
        />
      )}

      {selectedSuperadmin && (
        <DeleteSuperadminModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedSuperadmin(null);
          }}
          user={selectedSuperadmin}
        />
      )}
    </div>
  );
}
