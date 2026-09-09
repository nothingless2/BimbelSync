import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddScheduleModal } from "@/components/modals/add-schedule-modal";
import { redirect } from "next/navigation";
import SchedulesClientPage from "./client-page";

export default async function SchedulesPage({ 
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

  // Fetch all schedules for this academy with their relations
  // Concurrent fetch for optimum performance
  const [schedules, programs, rooms, tutors] = await Promise.all([
    prisma.schedule.findMany({
      where: {
        program: {
          academy_id: session.academy_id,
        },
        ...(q ? {
          OR: [
            { program: { name: { contains: q, mode: 'insensitive' } } },
            { room: { name: { contains: q, mode: 'insensitive' } } },
            { tutor: { name: { contains: q, mode: 'insensitive' } } },
          ]
        } : {})
      },
      include: {
        program: true,
        room: true,
        tutor: true,
      },
      orderBy: {
        start_time: 'asc' // Sort by upcoming schedules first
      }
    }),
    prisma.program.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      orderBy: { name: 'asc' }
    }),
    prisma.room.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      orderBy: { name: 'asc' }
    }),
    prisma.staff.findMany({
      where: { academy_id: session.academy_id, deleted_at: null },
      orderBy: { email: 'asc' } // Actually should be by name if it existed, but email works for MVP
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Jadwal Kelas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola perencanaan kelas reguler maupun pertemuan intensif di bimbel Anda.
          </p>
        </div>
        
        <AddScheduleModal 
          programs={programs} 
          rooms={rooms} 
          tutors={tutors} 
        />
      </div>

      <SchedulesClientPage 
        schedules={schedules} 
        tenantSlug={tenantSlug} 
      />
    </div>
  );
}
