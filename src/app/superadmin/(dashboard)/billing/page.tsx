import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import BillingClientPage from "./client-page";
import { getPlatformBankInfo } from "@/lib/platform-settings";

export default async function BillingPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!session || session.role !== "SUPERADMIN") redirect("/superadmin/login");

  try {
    const [invoices, proofRecords, academies, plans, bankInfo] = await Promise.all([
      // 1. Fetch metadata invoice secara selektif (hindari menarik string Base64 gambar agar payload ultra ringan)
      prisma.platformInvoice.findMany({
        where: { academy: { deleted_at: null } },
        select: {
          id: true,
          amount: true,
          billing_period: true,
          due_date: true,
          payment_status: true,
          duration_months: true,
          paid_at: true,
          verified_by_superadmin_id: true,
          academy: {
            select: {
              id: true,
              name: true,
              path_url: true,
              plan: { select: { id: true, name: true, price: true } },
            },
          },
          plan: { select: { id: true, name: true, price: true } },
          verified_by: { select: { name: true, email: true } },
        },
        orderBy: { billing_period: "desc" },
      }),

      // 2. Query ringan hanya ID untuk cek invoice yang sudah upload bukti transfer
      prisma.platformInvoice.findMany({
        where: {
          academy: { deleted_at: null },
          proof_of_payment_url: { not: null },
        },
        select: { id: true },
      }),

      // 3. Fetch akademi
      prisma.academy.findMany({
        where: { deleted_at: null },
        include: { plan: true },
        orderBy: { name: "asc" },
      }),

      // 4. Fetch paket aktif
      prisma.plan.findMany({
        where: { deleted_at: null, is_active: true },
        orderBy: { price: "asc" },
      }),

      // 5. Info rekening platform
      getPlatformBankInfo(),
    ]);

    const proofSet = new Set(proofRecords.map((p) => p.id));

    const serializedInvoices = invoices.map((inv) => ({
      ...inv,
      has_proof: proofSet.has(inv.id),
      plan_name: inv.plan.name,
      billing_period: inv.billing_period.toISOString(),
      due_date: inv.due_date.toISOString(),
      paid_at: inv.paid_at?.toISOString() ?? null,
    }));

    const serializedAcademies = academies.map((a) => ({
      id: a.id,
      name: a.name,
      subscription_due_date: a.subscription_due_date?.toISOString() ?? null,
      plan: { id: a.plan.id, name: a.plan.name, price: a.plan.price },
    }));

    const serializedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discount_6_months: p.discount_6_months,
      discount_12_months: p.discount_12_months,
    }));

    return (
      <BillingClientPage
        invoices={serializedInvoices}
        academies={serializedAcademies}
        plans={serializedPlans}
        initialBankInfo={bankInfo}
      />
    );
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
