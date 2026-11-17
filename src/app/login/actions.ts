"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt, encryptOtpPending } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, resetRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";

export async function loginAction(prevState: any, formData: FormData) {
  // 1. Anti-bot Honeypot Check (field tak terlihat)
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  const identifier = (formData.get("identifier") as string)?.trim();
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return { error: "Email/Username dan password wajib diisi." };
  }

  // 2. Rate Limiting — batasi percobaan login per IP dan per identifier
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";

  const rateLimitKey = `login:${ip}:${identifier.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, RATE_LIMIT_PRESETS.login);

  if (!rateCheck.allowed) {
    const minutesLeft = Math.ceil(rateCheck.retryAfterMs / 60000);
    return {
      error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${minutesLeft} menit.`,
      rateLimited: true,
    };
  }

  let redirectPath = "";

  try {
    // 2. Cek sebagai Staff (Admin / Tutor) menggunakan Email
    const staffList = await prisma.staff.findMany({
      where: {
        email: { equals: identifier, mode: "insensitive" },
        deleted_at: null,
      },
      include: {
        academy: true,
      },
    });

    for (const staff of staffList) {
      const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
      if (!isPasswordValid) {
        continue;
      }

      // 1. Cek apakah email sudah diverifikasi via OTP
      if (!staff.email_verified) {
        const pendingToken = await encryptOtpPending({ email: staff.email, attempts: 0 });
        const cookieStore = await cookies();
        cookieStore.set("bimbelsync_otp_pending", pendingToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 10 * 60,
        });

        return {
          error: "Email Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirim ke email Anda terlebih dahulu.",
          needsVerification: true,
        };
      }

      // 2. Jika akun Admin belum memiliki Bimbel:
      // Berikan sesi login dan arahkan untuk mengisi Nama Bimbel & Path URL sebelum ke Dashboard
      if (!staff.academy_id) {
        const sessionToken = await encrypt({
          id: staff.id,
          role: staff.role,
        });

        const cookieStore = await cookies();
        cookieStore.set("bimbelsync_session", sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 8, // 8 jam
        });

        redirectPath = "/onboarding";
        break;
      }

      if (!staff.academy || staff.academy.deleted_at) {
        continue;
      }

      // 3. Jika sudah memiliki Bimbel:
      const sessionToken = await encrypt({
        id: staff.id,
        role: staff.role,
        academy_id: staff.academy.id,
        tenant_slug: staff.academy.path_url,
      });

      const cookieStore = await cookies();
      cookieStore.set("bimbelsync_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 jam
      });

      redirectPath = `/${staff.academy.path_url}/dashboard`;
      // Reset rate limit setelah login sukses
      resetRateLimit(rateLimitKey);
      break;
    }

    // 3. Jika belum cocok sebagai Staff, cek sebagai Student (Username atau Email)
    if (!redirectPath) {
      const studentList = await prisma.student.findMany({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
          deleted_at: null,
        },
        include: {
          academy: true,
        },
      });

      for (const student of studentList) {
        if (!student.academy || student.academy.deleted_at) {
          continue;
        }

        const isPasswordValid = await bcrypt.compare(password, student.password_hash);
        if (isPasswordValid) {
          const sessionToken = await encrypt({
            id: student.id,
            role: "STUDENT",
            academy_id: student.academy.id,
            tenant_slug: student.academy.path_url,
          });

          const cookieStore = await cookies();
          cookieStore.set("bimbelsync_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8, // 8 jam
          });

          redirectPath = `/${student.academy.path_url}/student/dashboard`;
          // Reset rate limit setelah login sukses
          resetRateLimit(rateLimitKey);
          break;
        }
      }
    }

    if (!redirectPath) {
      // 4. Cek apakah ada akun Staff atau Siswa yang dinonaktifkan (Soft Delete)
      const deactivatedStaff = await prisma.staff.findFirst({
        where: {
          email: { equals: identifier, mode: "insensitive" },
          OR: [
            { deleted_at: { not: null } },
            { academy: { deleted_at: { not: null } } },
          ],
        },
      });

      if (deactivatedStaff) {
        return { error: "User sudah tidak aktif lagi." };
      }

      const deactivatedStudent = await prisma.student.findFirst({
        where: {
          AND: [
            {
              OR: [
                { username: { equals: identifier, mode: "insensitive" } },
                { email: { equals: identifier, mode: "insensitive" } },
              ],
            },
            {
              OR: [
                { deleted_at: { not: null } },
                { academy: { deleted_at: { not: null } } },
              ],
            },
          ],
        },
      });

      if (deactivatedStudent) {
        return { error: "User sudah tidak aktif lagi." };
      }

      return { error: "Email, Username, atau kata sandi tidak cocok." };
    }

  } catch (error: any) {
    console.error("Global Login Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // 4. Redirect ke Dashboard Tenant
  if (redirectPath) {
    redirect(redirectPath);
  }
}
