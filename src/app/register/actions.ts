"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { validatePassword, encryptOtpPending } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendOtpEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { z } from "zod";

// Skema Validasi Input Ketat (OWASP Top 10 - A03: Injection & Input Validation)
const registerSchema = z.object({
  adminName: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter.")
    .regex(/^[a-zA-Z\s.,'-]+$/, "Nama hanya boleh mengandung huruf dan tanda baca nama."),
  adminPhone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length >= 10 && val.length <= 15, {
      message: "Nomor WhatsApp tidak valid (10-15 digit angka).",
    }),
  adminEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid.")
    .max(255, "Email maksimal 255 karakter."),
  adminPassword: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(128, "Password maksimal 128 karakter."),
});

export async function registerAcademyAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  // 2. Validasi Input melalui Zod Schema
  const rawData = {
    adminName: formData.get("adminName") as string,
    adminPhone: formData.get("adminPhone") as string,
    adminEmail: formData.get("adminEmail") as string,
    adminPassword: formData.get("adminPassword") as string,
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    const firstIssue = validation.error.issues?.[0];
    return { error: firstIssue?.message || "Input form pendaftaran tidak valid." };
  }

  const { adminName, adminPhone, adminEmail, adminPassword } = validation.data;

  // 3. Validasi Keamanan Password
  const passwordCheck = validatePassword(adminPassword);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.errorMsg };
  }

  try {
    // 4. Cek apakah email sudah terdaftar
    const existingStaff = await prisma.staff.findFirst({
      where: {
        email: { equals: adminEmail, mode: "insensitive" },
        deleted_at: null,
      },
    });

    // Generate 6 Digit Kode OTP Kriptografis Aman (OWASP A02: Cryptographic Failures)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // Tepat 1 Menit (60 detik)
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

    // 5. Kirim Email Berisi Kode OTP
    await sendOtpEmail(adminEmail, otpCode, adminName);

    // 6. Simpan Token Sesi Verifikasi Terenkripsi di HttpOnly Cookie
    // (Mencegah kebocoran email di URL query string - OWASP PII Protection)
    const pendingToken = await encryptOtpPending({ email: adminEmail, attempts: 0 });
    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_otp_pending", pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 menit sesi verifikasi
    });

  } catch (error: any) {
    console.error("Register Account Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // 7. Arahkan ke /verify-otp secara bersih TANPA parameter email di URL
  redirect("/verify-otp");
}
