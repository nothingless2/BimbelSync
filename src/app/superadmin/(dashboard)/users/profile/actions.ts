"use server";

import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt, encrypt } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  return sessionCookie ? await decrypt(sessionCookie) : null;
}

export async function updateProfileAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") return { error: "Unauthorized" };

    const name = formData.get("name") as string;

    await prisma.superadmin.update({
      where: { id: session.id },
      data: { name },
    });

    revalidatePath("/superadmin/users/profile");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: "Terjadi kesalahan internal" };
  }
}

export async function updateAvatarAction(base64Image: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") return { error: "Unauthorized" };

    await prisma.superadmin.update({
      where: { id: session.id },
      data: { avatar_url: base64Image },
    });

    revalidatePath("/superadmin/users/profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menyimpan foto" };
  }
}

export async function changePasswordAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPERADMIN") return { error: "Unauthorized" };

    const oldPassword = formData.get("old_password") as string;
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return { error: "Semua field password wajib diisi" };
    }

    if (newPassword !== confirmPassword) {
      return { error: "Konfirmasi password tidak cocok" };
    }

    // Password strength check (min 8 chars, at least one letter and one number)
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { error: "Password minimal 8 karakter, harus mengandung huruf dan angka" };
    }

    const user = await prisma.superadmin.findUnique({ where: { id: session.id } });
    if (!user) return { error: "User tidak ditemukan" };

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) return { error: "Password lama salah" };

    const hash = await bcrypt.hash(newPassword, 10);
    const newSessionVersion = user.session_version + 1;

    await prisma.superadmin.update({
      where: { id: session.id },
      data: { 
        password_hash: hash,
        session_version: newSessionVersion,
      },
    });

    // Update current session cookie to match new version so user doesn't get logged out immediately
    const newToken = await encrypt({
      id: user.id,
      role: "SUPERADMIN",
      session_version: newSessionVersion,
    });

    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    revalidatePath("/superadmin/users/profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Terjadi kesalahan saat mengubah password" };
  }
}
