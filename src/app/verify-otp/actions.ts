"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendOtpEmail } from "@/lib/email";

export async function verifyOtpAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const otpCode = (formData.get("otpCode") as string)?.trim();

  if (!email || !otpCode) {
    return { error: "Email dan kode OTP wajib diisi." };
  }

  if (otpCode.length !== 6) {
    return { error: "Kode OTP harus terdiri dari 6 digit angka." };
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
      if (!staff.otp_code || staff.otp_code !== otpCode) {
        return { error: "Kode OTP salah. Silakan periksa kembali email Anda." };
      }

      if (staff.otp_expires_at && new Date() > staff.otp_expires_at) {
        return { error: "Kode OTP telah kadaluarsa. Silakan klik 'Kirim Ulang Kode OTP'." };
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

export async function resendOtpAction(email: string) {
  if (!email) {
    return { error: "Email tidak valid." };
  }

  try {
    const staff = await prisma.staff.findFirst({
      where: {
        email: { equals: email.trim().toLowerCase(), mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (!staff) {
      return { error: "Akun tidak ditemukan." };
    }

    if (staff.email_verified) {
      return { error: "Akun ini sudah terverifikasi. Silakan langsung masuk." };
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        otp_code: newOtp,
        otp_expires_at: newExpires,
      },
    });

    await sendOtpEmail(staff.email, newOtp, staff.name || "Pengguna");

    return { success: true, message: "Kode OTP baru telah dikirimkan ke email Anda." };
  } catch (err: any) {
    console.error("Resend OTP Error:", err);
    return { error: "Gagal mengirim ulang kode OTP." };
  }
}
