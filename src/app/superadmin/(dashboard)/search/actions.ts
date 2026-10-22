"use server";

import prisma from "@/lib/prisma";
import { requireSuperadminSession } from "@/lib/session";

export async function logAuditAction(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return;
    const superadminId = auth.session.id;

    await prisma.auditLog.create({
      data: {
        superadmin_id: superadminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    });
  } catch (error) {
    console.error("Failed to log audit", error);
  }
}

export async function searchTenantsAction(query: string) {
  try {
    const auth = await requireSuperadminSession();
    if ("error" in auth) return { error: auth.error };

    if (!query || query.trim() === "") return { data: [] };

    const q = query.trim();
    
    // Log audit
    await logAuditAction("SEARCH_TENANT", "Academy", undefined, { keyword: q });

    // Search by academy name or staff email
    const academies = await prisma.academy.findMany({
      where: {
        deleted_at: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { path_url: { contains: q, mode: "insensitive" } },
          {
            staff: {
              some: {
                email: { contains: q, mode: "insensitive" },
                role: "ADMIN"
              }
            }
          }
        ]
      },
      include: {
        plan: true,
        _count: {
          select: { students: true, staff: true, rooms: true }
        }
      },
      take: 20
    });

    return { data: academies };
  } catch (error) {
    console.error(error);
    return { error: "Terjadi kesalahan saat mencari" };
  }
}
