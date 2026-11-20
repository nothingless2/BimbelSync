"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/session";

/**
 * Server action untuk membuat kuis / latihan soal baru.
 */
export async function createQuizAction(data: {
  academyId: string;
  programId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  evaluationType?: "EXAM" | "HOMEWORK";
  isPublished: boolean;
  showResultImmediately?: boolean;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  if (session.academy_id !== data.academyId) {
    return { error: "Akses ditolak." };
  }

  const trimmedTitle = data.title?.trim();
  if (!trimmedTitle) {
    return { error: "Judul kuis wajib diisi." };
  }

  // Validasi program milik bimbel ini
  const program = await prisma.program.findFirst({
    where: { id: data.programId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!program) {
    return { error: "Program pembelajaran tidak ditemukan." };
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        academy_id: session.academy_id,
        program_id: data.programId,
        created_by_staff_id: session.id,
        title: trimmedTitle,
        description: data.description?.trim() || null,
        duration_minutes: Number(data.durationMinutes) || 30,
        evaluation_type: data.evaluationType || "EXAM",
        is_published: data.isPublished,
        show_result_immediately: data.showResultImmediately ?? false,
        is_results_released: false,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes`);
    return { success: true, quizId: quiz.id };
  } catch (err: any) {
    console.error("Error creating quiz:", err);
    return { error: err.message || "Gagal membuat kuis baru." };
  }
}

/**
 * Server action untuk memperbarui informasi dasar kuis.
 */
export async function updateQuizAction(data: {
  quizId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  evaluationType?: "EXAM" | "HOMEWORK";
  programId: string;
  isPublished: boolean;
  showResultImmediately?: boolean;
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
        evaluation_type: data.evaluationType || "EXAM",
        program_id: data.programId,
        is_published: data.isPublished,
        ...(data.showResultImmediately !== undefined && {
          show_result_immediately: data.showResultImmediately,
        }),
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes`);
    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${data.quizId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating quiz:", err);
    return { error: err.message || "Gagal memperbarui kuis." };
  }
}

/**
 * Server action untuk merilis (publish) atau menahan (hold) nilai kuis bagi seluruh siswa.
 * Mensinkronisasikan status StudentEvaluation (E-Rapor) antara DRAFT dan PUBLISHED.
 */
export async function toggleReleaseResultsAction(data: {
  quizId: string;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: data.quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  const newReleasedState = !quiz.is_results_released;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Perbarui status rilis kuis
      await tx.quiz.update({
        where: { id: quiz.id },
        data: { is_results_released: newReleasedState },
      });

      // 2. Sinkronkan nilai kuis pada StudentEvaluation (E-Rapor)
      await tx.studentEvaluation.updateMany({
        where: {
          academy_id: session.academy_id,
          program_id: quiz.program_id,
          title: `[Kuis Online] ${quiz.title}`,
        },
        data: {
          status: newReleasedState ? "PUBLISHED" : "DRAFT",
        },
      });
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${quiz.id}`);
    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes`);
    revalidatePath(`/${data.tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${data.tenantSlug}/student/quizzes/${quiz.id}`);
    revalidatePath(`/${data.tenantSlug}/student/quizzes`);
    revalidatePath(`/${data.tenantSlug}/student/evaluations`);
    revalidatePath(`/${data.tenantSlug}/student/dashboard`);

    return { success: true, isResultsReleased: newReleasedState };
  } catch (err: any) {
    console.error("Error toggling release results:", err);
    return { error: err.message || "Gagal mengubah status rilis nilai kuis." };
  }
}

/**
 * Server action untuk mengubah opsi apakah nilai kuis tampil seketika setelah submit.
 */
export async function toggleShowResultImmediatelyAction(data: {
  quizId: string;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: data.quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  const newImmediateState = !quiz.show_result_immediately;

  try {
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { show_result_immediately: newImmediateState },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/quizzes/${quiz.id}`);
    revalidatePath(`/${data.tenantSlug}/student/quizzes/${quiz.id}`);

    return { success: true, showResultImmediately: newImmediateState };
  } catch (err: any) {
    console.error("Error toggling showResultImmediately:", err);
    return { error: err.message || "Gagal mengubah pengaturan hasil kuis." };
  }
}

/**
 * Server action untuk mengubah status publikasi kuis (Terbit / Draf).
 */
export async function togglePublishQuizAction(quizId: string, isPublished: boolean, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  try {
    await prisma.quiz.update({
      where: { id: quizId },
      data: { is_published: isPublished },
    });

    revalidatePath(`/${tenantSlug}/dashboard/quizzes`);
    revalidatePath(`/${tenantSlug}/dashboard/quizzes/${quizId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling publish status:", err);
    return { error: err.message || "Gagal memperbarui status publikasi." };
  }
}

/**
 * Server action untuk menghapus kuis (soft delete).
 */
export async function deleteQuizAction(quizId: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ("error" in auth) return { error: auth.error };
  const session = auth.session;

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, academy_id: session.academy_id, deleted_at: null },
  });
  if (!quiz) return { error: "Kuis tidak ditemukan." };

  try {
    await prisma.quiz.update({
      where: { id: quizId },
      data: { deleted_at: new Date() },
    });

    revalidatePath(`/${tenantSlug}/dashboard/quizzes`);
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting quiz:", err);
    return { error: err.message || "Gagal menghapus kuis." };
  }
}

