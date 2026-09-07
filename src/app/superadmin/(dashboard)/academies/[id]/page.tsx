import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TenantDetailClientPage from "./client-page";

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const { id } = await params;

  // Query academy details + Admin staff
  const academy = await prisma.academy.findUnique({
    where: { id },
    include: {
      plan: true,
      staff: {
        where: { role: "ADMIN" },
        orderBy: { email: "asc" }
      }
    }
  });

  if (!academy) {
    redirect("/superadmin/search");
  }

  // Also query recent audit logs for this academy (Limit 5)
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity_id: academy.id, entity_type: "Academy" },
        { 
          entity_type: "Staff", 
          entity_id: { in: academy.staff.map(s => s.id) } 
        }
      ]
    },
    orderBy: { created_at: "desc" },
    take: 5,
    include: { superadmin: { select: { email: true, name: true } } }
  });

  return <TenantDetailClientPage academy={academy} logs={auditLogs} />;
}
