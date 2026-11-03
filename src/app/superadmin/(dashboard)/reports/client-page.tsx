"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileText, Printer, Calendar, RotateCcw, TrendingUp, CreditCard, UserMinus, Search } from "lucide-react";
import { format, startOfWeek, subWeeks, subMonths, subYears, getWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";
import { toast } from "@/components/ui/sonner";
import { Pagination } from "@/components/ui/pagination";

type ProgramData = {
  name: string;
  value: number;
};

type InvoiceData = {
  id: string;
  academy_id: string;
  academy_name: string;
  academy_path_url?: string;
  plan_name: string;
  billing_period?: string;
  amount: number;
  due_date?: string;
  paid_at: string;
  payment_status?: string;
  verified_by?: { name: string | null; email: string } | null;
};

type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export default function ReportsClientPage({
  planRevenueData: initialPlanRevenueData,
  invoices,
  arpu: initialArpu,
  churnRate
}: {
  planRevenueData: ProgramData[];
  invoices: InvoiceData[];
  arpu: number;
  churnRate: number;
}) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTHLY");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [quickPreset, setQuickPreset] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const itemsPerPage = 10;

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
    setCurrentPage(1);
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

  // Filtered invoices by date range
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

  // Recalculate plan revenue data dynamically based on filtered invoices
  const filteredPlanRevenueData = useMemo(() => {
    const planMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      planMap[inv.plan_name] = (planMap[inv.plan_name] || 0) + inv.amount;
    });
    return Object.entries(planMap).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  // Recalculate total revenue and ARPU based on filtered data
  const filteredTotalRevenue = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }, [filteredInvoices]);

  const filteredArpu = useMemo(() => {
    const paidAcademiesSet = new Set(filteredInvoices.map(inv => inv.academy_id));
    return paidAcademiesSet.size > 0 ? filteredTotalRevenue / paidAcademiesSet.size : 0;
  }, [filteredInvoices, filteredTotalRevenue]);

  // Filtered by Search query for the table view
  const searchedInvoices = useMemo(() => {
    if (!searchQuery.trim()) return filteredInvoices;
    const q = searchQuery.toLowerCase().trim();
    return filteredInvoices.filter(inv =>
      inv.academy_name.toLowerCase().includes(q) ||
      (inv.academy_path_url && inv.academy_path_url.toLowerCase().includes(q)) ||
      inv.plan_name.toLowerCase().includes(q)
    );
  }, [filteredInvoices, searchQuery]);

  const searchedTotalRevenue = useMemo(() => {
    return searchedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  }, [searchedInvoices]);

  const totalPages = Math.ceil(searchedInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return searchedInvoices.slice(start, start + itemsPerPage);
  }, [searchedInvoices, currentPage, itemsPerPage]);

  // Dynamic Chart Data Generation based on filtered invoices
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, { revenue: number, newSubscribers: number }> = {};
    const labels: string[] = [];

    // Pre-calculate the first invoice date for each academy to determine when they became a "new subscriber"
    const firstInvoicePerAcademy: Record<string, Date> = {};
    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.paid_at);
      if (!firstInvoicePerAcademy[inv.academy_id] || d < firstInvoicePerAcademy[inv.academy_id]) {
        firstInvoicePerAcademy[inv.academy_id] = d;
      }
    });

    const getLabel = (d: Date) => {
      if (period === "DAILY") {
        return format(d, "dd MMM", { locale: localeId });
      } else if (period === "WEEKLY") {
        const wDate = startOfWeek(d, { weekStartsOn: 1 });
        return `Minggu ${getWeek(wDate)}, ${format(wDate, "yy")}`;
      } else if (period === "MONTHLY") {
        return format(d, "MMM yy", { locale: localeId });
      } else {
        return format(d, "yyyy");
      }
    };

    if (period === "DAILY") {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = getLabel(d);
        if (!labels.includes(label)) labels.push(label);
        dataMap[label] = { revenue: 0, newSubscribers: 0 };
      }
    } else if (period === "WEEKLY") {
      for (let i = 11; i >= 0; i--) {
        const d = subWeeks(now, i);
        const label = getLabel(d);
        if (!labels.includes(label)) labels.push(label);
        dataMap[label] = { revenue: 0, newSubscribers: 0 };
      }
    } else if (period === "MONTHLY") {
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        const label = getLabel(d);
        labels.push(label);
        dataMap[label] = { revenue: 0, newSubscribers: 0 };
      }
    } else if (period === "YEARLY") {
      for (let i = 4; i >= 0; i--) {
        const d = subYears(now, i);
        const label = getLabel(d);
        labels.push(label);
        dataMap[label] = { revenue: 0, newSubscribers: 0 };
      }
    }

    filteredInvoices.forEach(inv => {
      const d = new Date(inv.paid_at);
      const label = getLabel(d);
      if (dataMap[label] !== undefined) {
        dataMap[label].revenue += inv.amount;
      }
    });

    Object.values(firstInvoicePerAcademy).forEach((d) => {
      const label = getLabel(d);
      if (dataMap[label] !== undefined) {
        dataMap[label].newSubscribers++;
      }
    });

    let cumulativeSubscribers = 0;
    return labels.map(label => {
      cumulativeSubscribers += dataMap[label].newSubscribers;
      return {
        label,
        revenue: dataMap[label].revenue,
        newSubscribers: dataMap[label].newSubscribers,
        totalSubscribers: cumulativeSubscribers
      };
    });
  }, [filteredInvoices, period]);

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada data transaksi pada rentang waktu yang dipilih untuk diekspor.");
      return;
    }

    const headers = ["Transaction ID", "Date Paid", "Academy Name", "Plan", "Revenue (Rp)"];
    const rows = filteredInvoices.map(inv => [
      inv.id,
      format(new Date(inv.paid_at), "dd MMM yyyy HH:mm", { locale: localeId }),
      `"${inv.academy_name.replace(/"/g, '""')}"`,
      `"${inv.plan_name.replace(/"/g, '""')}"`,
      inv.amount
    ]);
    
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
    link.setAttribute("download", `platform_report_${dateSuffix}.csv`);
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

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    set.add(format(now, "yyyy-MM"));
    set.add(format(subMonths(now, 1), "yyyy-MM"));
    invoices.forEach(inv => {
      const d = new Date(inv.paid_at);
      if (!isNaN(d.getTime())) {
        set.add(format(d, "yyyy-MM"));
      }
    });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const handleSelectMonth = (monthStr: string) => {
    setCurrentPage(1);
    if (!monthStr) {
      applyPreset("ALL");
      return;
    }
    const [y, m] = monthStr.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    setQuickPreset(`MONTH_${monthStr}`);
  };

  const periodOptions = [
    { value: "DAILY", label: "Harian" },
    { value: "WEEKLY", label: "Mingguan" },
    { value: "MONTHLY", label: "Bulanan" },
    { value: "YEARLY", label: "Tahunan" },
  ];

  return (
    <div className="space-y-6 print-container">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Laporan Platform</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan performa pendapatan berlangganan BimbelSync.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} /> Excel (CSV)
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm no-print">
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

          {/* Quick Presets & Month Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
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

            {/* Specific Month Select */}
            <select
              value={quickPreset.startsWith("MONTH_") ? quickPreset.replace("MONTH_", "") : ""}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Pilih Bulan...</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split("-").map(Number);
                const date = new Date(year, month - 1, 1);
                return (
                  <option key={m} value={m}>
                    {format(date, "MMMM yyyy", { locale: localeId })}
                  </option>
                );
              })}
            </select>
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
                  setCurrentPage(1);
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
                  setCurrentPage(1);
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

      {/* Print Specific CSS: Suppress browser default header/footer completely */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: auto;
          margin: 0mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
            color: #000000 !important;
            border-color: #000000 !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20mm 15mm !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-serif {
            font-family: "Times New Roman", Times, serif !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
        }
      `}} />

      {/* Dedicated Clean Print Report (Exactly as requested, only Alokasi Pendapatan & Buku Besar Transaksi) */}
      <div className="hidden print:block text-black print-serif leading-relaxed">
        {/* Judul Besar PDF (Only visible in Print mode) */}
        <div className="text-center mb-6 pb-4 border-b-2 border-black">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black print-serif">
            PLATFORM FINANCIAL REPORT
          </h1>
          <p className="text-sm font-semibold text-black mt-1 print-serif">BimbelSync Platform Management</p>
          <p className="text-xs text-black mt-0.5 print-serif">
            Periode: <strong>{formatPeriodText(startDate, endDate)}</strong>
          </p>
        </div>

        <h2 className="text-lg font-bold mb-3 uppercase border-b border-black pb-1.5 tracking-wide">
          ALOKASI PENDAPATAN PER PAKET LANGGANAN
        </h2>
        <table className="w-full mb-8 border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-black px-4 py-2.5 text-left bg-gray-100 font-bold">Paket Langganan</th>
              <th className="border border-black px-4 py-2.5 text-right bg-gray-100 font-bold">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlanRevenueData.map((prog, idx) => (
              <tr key={idx}>
                <td className="border border-black px-4 py-2">{prog.name}</td>
                <td className="border border-black px-4 py-2 text-right font-medium">{formatRupiah(prog.value)}</td>
              </tr>
            ))}
            {filteredPlanRevenueData.length === 0 && (
              <tr>
                <td colSpan={2} className="border border-black px-4 py-3 text-center text-gray-500">
                  Belum ada pendapatan paket yang tercatat pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
          {filteredPlanRevenueData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black px-4 py-2 text-left uppercase">Total Pendapatan</td>
                <td className="border border-black px-4 py-2 text-right">{formatRupiah(filteredTotalRevenue)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        <h2 className="text-lg font-bold mb-2 uppercase border-b border-black pb-1.5 mt-6 tracking-wide">
          BUKU BESAR TRANSAKSI PLATFORM
        </h2>
        <p className="mb-4 text-xs text-black print-serif">
          Daftar seluruh tagihan (invoice) langganan yang telah diselesaikan oleh bimbel terkait selama periode pelaporan ini dicatat di bawah ini untuk keperluan audit dan kepatuhan.
        </p>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-black px-3 py-2.5 text-left font-bold uppercase tracking-wider bg-gray-100">Tanggal</th>
              <th className="border border-black px-3 py-2.5 text-left font-bold uppercase tracking-wider bg-gray-100">Nama Bimbel</th>
              <th className="border border-black px-3 py-2.5 text-center font-bold uppercase tracking-wider bg-gray-100">Paket</th>
              <th className="border border-black px-3 py-2.5 text-right font-bold uppercase tracking-wider bg-gray-100">Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-black px-4 py-6 text-center text-gray-500 font-medium text-sm">
                  Tidak ada rincian transaksi pada rentang tanggal yang dipilih.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="border border-black px-3 py-2 whitespace-nowrap">
                    {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </td>
                  <td className="border border-black px-3 py-2 font-medium">
                    {inv.academy_name}
                  </td>
                  <td className="border border-black px-3 py-2 text-center">
                    <span className="border border-gray-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {inv.plan_name}
                    </span>
                  </td>
                  <td className="border border-black px-3 py-2 text-right font-medium">
                    {formatRupiah(inv.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredInvoices.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={3} className="border border-black px-3 py-2 text-right uppercase">
                  Total Pendapatan ({filteredInvoices.length} Transaksi):
                </td>
                <td className="border border-black px-3 py-2 text-right">
                  {formatRupiah(filteredTotalRevenue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Screen Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
        {/* Total Revenue */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">
              {startDate || endDate ? "Pendapatan Periode Terpilih" : "Total Pendapatan Platform"}
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatRupiah(filteredTotalRevenue)}
            </p>
            <p className="text-xs font-medium text-blue-200 mt-2">
              {filteredInvoices.length} transaksi lunas
            </p>
          </div>
        </div>

        {/* ARPU */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-600 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <CreditCard size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">
              ARPU (Rata-rata Pendapatan per User)
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatRupiah(filteredArpu)}
            </p>
            <p className="text-xs font-medium text-emerald-100 mt-2">
              Estimasi per akademi aktif
            </p>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 border border-rose-600 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <UserMinus size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-rose-100 uppercase tracking-wider mb-2">
              Tingkat Churn (Churn Rate)
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {churnRate.toFixed(1)}%
            </p>
            <p className="text-xs font-medium text-rose-100 mt-2">
              Rasio bimbel berhenti berlangganan
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print-chart-wrapper">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Pertumbuhan Platform</h3>
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
              <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorPlatformRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatformSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                <YAxis yAxisId="left" tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dx={-10} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dx={10} />
                <RechartsTooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'revenue') return [formatRupiah(value), 'Pendapatan'];
                    if (name === 'totalSubscribers') return [`${value} Bimbel`, 'Total Bimbel'];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlatformRev)" activeDot={{r: 5}} animationDuration={1000} />
                <Area yAxisId="right" type="monotone" dataKey="totalSubscribers" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlatformSub)" activeDot={{r: 5}} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print-chart-wrapper">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Pendapatan per Paket</h3>
          <div className="h-[280px]">
            {filteredPlanRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredPlanRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {filteredPlanRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff' }}
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

      {/* Table of Latest Transactions - Design matches Platform Billing */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden no-print mt-8 flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
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
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total: <strong className="text-slate-800 dark:text-slate-200">{searchedInvoices.length}</strong> transaksi ({formatRupiah(searchedTotalRevenue)})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    Tidak ada transaksi pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, index) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{inv.academy_name}</p>
                      {inv.academy_path_url && (
                        <p className="text-xs text-slate-500 font-mono">/{inv.academy_path_url}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        {inv.plan_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
                      {inv.billing_period 
                        ? format(new Date(inv.billing_period), "MMMM yyyy", { locale: localeId }) 
                        : "-"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {formatRupiah(inv.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {inv.due_date 
                        ? format(new Date(inv.due_date), "dd MMM yyyy", { locale: localeId }) 
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {inv.paid_at 
                        ? format(new Date(inv.paid_at), "dd MMM yyyy", { locale: localeId }) 
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                        Lunas
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.verified_by ? (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {inv.verified_by.name || inv.verified_by.email}
                        </span>
                      ) : (
                        <span className="italic text-slate-300 dark:text-slate-600">–</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {searchedInvoices.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    Total ({searchedInvoices.length} Transaksi)
                  </td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatRupiah(searchedTotalRevenue)}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={searchedInvoices.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
      
    </div>
  );
}
