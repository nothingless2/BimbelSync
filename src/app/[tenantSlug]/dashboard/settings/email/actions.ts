"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { requireAdminSession } from "@/lib/session";
import { isFeatureAllowedByPlan } from "@/lib/subscription";
import { 
  testTenantSmtpConnection, 
  sendTenantEmail, 
  renderAnnouncementEmailTemplate,
  TenantSmtpConfig 
} from "@/lib/tenant-mailer";

export interface SmtpConfigInput {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName?: string;
  fromEmail?: string;
  secure?: boolean;
  isActive?: boolean;
}

/**
 * Menyimpan atau memperbarui konfigurasi SMTP milik akademi.
 */
export async function saveSmtpConfigAction(data: SmtpConfigInput) {
  const result = await requireAdminSession();
  if ("error" in result) return { error: result.error };
  const session = result.session;

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: { plan: true },
  });

  if (!academy) {
    return { error: "Akademi tidak ditemukan." };
  }

  // Verifikasi gating paket: hanya Growth dan Pro yang diizinkan
  if (!isFeatureAllowedByPlan(academy.plan, "automated_email")) {
    return { error: "Fitur konfigurasi SMTP hanya tersedia pada paket Growth dan Pro." };
  }

  const host = (data.host || "").trim();
  const port = Number(data.port) || 587;
  const user = (data.user || "").trim();
  let pass = (data.pass || "").trim();
  const fromName = (data.fromName || "").trim() || academy.name;
  const fromEmail = (data.fromEmail || "").trim() || user;
  const secure = Boolean(data.secure);
  const isActive = Boolean(data.isActive);

  // Jika password menggunakan host Gmail, bersihkan spasi bawaan Google
  if (host.toLowerCase().includes("gmail")) {
    pass = pass.replace(/\s+/g, "");
  }

  // Jika password tidak diisi ulang saat edit, pertahankan password lama
  if (!pass && academy.smtp_pass) {
    pass = academy.smtp_pass;
  }

  // Jika admin mengaktifkan SMTP, pastikan kredensial wajib terisi dan valid
  if (isActive) {
    if (!host) return { error: "Host SMTP wajib diisi sebelum mengaktifkan pengiriman email." };
    if (!port || isNaN(port) || port < 1 || port > 65535) {
      return { error: "Port SMTP tidak valid (harus berada di rentang 1 - 65535)." };
    }
    if (!user) return { error: "Username atau email SMTP wajib diisi." };
    if (!pass) return { error: "Password atau App Password SMTP wajib diisi." };

    if (host.toLowerCase().includes("gmail") && pass.length !== 16) {
      return { 
        error: `App Password Gmail harus terdiri dari 16 digit karakter tanpa spasi (saat ini ${pass.length} karakter).` 
      };
    }
  }

  try {
    await prisma.academy.update({
      where: { id: academy.id },
      data: {
        smtp_host: host || null,
        smtp_port: port,
        smtp_user: user || null,
        smtp_pass: pass || null,
        smtp_from_name: fromName,
        smtp_from_email: fromEmail || null,
        smtp_secure: secure,
        is_smtp_active: isActive,
      },
    });

    await createAuditLog({
      academy_id: academy.id,
      staff_id: session.id,
      action: "UPDATE",
      entity_type: "SmtpConfig",
      details: {
        host,
        port,
        user,
        from_name: fromName,
        from_email: fromEmail,
        is_active: isActive,
      },
    });

    revalidatePath(`/${session.tenant_slug}/dashboard/settings/email`);
    return { 
      success: true, 
      message: isActive 
        ? "Pengaturan SMTP berhasil disimpan dan layanan email telah AKTIF."
        : "Pengaturan SMTP berhasil disimpan (status saat ini: Nonaktif)."
    };
  } catch (error: any) {
    console.error("Error saving SMTP config:", error);
    return { error: "Terjadi kesalahan saat menyimpan pengaturan SMTP." };
  }
}

/**
 * Menguji coba koneksi SMTP dengan mengirim email tes ke alamat target.
 */
