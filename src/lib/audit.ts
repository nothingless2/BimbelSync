import prisma from "@/lib/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VERIFY" | "LOGIN";

interface CreateAuditLogParams {
  academy_id: string;
  staff_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: any;
}

export async function createAuditLog({
  academy_id,
  staff_id,
  action,
  entity_type,
  entity_id,
  details
}: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        academy_id,
        staff_id,
        action,
        entity_type,
        entity_id,
        details: details || {}
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Kita tidak throw error agar kegagalan log tidak membatalkan proses utama
  }
}
