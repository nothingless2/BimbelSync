import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function FinanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  const dbUser = await prisma.staff.findUnique({
    where: { id: session.id },
    select: { role: true }
  });

  if (dbUser?.role === 'TUTOR') {
    // Tutor tidak boleh akses finance, lempar ke dashboard
    redirect(`/${tenantSlug}/dashboard`);
  }

  return <>{children}</>;
}
