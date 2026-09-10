import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AddScheduleModal } from "@/components/modals/add-schedule-modal";
import { redirect } from "next/navigation";
import SchedulesClientPage from "./client-page";
import { startOfWeek, addDays, parseISO, isValid, startOfMonth, addMonths } from "date-fns";

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
  const view = resolvedSearchParams?.view as string || "weekly";
  const dateParam = resolvedSearchParams?.date as string || resolvedSearchParams?.weekStart as string | undefined;

  let refDate = new Date();
  if (dateParam) {
    const parsedDate = parseISO(dateParam);
    if (isValid(parsedDate)) {
      refDate = parsedDate;
    }
  }
  
  let queryStart: Date;
  let queryEnd: Date;

  if (view === "monthly") {
    queryStart = startOfMonth(refDate);
    queryEnd = addMonths(queryStart, 1); // Awal bulan depannya
  } else {
    queryStart = startOfWeek(refDate, { weekStartsOn: 1 });
    queryEnd = addDays(queryStart, 7); // Hari Senin minggu berikutnya
  }

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
        program: { academy_id: session.academy_id },
        start_time: {
          gte: queryStart,
          lt: queryEnd
        }
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
        rooms={rooms}
        tenantSlug={tenantSlug} 
        currentDateStr={queryStart.toISOString()}
        viewMode={view}
      />
    </div>
  );
}
