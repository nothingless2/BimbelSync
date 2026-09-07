import SearchClientPage from "./client-page";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SearchPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  return <SearchClientPage />;
}
