import nodemailer from "nodemailer";

export async function sendOtpEmail(toEmail: string, otpCode: string, recipientName: string): Promise<{ success: boolean; error?: string }> {
  // 1. Kredensial Brevo (REST API atau SMTP Relay)
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "admin@bimbelsync.web.id";
  const brevoSenderName = process.env.BREVO_SENDER_NAME || "BimbelSync";

  // 2. Kredensial SMTP Umum (Bisa Brevo SMTP atau Gmail SMTP)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY;
  const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes("@") ? "smtp.gmail.com" : "smtp-relay.brevo.com");
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  // 3. Kredensial Resend (Alternatif)
  const resendApiKey = process.env.RESEND_API_KEY;

  const fromEmail = process.env.EMAIL_FROM || `BimbelSync <${smtpUser || brevoSenderEmail}>`;

  // Log ke server console untuk kemudahan pemantauan & pengujian
  console.log(`========================================`);
  console.log(`[EMAIL OTP BIMBELSYNC]`);
  console.log(`Tujuan: ${toEmail} (${recipientName})`);
  console.log(`Kode OTP: ${otpCode}`);
  console.log(`Masa Berlaku: 1 Menit (60 Detik)`);
  console.log(`Waktu Dibuat: ${new Date().toISOString()}`);
  console.log(`========================================`);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">BimbelSync</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistem Manajemen Bimbingan Belajar Terpadu</p>
      </div>
      
      <div style="padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center;">
        <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 12px;">Halo <strong>${recipientName}</strong>,</p>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Gunakan kode verifikasi berikut untuk mengaktifkan akun pendaftaran BimbelSync Anda:</p>
        
        <div style="background-color: #ffffff; border: 2px dashed #2563eb; padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 8px 0 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; font-family: monospace;">${otpCode}</span>
        </div>
        
        <p style="color: #e11d48; font-size: 13px; font-weight: 600; margin: 0;">
          ⚠️ Kode ini hanya berlaku selama 1 MENIT (60 detik).
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 6px;">Demi keamanan akun Anda, jangan berikan kode ini kepada siapa pun.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Jika Anda tidak merasa mendaftar di BimbelSync, abaikan email ini.</p>
        <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} BimbelSync. Hak cipta dilindungi.</p>
      </div>
    </div>
  `;

  // METODE 1: BREVO REST API (Sangat Direkomendasikan jika punya API Key Brevo)
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: brevoSenderName,
            email: brevoSenderEmail,
          },
          to: [
            {
              email: toEmail,
              name: recipientName,
            },
          ],
          subject: `${otpCode} adalah Kode Verifikasi Pendaftaran BimbelSync Anda`,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[EMAIL OTP - BREVO API] Error Response:", errData);
        return { success: false, error: errData.message || "Gagal mengirim email melalui Brevo API." };
      }

      console.log(`[EMAIL OTP - BREVO API] Berhasil dikirimkan ke ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL OTP - BREVO API] Network Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi server Brevo." };
    }
  }

  // METODE 2: SMTP RELAY (Brevo SMTP atau Gmail SMTP)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true untuk port 465 SSL, false untuk port 587 TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `${otpCode} adalah Kode Verifikasi Pendaftaran BimbelSync Anda`,
        html: htmlContent,
      });

      console.log(`[EMAIL OTP - SMTP] Berhasil dikirimkan ke ${toEmail} via SMTP (${smtpHost}:${smtpPort})`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL OTP - SMTP] Error:", err);
      return { success: false, error: err.message || "Gagal mengirim email via SMTP." };
    }
  }

  // METODE 3: RESEND API (Alternatif)
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `${otpCode} adalah Kode Verifikasi Pendaftaran BimbelSync Anda`,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[EMAIL OTP - RESEND] Error Response:", errData);
        return { success: false, error: "Gagal mengirim email verifikasi." };
      }

      console.log(`[EMAIL OTP - RESEND] Berhasil dikirimkan ke ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL OTP - RESEND] Network Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi layanan Resend." };
    }
  }

  // FALLBACK: DEVELOPMENT MODE (Belum ada kredensial di .env)
  console.warn(
    `[EMAIL OTP] KREDENSIAL EMAIL BELUM DIATUR DI .env.\n` +
    `Silakan masukkan BREVO_API_KEY atau SMTP_USER + SMTP_PASS di .env.\n` +
    `Kode OTP untuk ${toEmail}: ${otpCode} (Berlaku 1 menit)`
  );

  return { success: true };
}

export async function sendPasswordResetOtpEmail(
  toEmail: string,
  otpCode: string,
  recipientName: string
): Promise<{ success: boolean; error?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "admin@bimbelsync.web.id";
  const brevoSenderName = process.env.BREVO_SENDER_NAME || "BimbelSync";

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY;
  const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes("@") ? "smtp.gmail.com" : "smtp-relay.brevo.com");
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || `BimbelSync <${smtpUser || brevoSenderEmail}>`;

  console.log(`========================================`);
  console.log(`[EMAIL RESET PASSWORD BIMBELSYNC]`);
  console.log(`Tujuan: ${toEmail} (${recipientName})`);
  console.log(`Kode OTP: ${otpCode}`);
  console.log(`Masa Berlaku: 15 Menit`);
  console.log(`Waktu Dibuat: ${new Date().toISOString()}`);
  console.log(`========================================`);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">BimbelSync</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistem Manajemen Bimbingan Belajar Terpadu</p>
      </div>
      
      <div style="padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center;">
        <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 12px;">Halo <strong>${recipientName}</strong>,</p>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Kami menerima permintaan untuk mengatur ulang kata sandi akun BimbelSync Anda. Gunakan kode verifikasi berikut:</p>
        
        <div style="background-color: #ffffff; border: 2px dashed #2563eb; padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 8px 0 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; font-family: monospace;">${otpCode}</span>
        </div>
        
        <p style="color: #e11d48; font-size: 13px; font-weight: 600; margin: 0;">
          ⚠️ Kode ini berlaku selama 15 MENIT.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 6px;">Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini dan akun Anda tetap aman.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">Demi keamanan, jangan berikan kode ini kepada siapa pun.</p>
        <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} BimbelSync. Hak cipta dilindungi.</p>
      </div>
    </div>
  `;

  // METODE 1: BREVO REST API
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: brevoSenderName,
            email: brevoSenderEmail,
          },
          to: [
            {
              email: toEmail,
              name: recipientName,
            },
          ],
          subject: `${otpCode} adalah Kode Reset Password BimbelSync Anda`,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[EMAIL RESET - BREVO API] Error Response:", errData);
        return { success: false, error: errData.message || "Gagal mengirim email reset via Brevo API." };
      }

      console.log(`[EMAIL RESET - BREVO API] Berhasil dikirimkan ke ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL RESET - BREVO API] Network Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi server Brevo." };
    }
  }

  // METODE 2: SMTP RELAY
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `${otpCode} adalah Kode Reset Password BimbelSync Anda`,
        html: htmlContent,
      });

      console.log(`[EMAIL RESET - SMTP] Berhasil dikirimkan ke ${toEmail} via SMTP`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL RESET - SMTP] Error:", err);
      return { success: false, error: err.message || "Gagal mengirim email reset via SMTP." };
    }
  }

  // METODE 3: RESEND API
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `${otpCode} adalah Kode Reset Password BimbelSync Anda`,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        return { success: false, error: "Gagal mengirim email reset password." };
      }

      console.log(`[EMAIL RESET - RESEND] Berhasil dikirimkan ke ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error("[EMAIL RESET - RESEND] Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi layanan Resend." };
    }
  }

  // FALLBACK DEV
  console.warn(
    `[EMAIL RESET] KREDENSIAL EMAIL BELUM DIATUR DI .env.\n` +
    `Kode OTP Reset Password untuk ${toEmail}: ${otpCode} (Berlaku 15 menit)`
  );

  return { success: true };
}

