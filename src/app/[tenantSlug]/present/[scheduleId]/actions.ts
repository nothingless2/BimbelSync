'use server';

import { encryptQrData } from "@/lib/qr-crypto";

export async function generateSecureQrDataAction(scheduleId: string, tenantSlug: string) {
  const payload = {
    scheduleId,
    tenantSlug,
    timestamp: Date.now()
  };
  
  return encryptQrData(payload);
}
