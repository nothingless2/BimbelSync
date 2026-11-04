"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { decryptResetPending, encryptResetPending, validatePassword } from "@/lib/auth";

export async function resetPasswordAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  // 2. Ambil Email dari HttpOnly Cookie (OWASP Top 10 - Anti PII Leakage)
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get("bimbelsync_reset_pending")?.value;
  const pendingData = pendingCookie ? await decryptResetPending(pendingCookie) : null;

  const email = (pendingData?.email || (formData.get("email") as string))?.trim().toLowerCase();
  const otpCode = (formData.get("otpCode") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 3. Validasi Sesi Email
  if (!email) {
    return { error: "Sesi reset kata sandi telah kedaluwarsa. Silakan ajukan ulang dari menu Lupa Kata Sandi." };
  }

  // 4. Validasi Format Kode OTP
  if (!otpCode || !/^\d{6}$/.test(otpCode)) {
    return { error: "Kode OTP harus terdiri dari 6 digit angka." };
  }

  // 5. Validasi Kecocokan Password
  if (!password || !confirmPassword) {
    return { error: "Kata sandi baru dan konfirmasi kata sandi wajib diisi." };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi kata sandi baru tidak cocok. Pastikan keduanya sama." };
  }

  // 6. Validasi Kompleksitas Password (OWASP Standard)
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.errorMsg || "Kata sandi belum memenuhi kriteria keamanan." };
  }

  // 7. KEAMANAN: Pastikan BUKAN Superadmin
  const superadmin = await prisma.superadmin.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      deleted_at: null,
    },
  });

  if (superadmin) {
    return {
      error: "Akun pengelola tidak ditemukan.",
    };
  }

  // 8. Proteksi Brute-Force Rate Limiting (Maksimal 5 Percobaan Salah)
  const currentAttempts = (pendingData?.attempts || 0) + 1;
  if (currentAttempts > 5) {
    await prisma.staff.updateMany({
      where: { email },
      data: { otp_code: null, otp_expires_at: null },
    });
    cookieStore.delete("bimbelsync_reset_pending");
    return {
      error: "Terlalu banyak percobaan salah (Maksimal 5 kali). Kode OTP telah dibatalkan demi keamanan. Silakan minta kode baru.",
    };
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (!staff) {
      return { error: "Akun pengelola tidak ditemukan." };
    }

    // 9. Periksa Kode OTP
    if (!staff.otp_code || staff.otp_code !== otpCode) {
      // Simpan increment attempt ke cookie
      const updatedToken = await encryptResetPending({ email, attempts: currentAttempts });
      cookieStore.set("bimbelsync_reset_pending", updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });

      const remaining = 5 - currentAttempts;
      return {
        error: `Kode OTP salah. Sisa kesempatan: ${remaining} kali.`,
      };
    }

    // 10. Periksa Masa Berlaku Kode OTP
    if (staff.otp_expires_at && new Date() > staff.otp_expires_at) {
      return { error: "Kode OTP telah kedaluwarsa. Silakan klik 'Kirim Ulang Kode OTP'." };
    }

    // 11. Enkripsi Password Baru dengan Bcrypt (Salt Rounds: 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 12. Update Password di Database & Bersihkan Token OTP
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        password_hash: hashedPassword,
        otp_code: null,
        otp_expires_at: null,
      },
    });

    // 13. Hapus Sesi Cookie Reset Pending
    cookieStore.delete("bimbelsync_reset_pending");

  } catch (error: any) {
    console.error("[RESET PASSWORD ERROR]:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba beberapa saat lagi." };
  }

  // 14. Redirect ke Login dengan indikator sukses
  redirect("/login?reset=success");
}

export async function resendResetOtpAction(email: string) {
  if (!email) {
    return { error: "Email tidak valid." };
  }

  try {
    // Cek Superadmin Exclusion
    const superadmin = await prisma.superadmin.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deleted_at: null },
    });
    if (superadmin) {
      return { error: "Akun tidak ditemukan." };
    }

    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (!staff) {
      return { error: "Akun tidak ditemukan." };
    }

    // Generate Kode OTP Baru
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        otp_code: otpCode,
        otp_expires_at: expiresAt,
      },
    });

    await sendPasswordResetOtpEmail(
      staff.email,
      otpCode,
      staff.name || "Pengelola Bimbel"
    );

    // Reset attempt counter di cookie
    const updatedToken = await encryptResetPending({ email: staff.email, attempts: 0 });
    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_reset_pending", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return { success: true, message: "Kode OTP baru telah berhasil dikirimkan ke email Anda." };
  } catch (error: any) {
    console.error("[RESEND RESET OTP ERROR]:", error);
    return { error: "Gagal mengirim ulang kode OTP. Silakan coba lagi." };
  }
}

