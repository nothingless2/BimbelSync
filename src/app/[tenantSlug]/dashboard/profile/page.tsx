import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClientPage from "./client-page";

export default async function TenantProfilePage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionToken);
  if (!session || !session.id) redirect(`/${tenantSlug}/login`);

  const staff = await prisma.staff.findUnique({
    where: { id: session.id }
  });

  if (!staff) redirect(`/${tenantSlug}/login`);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profil Saya</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kelola informasi kredensial akun Anda.
        </p>
      </div>
      
      <ProfileClientPage staff={staff} />
    </div>
  );
}
