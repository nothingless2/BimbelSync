import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isFeatureAllowedByPlan } from "@/lib/subscription";
import { FeatureLockBanner } from "@/components/feature-lock-banner";
import EmailSettingsClientPage from "./client-page";

export default async function EmailSettingsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "ADMIN" || session.tenant_slug !== tenantSlug) {
    redirect(`/${tenantSlug}/login`);
  }

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id as string },
    include: {
      plan: true,
      staff: {
        where: { id: session.id as string },
        select: { email: true, name: true },
      },
    },
  });

  if (!academy) {
    redirect(`/${tenantSlug}/login`);
  }

  // Feature Gating: Jika paket tidak mengizinkan automated_email (Starter), tampilkan banner upgrade ke Growth
  if (!isFeatureAllowedByPlan(academy.plan, "automated_email")) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Email & Layanan SMTP
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gunakan server email bimbel Anda sendiri (BYO SMTP) untuk mengirimkan notifikasi invoice dan pengumuman secara otomatis.
          </p>
        </div>

        <FeatureLockBanner
          title="Layanan Custom SMTP & Notifikasi Email Otomatis"
          description="Kirim email tagihan dan pengumuman otomatis ke siswa dengan server SMTP kustom di paket Growth."
          requiredPlan="Growth"
          tenantSlug={tenantSlug}
          currentPlanName={academy.plan.name}
        />
      </div>
    );
  }

  const adminEmail = academy.staff?.[0]?.email || "";

  // Hitung jumlah siswa aktif untuk estimasi penerima broadcast
  const activeStudentCount = await prisma.student.count({
    where: {
      academy_id: academy.id,
      deleted_at: null,
      email: { not: null },
    },
  });

  const initialConfig = {
    host: academy.smtp_host || "",
    port: academy.smtp_port || 587,
    user: academy.smtp_user || "",
    hasPassword: !!academy.smtp_pass,
    fromName: academy.smtp_from_name || academy.name,
    fromEmail: academy.smtp_from_email || academy.smtp_user || "",
    secure: !!academy.smtp_secure,
    isActive: !!academy.is_smtp_active,
  };

  return (
    <EmailSettingsClientPage
      tenantSlug={tenantSlug}
      academyName={academy.name}
      planName={academy.plan.name}
      adminEmail={adminEmail}
      activeStudentCount={activeStudentCount}
      initialConfig={initialConfig}
    />
  );
}
