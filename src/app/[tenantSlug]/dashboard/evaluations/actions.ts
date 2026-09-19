"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

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
  const session = await getSession();
  if (!session || !session.id || session.academy_id !== data.academyId) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.studentEvaluation.create({
      data: {
        academy_id: data.academyId,
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
  const session = await getSession();
  if (!session || !session.id || session.academy_id !== data.academyId) {
    return { error: "Unauthorized" };
  }

  if (data.evaluations.length === 0) {
    return { error: "Tidak ada siswa untuk dinilai." };
  }

  try {
    const records = data.evaluations.map(ev => ({
      academy_id: data.academyId,
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
    const evaluation = await prisma.studentEvaluation.findUnique({ where: { id } });
    if (!evaluation || evaluation.academy_id !== session.academy_id) {
      return { error: "Evaluation not found or access denied" };
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
    await prisma.studentEvaluation.deleteMany({
      where: {
        program_id: programId,
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
    await prisma.studentEvaluation.updateMany({
      where: {
        program_id: programId,
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
    await prisma.studentEvaluation.updateMany({
      where: {
        program_id: programId,
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
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  if (weightExam + weightHomework !== 100) {
    return { error: "Total bobot harus 100%" };
  }

  try {
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
