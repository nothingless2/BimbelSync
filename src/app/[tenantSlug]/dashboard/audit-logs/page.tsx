import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AuditLogsClientPage from "./client-page";

export default async function AuditLogsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q as string || "";

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Double check that only ADMIN can access this page
  const staff = await prisma.staff.findUnique({
    where: { id: session.id }
  });

  if (staff?.role !== 'ADMIN') {
    redirect(`/${tenantSlug}/dashboard`);
  }

  // Fetch audit logs for this academy
  const logs = await prisma.auditLog.findMany({
    where: {
      academy_id: session.academy_id,
      ...(q ? {
        OR: [
          { action: { contains: q, mode: 'insensitive' } },
          { entity_type: { contains: q, mode: 'insensitive' } },
          { staff: { name: { contains: q, mode: 'insensitive' } } },
          { staff: { email: { contains: q, mode: 'insensitive' } } }
        ]
      } : {})
    },
    include: {
      staff: true
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 100 // limit to last 100 logs for performance
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Logs</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Riwayat aktivitas dan mutasi data di dalam {tenantSlug}.
        </p>
      </div>

      <AuditLogsClientPage logs={logs} />
    </div>
  );
}
