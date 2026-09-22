import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import TenantReportsClientPage from "./client-page";
import { format } from "date-fns";

export default async function TenantReportsPage({ 
  params
}: { 
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  try {
    const now = new Date();
    
    // Fetch all paid invoices for this academy
    const invoices = await prisma.invoice.findMany({
      where: {
        academy_id: session.academy_id,
        payment_status: "PAID",
      },
      include: {
        student: true,
        items: true,
        installments: true
      },
      orderBy: { created_at: "asc" }
    });

    const activeStudentsCount = await prisma.student.count({
      where: { academy_id: session.academy_id, deleted_at: null }
    });

    // 1. Revenue over time (Last 6 months)
    const revenueMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "MMM yyyy");
      revenueMap[key] = 0;
    }

    invoices.forEach(inv => {
      // Determine actual paid date (if installment use paid_at, else invoice created_at or due_date approximation)
      // Since invoice doesn't have a direct `paid_at` field (except in installments), we use created_at for FULL payments 
      // or check the latest installment paid_at
      let paidDate = inv.created_at;
      if (inv.payment_option === "INSTALLMENT" && inv.installments.length > 0) {
        const paidInstallments = inv.installments.filter(inst => inst.status === "PAID" && inst.paid_at);
        if (paidInstallments.length > 0) {
          // Sort to get the latest payment date
          paidInstallments.sort((a, b) => b.paid_at!.getTime() - a.paid_at!.getTime());
          paidDate = paidInstallments[0].paid_at!;
        }
      }
      
      const key = format(paidDate, "MMM yyyy");
      if (revenueMap[key] !== undefined) {
        revenueMap[key] += inv.total_amount;
      }
    });

    const chartData = Object.keys(revenueMap).map(month => ({
      month,
      revenue: revenueMap[month]
    }));

    // 2. Program Revenue Distribution
    const programRevenueMap: Record<string, number> = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        // Try to parse "Tagihan SPP - Program Name (Month)"
        let programName = item.description;
        const match = programName.match(/Tagihan SPP - (.*?)( \((.*)\))?$/);
        if (match && match[1]) {
          programName = match[1].trim();
        }
        programRevenueMap[programName] = (programRevenueMap[programName] || 0) + item.amount;
      });
    });

    const programRevenueData = Object.entries(programRevenueMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate growth vs last month
    const thisMonthKey = format(now, "MMM yyyy");
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = format(lastMonthDate, "MMM yyyy");
    
    const thisMonthRevenue = revenueMap[thisMonthKey] || 0;
    const lastMonthRevenue = revenueMap[lastMonthKey] || 0;

    let growthPercentage = 0;
    if (lastMonthRevenue > 0) {
      growthPercentage = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (thisMonthRevenue > 0) {
      growthPercentage = 100;
    }

    // Serialize invoices for table
    const serializedInvoices = invoices.map(inv => {
      // Determine date
      let paidDate = inv.created_at;
      if (inv.payment_option === "INSTALLMENT" && inv.installments.length > 0) {
        const paidInstallments = inv.installments.filter(inst => inst.status === "PAID" && inst.paid_at);
        if (paidInstallments.length > 0) {
          paidInstallments.sort((a, b) => b.paid_at!.getTime() - a.paid_at!.getTime());
          paidDate = paidInstallments[0].paid_at!;
        }
      }
      return {
        id: inv.id,
        student_name: inv.student.full_name,
        amount: inv.total_amount,
        paid_at: paidDate.toISOString(),
      };
    }).sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

    return (
      <TenantReportsClientPage 
        chartData={chartData}
        programRevenueData={programRevenueData}
        invoices={serializedInvoices}
        activeStudentsCount={activeStudentsCount}
        thisMonthRevenue={thisMonthRevenue}
        growthPercentage={growthPercentage}
        tenantSlug={tenantSlug}
      />
    );

  } catch (error) {
    console.error("TenantReportsPage error:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat data laporan.</p>
      </div>
    );
  }
}
