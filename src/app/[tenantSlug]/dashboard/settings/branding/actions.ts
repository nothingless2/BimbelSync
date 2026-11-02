"use server";

import prisma from "@/lib/prisma";
import { requireAdminSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateAcademyBrandingAction(
  tenantSlug: string,
  data: {
    name: string;
    phone?: string;
    logoDataUrl?: string | null;
    removeLogo?: boolean;
  }
) {
  const auth = await requireAdminSession();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const session = auth.session;

  if (session.tenant_slug !== tenantSlug) {
    return { error: "Akses ditolak. Tenant tidak sesuai dengan sesi Anda." };
  }

  const trimmedName = data.name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { error: "Nama bimbel minimal 2 karakter." };
  }
  if (trimmedName.length > 100) {
    return { error: "Nama bimbel maksimal 100 karakter." };
  }

  const trimmedPhone = data.phone?.trim() || null;

  // Siapkan data pembaruan
  const updatePayload: {
    name: string;
    phone: string | null;
    logo_url?: string | null;
  } = {
    name: trimmedName,
    phone: trimmedPhone,
  };

  if (data.removeLogo) {
    updatePayload.logo_url = null;
  } else if (data.logoDataUrl) {
    // Validasi format data URL (Keamanan & pencegahan DoS)
    const isBase64Image = data.logoDataUrl.startsWith("data:image/");
    if (!isBase64Image) {
      return { error: "Format gambar tidak valid." };
    }

    // Batasi ukuran payload base64 maksimal ~200 KB (setara string length ~280.000)
    if (data.logoDataUrl.length > 280000) {
      return { error: "Ukuran gambar terlalu besar. Maksimal 150 KB setelah kompresi." };
    }

    updatePayload.logo_url = data.logoDataUrl;
  }

  try {
    await prisma.academy.update({
      where: { id: session.academy_id },
      data: updatePayload,
    });

    // Catat ke Audit Log jika diperlukan
    try {
      await prisma.auditLog.create({
        data: {
          academy_id: session.academy_id,
          staff_id: session.id,
          action: "UPDATE_ACADEMY_BRANDING",
          entity_type: "Academy",
          entity_id: session.academy_id,
          details: {
            name: trimmedName,
            phone: trimmedPhone,
            has_custom_logo: data.removeLogo ? false : Boolean(data.logoDataUrl),
          },
        },
      });
    } catch (auditErr) {
      console.warn("Gagal mencatat audit log:", auditErr);
    }

    // Revalidasi halaman-halaman yang menampilkan branding
    revalidatePath(`/${tenantSlug}/login`);
    revalidatePath(`/${tenantSlug}/dashboard`, "layout");
    revalidatePath(`/${tenantSlug}/dashboard/settings/branding`);

    return { success: true };
  } catch (error) {
    console.error("updateAcademyBrandingAction error:", error);
    return { error: "Gagal menyimpan perubahan identitas bimbel." };
  }
}

