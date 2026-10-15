"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaffSession, requireAdminSession } from "@/lib/session";

export async function createEvaluationAction(data: {
  academyId: string;
  studentId: string;
  programId: string;
  title: string;
  evaluationType: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT";
  score?: number;
  notes?: string;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (session.academy_id !== data.academyId) {
    return { error: "Akses ditolak." };
  }

  try {
    await prisma.studentEvaluation.create({
      data: {
        academy_id: session.academy_id,
        student_id: data.studentId,
        program_id: data.programId,
        evaluator_id: session.id,
        title: data.title,
        evaluation_type: data.evaluationType,
        score: data.score,
        notes: data.notes || null,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${data.tenantSlug}/student/(protected)/evaluations`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create evaluation:", error);
    return { error: error.message || "Failed to create evaluation" };
  }
}

export async function bulkCreateEvaluationsAction(data: {
  academyId: string;
  programId: string;
  title: string;
  evaluationType: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT";
  evaluations: { studentId: string, score?: number, notes?: string }[];
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (session.academy_id !== data.academyId) {
    return { error: "Akses ditolak." };
  }

  if (data.evaluations.length === 0) {
    return { error: "Tidak ada siswa untuk dinilai." };
  }

  try {
    const records = data.evaluations.map(ev => ({
      academy_id: session.academy_id,
      student_id: ev.studentId,
      program_id: data.programId,
      evaluator_id: session.id,
      title: data.title,
      evaluation_type: data.evaluationType,
      score: ev.score,
      notes: ev.notes || null,
    }));

    await prisma.studentEvaluation.createMany({
      data: records
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${data.tenantSlug}/student/(protected)/evaluations`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to bulk create evaluations:", error);
    return { error: error.message || "Failed to create evaluations" };
  }
}

export async function deleteEvaluationAction(id: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const evaluation = await prisma.studentEvaluation.findFirst({
      where: { id, academy_id: session.academy_id }
    });
    if (!evaluation) {
      return { error: "Evaluasi tidak ditemukan atau akses ditolak." };
    }

    await prisma.studentEvaluation.delete({
      where: { id },
    });

    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${tenantSlug}/student/(protected)/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete evaluation" };
  }
}

export async function updateEvaluationScoreAction(id: string, score: number | null, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const evaluation = await prisma.studentEvaluation.findFirst({
      where: { id, academy_id: session.academy_id }
    });
    if (!evaluation) {
      return { error: "Evaluasi tidak ditemukan atau akses ditolak." };
    }

    await prisma.studentEvaluation.update({
      where: { id },
      data: { score }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update score" };
  }
}

export async function deleteEvaluationColumnAction(programId: string, title: string, evaluationType: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT", tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    // Validasi program milik academy user
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });
    if (!program) return { error: "Program tidak ditemukan atau akses ditolak." };

    await prisma.studentEvaluation.deleteMany({
      where: {
        program_id: programId,
        academy_id: session.academy_id,
        title: title,
        evaluation_type: evaluationType
      }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete column" };
  }
}

export async function updateEvaluationNotesAction(id: string, notes: string | null, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const evaluation = await prisma.studentEvaluation.findFirst({
      where: { id, academy_id: session.academy_id }
    });
    if (!evaluation) {
      return { error: "Evaluasi tidak ditemukan atau akses ditolak." };
    }

    await prisma.studentEvaluation.update({
      where: { id },
      data: { notes }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update notes" };
  }
}

export async function publishEvaluationColumnAction(programId: string, title: string, evaluationType: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT", tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });
    if (!program) return { error: "Program tidak ditemukan atau akses ditolak." };

    await prisma.studentEvaluation.updateMany({
      where: {
        program_id: programId,
        academy_id: session.academy_id,
        title: title,
        evaluation_type: evaluationType
      },
      data: {
        status: "PUBLISHED"
      }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${tenantSlug}/dashboard/evaluations/gradebook`);
    revalidatePath(`/${tenantSlug}/student/(protected)/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to publish column" };
  }
}

export async function unpublishEvaluationColumnAction(programId: string, title: string, evaluationType: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT", tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  try {
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });
    if (!program) return { error: "Program tidak ditemukan atau akses ditolak." };

    await prisma.studentEvaluation.updateMany({
      where: {
        program_id: programId,
        academy_id: session.academy_id,
        title: title,
        evaluation_type: evaluationType
      },
      data: {
        status: "DRAFT"
      }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    revalidatePath(`/${tenantSlug}/dashboard/evaluations/gradebook`);
    revalidatePath(`/${tenantSlug}/student/(protected)/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to revert to draft" };
  }
}

export async function updateProgramWeightsAction(programId: string, weightExam: number, weightHomework: number, tenantSlug: string) {
  const auth = await requireAdminSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (weightExam + weightHomework !== 100) {
    return { error: "Total bobot harus 100%" };
  }

  try {
    const program = await prisma.program.findFirst({
      where: { id: programId, academy_id: session.academy_id }
    });
    if (!program) return { error: "Program tidak ditemukan atau akses ditolak." };

    await prisma.program.update({
      where: { id: programId },
      data: {
        weight_exam: weightExam,
        weight_homework: weightHomework
      }
    });
    revalidatePath(`/${tenantSlug}/dashboard/evaluations/gradebook`);
    revalidatePath(`/${tenantSlug}/dashboard/evaluations`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update weights" };
  }
}
