"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export async function superadminLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    const superadmin = await prisma.superadmin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        session_version: true,
        failed_attempts: true,
        locked_until: true,
      },
    });

    // Jika akun tidak ditemukan, kembalikan pesan samar (tidak mengungkap apakah email terdaftar)
    if (!superadmin) {
      return { error: "Kredensial tidak valid." };
    }

    // ─── RATE LIMITING CHECK ────────────────────────────────────────────
    const now = new Date();

    // Cek apakah akun sedang dalam status terkunci
    if (superadmin.locked_until && superadmin.locked_until > now) {
      const remainingMs = superadmin.locked_until.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
      return {
        error: `Terlalu banyak percobaan gagal. Akun dikunci. Coba lagi dalam ${remainingMinutes} menit.`,
      };
    }

    // Reset jika lock sudah kadaluarsa
    if (superadmin.locked_until && superadmin.locked_until <= now) {
      await prisma.superadmin.update({
        where: { id: superadmin.id },
        data: { failed_attempts: 0, locked_until: null },
      });
    }
    // ────────────────────────────────────────────────────────────────────

    const isValidPassword = await bcrypt.compare(password, superadmin.password_hash);

    if (!isValidPassword) {
      // Tambah hitungan percobaan gagal
      const newAttempts = (superadmin.failed_attempts ?? 0) + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      await prisma.superadmin.update({
        where: { id: superadmin.id },
        data: {
          failed_attempts: newAttempts,
          locked_until: shouldLock
            ? new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)
            : undefined,
        },
      });

      const remaining = MAX_ATTEMPTS - newAttempts;
      if (shouldLock) {
        return {
          error: `Terlalu banyak percobaan gagal. Akun dikunci selama ${LOCK_DURATION_MINUTES} menit.`,
        };
      }
      return {
        error: `Kredensial tidak valid. ${remaining} percobaan tersisa sebelum akun dikunci.`,
      };
    }

    // ─── LOGIN BERHASIL ──────────────────────────────────────────────────
    // Reset counter percobaan gagal setelah berhasil login
    await prisma.superadmin.update({
      where: { id: superadmin.id },
      data: {
        failed_attempts: 0,
        locked_until: null,
        last_login: new Date(),
      },
    });

    // Buat JWT token khusus role SUPERADMIN
    const token = await encrypt({
      id: superadmin.id,
      role: "SUPERADMIN",
      session_version: superadmin.session_version,
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
