import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentEvaluationsClientPage from "./client-page";
import { BarChart } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Evaluasi | BimbelSync",
};

export default async function StudentEvaluationsPage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;

  // Fetch student's active enrollments and all evaluations
  const [student, rawEvaluations] = await Promise.all([
    prisma.student.findFirst({
      where: { id: session.id as string, deleted_at: null },
      select: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            program: {
              select: { id: true, name: true }
            }
          }
        }
      }
    }),
    prisma.studentEvaluation.findMany({
      where: { 
        student_id: session.id as string,
        status: "PUBLISHED"
      },
      include: {
        program: true,
        evaluator: true,
      },
      orderBy: { created_at: "desc" },
    })
  ]);

  const programs = student?.enrollments.map((e) => e.program) || [];

  // Deduplikasi jika ada tugas dengan judul dan tipe yang sama pada program yang sama
  // Prioritaskan baris yang memiliki nilai (score !== null)
  const dedupedMap = new Map<string, (typeof rawEvaluations)[0]>();
  for (const ev of rawEvaluations) {
    const key = `${ev.program_id}_${ev.title.trim().toLowerCase()}_${ev.evaluation_type}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, ev);
    } else {
      const existing = dedupedMap.get(key)!;
      if (existing.score === null && ev.score !== null) {
        dedupedMap.set(key, ev);
      }
    }
  }

  const evaluations = Array.from(dedupedMap.values()).map(ev => ({
    ...ev,
    score: ev.score !== null ? Number(ev.score) : null
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header Profile Style */}
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 pt-8 pb-16 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Portal Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Rapor & Nilai
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Pantau perkembangan hasil asesmen, kuis, dan ujian belajarmu
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-8 relative z-20 max-w-3xl mx-auto">
        <Suspense fallback={<div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400">Memuat nilai evaluasi...</div>}>
          <StudentEvaluationsClientPage evaluations={evaluations} programs={programs} />
        </Suspense>
      </div>
    </div>
  );
}
