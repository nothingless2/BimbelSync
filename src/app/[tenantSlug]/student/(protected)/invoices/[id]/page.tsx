import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
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

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/student/login`);

  const session = await decrypt(sessionToken);
  if (!session || session.role !== "STUDENT") {
    redirect(`/${tenantSlug}/student/login`);
  }

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
