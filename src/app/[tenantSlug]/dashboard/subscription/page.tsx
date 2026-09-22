import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SubscriptionClientPage from "./client-page";

export default async function SubscriptionPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;
  
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bimbelsync_session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== 'ADMIN' || session.tenant_slug !== tenantSlug) {
    redirect(`/${tenantSlug}/login`);
  }

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id as string },
    include: {
      plan: true,
      platform_invoices: {
        orderBy: { due_date: 'desc' }
      }
    }
  });

  if (!academy) {
    redirect(`/${tenantSlug}/login`);
  }

  // Format data untuk client page
  const data = {
    id: academy.id,
    name: academy.name,
    subscription_status: academy.subscription_status,
    subscription_due_date: academy.subscription_due_date?.toISOString() || null,
    plan: {
      name: academy.plan.name,
      price: academy.plan.price,
    },
    invoices: academy.platform_invoices.map(inv => ({
      id: inv.id,
      amount: inv.amount,
      billing_period: inv.billing_period.toISOString(),
      due_date: inv.due_date.toISOString(),
      payment_status: inv.payment_status,
      paid_at: inv.paid_at?.toISOString() || null,
      proof_of_payment_url: inv.proof_of_payment_url || null,
    }))
  };

  return <SubscriptionClientPage academy={data} tenantSlug={tenantSlug} />;
}
