import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddRoomModal } from "@/components/modals/add-room-modal";
import { redirect } from "next/navigation";
import RoomsClientPage from "./client-page";

export default async function RoomsPage({ 
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

  const rooms = await prisma.room.findMany({
    where: {
      academy_id: session.academy_id,
      deleted_at: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {})
    },
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manajemen Ruangan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar ruang kelas fisik atau virtual untuk penjadwalan.
          </p>
        </div>
        
        {/* Modal untuk tambah ruangan */}
        <AddRoomModal tenantSlug={tenantSlug} />
      </div>

      {/* Tabel Data - Client Component */}
      <RoomsClientPage rooms={rooms} tenantSlug={tenantSlug} />
    </div>
  );
}
