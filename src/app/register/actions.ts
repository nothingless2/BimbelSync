"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt, validatePassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function registerAcademyAction(prevState: any, formData: FormData) {
  const academyName = formData.get("academyName") as string;
  const pathUrl = formData.get("pathUrl") as string;
  const adminName = formData.get("adminName") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminPassword = formData.get("adminPassword") as string;

  if (!academyName || !pathUrl || !adminName || !adminEmail || !adminPassword) {
    return { error: "Semua kolom wajib diisi." };
  }

  // 1. Validasi Path URL (hanya huruf kecil dan angka, tanpa spasi)
  const pathRegex = /^[a-z0-9-]+$/;
  if (!pathRegex.test(pathUrl)) {
    return { error: "URL Bimbel hanya boleh mengandung huruf kecil, angka, dan strip (-)." };
  }
  
  if (pathUrl === "superadmin" || pathUrl === "api" || pathUrl === "register") {
    return { error: "URL Bimbel tersebut tidak diizinkan (kata terlarang)." };
  }

  // 2. Validasi Keamanan Password
  const passwordCheck = validatePassword(adminPassword);
  if (!passwordCheck.isValid) {
    return { error: passwordCheck.errorMsg };
  }

  try {
    // 3. Pastikan URL Bimbel belum dipakai orang lain
    const existingAcademy = await prisma.academy.findUnique({
      where: { path_url: pathUrl },
    });

    if (existingAcademy) {
      return { error: "URL Bimbel sudah digunakan. Silakan pilih URL lain." };
    }

    // 4. Cari Plan Trial (Buat otomatis jika belum ada di database)
    let trialPlan = await prisma.plan.findFirst({
      where: { name: "Trial Plan" },
    });

    if (!trialPlan) {
      trialPlan = await prisma.plan.create({
        data: {
          name: "Trial Plan",
          price: 0,
          max_students: 50,
          max_staff: 5,
          is_active: false, // Disembunyikan dari halaman harga publik
        },
      });
    }

    // 5. Transaksi Database (Buat Bimbel + Buat Admin)
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const trialDueDate = new Date();
    trialDueDate.setDate(trialDueDate.getDate() + 14); // Masa percobaan 14 hari

    const result = await prisma.$transaction(async (tx) => {
      // Buat Academy/Bimbel
      const newAcademy = await tx.academy.create({
        data: {
          name: academyName,
          path_url: pathUrl,
          plan_id: trialPlan.id,
          subscription_status: "TRIAL",
          subscription_due_date: trialDueDate,
        },
      });

      // Buat Akun Admin Pertama untuk Bimbel ini
      const newAdmin = await tx.staff.create({
        data: {
          academy_id: newAcademy.id,
          email: adminEmail,
          name: adminName,
          role: "ADMIN",
          password_hash: hashedPassword,
        },
      });

      return { newAcademy, newAdmin };
    });

    // 6. Buat Sesi (Login Otomatis)
    const token = await encrypt({
      id: result.newAdmin.id,
      role: "ADMIN",
      academy_id: result.newAcademy.id,
      tenant_slug: result.newAcademy.path_url,
    });

    const cookieStore = await cookies();
    cookieStore.set("bimbelsync_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 jam
      path: "/",
    });

  } catch (error: any) {
    console.error("Register Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // 7. Redirect ke Dashboard Tenant
  // Redirect tidak boleh berada di dalam try-catch block karena melempar error khusus
  redirect(`/${pathUrl}/dashboard`);
}
