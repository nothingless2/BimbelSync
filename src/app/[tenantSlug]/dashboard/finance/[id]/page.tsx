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
      academy: {
        select: {
          name: true,
          bank_name: true,
          bank_account: true,
        }
      },
      student: true,
      items: true,
      installments: {
        orderBy: { installment_number: 'asc' },
        include: {
          verified_by: true
        }
      },
      verified_by: true
    }
  });

  if (!invoice) {
    redirect(`/${tenantSlug}/dashboard/finance`);
  }

  // Cek fitur cicilan dan batasan termin menggunakan sentralisasi subscription helper
  const { checkFeatureAccess, getAcademySubscription, getMaxInstallmentTerms } = await import("@/lib/subscription");
  const installmentAccess = await checkFeatureAccess(session.academy_id, "installment");
  const canSplitInstallments = installmentAccess.allowed;

  const sub = await getAcademySubscription(session.academy_id);
  const maxTerms = sub ? getMaxInstallmentTerms(sub.planName) : null;

  const { getTenantSmtpConfig } = await import("@/lib/tenant-mailer");
  const smtpData = await getTenantSmtpConfig(session.academy_id);
  const emailInfo = {
    allowed: !('error' in smtpData) && smtpData.isAllowed,
    configured: !('error' in smtpData) && smtpData.isConfigured,
    active: !('error' in smtpData) && smtpData.isActive,
  };

  return (
    <FinanceDetailClient 
      invoice={invoice} 
      tenantSlug={tenantSlug} 
      canSplitInstallments={canSplitInstallments} 
      maxTerms={maxTerms}
      emailInfo={emailInfo}
    />
  );
}
