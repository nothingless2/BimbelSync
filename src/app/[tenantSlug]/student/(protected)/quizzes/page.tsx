import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentQuizzesClientPage from "./client-page";
import { FileQuestion } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Kuis & Latihan Soal | BimbelSync",
};

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const auth = await requireStudentSession();
  if ("error" in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;
  const studentId = session.id as string;
  const academyId = session.academy_id as string;

  // Query enrollments and available published quizzes concurrently
  const [enrollments, rawQuizzes] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        student_id: studentId,
        status: "ACTIVE",
      },
      include: {
        program: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.quiz.findMany({
      where: {
        academy_id: academyId,
        is_published: true,
        deleted_at: null,
        program: {
          enrollments: {
            some: { student_id: studentId, status: "ACTIVE" },
          },
        },
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
        submissions: {
          where: {
            student_id: studentId,
          },
          select: {
            id: true,
            score: true,
            total_correct: true,
            total_questions: true,
            submitted_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  const programs = enrollments.map((e) => e.program);

  const quizzes = rawQuizzes.map((q) => {
    const submission = q.submissions[0] || null;
    return {
      id: q.id,
      programId: q.program_id,
      title: q.title,
      description: q.description,
      durationMinutes: q.duration_minutes,
      programName: q.program.name,
      creatorName: q.creator?.name || "Tutor",
      totalQuestions: q._count.questions,
      createdAt: q.created_at.toISOString(),
      submission: submission
        ? {
            id: submission.id,
            score: Number(submission.score),
            totalCorrect: submission.total_correct,
            totalQuestions: submission.total_questions,
            submittedAt: submission.submitted_at.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 pt-8 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Portal Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Kuis & Latihan Soal
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Uji pemahaman belajarmu dengan latihan soal interaktif
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 -mt-8 relative z-20 max-w-4xl mx-auto">
        <Suspense fallback={<div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center text-slate-400">Memuat kuis...</div>}>
          <StudentQuizzesClientPage quizzes={quizzes} programs={programs} tenantSlug={tenantSlug} />
        </Suspense>
      </div>
    </div>
  );
}