export async function sendSupportTicketEmail({
  senderEmail,
  senderName,
  academyName,
  tenantSlug,
  category,
  message,
}: {
  senderEmail: string;
  senderName: string;
  academyName: string;
  tenantSlug: string;
  category: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const targetEmail = "admin@bimbelsync.web.id";

  const categoryMap: Record<string, string> = {
    billing: "Kendala Tagihan & Pembayaran",
    account: "Akun & Akses",
    feature: "Cara Penggunaan Fitur",
    bug: "Laporan Bug / Error",
    other: "Lainnya",
  };
  const categoryLabel = categoryMap[category] || category || "Umum";

  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || "admin@bimbelsync.web.id";
  const brevoSenderName = process.env.BREVO_SENDER_NAME || "BimbelSync Support Ticket";

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY;
  const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes("@") ? "smtp.gmail.com" : "smtp-relay.brevo.com");
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = `BimbelSync Ticket System <${smtpUser || brevoSenderEmail}>`;

  const subject = `[Tiket Bantuan - ${categoryLabel}] ${academyName} (${senderName})`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 800; margin: 0;">Tiket Bantuan Masuk</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Pesan kendala operasional dari pengguna bimbel</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 140px;">Bimbel / Akademi:</td>
            <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${academyName} (Slug: ${tenantSlug})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Pengirim:</td>
            <td style="padding: 4px 0; font-weight: 700; color: #1e293b;">${senderName} (${senderEmail})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Kategori Kendala:</td>
            <td style="padding: 4px 0; font-weight: 700; color: #2563eb;">${categoryLabel}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Waktu Pengiriman:</td>
            <td style="padding: 4px 0; color: #334155;">${new Date().toLocaleString("id-ID")}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px;">Uraian Pesan / Kendala:</h4>
        <div style="padding: 16px; background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${message}</div>
      </div>

      <div style="background-color: #eff6ff; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #1d4ed8;">
        <strong>Catatan:</strong> Anda dapat langsung membalas email ini untuk mengirimkan tanggapan kepada pengirim (${senderEmail}).
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">Tiket ini dikirim otomatis melalui Formulir Pusat Bantuan BimbelSync.</p>
      </div>
    </div>
  `;

  // 1. BREVO REST API
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: brevoSenderName, email: brevoSenderEmail },
          to: [{ email: targetEmail, name: "Tim Support BimbelSync" }],
          replyTo: { email: senderEmail, name: senderName },
          subject: subject,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[SUPPORT TICKET - BREVO API] Error:", errData);
        return { success: false, error: errData.message || "Gagal mengirim tiket via Brevo API." };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[SUPPORT TICKET - BREVO API] Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi Brevo API." };
    }
  }

  // 2. SMTP RELAY
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: fromEmail,
        replyTo: `"${senderName}" <${senderEmail}>`,
        to: targetEmail,
        subject: subject,
        html: htmlContent,
      });

      console.log(`[SUPPORT TICKET - SMTP] Berhasil dikirimkan ke ${targetEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error("[SUPPORT TICKET - SMTP] Error:", err);
      return { success: false, error: err.message || "Gagal mengirim tiket via SMTP." };
    }
  }

  // 3. RESEND API
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          reply_to: senderEmail,
          to: [targetEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        return { success: false, error: "Gagal mengirim tiket bantuan via Resend." };
      }
      return { success: true };
    } catch (err: any) {
      console.error("[SUPPORT TICKET - RESEND] Error:", err);
      return { success: false, error: err.message || "Gagal menghubungi Resend." };
    }
  }

  // Fallback Dev
  console.log(`[SUPPORT TICKET DEV] Tiket dari ${senderEmail} (${academyName}): ${message}`);
  return { success: true };
}
