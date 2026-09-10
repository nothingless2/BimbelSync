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

  const invoice = await prisma.invoice.findUnique({
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
  });

  if (!invoice) {
    redirect(`/${tenantSlug}/student/invoices`);
  }

  return <StudentInvoiceDetailClient invoice={invoice} tenantSlug={tenantSlug} />;
}
