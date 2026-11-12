import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import QuizDetailClientPage from "./client-page";

export const metadata = {
  title: "Kelola Soal Kuis | BimbelSync",
};

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; quizId: string }>;
}) {
  const { tenantSlug, quizId } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) redirect(`/${tenantSlug}/login`);

  const session = await decrypt(sessionCookie);
  if (!session || !session.academy_id) redirect(`/${tenantSlug}/login`);

  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      academy_id: session.academy_id,
      deleted_at: null,
    },
    include: {
      program: {
        select: {
          id: true,
          name: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                select: {
                  id: true,
                  full_name: true,
                  username: true,
                },
              },
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        orderBy: { order_index: "asc" },
      },
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              username: true,
            },
          },
        },
        orderBy: { submitted_at: "desc" },
      },
    },
  });

  if (!quiz) notFound();

  // Serialized questions
  const questions = quiz.questions.map((q) => ({
    id: q.id,
    questionText: q.question_text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswerIndex: q.correct_answer_index,
    explanation: q.explanation,
    points: q.points,
    orderIndex: q.order_index,
  }));

  // Serialized submissions
  const submissions = quiz.submissions.map((s) => ({
    id: s.id,
    studentId: s.student_id,
    studentName: s.student.full_name,
    studentUsername: s.student.username,
    score: Number(s.score),
    totalCorrect: s.total_correct,
    totalQuestions: s.total_questions,
    answers: s.answers as Record<string, number>,
    submittedAt: s.submitted_at.toISOString(),
  }));

  // Enrolled active students for this program
  const enrolledStudents = quiz.program.enrollments.map((en) => ({
    id: en.student.id,
    name: en.student.full_name,
    username: en.student.username,
  }));

  return (
    <QuizDetailClientPage
      quiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.duration_minutes,
        evaluationType: quiz.evaluation_type,
        isPublished: quiz.is_published,
        programId: quiz.program_id,
        programName: quiz.program.name,
        creatorName: quiz.creator?.name || "Tutor",
        createdAt: quiz.created_at.toISOString(),
      }}
      questions={questions}
      submissions={submissions}
      enrolledStudents={enrolledStudents}
      tenantSlug={tenantSlug}
    />
  );
}

