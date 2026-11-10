import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentQuizzesClientPage from "./client-page";
import { FileQuestion } from "lucide-react";

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

  // Ambil program aktif yang diikuti siswa
  const enrollments = await prisma.enrollment.findMany({
    where: {
      student_id: studentId,
      status: "ACTIVE",
    },
    select: { program_id: true },
  });

  const enrolledProgramIds = enrollments.map((e) => e.program_id);

  // Ambil kuis yang tersedia untuk program siswa
  const rawQuizzes = await prisma.quiz.findMany({
    where: {
      academy_id: academyId,
      program_id: { in: enrolledProgramIds },
      is_published: true,
      deleted_at: null,
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
  });

  const quizzes = rawQuizzes.map((q) => {
    const submission = q.submissions[0] || null;
    return {
      id: q.id,
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
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <FileQuestion size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Kuis & Latihan Soal</h1>
          <p className="text-blue-100 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium">
            Uji pemahaman belajarmu dengan latihan soal interaktif
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-8 -mt-16 relative z-20 max-w-4xl mx-auto">
        <StudentQuizzesClientPage quizzes={quizzes} tenantSlug={tenantSlug} />
      </div>
    </div>
  );
}
