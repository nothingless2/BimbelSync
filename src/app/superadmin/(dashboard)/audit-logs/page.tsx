import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AuditLogsClientPage from "./client-page";
import { validateSearchQuery } from "@/lib/search-validation";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const queryParams = await searchParams;
  const { tenant, superadmin, action, page = "1" } = queryParams;
  const q = validateSearchQuery(queryParams?.q);
  
  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = 15;
  const skip = (currentPage - 1) * pageSize;

  const where: any = {};

  if (superadmin) {
    where.superadmin_id = superadmin;
  } else {
    where.superadmin_id = { not: null };
  }
  
  if (action) {
    where.action = action;
  }

  if (tenant) {
    where.OR = [
      { entity_id: tenant },
      { details: { path: ["academy_id"], equals: tenant } }, // Based on user request and our key name
    ];
  }

  if (q) {
    const textSearchCondition = {
      OR: [
        { action: { contains: q, mode: "insensitive" } },
        { superadmin: { email: { contains: q, mode: "insensitive" } } }
      ]
    };
    
    // If we already have OR conditions (from tenant), wrap in AND
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        textSearchCondition
      ];
      delete where.OR;
    } else {
      where.OR = textSearchCondition.OR;
    }
  }

  try {
    const [logs, total, superadmins, academies] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
        include: {
          superadmin: { select: { name: true, email: true, avatar_url: true } }
        }
      }),
      prisma.auditLog.count({ where }),
      prisma.superadmin.findMany({ select: { id: true, name: true, email: true }, orderBy: { email: "asc" } }),
      prisma.academy.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
    ]);

    // Enrich logs with academy names if entity_id matches an academy, or if academy_id is in details
    const enrichedLogs = logs.map(log => {
      let tenantName = null;
      let tenantId = null;

      // Cek apakah entity_id adalah academy
      let match = academies.find(a => a.id === log.entity_id);
      
      // Jika bukan, cek apakah ada academy_id di dalam details JSON
      if (!match && log.details && typeof log.details === 'object' && !Array.isArray(log.details)) {
        const detailsObj = log.details as Record<string, any>;
        if (detailsObj.academy_id) {
          match = academies.find(a => a.id === detailsObj.academy_id);
        }
      }

      if (match) {
        tenantName = match.name;
        tenantId = match.id;
      }

      return {
        ...log,
        tenantName,
        tenantId
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return (
      <AuditLogsClientPage 
        logs={enrichedLogs} 
        total={total} 
        totalPages={totalPages} 
        currentPage={currentPage} 
        superadmins={superadmins}
        academies={academies}
        currentFilters={{ tenant: tenant as string, superadmin: superadmin as string, action: action as string }}
      />
    );
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-600 dark:text-slate-400">Gagal memuat log aktivitas. Silakan coba lagi nanti.</p>
      </div>
    );
  }
}
