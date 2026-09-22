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

    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        academy_id: session.academy_id,
        payment_status: { in: ["UNPAID", "OVERDUE"] }
      },
      select: {
        total_amount: true
      }
    });

    const outstandingRevenue = unpaidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    // Removed static chartData logic. It will be computed on the client.

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
    const thisMonthRevenue = invoices.filter(inv => {
      let d = inv.created_at;
      if (inv.payment_option === "INSTALLMENT" && inv.installments.length > 0) {
        const p = inv.installments.filter(i => i.status === "PAID" && i.paid_at);
        if (p.length > 0) { p.sort((a,b)=>b.paid_at!.getTime()-a.paid_at!.getTime()); d = p[0].paid_at!; }
      }
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + inv.total_amount, 0);

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthRevenue = invoices.filter(inv => {
      let d = inv.created_at;
      if (inv.payment_option === "INSTALLMENT" && inv.installments.length > 0) {
        const p = inv.installments.filter(i => i.status === "PAID" && i.paid_at);
        if (p.length > 0) { p.sort((a,b)=>b.paid_at!.getTime()-a.paid_at!.getTime()); d = p[0].paid_at!; }
      }
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, inv) => sum + inv.total_amount, 0);

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
        programRevenueData={programRevenueData}
        invoices={serializedInvoices}
        activeStudentsCount={activeStudentsCount}
        thisMonthRevenue={thisMonthRevenue}
        growthPercentage={growthPercentage}
        outstandingRevenue={outstandingRevenue}
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
