import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingClientPage from "./client-page";

export default async function BillingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!session || session.role !== "SUPERADMIN") redirect("/superadmin/login");

  try {
    // Process auto-activations
    const todayForActivation = new Date();
    todayForActivation.setHours(0, 0, 0, 0);

    const pendingAcademies = await prisma.academy.findMany({
      where: {
        pending_plan_id: { not: null },
        pending_plan_date: { lte: todayForActivation }
      }
    });

    if (pendingAcademies.length > 0) {
      await Promise.all(pendingAcademies.map(acad => 
        prisma.academy.update({
          where: { id: acad.id },
          data: {
            plan_id: acad.pending_plan_id!,
            pending_plan_id: null,
            pending_plan_date: null
          }
        })
      ));
    }

    const [invoices, academies, plans] = await Promise.all([
      prisma.platformInvoice.findMany({
        where: { academy: { deleted_at: null } },
        include: {
          academy: { include: { plan: true } },
          plan: true,
          verified_by: { select: { name: true, email: true } },
        },
        orderBy: { billing_period: "desc" },
      }),
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: { plan: true },
        orderBy: { name: "asc" },
      }),
      prisma.plan.findMany({
        where: { deleted_at: null, is_active: true },
        orderBy: { price: "asc" },
      }),
    ]);

    const serializedInvoices = invoices.map(inv => ({
      ...inv,
      plan_name: inv.plan.name,
      billing_period: inv.billing_period.toISOString(),
      due_date: inv.due_date.toISOString(),
      paid_at: inv.paid_at?.toISOString() ?? null,
    }));

    const serializedAcademies = academies.map(a => ({
      id: a.id,
      name: a.name,
      subscription_due_date: a.subscription_due_date?.toISOString() ?? null,
      plan: { id: a.plan.id, name: a.plan.name, price: a.plan.price },
    }));

    const serializedPlans = plans.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
    }));

    return <BillingClientPage invoices={serializedInvoices} academies={serializedAcademies} plans={serializedPlans} />;
  } catch (error) {
    console.error("BillingPage error:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat data billing.</p>
      </div>
    );
  }
}
