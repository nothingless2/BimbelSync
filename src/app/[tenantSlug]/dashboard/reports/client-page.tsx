"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileText, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Printer, Calendar, RotateCcw, AlertCircle, Receipt } from "lucide-react";
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
  academyLogoUrl = null,
  academyPhone = null,
  programRevenueData: initialProgramRevenueData,
  invoices,
  activeStudentsCount,
  thisMonthRevenue,
  growthPercentage,
  outstandingRevenue,
  tenantSlug
}: {
  academyName?: string;
  academyLogoUrl?: string | null;
  academyPhone?: string | null;
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

  const formatCompactRupiah = (val: number) => {
    if (val === 0) return "Rp 0";
    if (val >= 1_000_000_000) {
      const b = val / 1_000_000_000;
      return `Rp ${b % 1 === 0 ? b : b.toFixed(1).replace('.', ',')} M`;
    }
    if (val >= 1_000_000) {
      const m = val / 1_000_000;
      return `Rp ${m % 1 === 0 ? m : m.toFixed(1).replace('.', ',')} jt`;
    }
    if (val >= 1_000) {
      const k = val / 1_000;
      return `Rp ${k % 1 === 0 ? k : k.toFixed(1).replace('.', ',')} rb`;
    }
    return `Rp ${val}`;
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan Keuangan Bimbel</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan performa pendapatan dari siswa.</p>
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
            <div className="w-44">
              <CustomSelect
                value={quickPreset.startsWith("MONTH_") ? quickPreset.replace("MONTH_", "") : ""}
                onChange={(val) => handleSelectMonth(val)}
                placeholder="Pilih Bulan..."
                options={[
                  { value: "", label: "Semua Bulan" },
                  ...availableMonths.map((m) => {
                    const [year, month] = m.split("-").map(Number);
                    const date = new Date(year, month - 1, 1);
                    return {
                      value: m,
                      label: format(date, "MMMM yyyy", { locale: localeId }),
                    };
                  }),
                ]}
              />
            </div>
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

      {/* Print Specific CSS: Modern Corporate Layout with Natural Multi-Page Pagination */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 14mm 15mm 15mm 15mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: static !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .no-print, header, aside, nav {
            display: none !important;
          }
          table {
            page-break-inside: auto;
            border-collapse: collapse;
            width: 100%;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}} />

      {/* Dedicated Modern Corporate Financial Report */}
      <div className="hidden print:block text-slate-900 font-sans leading-normal">
        {/* Document Header */}
        <div className="pb-5 mb-5 border-b-2 border-slate-800">
          <div className="flex justify-between items-start gap-6">
            {/* Left: Academy Identification & Logo */}
            <div className="space-y-2 max-w-[55%]">
              {academyLogoUrl ? (
                <div className="mb-2">
                  <img 
                    src={academyLogoUrl} 
                    alt={academyName} 
                    className="max-h-12 w-auto max-w-[180px] object-contain"
                  />
                </div>
              ) : null}
              <div>
                <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Dokumen Resmi Keuangan
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {academyName}
                </h1>
                {academyPhone && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kontak: {academyPhone}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Platform Manajemen Bimbingan Belajar BimbelSync
                </p>
              </div>
            </div>

            {/* Right: Report Title & Period Details */}
            <div className="text-right space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                LAPORAN KEUANGAN
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Penerimaan Pembayaran & Kas Masuk
              </p>
              <div className="pt-2 space-y-0.5 text-xs text-slate-600">
                <p>
                  <span className="text-slate-400">Periode: </span>
                  <span className="font-semibold text-slate-800">{formatPeriodText(startDate, endDate)}</span>
                </p>
                <p>
                  <span className="text-slate-400">Tanggal Terbit: </span>
                  <span className="font-medium text-slate-700">{format(new Date(), "dd MMMM yyyy, HH:mm 'WIB'", { locale: localeId })}</span>
                </p>
                <p className="font-mono text-[10px] text-slate-400">
                  REF: FIN/{tenantSlug.toUpperCase()}/{format(new Date(), "yyyyMMdd-HHmm")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="mb-6 break-inside-avoid">
          <div className="grid grid-cols-3 gap-3">
            {/* KPI 1: Total Pendapatan */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Pendapatan (Lunas)
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {formatRupiah(filteredTotalRevenue)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Penerimaan terverifikasi lunas
              </p>
            </div>

            {/* KPI 2: Jumlah Transaksi */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Jumlah Transaksi Berhasil
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {filteredInvoices.length} Transaksi
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Faktur lunas pada periode ini
              </p>
            </div>

            {/* KPI 3: Rata-rata per Transaksi */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rata-rata Transaksi (ARPU)
              </span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {formatRupiah(filteredInvoices.length > 0 ? Math.round(filteredTotalRevenue / filteredInvoices.length) : 0)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Nilai rata-rata pembayaran per siswa
              </p>
            </div>
          </div>
        </div>

        {/* Section I: Alokasi Pendapatan per Program */}
        <div className="mb-7 break-inside-avoid">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-300 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              I. Alokasi Pendapatan per Program
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              Distribusi penerimaan berdasarkan program bimbingan belajar
            </span>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-y border-slate-300">
                <th className="py-2 px-3 text-left">Nama Program</th>
                <th className="py-2 px-3 text-center w-28">Porsi (%)</th>
                <th className="py-2 px-3 text-right w-44">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgramRevenueData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 px-3 text-center text-slate-500 italic border-b border-slate-200">
                    Belum ada pendapatan program yang tercatat pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredProgramRevenueData.map((prog, idx) => {
                  const sharePercent = filteredTotalRevenue > 0
                    ? ((prog.value / filteredTotalRevenue) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={idx} className="border-b border-slate-200/80 even:bg-slate-50/40">
                      <td className="py-2 px-3 text-slate-800 font-medium break-words">{prog.name}</td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600">{sharePercent}%</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 tabular-nums">
                        {formatRupiah(prog.value)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredProgramRevenueData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 text-xs border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2 px-3 text-left uppercase tracking-wider">
                    Total Pendapatan Seluruh Program
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatRupiah(filteredTotalRevenue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Section II: Buku Besar Transaksi */}
        <div className="mb-6">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-300 mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              II. Buku Besar Transaksi (General Ledger)
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              Total {filteredInvoices.length} baris transaksi
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2.5">
            Daftar seluruh transaksi pembayaran yang telah diselesaikan oleh siswa selama periode pelaporan untuk keperluan audit dan pembukuan internal.
          </p>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[9.5px] font-bold uppercase tracking-wider border-y border-slate-300">
                <th className="py-2 px-2.5 text-left w-36">Tanggal & Waktu</th>
                <th className="py-2 px-2.5 text-left w-24">No. Faktur</th>
                <th className="py-2 px-2.5 text-left w-40">Nama Siswa</th>
                <th className="py-2 px-2.5 text-left">Program / Rincian Biaya</th>
                <th className="py-2 px-2.5 text-right w-32">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-slate-500 font-medium text-xs border-b border-slate-200">
                    Tidak ada rincian transaksi pada rentang tanggal yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invoiceCode = `INV-${inv.id.slice(0, 8).toUpperCase()}`;
                  const details = inv.items && inv.items.length > 0
                    ? inv.items.map(it => it.description).join(", ")
                    : "Tagihan SPP Siswa";

                  return (
                    <tr key={inv.id} className="border-b border-slate-200/80 even:bg-slate-50/40 text-[10.5px]">
                      <td className="py-2 px-2.5 text-slate-700 whitespace-nowrap font-mono text-[10px]">
                        {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })} WIB
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[10px] font-semibold text-slate-600 whitespace-nowrap" title={inv.id}>
                        {invoiceCode}
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-900 break-words">
                        {inv.student_name}
                      </td>
                      <td className="py-2 px-2.5 text-slate-600 leading-snug break-words">
                        {details}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatRupiah(inv.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredInvoices.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 text-xs border-t-2 border-slate-400">
                  <td colSpan={4} className="py-2 px-2.5 text-right uppercase tracking-wider">
                    Total Pendapatan ({filteredInvoices.length} Transaksi):
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {formatRupiah(filteredTotalRevenue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Document Signoff & Corporate Footer */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end text-[10px] text-slate-500 break-inside-avoid">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-700">Diverifikasi & Diterbitkan Oleh:</p>
            <p className="text-slate-800 font-medium">{academyName} • BimbelSync Financial Cloud</p>
            <p className="text-[9px] text-slate-400">
              Dokumen ini dihasilkan secara otomatis dan memiliki validitas hukum pembukuan internal.
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-semibold text-slate-700">Waktu Cetak:</p>
            <p className="text-slate-800 font-medium">
              {format(new Date(), "dd MMMM yyyy, HH:mm:ss 'WIB'", { locale: localeId })}
            </p>
            <p className="font-mono text-[9px] text-slate-400">
              Dokumen Keuangan • Halaman Resmi
            </p>
          </div>
        </div>
      </div>

      {/* Screen Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
        {/* Card 1: Revenue */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-700 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">
              {startDate || endDate ? "Pendapatan Periode Terpilih" : "Total Pendapatan Terakumulasi"}
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatRupiah(filteredTotalRevenue)}
            </p>
            <p className="text-xs font-medium text-blue-200 mt-2">
              {filteredInvoices.length} transaksi selesai
            </p>
          </div>
        </div>
        
        {/* Card 2: Active Students */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 border border-emerald-600 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <Users size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-2">
              Total Siswa Aktif
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {activeStudentsCount} Siswa
            </p>
            <p className="text-xs font-medium text-emerald-100 mt-2">
              Terdaftar aktif saat ini
            </p>
          </div>
        </div>

        {/* Card 3: Outstanding Revenue */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 border border-rose-600 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-white/10 transition-transform group-hover:scale-110 pointer-events-none">
            <Receipt size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-rose-100 uppercase tracking-wider mb-2">
              Total Piutang / Tunggakan
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatRupiah(outstandingRevenue)}
            </p>
            <p className="text-xs font-medium text-rose-100 mt-2">
              Tagihan belum lunas
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print-chart-wrapper">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tren Pendapatan</h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-900/40" />
                  <span>Pendapatan Tagihan Lunas</span>
                </span>
              </div>
            </div>
            <div className="w-40 no-print">
              <CustomSelect
                options={periodOptions}
                value={period}
                onChange={(val) => setPeriod(val as PeriodFilter)}
              />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 15 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.85}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} dy={10} />
                <YAxis 
                  width={80}
                  tickFormatter={formatCompactRupiah} 
                  tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-4} 
                />
                <RechartsTooltip 
                  formatter={(value: any) => [formatRupiah(value), 'Pendapatan']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
                    backgroundColor: '#ffffff',
                    padding: '10px 14px',
                    fontSize: '12px'
                  }}
                  cursor={{fill: 'rgba(37, 99, 235, 0.04)'}}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                />
                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print-chart-wrapper">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Pendapatan per Program</h3>
          <div className="h-[300px]">
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

      {/* Table of Latest Transactions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden no-print mt-8">
        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 no-print">
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
            {filteredInvoices.length > 0 && (
              <tfoot className="bg-slate-50/80 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                    Total ({filteredInvoices.length} Transaksi):
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatRupiah(filteredTotalRevenue)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
    </div>
  );
}
