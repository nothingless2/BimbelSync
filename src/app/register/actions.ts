"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { validatePassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendOtpEmail } from "@/lib/email";

export async function registerAcademyAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  const adminName = (formData.get("adminName") as string)?.trim();
  const adminPhone = (formData.get("adminPhone") as string)?.trim();
  const adminEmail = (formData.get("adminEmail") as string)?.trim().toLowerCase();
  const adminPassword = formData.get("adminPassword") as string;

  if (!adminName || !adminPhone || !adminEmail || !adminPassword) {
    return { error: "Semua kolom wajib diisi." };
  }

  // 2. Validasi Nomor WhatsApp minimal 10 digit angka
  const phoneDigits = adminPhone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return { error: "Nomor WhatsApp tidak valid (minimal 10 digit angka)." };
  }

  // 3. Validasi Format Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    return { error: "Format email tidak valid." };
  }

  // 4. Validasi Keamanan Password
  const passwordCheck = validatePassword(adminPassword);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.errorMsg };
  }

  let targetRedirectEmail = "";

  try {
    // 5. Cek apakah email sudah terdaftar
    const existingStaff = await prisma.staff.findFirst({
      where: {
        email: { equals: adminEmail, mode: "insensitive" },
        deleted_at: null,
      },
    });

    // Generate 6 Digit Kode OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Berlaku 10 menit
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (existingStaff) {
      if (existingStaff.email_verified) {
        return { error: "Email ini sudah terdaftar dan terverifikasi. Silakan langsung masuk di menu Login." };
      }

      // Jika belum terverifikasi sebelumnya, perbarui OTP dan kirim ulang
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: {
          name: adminName,
          phone: adminPhone,
          password_hash: hashedPassword,
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
        },
      });
    } else {
      // Buat akun baru dengan email_verified: false
      await prisma.staff.create({
        data: {
          name: adminName,
          phone: adminPhone,
          email: adminEmail,
          role: "ADMIN",
          password_hash: hashedPassword,
          email_verified: false,
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
          academy_id: null,
        },
      });
    }

    // 6. Kirim Email Berisi Kode OTP
    await sendOtpEmail(adminEmail, otpCode, adminName);
    targetRedirectEmail = adminEmail;

  } catch (error: any) {
    console.error("Register Account Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // 7. Arahkan ke Halaman Verifikasi OTP Email
  if (targetRedirectEmail) {
    redirect(`/verify-otp?email=${encodeURIComponent(targetRedirectEmail)}`);
  }
}
