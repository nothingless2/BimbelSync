"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { sendOtpEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { decryptOtpPending, encryptOtpPending } from "@/lib/auth";

export async function verifyOtpAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  // 2. Ambil Email dari HttpOnly Cookie (OWASP Top 10 - Anti PII Leakage & Parameter Tampering)
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get("bimbelsync_otp_pending")?.value;
  const pendingData = pendingCookie ? await decryptOtpPending(pendingCookie) : null;

  // Fallback membaca dari form jika cookie belum tersedia
  const email = (pendingData?.email || (formData.get("email") as string))?.trim().toLowerCase();
  const otpCode = (formData.get("otpCode") as string)?.trim();

  // 3. Validasi Input Ketat (OWASP Top 10 - A03: Injection & Input Validation)
  if (!email) {
    return { error: "Sesi verifikasi telah kedaluwarsa. Silakan lakukan pendaftaran ulang." };
  }

  if (!otpCode || !/^\d{6}$/.test(otpCode)) {
    return { error: "Kode OTP harus terdiri dari 6 digit angka." };
  }

  // 4. Proteksi Brute-Force Rate Limiting (Maksimal 5 Percobaan Salah)
  const currentAttempts = (pendingData?.attempts || 0) + 1;
  if (currentAttempts > 5) {
    // Invalidate OTP di database demi keamanan
    await prisma.staff.updateMany({
      where: { email },
      data: { otp_code: null, otp_expires_at: null },
    });
    cookieStore.delete("bimbelsync_otp_pending");
    return { 
      error: "Terlalu banyak percobaan salah (Maksimal 5 kali). Kode OTP telah dibatalkan demi keamanan. Silakan minta kode baru." 
    };
  }

  let isVerified = false;

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (!staff) {
      return { error: "Akun dengan email tersebut tidak ditemukan." };
    }

    if (staff.email_verified) {
      isVerified = true;
    } else {
      // Periksa kecocokan kode OTP
      if (!staff.otp_code || staff.otp_code !== otpCode) {
        // Simpan increment attempt ke cookie
        const updatedPendingToken = await encryptOtpPending({ email, attempts: currentAttempts });
        cookieStore.set("bimbelsync_otp_pending", updatedPendingToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 10 * 60,
        });

        const remaining = 5 - currentAttempts;
        return { 
          error: `Kode OTP salah. Sisa kesempatan: ${remaining} kali.` 
        };
      }

      // Periksa masa berlaku kode OTP (1 menit)
      if (staff.otp_expires_at && new Date() > staff.otp_expires_at) {
        return { error: "Kode OTP telah kadaluarsa. Silakan kirim Ulang Kode OTP." };
      }

      // Verifikasi berhasil
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          email_verified: true,
          otp_code: null,
          otp_expires_at: null,
        },
      });

      // Hapus cookie sesi pending OTP setelah verifikasi berhasil
      cookieStore.delete("bimbelsync_otp_pending");

      isVerified = true;
    }
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  if (isVerified) {
    redirect("/login?verified=true");
  }
}

export async function resendOtpAction(fallbackEmail?: string) {
  // Ambil email dari HttpOnly cookie aman, atau fallbackEmail
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get("bimbelsync_otp_pending")?.value;
  const pendingData = pendingCookie ? await decryptOtpPending(pendingCookie) : null;

  const email = (pendingData?.email || fallbackEmail)?.trim().toLowerCase();

  if (!email) {
    return { error: "Sesi telah berakhir. Silakan daftar ulang atau masuk ke akun Anda." };
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (!staff) {
      return { error: "Akun tidak ditemukan." };
    }

    if (staff.email_verified) {
      return { error: "Akun ini sudah terverifikasi. Silakan langsung masuk." };
    }

    // Generate kode kriptografis baru 6 digit
    const newOtp = crypto.randomInt(100000, 1000000).toString();
    const newExpires = new Date(Date.now() + 1 * 60 * 1000); // 1 Menit (60 detik)

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        otp_code: newOtp,
        otp_expires_at: newExpires,
      },
    });

    // Reset attempt counter ke 0 pada cookie
    const resetPendingToken = await encryptOtpPending({ email, attempts: 0 });
    cookieStore.set("bimbelsync_otp_pending", resetPendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    // Kirim email
    await sendOtpEmail(staff.email, newOtp, staff.name || "Pengguna");

    return { success: true, message: "Kode OTP baru telah dikirimkan ke email Anda." };
  } catch (err: any) {
    console.error("Resend OTP Error:", err);
    return { error: "Gagal mengirim ulang kode OTP." };
  }
}
