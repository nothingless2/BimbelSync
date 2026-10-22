import { requireStudentSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentInvoiceDetailClient from "./client-page";

export default async function StudentInvoiceDetailPage({
  params
}: {
  params: Promise<{ tenantSlug: string, id: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const invoiceId = resolvedParams.id;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;

  const [invoice, academy] = await Promise.all([
    prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        student_id: session.id
      },
      include: {
        items: true,
        installments: {
          orderBy: { installment_number: 'asc' }
        }
      }
    }),
    prisma.academy.findUnique({
      where: { id: session.academy_id },
      select: { name: true, bank_name: true, bank_account: true }
    })
  ]);

  if (!invoice) {
    redirect(`/${tenantSlug}/student/invoices`);
  }

  const bankInfo = {
    bankName: academy?.bank_name || "",
    bankAccount: academy?.bank_account || "",
    academyName: academy?.name || "Bimbel"
  };

  return <StudentInvoiceDetailClient invoice={invoice} tenantSlug={tenantSlug} bankInfo={bankInfo} />;
}
