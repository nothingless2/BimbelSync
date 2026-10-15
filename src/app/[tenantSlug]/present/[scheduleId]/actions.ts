'use server';

import { encryptQrData } from "@/lib/qr-crypto";
import { requireStaffSession } from "@/lib/session";

export async function generateSecureQrDataAction(scheduleId: string, tenantSlug: string) {
  const auth = await requireStaffSession();
  if ('error' in auth) {
    return "";
  }

  if (auth.session.tenant_slug && auth.session.tenant_slug !== tenantSlug) {
    return "";
  }

  const payload = {
    scheduleId,
    tenantSlug,
    timestamp: Date.now()
  };
  
  return encryptQrData(payload);
}
