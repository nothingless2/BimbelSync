import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddStaffModal } from "@/components/modals/add-staff-modal";
import { redirect } from "next/navigation";
import StaffClientPage from "./client-page";

export default async function StaffPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
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

  // Fetch staff for this academy
  const staffList = await prisma.staff.findMany({
    where: {
      academy_id: session.academy_id,
      deleted_at: null
    },
    orderBy: {
      email: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Staf & Tutor</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola akses Admin pengelola dan Tutor pengajar.
          </p>
        </div>
        
        {/* Modal untuk tambah staf */}
        <AddStaffModal tenantSlug={tenantSlug} />
      </div>

      {/* Tabel Data - Client Component */}
      <StaffClientPage staffList={staffList} tenantSlug={tenantSlug} />
    </div>
  );
}
