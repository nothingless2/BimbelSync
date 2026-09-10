import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TenantDetailClientPage from "./client-page";

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const { id } = await params;

  const [academy, plans, invoices, auditLogs] = await Promise.all([
    prisma.academy.findUnique({
      where: { id },
      include: {
        plan: true,
        staff: {
          where: { role: "ADMIN" },
          orderBy: { email: "asc" }
        }
      }
    }),
    prisma.plan.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { price: "asc" },
    }),
    prisma.platformInvoice.findMany({
      where: { academy_id: id },
      include: { plan: true, verified_by: { select: { name: true, email: true } } },
      orderBy: { billing_period: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { academy_id: id },
          { entity_id: id },
          { details: { path: ["academy_id"], equals: id } }
        ],
        staff_id: { not: null }
      },
      include: {
        staff: { select: { name: true, email: true, avatar_url: true } }
      },
      orderBy: { created_at: "desc" },
      take: 100
    }),
  ]);

  if (!academy) {
    redirect("/superadmin/academies");
  }

  const serializedInvoices = invoices.map(inv => ({
    id: inv.id,
    billing_period: inv.billing_period.toISOString(),
    due_date: inv.due_date.toISOString(),
    paid_at: inv.paid_at?.toISOString() ?? null,
    amount: inv.amount,
    payment_status: inv.payment_status,
    plan: { name: inv.plan.name },
    verified_by: inv.verified_by,
  }));

  return <TenantDetailClientPage academy={academy} plans={plans} invoices={serializedInvoices} auditLogs={auditLogs} />;
}
