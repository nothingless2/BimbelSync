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
    const [invoices, academies] = await Promise.all([
      prisma.platformInvoice.findMany({
        include: {
          academy: { include: { plan: true } },
          verified_by: { select: { name: true, email: true } },
        },
        orderBy: { billing_period: "desc" },
      }),
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: { plan: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const serializedInvoices = invoices.map(inv => ({
      ...inv,
      billing_period: inv.billing_period.toISOString(),
      due_date: inv.due_date.toISOString(),
      paid_at: inv.paid_at?.toISOString() ?? null,
    }));

    const serializedAcademies = academies.map(a => ({
      id: a.id,
      name: a.name,
      plan: { id: a.plan.id, name: a.plan.name, price: a.plan.price },
    }));

    return <BillingClientPage invoices={serializedInvoices} academies={serializedAcademies} />;
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
