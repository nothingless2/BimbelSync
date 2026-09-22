import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportsClientPage from "./client-page";

export default async function SuperadminReportsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  try {
    const now = new Date();
    
    const [allAcademies, invoices] = await Promise.all([
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: { plan: true },
      }),
      prisma.platformInvoice.findMany({
        where: { 
          academy: { deleted_at: null },
          payment_status: "PAID",
          paid_at: { not: null }
        },
        include: { plan: true, academy: true },
        orderBy: { paid_at: "asc" },
      })
    ]);

    // 1. Revenue over time (Last 12 months)
    const revenueMap: Record<string, number> = {};
    const subscriptionGrowthMap: Record<string, number> = {};
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      revenueMap[key] = 0;
      subscriptionGrowthMap[key] = 0;
    }

    invoices.forEach(inv => {
      if (!inv.paid_at) return;
      const d = new Date(inv.paid_at);
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      if (revenueMap[key] !== undefined) {
        revenueMap[key] += inv.amount;
      }
    });

    const firstInvoicePerAcademy: Record<string, Date> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.paid_at!);
      if (!firstInvoicePerAcademy[inv.academy_id] || d < firstInvoicePerAcademy[inv.academy_id]) {
        firstInvoicePerAcademy[inv.academy_id] = d;
      }
    });
    
    Object.values(firstInvoicePerAcademy).forEach((d) => {
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      if (subscriptionGrowthMap[key] !== undefined) {
        subscriptionGrowthMap[key]++;
      }
    });

    let cumulativeSubscribers = 0;
    const chartData = Object.keys(revenueMap).map(month => {
      cumulativeSubscribers += subscriptionGrowthMap[month];
      return {
        month,
        revenue: revenueMap[month],
        newSubscribers: subscriptionGrowthMap[month],
        totalSubscribers: cumulativeSubscribers
      };
    });

    // 2. Plan Revenue Distribution
    const planRevenueMap: Record<string, number> = {};
    invoices.forEach(inv => {
      planRevenueMap[inv.plan.name] = (planRevenueMap[inv.plan.name] || 0) + inv.amount;
    });
    const planRevenueData = Object.entries(planRevenueMap).map(([name, value]) => ({ name, value }));

    // Serialize invoices for table
    const serializedInvoices = invoices.map(inv => ({
      id: inv.id,
      academy_name: inv.academy.name,
      plan_name: inv.plan.name,
      amount: inv.amount,
      paid_at: inv.paid_at!.toISOString(),
    })).sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

    return (
      <ReportsClientPage 
        chartData={chartData}
        planRevenueData={planRevenueData}
        invoices={serializedInvoices}
      />
    );
  } catch (error) {
    console.error("ReportsPage error:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat data laporan.</p>
      </div>
    );
  }
}
