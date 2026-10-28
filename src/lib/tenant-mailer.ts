import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { isFeatureAllowedByPlan } from "@/lib/subscription";

export interface TenantSmtpConfig {
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
 * Mengambil konfigurasi SMTP akademi yang valid dan aktif.
 */
export async function getTenantSmtpConfig(academyId: string) {
  const academy = await prisma.academy.findUnique({
    where: { id: academyId },
    include: { plan: true },
  });

  if (!academy) {
    return { error: "Akademi tidak ditemukan." };
  }

  const isAllowed = isFeatureAllowedByPlan(academy.plan, "automated_email");
  const isConfigured = !!(academy.smtp_host && academy.smtp_user && academy.smtp_pass);

  return {
    isAllowed,
    isConfigured,
    isActive: !!academy.is_smtp_active,
    config: {
      host: academy.smtp_host || "",
      port: academy.smtp_port || 587,
      user: academy.smtp_user || "",
      pass: academy.smtp_pass || "",
      fromName: academy.smtp_from_name || academy.name,
      fromEmail: academy.smtp_from_email || academy.smtp_user || "",
      secure: academy.smtp_secure || academy.smtp_port === 465,
      isActive: !!academy.is_smtp_active,
    },
    academyName: academy.name,
    tenantSlug: academy.path_url,
  };
}

/**
 * Menguji coba koneksi SMTP dengan mengirimkan satu email verifikasi ke email target.
 */
export async function testTenantSmtpConnection(
  config: TenantSmtpConfig,
  targetEmail: string,
  academyName: string = "Bimbel"
): Promise<{ success: boolean; error?: string }> {
  try {
    const isSecure = config.secure || config.port === 465;
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false, // Menghindari isu sertifikat self-signed pada custom SMTP
      },
    });

    // 1. Verifikasi koneksi ke mail server
    await transporter.verify();

    const senderDisplay = `"${config.fromName || academyName}" <${config.fromEmail || config.user}>`;

    // 2. Kirim email pengujian
    await transporter.sendMail({
      from: senderDisplay,
      to: targetEmail,
      subject: `[Uji Coba SMTP] Verifikasi Pengaturan Email - ${academyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e293b; font-size: 22px; font-weight: 800; margin: 0;">${academyName}</h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Konfigurasi Layanan Email Bimbel</p>
          </div>
          
          <div style="padding: 24px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0; text-align: center;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: #22c55e; color: #ffffff; font-size: 20px; font-weight: bold; margin-bottom: 12px;">✓</div>
            <h3 style="color: #15803d; font-size: 16px; font-weight: 700; margin: 0 0 8px 0;">Koneksi SMTP Berhasil!</h3>
            <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.5;">
              Server email bimbel Anda telah terhubung dengan sukses. Sistem kini siap mengirimkan notifikasi tagihan dan pengumuman secara otomatis ke siswa dan wali murid.
            </p>
          </div>

          <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; font-size: 12px; color: #64748b;">
            <p style="margin: 0 0 4px 0;"><strong>Host:</strong> ${config.host}:${config.port}</p>
            <p style="margin: 0 0 4px 0;"><strong>Akun Pengirim:</strong> ${config.user}</p>
            <p style="margin: 0;"><strong>Waktu Pengujian:</strong> ${new Date().toLocaleString("id-ID")}</p>
          </div>

          <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">Email pengujian otomatis dari BimbelSync.</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err: any) {
    console.error("[SMTP TEST ERROR]:", err);
    let errorMessage = err.message || "Gagal menghubungi server SMTP.";
    if (err.code === "EAUTH") {
      errorMessage = "Autentikasi gagal. Pastikan username dan password (App Password) sudah benar.";
    } else if (err.code === "ESOCKET" || err.code === "ETIMEDOUT") {
      errorMessage = `Koneksi timeout ke ${config.host}:${config.port}. Periksa host dan port SMTP.`;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Mengirimkan email resmi dari akademi ke siswa/wali.
 */
export async function sendTenantEmail({
  academyId,
  to,
  subject,
  html,
  text,
}: {
  academyId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpData = await getTenantSmtpConfig(academyId);
    if ("error" in smtpData) return { success: false, error: smtpData.error };

    if (!smtpData.isAllowed) {
      return { success: false, error: "Fitur pengiriman email otomatis hanya tersedia pada paket Growth dan Pro." };
    }

    if (!smtpData.isConfigured || !smtpData.isActive) {
      return { success: false, error: "Layanan email SMTP bimbel belum dikonfigurasi atau belum diaktifkan." };
    }

    const { config } = smtpData;
    const isSecure = config.secure || config.port === 465;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const senderDisplay = `"${config.fromName || smtpData.academyName}" <${config.fromEmail || config.user}>`;

    await transporter.sendMail({
      from: senderDisplay,
      to,
      subject,
      html,
      text: text || "Silakan buka email ini di aplikasi yang mendukung format HTML.",
    });

    return { success: true };
  } catch (err: any) {
    console.error("[SEND TENANT EMAIL ERROR]:", err);
    return { success: false, error: err.message || "Gagal mengirimkan email ke siswa." };
  }
}

/**
 * Template Email: Tagihan SPP Baru & Cicilan
 */
export function renderInvoiceEmailTemplate({
  academyName,
  studentName,
  invoiceNumber,
  amount,
  dueDate,
  paymentOption,
  installments,
  bankName,
  bankAccount,
  portalUrl,
}: {
  academyName: string;
  studentName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paymentOption: "FULL" | "INSTALLMENT";
  installments?: { term: number; amount: number; dueDate: string; isPaid: boolean }[];
  bankName?: string | null;
  bankAccount?: string | null;
  portalUrl: string;
}): string {
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  const installmentRows =
    installments && installments.length > 0
      ? installments
          .map(
            (inst) => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; font-size: 13px; color: #334155;">Termin ${inst.term}</td>
            <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #1e293b;">${formatRupiah(inst.amount)}</td>
            <td style="padding: 10px 12px; font-size: 13px; color: #64748b;">${inst.dueDate}</td>
            <td style="padding: 10px 12px; font-size: 12px; text-align: right;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px; ${
                inst.isPaid ? "background-color: #dcfce7; color: #15803d;" : "background-color: #fef3c7; color: #b45309;"
              }">
                ${inst.isPaid ? "Lunas" : "Belum Bayar"}
              </span>
            </td>
          </tr>`
          )
          .join("")
      : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #2563eb; padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">${academyName}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Pemberitahuan Tagihan Pembayaran Siswa</p>
      </div>

      <!-- Content -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">
          Yth. Siswa/Wali Murid dari <strong>${studentName}</strong>,
        </p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
          Berikut rincian tagihan biaya bimbingan belajar yang diterbitkan untuk periode berjalan:
        </p>

        <!-- Invoice Summary Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">No. Tagihan</td>
              <td style="padding: 6px 0; font-weight: 700; color: #1e293b; text-align: right;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Tagihan</td>
              <td style="padding: 6px 0; font-size: 18px; font-weight: 800; color: #2563eb; text-align: right;">${formatRupiah(amount)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Skema Pembayaran</td>
              <td style="padding: 6px 0; font-weight: 600; color: #334155; text-align: right;">
                ${paymentOption === "INSTALLMENT" ? "Cicilan Termin" : "Pembayaran Lunas Penuh"}
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Jatuh Tempo</td>
              <td style="padding: 6px 0; font-weight: 600; color: #dc2626; text-align: right;">${dueDate}</td>
            </tr>
          </table>
        </div>

        ${
          paymentOption === "INSTALLMENT" && installmentRows
            ? `
          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Rincian Termin Pembayaran</h4>
            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                  <th style="padding: 8px 12px;">Termin</th>
                  <th style="padding: 8px 12px;">Nominal</th>
                  <th style="padding: 8px 12px;">Jatuh Tempo</th>
                  <th style="padding: 8px 12px; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${installmentRows}
              </tbody>
            </table>
          </div>`
            : ""
        }

        ${
          bankName && bankAccount
            ? `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Rekening Pembayaran Resmi Bimbel</p>
            <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1e3a8a;">${bankName}: ${bankAccount}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #3b82f6;">a.n. ${academyName}</p>
          </div>`
            : ""
        }

        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">
            Lihat Tagihan & Upload Bukti Bayar
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">Email ini dikirimkan otomatis oleh sistem manajemen operasional <strong>${academyName}</strong>.</p>
        <p style="margin: 4px 0 0 0;">Jika Anda memiliki pertanyaan mengenai pembayaran ini, silakan hubungi staf admin bimbel.</p>
      </div>
    </div>
  `;
}

/**
 * Template Email: Broadcast Pengumuman Resmi Bimbel
 */
export function renderAnnouncementEmailTemplate({
  academyName,
  studentName,
  title,
  message,
  portalUrl,
}: {
  academyName: string;
  studentName: string;
  title: string;
  message: string;
  portalUrl: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: #1e293b; padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">${academyName}</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Pengumuman & Informasi Akademik</p>
      </div>

      <!-- Content -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">
          Halo <strong>${studentName}</strong>,
        </p>

        <div style="margin: 20px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px 12px 12px 4px;">
          <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a;">${title}</h2>
          <div style="font-size: 14px; line-height: 1.7; color: #334155; white-space: pre-line;">
            ${message}
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
            Buka Portal Siswa
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        <p style="margin: 0;">Pesan resmi dari pengelola <strong>${academyName}</strong>.</p>
      </div>
    </div>
  `;
}
