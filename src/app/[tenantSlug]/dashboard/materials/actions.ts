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

export async function createMaterialAction(data: {
  academyId: string;
  programId: string;
  title: string;
  description?: string;
  materialType: "DOCUMENT_LINK" | "VIDEO_LINK" | "OTHER_LINK";
  url: string;
  tenantSlug: string;
}) {
  const session = await getSession();
  if (!session || !session.id || session.academy_id !== data.academyId) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.learningMaterial.create({
      data: {
        academy_id: data.academyId,
        program_id: data.programId,
        title: data.title,
        description: data.description || null,
        material_type: data.materialType,
        url: data.url,
        created_by_staff_id: session.id,
      },
    });

    revalidatePath(`/${data.tenantSlug}/dashboard/materials`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create material:", error);
    return { error: error.message || "Failed to create learning material" };
  }
}

export async function deleteMaterialAction(id: string, tenantSlug: string) {
  const session = await getSession();
  if (!session || !session.id) return { error: "Unauthorized" };

  try {
    const material = await prisma.learningMaterial.findUnique({ where: { id } });
    if (!material || material.academy_id !== session.academy_id) {
      return { error: "Material not found or access denied" };
    }

    await prisma.learningMaterial.delete({
      where: { id },
    });

    revalidatePath(`/${tenantSlug}/dashboard/materials`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete learning material" };
  }
}
