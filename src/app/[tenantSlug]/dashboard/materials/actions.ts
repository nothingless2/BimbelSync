"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireStaffSession } from "@/lib/session";
import { assertFeatureAccess, getAcademySubscription, getMaxLearningMaterials } from "@/lib/subscription";

export async function createMaterialAction(data: {
  academyId: string;
  programId: string;
  title: string;
  description?: string;
  materialType: "DOCUMENT_LINK" | "VIDEO_LINK" | "OTHER_LINK";
  url: string;
  tenantSlug: string;
}) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  if (session.academy_id !== data.academyId) {
    return { error: "Akses ditolak." };
  }

  // Feature Gating: Pengelolaan materi pembelajaran
  const featureCheck = await assertFeatureAccess(session.academy_id, "learning_materials");
  if (!featureCheck.allowed) {
    return { error: featureCheck.error };
  }

  // Validasi URL
  const trimmedUrl = data.url?.trim() || "";
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return { error: "URL harus berupa link valid yang diawali dengan http:// atau https://" };
  }

  try {
    // Validasi kuota modul belajar (misal Starter: maks 15 modul)
    const sub = await getAcademySubscription(session.academy_id);
    if (sub) {
      const maxMaterials = getMaxLearningMaterials(sub.planName);
      if (maxMaterials !== null) {
        const currentCount = await prisma.learningMaterial.count({
          where: { academy_id: session.academy_id }
        });
        if (currentCount >= maxMaterials) {
          return {
            error: `Batas kuota materi belajar untuk paket ${sub.planName} (${maxMaterials} modul) telah tercapai. Silakan upgrade ke paket Growth atau Pro untuk mengunggah materi tanpa batas.`
          };
        }
      }
    }

    // Validasi program milik akademi
    const program = await prisma.program.findFirst({
      where: { id: data.programId, academy_id: session.academy_id, deleted_at: null }
    });
    if (!program) return { error: "Program tidak ditemukan." };

    await prisma.learningMaterial.create({
      data: {
        academy_id: session.academy_id,
        program_id: data.programId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        material_type: data.materialType,
        url: trimmedUrl,
        created_by_staff_id: session.id,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/materials`);
    revalidatePath(`/${data.tenantSlug}/student/materials`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create material:", error);
    return { error: error.message || "Failed to create learning material" };
  }
}

export async function deleteMaterialAction(id: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) return { error: auth.error };
  const session = auth.session;

  const featureCheck = await assertFeatureAccess(session.academy_id, "learning_materials");
  if (!featureCheck.allowed) {
    return { error: featureCheck.error };
  }

  try {
    const material = await prisma.learningMaterial.findFirst({
      where: { id, academy_id: session.academy_id }
    });
    if (!material) {
      return { error: "Materi belajar tidak ditemukan atau akses ditolak." };
    }

    await prisma.learningMaterial.delete({
      where: { id },
    });

    revalidatePath(`/${tenantSlug}/dashboard/materials`);
    revalidatePath(`/${tenantSlug}/student/materials`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete learning material" };
  }
}
