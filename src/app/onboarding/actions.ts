"use server";

import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setupAcademyAction(prevState: any, formData: FormData) {
  // 1. Validasi Sesi Pengguna
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionToken ? await decrypt(sessionToken) : null;

  if (!session || !session.id || session.role !== "ADMIN") {
    return { error: "Sesi login tidak valid. Silakan login kembali." };
  }

  const academyName = (formData.get("academyName") as string)?.trim();
  const pathUrl = (formData.get("pathUrl") as string)?.trim().toLowerCase();

  if (!academyName || !pathUrl) {
    return { error: "Nama Bimbel dan URL Portal wajib diisi." };
  }

  // 2. Validasi Path URL (hanya huruf kecil, angka, dan strip)
  const pathRegex = /^[a-z0-9-]+$/;
  if (!pathRegex.test(pathUrl)) {
    return { error: "URL Portal hanya boleh berisi huruf kecil, angka, dan tanda strip (-)." };
  }

  const reservedPaths = ["superadmin", "api", "register", "login", "onboarding", "admin", "dashboard", "terms", "privacy"];
  if (reservedPaths.includes(pathUrl)) {
    return { error: "URL Portal tersebut tidak dapat digunakan (kata terlarang sistem)." };
  }

  let finalSlug = "";

  try {
    // 3. Pastikan Akun Staf Ada dan Belum Punya Bimbel
    const staff = await prisma.staff.findUnique({
      where: { id: session.id },
      include: { academy: true },
    });

    if (!staff) {
      return { error: "Akun pengguna tidak ditemukan." };
    }

    if (staff.academy_id && staff.academy) {
      // Jika sudah punya bimbel, langsung arahkan ke dashboard
      redirect(`/${staff.academy.path_url}/dashboard`);
    }

    // 4. Pastikan URL belum dipakai bimbel lain
    const existingAcademy = await prisma.academy.findUnique({
      where: { path_url: pathUrl },
    });

    if (existingAcademy) {
      return { error: "URL Portal sudah digunakan oleh bimbel lain. Silakan pilih URL lain." };
    }

    // 5. Cari Plan Pro untuk Trial 14 Hari
    let proPlan = await prisma.plan.findFirst({
      where: {
        name: { contains: "Pro", mode: "insensitive" },
        deleted_at: null,
        is_active: true,
      },
    });

    if (!proPlan) {
      proPlan = await prisma.plan.findFirst({
        where: { deleted_at: null, is_active: true },
        orderBy: { price: "desc" },
      });
    }

    if (!proPlan) {
      proPlan = await prisma.plan.create({
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

    // 6. Buat Academy Baru & Tautkan ke Akun Staff
    const trialDueDate = new Date();
    trialDueDate.setDate(trialDueDate.getDate() + 14); // Masa percobaan 14 hari penuh

    const newAcademy = await prisma.$transaction(async (tx) => {
      const createdAcademy = await tx.academy.create({
        data: {
          name: academyName,
          path_url: pathUrl,
          phone: staff.phone,
          plan_id: proPlan.id,
          subscription_status: "TRIAL",
          subscription_due_date: trialDueDate,
        },
      });

      await tx.staff.update({
        where: { id: staff.id },
        data: { academy_id: createdAcademy.id },
      });

      return createdAcademy;
    });

    finalSlug = newAcademy.path_url;

    // 7. Perbarui Token Sesi dengan Academy ID & Tenant Slug
    const updatedToken = await encrypt({
      id: staff.id,
      role: "ADMIN",
      academy_id: newAcademy.id,
      tenant_slug: newAcademy.path_url,
    });

    cookieStore.set("bimbelsync_session", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 jam
      path: "/",
    });

  } catch (error: any) {
    console.error("Setup Academy Error:", error);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  // 8. Redirect ke Dashboard Tenant yang Baru Dibuat
  if (finalSlug) {
    redirect(`/${finalSlug}/dashboard`);
  }
}
