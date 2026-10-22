import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentSchedulesClientPage from "./client-page";

import { Calendar } from "lucide-react";

export const metadata = {
  title: "Jadwal Kelas | BimbelSync",
};

export default async function StudentSchedulesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;

  const student = await prisma.student.findFirst({
    where: {
      id: session.id,
      academy_id: session.academy_id,
      deleted_at: null,
    },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { program: true }
      }
    }
  });

  if (!student) redirect(`/${tenantSlug}/student/login`);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* Header Profile Style */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <Calendar size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Jadwal Kelas</h1>
          <p className="text-blue-100 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium">Pantau jadwal program aktif Anda</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 max-w-4xl mx-auto">
        <StudentSchedulesClientPage 
          schedules={schedules} 
          tenantSlug={tenantSlug} 
        />
      </div>
    </div>
  );
}
