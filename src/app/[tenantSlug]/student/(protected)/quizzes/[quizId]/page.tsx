import prisma from "@/lib/prisma";
import { requireStudentSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import StudentQuizPlayClientPage from "./client-page";

export const metadata = {
  title: "Pengerjaan Kuis | BimbelSync",
};

export default async function StudentQuizPlayPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; quizId: string }>;
}) {
  const { tenantSlug, quizId } = await params;

  const auth = await requireStudentSession();
  if ("error" in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;
  const studentId = session.id as string;
  const academyId = session.academy_id as string;

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      academy_id: academyId,
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
      questions: {
        orderBy: { order_index: "asc" },
      },
      submissions: {
        where: {
          student_id: studentId,
        },
      },
    },
  });

  if (!quiz) notFound();

  // Pastikan siswa terdaftar di program ini
  const isEnrolled = await prisma.enrollment.findFirst({
    where: {
      student_id: studentId,
      program_id: quiz.program_id,
      status: "ACTIVE",
    },
  });

  if (!isEnrolled) {
    redirect(`/${tenantSlug}/student/quizzes`);
  }

  const submission = quiz.submissions[0] || null;
  const isCompleted = submission !== null;
  const canViewResults = quiz.show_result_immediately || quiz.is_results_released;

  // Sanitasi data soal:
  // Hanya kirimkan `correct_answer_index` atau `explanation` jika kuis sudah selesai DAN hasilnya sudah dirilis/boleh dilihat
  // untuk mencegah kebocoran kunci jawaban via inspect element / devtools.
  const sanitizedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.question_text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    points: q.points,
    orderIndex: q.order_index,
    correctAnswerIndex: isCompleted && canViewResults ? q.correct_answer_index : undefined,
    explanation: isCompleted && canViewResults ? q.explanation : undefined,
  }));

  const serializedSubmission = submission
    ? {
        id: submission.id,
        score: canViewResults ? Number(submission.score) : 0,
        totalCorrect: canViewResults ? submission.total_correct : 0,
        totalQuestions: submission.total_questions,
        answers: submission.answers as Record<string, number>,
        submittedAt: submission.submitted_at.toISOString(),
      }
    : null;

  return (
    <StudentQuizPlayClientPage
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.duration_minutes,
        programName: quiz.program.name,
        canViewResults,
      }}
      questions={sanitizedQuestions}
      submission={serializedSubmission}
      tenantSlug={tenantSlug}
    />
  );
}

