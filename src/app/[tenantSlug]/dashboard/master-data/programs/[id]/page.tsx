import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProgramDetailClientPage from "./client-page";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProgramDetailPage({ 
  params,
}: { 
  params: Promise<{ tenantSlug: string, id: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const programId = resolvedParams.id;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      academy_id: session.academy_id,
      deleted_at: null,
    },
  });

  if (!program) {
    redirect(`/${tenantSlug}/dashboard/master-data/programs`);
  }

  // Get schedules for this program
  const schedules = await prisma.schedule.findMany({
    where: {
      program_id: program.id,
      status: { not: "CANCELLED" }
    },
    include: {
      room: true,
      tutor: true,
      attendances: true
    },
    orderBy: {
      start_time: 'asc'
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href={`/${tenantSlug}/dashboard/master-data/programs`}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Detail Program: {program.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Melihat detail program dan daftar jadwal pertemuannya.
          </p>
        </div>
      </div>

      <ProgramDetailClientPage program={program} schedules={schedules} tenantSlug={tenantSlug} />
    </div>
  );
}
