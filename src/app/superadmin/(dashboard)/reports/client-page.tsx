"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, FileText, Printer } from "lucide-react";
import { format, startOfWeek, subWeeks, subMonths, subYears, getWeek } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CustomSelect } from "@/components/ui/custom-select";

type ProgramData = {
  name: string;
  value: number;
};

type InvoiceData = {
  id: string;
  academy_id: string;
  academy_name: string;
  plan_name: string;
  amount: number;
  paid_at: string;
};

type PeriodFilter = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export default function ReportsClientPage({
  planRevenueData,
  invoices,
  arpu,
  churnRate
}: {
  planRevenueData: ProgramData[];
  invoices: InvoiceData[];
  arpu: number;
  churnRate: number;
}) {
  const [period, setPeriod] = useState<PeriodFilter>("MONTHLY");
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Dynamic Chart Data Generation
  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap: Record<string, { revenue: number, newSubscribers: number }> = {};
    const labels: string[] = [];

    // Pre-calculate the first invoice date for each academy to determine when they became a "new subscriber"
    const firstInvoicePerAcademy: Record<string, Date> = {};
    invoices.forEach((inv) => {
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

    invoices.forEach(inv => {
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
  }, [invoices, period]);

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date Paid", "Academy Name", "Plan", "Revenue (Rp)"];
    const rows = invoices.map(inv => [
      inv.id,
      format(new Date(inv.paid_at), "dd MMM yyyy HH:mm", { locale: localeId }),
      `"${inv.academy_name}"`, // Quote to avoid comma issues
      `"${inv.plan_name}"`,
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
    link.setAttribute("download", `platform_report_${format(new Date(), 'yyyyMMdd')}.csv`);
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
        <h1 className="text-2xl font-bold uppercase tracking-widest text-black print-serif">PLATFORM FINANCIAL REPORT</h1>
        <p className="text-black text-sm mt-1 print-serif">BimbelSync | Generated on: {format(new Date(), "dd MMMM yyyy", { locale: localeId })}</p>
      </div>

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

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
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

          /* Hide UI Dashboard elements to show only narrative in print */
          .print-card, .print-chart-wrapper { display: none !important; }
          
          /* Simplify Table */
          .print-table { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; overflow: visible !important; }
          .print-table th, .print-table td { border-bottom: 1px solid #000 !important; padding-top: 8px !important; padding-bottom: 8px !important; }
          .print-table tr { page-break-inside: avoid; break-inside: avoid; }
          .print-table thead { display: table-header-group; }
        }
      `}} />

      {/* Narrative Report (Only visible in Print mode) */}
      <div className="hidden print:block text-black print-serif leading-relaxed text-justify mb-8">
        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2">1. Ringkasan Eksekutif</h2>
        <p className="mb-4">
          Dokumen ini merupakan laporan resmi pendapatan platform <strong>BimbelSync</strong> per <strong>{format(new Date(), "dd MMMM yyyy", { locale: localeId })}</strong>. 
          Laporan ini merincikan performa keuangan dan arus kas langganan yang masuk dari berbagai institusi pendidikan (bimbel) yang berafiliasi.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">2. Tinjauan Pendapatan Langganan</h2>
        <p className="mb-4">
          Platform telah mengakumulasikan total <strong>{invoices.length} transaksi langganan lunas</strong> selama periode pelaporan yang dipilih. 
          Rincian berikut menyoroti kontribusi pendapatan yang dipetakan berdasarkan paket berlangganan (*SaaS*) yang ditawarkan kepada bimbel.
        </p>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">3. Alokasi Pendapatan per Paket Langganan</h2>
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr>
              <th className="border border-black px-4 py-2 text-left bg-gray-100">Paket Langganan</th>
              <th className="border border-black px-4 py-2 text-right bg-gray-100">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {planRevenueData.map((prog, idx) => (
              <tr key={idx}>
                <td className="border border-black px-4 py-2">{prog.name}</td>
                <td className="border border-black px-4 py-2 text-right font-bold">{formatRupiah(prog.value)}</td>
              </tr>
            ))}
            {planRevenueData.length === 0 && (
              <tr>
                <td colSpan={2} className="border border-black px-4 py-2 text-center">Belum ada pendapatan paket yang tercatat.</td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="text-xl font-bold mb-4 uppercase border-b border-black pb-2 mt-6">4. Buku Besar Transaksi Platform</h2>
        <p className="mb-4">
          Daftar lengkap seluruh tagihan (invoice) yang telah diselesaikan dan pembayaran langganan yang diterima dari bimbel terkait dicatat di bawah ini untuk keperluan audit dan kepatuhan.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 rounded-3xl shadow-xl shadow-purple-500/30 flex flex-col justify-center print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-sm font-medium text-white/80 relative z-10">Total Pendapatan Platform</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1 relative z-10">
            {formatRupiah(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
          </h3>
        </div>

        {/* ARPU */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-cyan-600 to-teal-500 p-6 rounded-3xl shadow-xl shadow-cyan-500/30 flex flex-col justify-center print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-sm font-medium text-white/80 relative z-10">ARPU (Rata-rata Pendapatan per User)</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1 relative z-10">
            {formatRupiah(arpu)}
          </h3>
        </div>

        {/* Churn Rate */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-6 rounded-3xl shadow-xl shadow-red-500/30 flex flex-col justify-center print-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/40 border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-sm font-medium text-white/80 relative z-10">Tingkat Churn (Churn Rate)</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight mt-1 relative z-10">
            {churnRate.toFixed(1)}%
          </h3>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none print-chart-wrapper transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pertumbuhan Platform</h3>
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
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlatformSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
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
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPlatformRev)" activeDot={{r: 6}} animationDuration={1500} />
                <Area yAxisId="right" type="monotone" dataKey="totalSubscribers" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPlatformSub)" activeDot={{r: 6}} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-none print-chart-wrapper transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Pendapatan per Paket</h3>
          <div className="h-[280px]">
            {planRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planRevenueData.map((entry, index) => (
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
                No revenue data available
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
                <th className="px-6 py-4 font-bold tracking-wider">Nama Bimbel</th>
                <th className="px-6 py-4 font-bold tracking-wider">Paket</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">Tidak ada rincian transaksi.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                      {inv.academy_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800/50">
                        {inv.plan_name}
                      </span>
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
