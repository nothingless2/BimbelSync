"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { encrypt, validatePassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function registerAcademyAction(prevState: any, formData: FormData) {
  // Anti-bot Honeypot Check
  const honeypot = formData.get("_hp_website") as string;
  if (honeypot) {
    return { error: "Akses tidak sah terdeteksi." };
  }

  const academyName = formData.get("academyName") as string;
  const pathUrl = formData.get("pathUrl") as string;
  const adminName = formData.get("adminName") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminPhone = (formData.get("adminPhone") as string)?.trim();
  const adminPassword = formData.get("adminPassword") as string;
  const planChoice = (formData.get("planChoice") as string)?.trim() || "Pro";

  if (!academyName || !pathUrl || !adminName || !adminEmail || !adminPassword || !adminPhone) {
    return { error: "Semua kolom wajib diisi, termasuk nomor WhatsApp." };
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

    // 4. Set Default Paket Pro untuk Uji Coba 14 Hari (Semua Fitur Terbuka Penuh)
    let selectedPlan = await prisma.plan.findFirst({
      where: { 
        name: { contains: "Pro", mode: "insensitive" },
        deleted_at: null,
        is_active: true
      },
    });

    if (!selectedPlan) {
      selectedPlan = await prisma.plan.findFirst({
        where: { deleted_at: null, is_active: true },
        orderBy: { price: "desc" }
      });
    }

    // Fallback jika belum ada plan sama sekali di database
    if (!selectedPlan) {
      selectedPlan = await prisma.plan.create({
        data: {
          name: "Pro",
          price: 399000,
          max_students: null,
          max_staff: null,
          max_rooms: null,
          allows_installment: true,
          allows_automated_email: true,
          allows_qr_attendance: true,
          allows_erapor: true,
          allows_audit_trail: true,
          is_active: true,
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
          phone: adminPhone,
          plan_id: selectedPlan.id,
          subscription_status: "TRIAL",
          subscription_due_date: trialDueDate,
        },
      });

      // Buat Akun Admin Pertama untuk Bimbel ini
      const newAdmin = await tx.staff.create({
        data: {
          academy_id: newAcademy.id,
          email: adminEmail,
          phone: adminPhone,
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
