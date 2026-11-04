"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { encryptResetPending } from "@/lib/auth";

export async function requestPasswordResetAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();

  // 2. Validasi Format Email
  if (!email) {
    return { error: "Email wajib diisi." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format email tidak valid." };
  }

  try {
    // 3. KEAMANAN: Cek apakah akun ini adalah Superadmin
    // Fitur lupa password TIDAK BERLAKU untuk Superadmin
    const superadmin = await prisma.superadmin.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (superadmin) {
      return {
        error: "Email tidak ditemukan di sistem BimbelSync. Pastikan email yang Anda masukkan sudah benar.",
      };
    }

    // 4. Cari di tabel Staff (Admin Bimbel atau Tutor)
    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
      include: {
        academy: true,
      },
    });

    if (!staff) {
      // Cek apakah akun ini adalah Siswa
      const student = await prisma.student.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          deleted_at: null,
        },
        include: {
          academy: true,
        },
      });

      if (student) {
        return {
          error: `Akun ini terdaftar sebagai Siswa di ${student.academy.name}. Silakan hubungi staf admin bimbel Anda untuk mengatur ulang kata sandi.`,
        };
      }

      return {
        error: "Email tidak ditemukan di sistem BimbelSync. Pastikan email yang Anda masukkan sudah benar.",
      };
    }

    // 5. Generate Kode OTP 6 Digit yang aman (Cryptographically Secure)
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Berlaku 15 menit

    // 6. Simpan kode OTP ke Database
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        otp_code: otpCode,
        otp_expires_at: expiresAt,
      },
    });

    // 7. Kirimkan Email OTP Reset Password
    const emailResult = await sendPasswordResetOtpEmail(
      staff.email,
      otpCode,
      staff.name || "Pengelola Bimbel"
    );

    if (!emailResult.success) {
      return {
        error: emailResult.error || "Gagal mengirimkan email reset password. Silakan coba lagi.",
      };
    }

    // 8. Buat Sesi Token Sementara di HttpOnly Cookie (OWASP Anti PII Leakage)
    const resetPendingToken = await encryptResetPending({
      email: staff.email,
      attempts: 0,
    });

    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_reset_pending", resetPendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 menit
    });

  } catch (error: any) {
    console.error("[REQUEST PASSWORD RESET ERROR]:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba beberapa saat lagi." };
  }

  // 9. Redirect ke halaman Reset Password
  redirect("/reset-password");
}

