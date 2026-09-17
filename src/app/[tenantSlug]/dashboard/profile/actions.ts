"use server";

import prisma from "@/lib/prisma";
import { decrypt, encrypt, validatePassword } from "@/lib/auth";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  if (!sessionToken) return null;
  const session = await decrypt(sessionToken);
  if (!session || !session.id) return null;
  return session;
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sesi tidak valid." };

  const name = formData.get("name") as string;

  try {
    await prisma.staff.update({
      where: { id: session.id },
      data: { name: name || null }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/profile`);
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Terjadi kesalahan saat mengupdate profil." };
  }
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sesi tidak valid." };

  const currentPassword = formData.get("current_password") as string;
  const password = formData.get("password") as string;
  const passwordConfirm = formData.get("password_confirm") as string;

  if (!currentPassword || !password || !passwordConfirm) {
    return { error: "Semua isian password wajib diisi." };
  }

  if (password !== passwordConfirm) {
    return { error: "Konfirmasi password baru tidak cocok." };
  }
  
  const pwValidation = validatePassword(password);
  if (!pwValidation.isValid) return { error: pwValidation.errorMsg };

  try {
    const staff = await prisma.staff.findUnique({ where: { id: session.id } });
    if (!staff) return { error: "Akun tidak ditemukan." };
    
    // Verifikasi password saat ini
    const isCurrentValid = await bcrypt.compare(currentPassword, staff.password_hash);
    if (!isCurrentValid) {
      return { error: "Password saat ini salah." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.staff.update({
      where: { id: session.id },
      data: { password_hash: passwordHash }
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/profile`);
    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { error: "Terjadi kesalahan saat mengubah password." };
  }
}

export async function updateAvatarAction(base64Image: string) {
  const session = await getSession();
  if (!session) return { error: "Sesi tidak valid." };

  try {
    await prisma.staff.update({
      where: { id: session.id },
      data: { avatar_url: base64Image },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/profile`);
    return { success: true };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { error: "Gagal menyimpan foto." };
  }
}
