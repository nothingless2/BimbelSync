"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStudentSession } from "@/lib/session";

/**
 * Server action saat siswa mengumpulkan jawaban kuis online.
 * Menghitung nilai secara otomatis dan mensinkronisasikan ke E-Rapor (StudentEvaluation).
 */
export async function submitQuizAction(data: {
  quizId: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  tenantSlug: string;
}) {
  const auth = await requireStudentSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const studentId = session.id as string;
  const academyId = session.academy_id as string;

  // 1. Ambil data kuis beserta butir soalnya
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: data.quizId,
      academy_id: academyId,
      deleted_at: null,
      is_published: true,
    },
    include: {
      questions: {
        orderBy: { order_index: "asc" },
      },
    },
  });

  if (!quiz) {
    return { error: "Kuis tidak ditemukan atau belum dipublikasikan." };
  }

  // 2. Pastikan siswa terdaftar aktif di program ini
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      student_id: studentId,
      program_id: quiz.program_id,
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    return { error: "Anda tidak terdaftar dalam program pembelajaran kuis ini." };
  }

  // 3. Pastikan siswa belum pernah submit sebelumnya
  const existingSubmission = await prisma.quizSubmission.findUnique({
    where: {
      quiz_id_student_id: {
        quiz_id: quiz.id,
        student_id: studentId,
      },
    },
  });

  if (existingSubmission) {
    return { error: "Anda sudah pernah mengumpulkan kuis ini sebelumnya." };
  }

  // 4. Hitung skor otomatis
  const totalQuestions = quiz.questions.length;
  if (totalQuestions === 0) {
    return { error: "Kuis ini belum memiliki butir soal." };
  }

  let totalCorrect = 0;
  let earnedPoints = 0;
  let maxPoints = 0;

  for (const q of quiz.questions) {
    maxPoints += q.points;
    const studentChoice = data.answers[q.id];
    if (studentChoice !== undefined && studentChoice === q.correct_answer_index) {
      totalCorrect += 1;
      earnedPoints += q.points;
    }
  }

  const finalScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100 * 10) / 10 : 0;

  // 5. Cari evaluator default jika creator staff sudah tidak ada
  let evaluatorId = quiz.created_by_staff_id;
  if (!evaluatorId) {
    const fallbackStaff = await prisma.staff.findFirst({
      where: { academy_id: academyId, deleted_at: null },
      select: { id: true },
    });
    evaluatorId = fallbackStaff?.id || null;
  }

  try {
    const submission = await prisma.$transaction(async (tx) => {
      // Simpan pengerjaan kuis
      const sub = await tx.quizSubmission.create({
        data: {
          quiz_id: quiz.id,
          student_id: studentId,
          score: finalScore,
          total_correct: totalCorrect,
          total_questions: totalQuestions,
          answers: data.answers,
        },
      });

      // Sinkronisasi otomatis ke StudentEvaluation (E-Rapor)
      if (evaluatorId) {
        await tx.studentEvaluation.create({
          data: {
            academy_id: academyId,
            student_id: studentId,
            program_id: quiz.program_id,
            evaluator_id: evaluatorId,
            title: `[Kuis Online] ${quiz.title}`,
            evaluation_type: quiz.evaluation_type || "EXAM",
            score: finalScore,
            notes: `Hasil kuis online: ${totalCorrect} dari ${totalQuestions} soal terjawab benar (Skor: ${finalScore}/100).`,
            status: "PUBLISHED",
          },
        });
      }

      return sub;
    });

    // Revalidate paths
    revalidatePath(`/${data.tenantSlug}/student/quizzes`);
    revalidatePath(`/${data.tenantSlug}/student/quizzes/${quiz.id}`);
    revalidatePath(`/${data.tenantSlug}/student/evaluations`);
    revalidatePath(`/${data.tenantSlug}/student/dashboard`);
    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${quiz.id}`);
    revalidatePath(`/${data.tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${data.tenantSlug}/dashboard`);

    return {
      success: true,
      score: finalScore,
      totalCorrect,
      totalQuestions,
      submissionId: submission.id,
    };
  } catch (err: any) {
    console.error("Error submitting quiz:", err);
    return { error: err.message || "Gagal mengumpulkan kuis. Silakan coba lagi." };
  }
}

