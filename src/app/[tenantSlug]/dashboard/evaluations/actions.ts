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
