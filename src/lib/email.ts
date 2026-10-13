export async function sendOtpEmail(toEmail: string, otpCode: string, recipientName: string): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "BimbelSync <onboarding@resend.dev>";

  // Log ke server console untuk kemudahan pengujian lokal
  console.log(`========================================`);
  console.log(`[EMAIL OTP BIMBELSYNC]`);
  console.log(`Tujuan: ${toEmail} (${recipientName})`);
  console.log(`Kode OTP: ${otpCode}`);
  console.log(`Waktu: ${new Date().toISOString()}`);
  console.log(`========================================`);

  if (!resendApiKey) {
    console.warn("[EMAIL OTP] RESEND_API_KEY belum dikonfigurasi di .env. Kode OTP dicatat di log server di atas.");
    return { success: true };
  }

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
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">BimbelSync</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistem Manajemen Bimbingan Belajar Terpadu</p>
            </div>
            
            <div style="padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #334155; font-size: 15px; margin-top: 0; margin-bottom: 12px;">Halo <strong>${recipientName}</strong>,</p>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Gunakan kode verifikasi di bawah ini untuk memverifikasi pendaftaran akun Anda:</p>
              
              <div style="background-color: #ffffff; border: 2px dashed #2563eb; padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 8px 0 20px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; font-family: monospace;">${otpCode}</span>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">Kode ini berlaku selama <strong>10 menit</strong>. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.</p>
            </div>

            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0;">Jika Anda tidak merasa mendaftar di BimbelSync, abaikan email ini.</p>
              <p style="margin-top: 4px;">&copy; ${new Date().getFullYear()} BimbelSync. Hak cipta dilindungi.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("[EMAIL OTP] Resend API Error:", errData);
      return { success: false, error: "Gagal mengirim email verifikasi." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[EMAIL OTP] Network Error:", err);
    return { success: false, error: err.message || "Gagal menghubungi layanan email." };
  }
}
