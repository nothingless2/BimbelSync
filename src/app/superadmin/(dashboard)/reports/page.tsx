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

    // Removed static chartData logic. It will be computed on the client.

    // 2. Plan Revenue Distribution
    const planRevenueMap: Record<string, number> = {};
    invoices.forEach(inv => {
      planRevenueMap[inv.plan.name] = (planRevenueMap[inv.plan.name] || 0) + inv.amount;
    });
    const planRevenueData = Object.entries(planRevenueMap).map(([name, value]) => ({ name, value }));

    // 3. SaaS Metrics
    const totalAcademies = allAcademies.length;
    const churnedAcademies = allAcademies.filter(a => a.subscription_status === "SUSPENDED" || a.subscription_status === "EXPIRED_TRIAL").length;
    const churnRate = totalAcademies > 0 ? (churnedAcademies / totalAcademies) * 100 : 0;
    
    const paidAcademiesSet = new Set(invoices.map(inv => inv.academy_id));
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const arpu = paidAcademiesSet.size > 0 ? totalRevenue / paidAcademiesSet.size : 0;

    // Serialize invoices for table
    const serializedInvoices = invoices.map(inv => ({
      id: inv.id,
      academy_id: inv.academy_id,
      academy_name: inv.academy.name,
      plan_name: inv.plan.name,
      amount: inv.amount,
      paid_at: inv.paid_at!.toISOString(),
    })).sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

    return (
      <ReportsClientPage 
        planRevenueData={planRevenueData}
        invoices={serializedInvoices}
        arpu={arpu}
        churnRate={churnRate}
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
