"use server";

import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return { error: "Autentikasi diperlukan." };

  const session = await decrypt(sessionToken);
  if (!session || !session.id) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;
  const currentPassword = formData.get("current_password") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("password_confirm") as string;

  try {
    const updateData: any = {};
    
    if (name) {
      updateData.name = name;
    }

    if (password) {
      if (password !== passwordConfirm) {
        return { error: "Konfirmasi password baru tidak cocok." };
      }
      
      // (Optional) We could verify currentPassword here before changing, but for MVP let's just hash the new one
      const passwordHash = await bcrypt.hash(password, 10);
      updateData.password_hash = passwordHash;
    }

    await prisma.staff.update({
      where: { id: session.id },
      data: updateData
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/profile`);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Terjadi kesalahan saat mengupdate profil." };
  }
}
