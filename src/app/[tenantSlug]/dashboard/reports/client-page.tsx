"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileText, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react";
import { format, startOfWeek, subWeeks, subMonths, subYears, getWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";

type ProgramData = {
  name: string;
  value: number;
};

type InvoiceData = {
  id: string;
  student_name: string;
  amount: number;
  paid_at: string;
};

type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export default function TenantReportsClientPage({
  programRevenueData,
  invoices,
  activeStudentsCount,
  thisMonthRevenue,
  growthPercentage,
  tenantSlug
}: {
  programRevenueData: ProgramData[];
  invoices: InvoiceData[];
  activeStudentsCount: number;
  thisMonthRevenue: number;
  growthPercentage: number;
  tenantSlug: string;
}) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTHLY");
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

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
      invoices.forEach(inv => {
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
      invoices.forEach(inv => {
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
      invoices.forEach(inv => {
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
      invoices.forEach(inv => {
        const d = new Date(inv.paid_at);
        const key = format(d, "yyyy");
        if (dataMap[key] !== undefined) dataMap[key] += inv.amount;
      });
    }

    return labels.map(label => ({
      label,
      revenue: dataMap[label]
    }));
  }, [invoices, period]);

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date Paid", "Student Name", "Revenue (Rp)"];
    const rows = invoices.map(inv => [
      inv.id,
      format(new Date(inv.paid_at), "dd MMM yyyy HH:mm", { locale: localeId }),
      `"${inv.student_name}"`,
      inv.amount
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
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
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black print-serif">FINANCIAL REPORT</h1>
        <p className="text-black text-sm mt-1 print-serif">Generated on: {format(new Date(), "dd MMMM yyyy", { locale: localeId })}</p>
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
          .print-table { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; }
          .print-table th, .print-table td { border-bottom: 1px solid #000 !important; }
        }
      `}} />

      {/* Narrative Report (Only visible in Print mode) */}
      <div className="hidden print:block text-black print-serif leading-relaxed text-justify mb-8">
        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2">1. Ringkasan Eksekutif</h2>
        <p className="mb-4">
          Dokumen ini merupakan laporan resmi pendapatan institusi pendidikan hingga <strong>{format(new Date(), "dd MMMM yyyy", { locale: localeId })}</strong>. 
          Laporan ini menguraikan arus kas masuk yang dihasilkan dari pembayaran biaya pendidikan dan langganan program siswa.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">2. Tinjauan Pendapatan</h2>
        <p className="mb-4">
          Untuk bulan berjalan, institusi berhasil mencatat total pendapatan kotor sebesar <strong>{formatRupiah(thisMonthRevenue)}</strong>. 
          {growthPercentage !== 0 && (
            <span> Angka ini menunjukkan <strong>{Math.abs(growthPercentage).toFixed(2)}% {growthPercentage > 0 ? "pertumbuhan positif (kenaikan)" : "pertumbuhan negatif (penurunan)"}</strong> dibandingkan dengan performa keuangan bulan sebelumnya. </span>
          )}
          Total siswa aktif yang berkontribusi terhadap pendapatan saat ini berjumlah <strong>{activeStudentsCount} siswa</strong>.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">3. Alokasi Pendapatan per Program</h2>
        <p className="mb-4">
          Rincian berikut menggambarkan distribusi pendapatan di berbagai program pendidikan yang ditawarkan oleh institusi:
        </p>
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr>
              <th className="border border-black px-4 py-2 text-left bg-gray-100">Nama Program</th>
              <th className="border border-black px-4 py-2 text-right bg-gray-100">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {programRevenueData.map((prog, idx) => (
              <tr key={idx}>
                <td className="border border-black px-4 py-2">{prog.name}</td>
                <td className="border border-black px-4 py-2 text-right font-bold">{formatRupiah(prog.value)}</td>
              </tr>
            ))}
            {programRevenueData.length === 0 && (
              <tr>
                <td colSpan={2} className="border border-black px-4 py-2 text-center">Belum ada pendapatan program yang tercatat.</td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">4. Buku Besar Transaksi (Rincian)</h2>
        <p className="mb-4">
          Selama periode yang dilaporkan, sebanyak <strong>{invoices.length} transaksi selesai</strong> telah tercatat pada sistem. Rincian dari setiap transaksi dilampirkan pada tabel di bawah ini.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 print-card">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 no-print">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendapatan Bulan Ini</p>
            <div className="flex items-end gap-3 mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatRupiah(thisMonthRevenue)}
              </h3>
              {growthPercentage !== 0 && (
                <span className={`flex items-center text-xs font-medium mb-1.5 no-print ${growthPercentage > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {growthPercentage > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(growthPercentage).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 print-card">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 no-print">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Siswa Aktif</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeStudentsCount} Siswa
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print-chart-wrapper">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tren Pendapatan</h3>
            <div className="w-40 no-print">
              <CustomSelect
                options={periodOptions}
                value={period}
                onChange={(val) => setPeriod(val as PeriodFilter)}
              />
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  formatter={(value: any) => [formatRupiah(value), 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print-chart-wrapper">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Pendapatan per Program</h3>
          <div className="h-[250px]">
            {programRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={programRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {programRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No revenue data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table of Latest Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden print-table mt-8">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 no-print">
          <h3 className="font-bold text-slate-900 dark:text-white">Rincian Transaksi Pendapatan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">ID Transaksi</th>
                <th className="px-6 py-4 font-semibold">Nama Siswa</th>
                <th className="px-6 py-4 font-semibold text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Tidak ada rincian transaksi.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-3 font-medium text-slate-500 print:text-black">
                      {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 print:border-none print:bg-transparent">
                        {inv.id.substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 print:text-black">{inv.student_name}</td>
                    <td className="px-6 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-right print:text-black">
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
