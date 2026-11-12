"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/session";

/**
 * Server action untuk menambah butir soal baru ke kuis.
 */
export async function addQuestionAction(data: {
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: data.quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  const trimmedText = data.questionText?.trim();
  if (!trimmedText) return { error: "Pertanyaan soal wajib diisi." };

  const cleanedOptions = (data.options || []).map((opt) => opt.trim()).filter(Boolean);
  if (cleanedOptions.length < 2) {
    return { error: "Minimal sediakan 2 pilihan jawaban." };
  }

  if (data.correctAnswerIndex < 0 || data.correctAnswerIndex >= cleanedOptions.length) {
    return { error: "Kunci jawaban harus menunjuk ke salah satu opsi yang valid." };
  }

  try {
    // Cari urutan terakhir
    const count = await prisma.quizQuestion.count({
      where: { quiz_id: data.quizId },
    });

    const question = await prisma.quizQuestion.create({
      data: {
        quiz_id: data.quizId,
        question_text: trimmedText,
        options: cleanedOptions,
        correct_answer_index: data.correctAnswerIndex,
        explanation: data.explanation?.trim() || null,
        points: Math.max(1, Number(data.points) || 10),
        order_index: count,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${data.quizId}`);
    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes`);
    return { success: true, questionId: question.id };
  } catch (err: any) {
    console.error("Error adding question:", err);
    return { error: err.message || "Gagal menambahkan soal." };
  }
}

/**
 * Server action untuk memperbarui butir soal yang sudah ada.
 */
export async function updateQuestionAction(data: {
  questionId: string;
  quizId: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  points: number;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const question = await prisma.quizQuestion.findFirst({
    where: {
      id: data.questionId,
      quiz: {
        academy_id: session.academy_id,
        deleted_at: null,
      },
    },
  });
  if (!question) return { error: "Soal tidak ditemukan." };

  const trimmedText = data.questionText?.trim();
  if (!trimmedText) return { error: "Pertanyaan soal wajib diisi." };

  const cleanedOptions = (data.options || []).map((opt) => opt.trim()).filter(Boolean);
  if (cleanedOptions.length < 2) {
    return { error: "Minimal sediakan 2 pilihan jawaban." };
  }

  if (data.correctAnswerIndex < 0 || data.correctAnswerIndex >= cleanedOptions.length) {
    return { error: "Kunci jawaban harus menunjuk ke salah satu opsi yang valid." };
  }

  try {
    await prisma.quizQuestion.update({
      where: { id: data.questionId },
      data: {
        question_text: trimmedText,
        options: cleanedOptions,
        correct_answer_index: data.correctAnswerIndex,
        explanation: data.explanation?.trim() || null,
        points: Math.max(1, Number(data.points) || 10),
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${data.quizId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating question:", err);
    return { error: err.message || "Gagal memperbarui soal." };
  }
}

/**
 * Server action untuk menghapus butir soal.
 */
export async function deleteQuestionAction(questionId: string, quizId: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const question = await prisma.quizQuestion.findFirst({
    where: {
      id: questionId,
      quiz: {
        academy_id: session.academy_id,
        deleted_at: null,
      },
    },
  });
  if (!question) return { error: "Soal tidak ditemukan." };

  try {
    await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(`/${tenantSlug}/dashboard/quizzes/${quizId}`);
    revalidatePath(`/${tenantSlug}/dashboard/quizzes`);
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting question:", err);
    return { error: err.message || "Gagal menghapus soal." };
  }
}

/**
 * Server action untuk memperbarui pengaturan kuis (judul, durasi, status).
 */
export async function updateQuizSettingsAction(data: {
  quizId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  evaluationType?: "EXAM" | "HOMEWORK";
  isPublished: boolean;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: data.quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  const trimmedTitle = data.title?.trim();
  if (!trimmedTitle) return { error: "Judul kuis wajib diisi." };

  try {
    await prisma.quiz.update({
      where: { id: data.quizId },
      data: {
        title: trimmedTitle,
        description: data.description?.trim() || null,
        duration_minutes: Number(data.durationMinutes) || 30,
        ...(data.evaluationType ? { evaluation_type: data.evaluationType } : {}),
        is_published: data.isPublished,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${data.quizId}`);
    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating quiz settings:", err);
    return { error: err.message || "Gagal memperbarui pengaturan kuis." };
  }
}

