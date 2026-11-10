export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { purgeExpiredTenantUsers } from "@/lib/user-cleanup";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

const CRON_SECRET = process.env.CRON_SECRET;

async function handlePurgeRequest(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret");

    const isCronAuth =
      (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) ||
      (CRON_SECRET && querySecret === CRON_SECRET);

    if (!isCronAuth) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("bimbelsync_session")?.value;
      if (!sessionToken) {
        return NextResponse.json(
          { error: "Unauthorized: Missing valid session or cron secret" },
          { status: 401 }
        );
      }
      const session = await decrypt(sessionToken);
      if (!session || session.role !== "SUPERADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Superadmin access required" },
          { status: 403 }
        );
      }
    }

    const result = await purgeExpiredTenantUsers();

    return NextResponse.json({
      success: true,
      message:
        result.message ||
        `Pembersihan berhasil. ${result.purgedStaffCount} staf, ${result.purgedStudentCount} siswa, dan ${result.purgedAcademyCount} bimbel (yang nonaktif > ${result.retentionDays} hari) telah dihapus permanen.`,
      ...result,
    });
  } catch (error: any) {
    console.error("Cron purge-deleted-users error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handlePurgeRequest(request);
}

export async function POST(request: Request) {
  return handlePurgeRequest(request);
}

