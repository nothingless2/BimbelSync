"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
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
}: {
  planRevenueData: ProgramData[];
  invoices: InvoiceData[];
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
          .print-table { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; }
          .print-table th, .print-table td { border-bottom: 1px solid #000 !important; }
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print-chart-wrapper">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pertumbuhan Platform</h3>
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
              <LineChart data={chartData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={(val) => `Rp${val/1000}k`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'revenue') return [formatRupiah(value), 'Revenue'];
                    if (name === 'totalSubscribers') return [`${value} Academies`, 'Total Academies'];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                <Line yAxisId="right" type="monotone" dataKey="totalSubscribers" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Revenue Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print-chart-wrapper">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Pendapatan per Paket</h3>
          <div className="h-[250px]">
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
          <h3 className="font-bold text-slate-900 dark:text-white">Riwayat Tagihan Platform (Paid)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Bimbel</th>
                <th className="px-6 py-4 font-semibold">Paket Langganan</th>
                <th className="px-6 py-4 font-semibold text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Tidak ada riwayat transaksi.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-3 font-medium text-slate-500 print:text-black">
                      {format(new Date(inv.paid_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 print:text-black">{inv.academy_name}</td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 print:border-none print:bg-transparent">
                        {inv.plan_name}
                      </span>
                    </td>
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
