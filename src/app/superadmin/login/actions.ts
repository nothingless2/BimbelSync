"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { cookies, headers } from "next/headers";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

export async function superadminLoginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  try {
    // 1. Dapatkan IP Address (Global Rate Limiting)
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    // Jika tidak ada x-forwarded-for (misal di localhost), gunakan fallback
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    // 2. Cek status Rate Limit untuk IP ini
    let rateLimit = await prisma.loginRateLimit.findUnique({
      where: { ip_address: ip }
    });

    const now = new Date();

    // Jika belum ada record untuk IP ini, buat baru
    if (!rateLimit) {
      rateLimit = await prisma.loginRateLimit.create({
        data: { ip_address: ip, failed_attempts: 0 }
      });
    } else {
      // Cek apakah IP ini sedang terkunci
      if (rateLimit.locked_until && rateLimit.locked_until > now) {
        const remainingMs = rateLimit.locked_until.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
        return {
          error: `Terlalu banyak percobaan. Akses ditangguhkan. Coba lagi dalam ${remainingMinutes} menit.`,
        };
      }

      // Jika hukuman sudah selesai, reset
      if (rateLimit.locked_until && rateLimit.locked_until <= now) {
        rateLimit = await prisma.loginRateLimit.update({
          where: { ip_address: ip },
          data: { failed_attempts: 0, locked_until: null },
        });
      }
    }

    let currentAttempts = rateLimit.failed_attempts;

    // 3. Cek Kredensial di Database
    const superadmin = await prisma.superadmin.findUnique({
      where: { email },
    });

    let isValidPassword = false;
    if (superadmin) {
      isValidPassword = await bcrypt.compare(password, superadmin.password_hash);
    }

    // 4. Jika Gagal Login (Email tidak ada ATAU Password salah)
    if (!isValidPassword) {
      const newAttempts = currentAttempts + 1;
      const shouldLock = newAttempts >= MAX_ATTEMPTS;

      await prisma.loginRateLimit.update({
        where: { ip_address: ip },
        data: {
          failed_attempts: newAttempts,
          locked_until: shouldLock
            ? new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)
            : null,
        },
      });

      const remaining = MAX_ATTEMPTS - newAttempts;
      if (shouldLock) {
        return {
          error: `Terlalu banyak percobaan gagal. Akses ditangguhkan selama ${LOCK_DURATION_MINUTES} menit.`,
        };
      }
      // Pesan samar agar tidak memberitahu apakah email terdaftar atau tidak
      return {
        error: `Kredensial tidak valid. ${remaining} percobaan tersisa.`,
      };
    }

    // 5. JIKA BERHASIL LOGIN (superadmin PASTI ada jika isValidPassword true)
    // Reset counter percobaan gagal untuk IP ini
    await prisma.loginRateLimit.update({
      where: { ip_address: ip },
      data: { failed_attempts: 0, locked_until: null },
    });

    // Update last_login timestamp
    await prisma.superadmin.update({
      where: { id: superadmin!.id },
      data: {
        last_login: new Date(),
      },
    });

    // Buat JWT token
    const token = await encrypt({
      id: superadmin!.id,
      role: "SUPERADMIN",
      session_version: superadmin!.session_version,
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