export async function testSmtpConfigAction(data: SmtpConfigInput & { targetEmail: string }) {
  const result = await requireAdminSession();
  if ("error" in result) return { error: result.error };
  const session = result.session;

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: { plan: true },
  });

  if (!academy) {
    return { error: "Akademi tidak ditemukan." };
  }

  if (!isFeatureAllowedByPlan(academy.plan, "automated_email")) {
    return { error: "Fitur pengiriman email hanya tersedia pada paket Growth dan Pro." };
  }

  const host = (data.host || "").trim();
  const port = Number(data.port) || 587;
  const user = (data.user || "").trim();
  let pass = (data.pass || "").trim();
  const targetEmail = (data.targetEmail || "").trim() || (session.staff?.email || "");

  if (host.toLowerCase().includes("gmail")) {
    pass = pass.replace(/\s+/g, "");
  }

  if (!pass && academy.smtp_pass) {
    pass = academy.smtp_pass;
  }

  if (!host || !user || !pass) {
    return { error: "Mohon lengkapi Host, Username, dan Password SMTP sebelum melakukan uji coba." };
  }

  if (host.toLowerCase().includes("gmail") && pass.length !== 16) {
    return { 
      error: `App Password Gmail harus terdiri dari 16 digit karakter tanpa spasi (saat ini ${pass.length} karakter).` 
    };
  }

  if (!targetEmail) {
    return { error: "Alamat email penerima uji coba tidak valid." };
  }

  const config: TenantSmtpConfig = {
    host,
    port,
    user,
    pass,
    fromName: (data.fromName || "").trim() || academy.name,
    fromEmail: (data.fromEmail || "").trim() || user,
    secure: Boolean(data.secure),
  };

  const testResult = await testTenantSmtpConnection(config, targetEmail, academy.name);

  if (!testResult.success) {
    return { error: testResult.error || "Gagal menghubungkan ke server SMTP." };
  }

  await createAuditLog({
    academy_id: academy.id,
    staff_id: session.id,
    action: "UPDATE",
    entity_type: "SmtpConfig",
    details: { action: "TEST_SMTP_CONNECTION", target_email: targetEmail, host, port },
  });

  return { 
    success: true, 
    message: `Koneksi SMTP berhasil! Email uji coba telah dikirim ke ${targetEmail}.` 
  };
}

/**
 * Mengirimkan broadcast email pengumuman resmi ke seluruh siswa aktif bimbel.
 */
export async function broadcastAnnouncementEmailAction({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const result = await requireAdminSession();
  if ("error" in result) return { error: result.error };
  const session = result.session;

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    include: { plan: true },
  });

  if (!academy) {
    return { error: "Akademi tidak ditemukan." };
  }

  const planName = (academy.plan?.name || "").trim().toLowerCase();
  const isPro = planName === "pro" || !!academy.plan?.allows_audit_trail;
  if (!isPro) {
    return { error: "Fitur broadcast pengumuman massal via email hanya tersedia pada paket Pro." };
  }

  if (!academy.is_smtp_active || !academy.smtp_host || !academy.smtp_user || !academy.smtp_pass) {
    return { error: "Layanan SMTP belum diaktifkan atau belum dikonfigurasi lengkap." };
  }

  const cleanTitle = (title || "").trim();
  const cleanMessage = (message || "").trim();

  if (!cleanTitle || !cleanMessage) {
    return { error: "Judul dan isi pengumuman tidak boleh kosong." };
  }

  // Ambil siswa aktif yang memiliki alamat email
  const students = await prisma.student.findMany({
    where: {
      academy_id: academy.id,
      deleted_at: null,
      email: { not: null },
    },
    select: {
      id: true,
      full_name: true,
      email: true,
    },
  });

  const validStudents = students.filter(s => s.email && s.email.includes("@"));

  if (validStudents.length === 0) {
    return { error: "Tidak ada siswa aktif yang memiliki alamat email valid di sistem." };
  }

  const appBaseUrl = process.env.NEXTAUTH_URL || "https://bimbelsync.com";
  const portalUrl = `${appBaseUrl}/${academy.path_url}/login`;

  let successCount = 0;
  let failCount = 0;

  for (const student of validStudents) {
    if (!student.email) continue;

    const html = renderAnnouncementEmailTemplate({
      academyName: academy.name,
      studentName: student.full_name,
      title: cleanTitle,
      message: cleanMessage,
      portalUrl,
    });

    const sendRes = await sendTenantEmail({
      academyId: academy.id,
      to: student.email,
      subject: `[Pengumuman] ${cleanTitle} - ${academy.name}`,
      html,
    });

    if (sendRes.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  await createAuditLog({
    academy_id: academy.id,
    staff_id: session.id,
    action: "CREATE",
    entity_type: "EmailAnnouncement",
    details: {
      action: "BROADCAST_ANNOUNCEMENT",
      title: cleanTitle,
      total_recipients: validStudents.length,
      success_count: successCount,
      fail_count: failCount,
    },
  });

  return {
    success: true,
    message: `Pengumuman berhasil disiarkan: ${successCount} email terkirim.${failCount > 0 ? ` (${failCount} gagal)` : ""}`,
    successCount,
    failCount,
  };
}
