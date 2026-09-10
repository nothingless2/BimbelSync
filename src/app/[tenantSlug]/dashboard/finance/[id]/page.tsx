import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FinanceDetailClient from "./client-page";

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ tenantSlug: string, id: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const invoiceId = resolvedParams.id;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
      academy_id: session.academy_id
    },
    include: {
      student: true,
      items: true,
      installments: {
        orderBy: { installment_number: 'asc' }
      },
      verified_by: true
    }
  });

  if (!invoice) {
    redirect(`/${tenantSlug}/dashboard/finance`);
  }

  // Cek fitur cicilan (hanya untuk Growth & Pro)
  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: { plan: true }
  });
  
  const canSplitInstallments = academy?.plan?.allows_installment || false;

  return (
    <FinanceDetailClient 
      invoice={invoice} 
      tenantSlug={tenantSlug} 
      canSplitInstallments={canSplitInstallments} 
    />
  );
}
