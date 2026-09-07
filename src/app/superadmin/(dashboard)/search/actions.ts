"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

async function getSuperadminId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  if (!session || session.role !== "SUPERADMIN") return null;
  return session.id as string;
}

export async function logAuditAction(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const superadminId = await getSuperadminId();
    if (!superadminId) return;

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
    const superadminId = await getSuperadminId();
    if (!superadminId) return { error: "Unauthorized" };

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
