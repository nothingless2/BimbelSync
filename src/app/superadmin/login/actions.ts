"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function superadminLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const superadmin = await prisma.superadmin.findUnique({
      where: { email },
    });

    if (!superadmin) {
      return { error: "Kredensial tidak valid." };
    }

    const isValidPassword = await bcrypt.compare(password, superadmin.password_hash);

    if (!isValidPassword) {
      return { error: "Kredensial tidak valid." };
    }

    // Buat JWT token khusus role SUPERADMIN
    const token = await encrypt({
      id: superadmin.id,
      role: "SUPERADMIN",
    });

    // Simpan di HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Superadmin login error:", error);
    return { error: "Terjadi kesalahan internal pada server." };
  }
}
