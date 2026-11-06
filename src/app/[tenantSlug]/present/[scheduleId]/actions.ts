'use server';

import { encryptQrData } from "@/lib/qr-crypto";
import { requireStaffSession } from "@/lib/session";
import { assertFeatureAccess } from "@/lib/subscription";
import prisma from "@/lib/prisma";

export async function generateSecureQrDataAction(scheduleId: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) {
    return "";
  }

  if (auth.session.tenant_slug && auth.session.tenant_slug !== tenantSlug) {
    return "";
  }

  // Feature Gating: Absensi QR dinamis hanya untuk paket Growth dan Pro
  const featureCheck = await assertFeatureAccess(auth.session.academy_id, "qr_attendance");
  if (!featureCheck.allowed) {
    return "";
  }

  // Validasi Jadwal: Pastikan jadwal ada, milik akademi yang sama, berstatus SCHEDULED, dan belum lewat end_time
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      end_time: true,
      status: true,
      program: {
        select: { academy_id: true }
      }
    }
  });

  if (!schedule || schedule.program.academy_id !== auth.session.academy_id) {
    return "";
  }

  if (schedule.status !== 'SCHEDULED') {
    return "";
  }

  // Jika waktu pelaksanaan kelas sudah lewat, tolak generate token QR
  if (Date.now() > new Date(schedule.end_time).getTime()) {
    return "";
  }

  const payload = {
    scheduleId,
    tenantSlug,
    timestamp: Date.now()
  };
  
  return encryptQrData(payload);
}
