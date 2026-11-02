"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileText, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Printer, Calendar, RotateCcw } from "lucide-react";
import { format, startOfWeek, subWeeks, subMonths, subYears, getWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";

type ProgramData = {
  name: string;
  value: number;
};

type InvoiceItemData = {
  description: string;
  amount: number;
};

type InvoiceData = {
  id: string;
  student_name: string;
  amount: number;
  paid_at: string;
  items?: InvoiceItemData[];
};

type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export default function TenantReportsClientPage({
  academyName = "Bimbel",
  programRevenueData: initialProgramRevenueData,
  invoices,
  activeStudentsCount,
  thisMonthRevenue,
  growthPercentage,
  outstandingRevenue,
  tenantSlug
}: {
  academyName?: string;
  programRevenueData: ProgramData[];
  invoices: InvoiceData[];
  activeStudentsCount: number;
  thisMonthRevenue: number;
  growthPercentage: number;
  outstandingRevenue: number;
  tenantSlug: string;
}) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTHLY");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [quickPreset, setQuickPreset] = useState<string>("ALL");

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const parseDateRange = (s: string, e: string) => {
    let start: Date | null = null;
    let end: Date | null = null;
    if (s) {
      const [y, m, d] = s.split('-').map(Number);
      start = new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    if (e) {
      const [y, m, d] = e.split('-').map(Number);
      end = new Date(y, m - 1, d, 23, 59, 59, 999);
    }
    return { start, end };
  };

  const formatPeriodText = (s: string, e: string) => {
    if (s && e) {
      const { start, end } = parseDateRange(s, e);
      if (start && end) {
        return `${format(start, "dd MMMM yyyy", { locale: localeId })} - ${format(end, "dd MMMM yyyy", { locale: localeId })}`;
      }
    }
    if (s) {
      const { start } = parseDateRange(s, "");
      if (start) return `Mulai ${format(start, "dd MMMM yyyy", { locale: localeId })}`;
    }
    if (e) {
      const { end } = parseDateRange("", e);
      if (end) return `Hingga ${format(end, "dd MMMM yyyy", { locale: localeId })}`;
    }
    return "Semua Waktu";
  };

  const applyPreset = (preset: string) => {
    const now = new Date();
    const formatDateInput = (d: Date) => format(d, "yyyy-MM-dd");

    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
      setQuickPreset("ALL");
    } else if (preset === "TODAY") {
      const str = formatDateInput(now);
      setStartDate(str);
      setEndDate(str);
      setQuickPreset("TODAY");
    } else if (preset === "7_DAYS") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(now));
      setQuickPreset("7_DAYS");
    } else if (preset === "30_DAYS") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(now));
      setQuickPreset("30_DAYS");
    } else if (preset === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(end));
      setQuickPreset("THIS_MONTH");
    } else if (preset === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(end));
      setQuickPreset("LAST_MONTH");
    } else if (preset === "THIS_YEAR") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatDateInput(start));
      setEndDate(formatDateInput(end));
      setQuickPreset("THIS_YEAR");
    }
  };

  // Filter invoices based on date range
  const filteredInvoices = useMemo(() => {
    if (!startDate && !endDate) return invoices;
    const { start, end } = parseDateRange(startDate, endDate);

    return invoices.filter(inv => {
      const d = new Date(inv.paid_at);
      if (isNaN(d.getTime())) return true;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [invoices, startDate, endDate]);

  const filteredTotalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }, [filteredInvoices]);

  // Recalculate program revenue dynamically based on filtered invoices
  const filteredProgramRevenueData = useMemo(() => {
    const programRevenueMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach(item => {
          let programName = item.description;
          const match = programName.match(/Tagihan SPP - (.*?)( \((.*)\))?$/);
          if (match && match[1]) {
            programName = match[1].trim();
          }
          programRevenueMap[programName] = (programRevenueMap[programName] || 0) + item.amount;
        });
      } else {
        programRevenueMap["Lainnya"] = (programRevenueMap["Lainnya"] || 0) + inv.amount;
      }
    });

    return Object.entries(programRevenueMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredInvoices]);

  // Dynamic Chart Data Generation
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, number> = {};
    const labels: string[] = [];

    if (period === "DAILY") {
      // Last 14 days
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = format(d, "dd MMM", { locale: localeId });
        labels.push(key);
        dataMap[key] = 0;
      }
      filteredInvoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const key = format(d, "dd MMM", { locale: localeId });
        if (dataMap[key] !== undefined) dataMap[key] += inv.amount;
      });
    } else if (period === "WEEKLY") {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const d = subWeeks(now, i);
        const wDate = startOfWeek(d, { weekStartsOn: 1 });
        const key = `Minggu ${getWeek(wDate)}, ${format(wDate, "yy")}`;
        labels.push(key);
        dataMap[key] = 0;
      }
      filteredInvoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const wDate = startOfWeek(d, { weekStartsOn: 1 });
        const key = `Minggu ${getWeek(wDate)}, ${format(wDate, "yy")}`;
        if (dataMap[key] !== undefined) dataMap[key] += inv.amount;
      });
    } else if (period === "MONTHLY") {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "MMM yy", { locale: localeId });
        labels.push(key);
        dataMap[key] = 0;
      }
      filteredInvoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const key = format(d, "MMM yy", { locale: localeId });
        if (dataMap[key] !== undefined) dataMap[key] += inv.amount;
      });
    } else if (period === "YEARLY") {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const d = subYears(now, i);
        const key = format(d, "yyyy");
        labels.push(key);
        dataMap[key] = 0;
      }
      filteredInvoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const key = format(d, "yyyy");
        if (dataMap[key] !== undefined) dataMap[key] += inv.amount;
      });
    }

    return labels.map(label => ({
      label,
      revenue: dataMap[label]
    }));
  }, [filteredInvoices, period]);

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada data transaksi pada rentang waktu yang dipilih untuk diekspor.");
      return;
    }

    const headers = ["Transaction ID", "Date Paid", "Student Name", "Program / Deskripsi", "Revenue (Rp)"];
    const rows = filteredInvoices.map(inv => {
      const descriptions = inv.items && inv.items.length > 0
        ? inv.items.map(it => it.description).join("; ")
        : "-";
      return [
        inv.id,
        format(new Date(inv.paid_at), "dd MMM yyyy HH:mm", { locale: localeId }),
        `"${inv.student_name.replace(/"/g, '""')}"`,
        `"${descriptions.replace(/"/g, '""')}"`,
        inv.amount
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const dateSuffix = startDate && endDate
      ? `${startDate}_sd_${endDate}`
      : startDate
      ? `mulai_${startDate}`
      : endDate
      ? `sampai_${endDate}`
      : `semua_${format(new Date(), 'yyyyMMdd')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${tenantSlug}_${dateSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengunduh ${filteredInvoices.length} transaksi ke CSV.`);
  };

  const handleExportPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada data transaksi pada rentang waktu yang dipilih untuk dicetak.");
      return;
    }
    window.print();
  };

  const periodOptions = [
    { value: "DAILY", label: "Harian" },
    { value: "WEEKLY", label: "Mingguan" },
    { value: "MONTHLY", label: "Bulanan" },
    { value: "YEARLY", label: "Tahunan" },
  ];

  return (
    <div className="space-y-6 print-container">
      {/* Formal PDF Header (Only visible in Print mode) */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black print-serif">LAPORAN KEUANGAN BIMBEL</h1>
        <p className="text-black text-base font-semibold mt-1 print-serif">{academyName}</p>
        <p className="text-black text-xs mt-1 print-serif">
          Periode Laporan: <strong>{formatPeriodText(startDate, endDate)}</strong> | Tanggal Cetak: {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })} WIB
        </p>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Keuangan Bimbel</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan performa pendapatan dari siswa.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Download size={16} /> Excel (CSV)
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none no-print transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Filter Rentang Waktu</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilih rentang tanggal untuk ekspor CSV dan laporan cetak PDF.</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Semua Waktu" },
              { id: "THIS_MONTH", label: "Bulan Ini" },
              { id: "LAST_MONTH", label: "Bulan Lalu" },
              { id: "30_DAYS", label: "30 Hari Terakhir" },
              { id: "THIS_YEAR", label: "Tahun Ini" },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  quickPreset === p.id 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30" 
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs & Summary Indicator */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setQuickPreset("CUSTOM");
                }}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setQuickPreset("CUSTOM");
                }}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => applyPreset("ALL")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Reset Filter"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Menampilkan: <strong className="text-slate-800 dark:text-slate-200">{filteredInvoices.length}</strong> transaksi ({formatRupiah(filteredTotalRevenue)})
            </span>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide Sidebar and Nav */
          body * { visibility: hidden; }
          .print-container, .print-container * { 
            visibility: visible; 
            color: black !important;
            border-color: #e2e8f0 !important;
          }
          .print-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 20px;
          }
          .no-print { display: none !important; }
          
          /* Formal Serif Font */
          .print-serif, .print-container { font-family: "Times New Roman", Times, serif !important; }
          
          /* Simplify Cards */
          .print-card { 
            box-shadow: none !important; 
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            background: white !important;
          }

          /* Hide UI Dashboard elements to show only narrative in print */
          .print-card, .print-chart-wrapper { display: none !important; }
          
          /* Simplify Table */
          .print-table, .print-table .overflow-x-auto { 
            border: none !important; 
            border-radius: 0 !important; 
            box-shadow: none !important; 
            background: transparent !important; 
            overflow: visible !important; 
            display: block !important;
          }
          .print-table table { display: table !important; width: 100% !important; }
          .print-table th, .print-table td { border-bottom: 1px solid #000 !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          .print-table tr { page-break-inside: avoid; break-inside: avoid; }
          .print-table thead { display: table-header-group; }
        }
        @page {
          margin: 1cm;
          size: auto;
        }
      `}} />

      {/* Narrative Report (Only visible in Print mode) */}
      <div className="hidden print:block text-black print-serif leading-relaxed text-justify mb-8">
        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2">1. Ringkasan Eksekutif</h2>
        <p className="mb-4">
          Dokumen ini merupakan laporan resmi pendapatan institusi pendidikan <strong>{academyName}</strong> untuk periode <strong>{formatPeriodText(startDate, endDate)}</strong> yang dicetak pada <strong>{format(new Date(), "dd MMMM yyyy", { locale: localeId })}</strong>. 
          Laporan ini menguraikan arus kas masuk yang dihasilkan dari pembayaran biaya pendidikan dan program siswa.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">2. Tinjauan Pendapatan</h2>
        <p className="mb-4">
          Selama periode <strong>{formatPeriodText(startDate, endDate)}</strong>, institusi berhasil mencatat total <strong>{filteredInvoices.length} transaksi selesai</strong> dengan akumulasi pendapatan kotor sebesar <strong>{formatRupiah(filteredTotalRevenue)}</strong>.
          Total siswa aktif terdaftar saat ini berjumlah <strong>{activeStudentsCount} siswa</strong>, dengan estimasi total piutang/tunggakan tercatat sebesar <strong>{formatRupiah(outstandingRevenue)}</strong>.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">3. Alokasi Pendapatan per Program</h2>
        <p className="mb-4">
          Rincian berikut menggambarkan distribusi pendapatan di berbagai program pendidikan yang ditawarkan oleh institusi pada periode ini:
        </p>
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr>
              <th className="border border-black px-4 py-2 text-left bg-gray-100">Nama Program</th>
              <th className="border border-black px-4 py-2 text-right bg-gray-100">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredProgramRevenueData.map((prog, idx) => (
              <tr key={idx}>
                <td className="border border-black px-4 py-2">{prog.name}</td>
                <td className="border border-black px-4 py-2 text-right font-bold">{formatRupiah(prog.value)}</td>
              </tr>
            ))}
            {filteredProgramRevenueData.length === 0 && (
              <tr>
                <td colSpan={2} className="border border-black px-4 py-2 text-center">Belum ada pendapatan program yang tercatat pada periode ini.</td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">4. Buku Besar Transaksi (Rincian)</h2>
        <p className="mb-4">
          Selama periode <strong>{formatPeriodText(startDate, endDate)}</strong>, sebanyak <strong>{filteredInvoices.length} transaksi selesai</strong> telah tercatat pada sistem. Rincian dari setiap transaksi dilampirkan pada tabel di bawah ini.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Revenue */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 rounded-3xl shadow-xl shadow-purple-500/30 flex items-center gap-5 print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <TrendingUp size={28} className="text-white" />
          </div>
          <div className="flex-1 relative z-10">
            <p className="text-sm font-medium text-white/80">
              {startDate || endDate ? "Pendapatan Periode Terpilih" : "Total Pendapatan Terakumulasi"}
            </p>
            <div className="flex items-end gap-3 mt-1">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {formatRupiah(filteredTotalRevenue)}
              </h3>
            </div>
            <p className="text-xs text-white/70 mt-1">
              {filteredInvoices.length} transaksi selesai
            </p>
          </div>
        </div>
        
        {/* Card 2: Active Students */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-6 rounded-3xl shadow-xl shadow-teal-500/30 flex items-center gap-5 print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <Users size={28} className="text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">Total Siswa Aktif</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              {activeStudentsCount} Siswa
            </h3>
          </div>
        </div>

        {/* Card 3: Outstanding Revenue */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 rounded-3xl shadow-xl shadow-orange-500/30 flex items-center gap-5 print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <TrendingUp size={28} className="text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">Total Piutang / Tunggakan</p>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1">
              {formatRupiah(outstandingRevenue)}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none print-chart-wrapper transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tren Pendapatan</h3>
            <div className="w-40 no-print">
              <CustomSelect
                options={periodOptions}
                value={period}
                onChange={(val) => setPeriod(val as PeriodFilter)}
              />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dx={-10} />
                <RechartsTooltip 
                  formatter={(value: any) => [formatRupiah(value), 'Pendapatan']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
                  cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none print-chart-wrapper transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Pendapatan per Program</h3>
          <div className="h-[280px]">
            {filteredProgramRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredProgramRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {filteredProgramRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Tidak ada data pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table of Latest Transactions */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden print-table mt-8">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 no-print">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Rincian Transaksi Pendapatan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Tanggal</th>
                <th className="px-6 py-4 font-bold tracking-wider">ID Transaksi</th>
                <th className="px-6 py-4 font-bold tracking-wider">Nama Siswa</th>
                <th className="px-6 py-4 font-bold tracking-wider">Program / Rincian</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Tidak ada transaksi pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400 dark:text-slate-500">
                      {inv.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {inv.student_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {inv.items && inv.items.length > 0
                        ? inv.items.map(it => it.description).join(", ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(inv.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
