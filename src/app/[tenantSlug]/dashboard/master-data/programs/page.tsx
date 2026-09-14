import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddProgramModal } from "@/components/modals/add-program-modal";
import { redirect } from "next/navigation";
import ProgramsClientPage from "./client-page";

export default async function ProgramsPage({ 
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

  const [programs, staffs, rooms] = await Promise.all([
    prisma.program.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
      },
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.staff.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      select: { id: true, name: true, email: true }
    }),
    prisma.room.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      select: { id: true, name: true, capacity: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Program</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar program belajar, kapasitas, dan tarif biaya bulanannya.
          </p>
        </div>
        
        {/* Modal untuk tambah program */}
        <AddProgramModal tenantSlug={tenantSlug} />
      </div>

      {/* Tabel Data - Diubah menjadi Client Component agar interaktif */}
      <ProgramsClientPage programs={programs} staffs={staffs} rooms={rooms} tenantSlug={tenantSlug} />
    </div>
  );
}
