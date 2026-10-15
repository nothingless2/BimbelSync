'use server';

import { encryptQrData } from "@/lib/qr-crypto";
import { requireStaffSession } from "@/lib/session";
import { assertFeatureAccess } from "@/lib/subscription";

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

  const payload = {
    scheduleId,
    tenantSlug,
    timestamp: Date.now()
  };
  
  return encryptQrData(payload);
}
