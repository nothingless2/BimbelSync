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

  return <TenantDetailClientPage academy={academy} />;
}
