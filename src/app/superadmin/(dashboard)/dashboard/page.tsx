import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClientPage from "./client-page";

export default async function SuperadminDashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  try {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Ambil semua data sekaligus dengan Promise.all
    const [
      allAcademies,
      invoices,
      superadminCount,
      recentLogs,
      topAcademiesRaw,
      expiringTrials,
    ] = await Promise.all([
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: { plan: true },
      }),
      prisma.platformInvoice.findMany({
        include: { academy: true, plan: true },
        orderBy: { due_date: "desc" },
      }),
      prisma.superadmin.count({ where: { deleted_at: null } }),
      prisma.auditLog.findMany({
        where: { superadmin_id: { not: null } },
        orderBy: { created_at: "desc" },
        take: 5,
        include: { superadmin: { select: { name: true, email: true } } },
      }),
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: {
          _count: { select: { students: true, staff: true } },
          plan: true,
        },
        orderBy: { students: { _count: "desc" } },
        take: 5,
      }),
      prisma.academy.findMany({
        where: {
          subscription_status: "TRIAL",
          deleted_at: null,
          subscription_due_date: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        include: { plan: { select: { name: true } } },
        orderBy: { subscription_due_date: "asc" },
      }),
    ]);

    // --- Derive stats ---
    const activeAcademies = allAcademies.filter((a) => a.subscription_status === "ACTIVE");
    const trialAcademies = allAcademies.filter((a) => a.subscription_status === "TRIAL");
    const suspendedAcademies = allAcademies.filter((a) => a.subscription_status === "SUSPENDED");

    const currentMRR = activeAcademies.reduce((acc, a) => acc + a.plan.price, 0);

    // Hitung MRR bulan lalu: akademi yang aktif pada bulan sebelumnya (estimasi dari invoice PAID)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthPaidInvoices = invoices.filter(
      (i) =>
        i.payment_status === "PAID" &&
        i.paid_at &&
        new Date(i.paid_at) >= lastMonthStart &&
        new Date(i.paid_at) <= lastMonthEnd
    );
    const recentMRR = lastMonthPaidInvoices.reduce((acc, i) => acc + i.amount, 0);

    const totalRevenue = invoices
      .filter((i) => i.payment_status === "PAID")
      .reduce((acc, i) => acc + i.amount, 0);

    const totalReceivables = invoices
      .filter((i) => i.payment_status === "UNPAID" || i.payment_status === "OVERDUE")
      .reduce((acc, i) => acc + i.amount, 0);

    // --- Growth Chart Data (last 12 months) ---
    const growthMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      growthMap[key] = 0;
    }
    // Count academies created per month (approximation via plan_id & invoice date)
    // We use allAcademies (no direct createdAt), so we approximate via first invoice
    const firstInvoicePerAcademy: Record<string, Date> = {};
    invoices.forEach((inv) => {
      const d = new Date(inv.billing_period);
      if (!firstInvoicePerAcademy[inv.academy_id] || d < firstInvoicePerAcademy[inv.academy_id]) {
        firstInvoicePerAcademy[inv.academy_id] = d;
      }
    });
    Object.values(firstInvoicePerAcademy).forEach((d) => {
      const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      if (growthMap[key] !== undefined) growthMap[key]++;
    });
    const growthData = Object.entries(growthMap).map(([month, count]) => ({ month, count }));

    // --- Plan Distribution ---
    const planMap: Record<string, number> = {};
    activeAcademies.forEach((a) => {
      planMap[a.plan.name] = (planMap[a.plan.name] || 0) + 1;
    });
    const planDistribution = Object.entries(planMap).map(([name, value]) => ({ name, value }));

    // --- Top Academies ---
    const topAcademies = topAcademiesRaw.map((a) => ({
      name: a.name,
      path_url: a.path_url,
      id: a.id,
      studentCount: a._count.students,
      staffCount: a._count.staff,
    }));

    // Serialize dates to strings for client component
    const serializedExpiringTrials = expiringTrials.map((a) => ({
      id: a.id,
      name: a.name,
      subscription_due_date: a.subscription_due_date?.toISOString() ?? null,
      plan: { name: a.plan.name },
    }));

    const serializedLogs = recentLogs.map((l) => ({
      id: l.id,
      action: l.action,
      created_at: l.created_at.toISOString(),
      superadmin: l.superadmin ? { name: l.superadmin.name, email: l.superadmin.email } : null,
    }));

    const recentInvoices = invoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      academy: { name: inv.academy.name },
      plan: { name: inv.plan.name },
      billing_period: new Date(inv.billing_period).toISOString(),
      amount: inv.amount,
      payment_status: inv.payment_status,
    }));

    return (
      <DashboardClientPage
        stats={{
          totalAcademies: allAcademies.length,
          activeAcademies: activeAcademies.length,
          trialAcademies: trialAcademies.length,
          suspendedAcademies: suspendedAcademies.length,
          totalSuperadmins: superadminCount,
          currentMRR,
          totalRevenue,
          totalReceivables,
          recentMRR,
        }}
        growthData={growthData}
        planDistribution={planDistribution}
        topAcademies={topAcademies}
        expiringTrials={serializedExpiringTrials}
        recentLogs={serializedLogs}
        recentInvoices={recentInvoices}
      />
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat data dashboard. Silakan coba lagi nanti.</p>
      </div>
    );
  }
}
