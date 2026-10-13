"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
      if (!staff.academy || staff.academy.deleted_at) {
        continue;
      }

      const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
      if (isPasswordValid) {
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
        break;
      }
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
          break;
        }
      }
    }

    if (!redirectPath) {
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
