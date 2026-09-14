"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import {
  DollarSign,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(n)
    .replace(",00", "");

const DATE = (d: string | Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

interface Props {
  stats: {
    totalAcademies: number;
    activeAcademies: number;
    trialAcademies: number;
    suspendedAcademies: number;
    expiredTrialAcademies: number;
    totalSuperadmins: number;
    currentMRR: number;
    totalRevenue: number;
    totalReceivables: number;
    recentMRR: number; // last month MRR to compare
  };
  growthData: { month: string; count: number }[];
  planDistribution: { name: string; value: number }[];
  topAcademies: { name: string; path_url: string; id: string; studentCount: number; staffCount: number }[];
  expiringTrials: { id: string; name: string; subscription_due_date: string | null; plan: { name: string } }[];
  recentLogs: { id: string; action: string; created_at: string; superadmin: { name: string | null; email: string } | null }[];
  recentInvoices: {
    id: string;
    academy: { name: string };
    plan: { name: string };
    billing_period: string;
    amount: number;
    payment_status: string;
  }[];
}

export default function DashboardClientPage({ stats, growthData, planDistribution, topAcademies, expiringTrials, recentLogs, recentInvoices }: Props) {
  const mrrDiff = stats.currentMRR - stats.recentMRR;
  const mrrGrowthPct = stats.recentMRR > 0 ? ((mrrDiff / stats.recentMRR) * 100).toFixed(1) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ringkasan performa bisnis BimbelSync secara keseluruhan.</p>
      </div>

      {/* === KPI CARDS === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">MRR</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp size={15} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{IDR(stats.currentMRR)}</h3>
          {mrrGrowthPct !== null && (
            <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${mrrDiff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {mrrDiff >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {mrrDiff >= 0 ? "+" : ""}{mrrGrowthPct}% dari bulan lalu
            </p>
          )}
          {mrrGrowthPct === null && <p className="text-xs text-blue-600 mt-2">/bulan dari akademi aktif</p>}
        </div>

        {/* Total Pendapatan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Pendapatan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign size={15} className="text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{IDR(stats.totalRevenue)}</h3>
          <p className="text-xs text-emerald-600 mt-2">Total tagihan lunas</p>
        </div>

        {/* Piutang */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Piutang</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle size={15} className="text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">{IDR(stats.totalReceivables)}</h3>
          <p className="text-xs text-amber-600 mt-2">Belum dibayar</p>
        </div>

        {/* Total Akademi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Akademi</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Building2 size={15} className="text-indigo-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalAcademies}</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">{stats.activeAcademies} Aktif</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">{stats.trialAcademies} Trial</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">{stats.suspendedAcademies} Suspended</span>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">{stats.expiredTrialAcademies} Expired Trial</span>
          </div>
        </div>
      </div>

      {/* === CHARTS ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pertumbuhan Tenant</h3>
              <p className="text-xs text-slate-500 mt-0.5">Akumulasi akademi baru per bulan</p>
            </div>
          </div>
          {growthData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">Belum ada data pertumbuhan.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f1f5f9", fontSize: "12px" }}
                  itemStyle={{ color: "#60a5fa" }}
                  labelStyle={{ fontWeight: "bold", color: "#e2e8f0" }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorGrowth)" dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="Akademi Baru" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan Distribution Pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Distribusi Paket</h3>
            <p className="text-xs text-slate-500 mt-0.5">Akademi aktif per paket langganan</p>
          </div>
          {planDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">Belum ada data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {planDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "12px", color: "#f1f5f9", fontSize: "12px" }}
                  formatter={(value: any, name: any) => [`${value} akademi`, name]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* === BOTTOM ROW === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 Akademi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">🏆 Top Akademi</h3>
            <Link href="/superadmin/academies" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</Link>
          </div>
          <div className="space-y-3">
            {topAcademies.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>}
            {topAcademies.map((a, i) => (
              <Link href={`/superadmin/academies/${a.id}`} key={a.id} className="flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 py-1.5 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black w-5 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-slate-300"}`}>#{i + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 transition">{a.name}</p>
                    <p className="text-[10px] text-slate-400">/{a.path_url}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{a.studentCount} <span className="font-normal text-slate-400">murid</span></p>
                  <p className="text-[10px] text-slate-400">{a.staffCount} staf</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trial Akan Habis */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">⏰ Trial Akan Habis</h3>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">7 hari</span>
          </div>
          <div className="space-y-3">
            {expiringTrials.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={28} />
                <p className="text-xs text-slate-400">Tidak ada trial yang akan habis</p>
              </div>
            )}
            {expiringTrials.map((a) => (
              <Link href={`/superadmin/academies/${a.id}`} key={a.id} className="flex items-center justify-between group hover:bg-amber-50/50 dark:hover:bg-amber-900/10 -mx-2 px-2 py-1.5 rounded-xl transition">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-amber-600 transition">{a.name}</p>
                  <p className="text-[10px] text-slate-400">{a.plan.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <Clock size={10} />
                    {a.subscription_due_date ? DATE(a.subscription_due_date) : "–"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Stats */}
        <div className="space-y-4">
          {/* Superadmin Count */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <Users size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Superadmin Aktif</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalSuperadmins}</p>
              </div>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Terbaru</h3>
              <Link href="/superadmin/audit-logs" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</Link>
            </div>
            <div className="space-y-2.5">
              {recentLogs.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Belum ada log.</p>}
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert size={11} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">{log.action}</p>
                    <p className="text-[10px] text-slate-400">
                      {log.superadmin?.name || log.superadmin?.email || "System"} • {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(log.created_at))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* === RECENT INVOICES === */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tagihan Platform Terbaru</h3>
          <Link href="/superadmin/billing" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat Semua</Link>
        </div>
        <div className="space-y-3">
          {recentInvoices.length === 0 && <div className="text-center py-8 text-sm text-slate-500">Belum ada tagihan platform.</div>}
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${inv.payment_status === "PAID" ? "bg-emerald-100 text-emerald-600" : inv.payment_status === "OVERDUE" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                  {inv.payment_status === "PAID" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{inv.academy.name}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(inv.billing_period))} • {inv.plan.name}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-slate-900 dark:text-white">{IDR(inv.amount)}</p>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${inv.payment_status === "PAID" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : inv.payment_status === "OVERDUE" ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"}`}>
                  {inv.payment_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
