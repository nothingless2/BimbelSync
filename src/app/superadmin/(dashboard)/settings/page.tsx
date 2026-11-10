import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRetentionStats } from "@/lib/user-cleanup";
import SettingsClientPage from "./client-page";

export default async function SuperadminSettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const stats = await getRetentionStats();

  return <SettingsClientPage stats={stats} />;
}

