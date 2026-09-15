import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentSchedulesClientPage from "./client-page";

export const metadata = {
  title: "Jadwal Kelas | BimbelSync",
};

export default async function StudentSchedulesPage({ params }: { params: { tenantSlug: string } }) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionToken);
  if (!session || session.role !== "STUDENT") {
    redirect(`/${tenantSlug}/login`);
  }

  const student = await prisma.student.findUnique({
    where: { id: session.id as string },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { program: true }
      }
    }
  });

  if (!student) redirect(`/${tenantSlug}/login`);

  const programIds = student.enrollments.map(e => e.program_id);

  // Get schedules for the active programs
  const schedules = await prisma.schedule.findMany({
    where: {
      program_id: { in: programIds },
      // Includes both SCHEDULED and CANCELLED
    },
    include: {
      program: true,
      tutor: { select: { name: true } },
      room: { select: { name: true } },
    },
    orderBy: { start_time: "asc" },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal Kelas</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Pantau seluruh jadwal kelas dari program yang Anda ikuti.
        </p>
      </div>
      
      <StudentSchedulesClientPage 
        schedules={schedules} 
        tenantSlug={tenantSlug} 
      />
    </div>
  );
}
