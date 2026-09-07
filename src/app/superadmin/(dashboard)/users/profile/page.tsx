import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClientPage from "./client-page";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("bimbelsync_session")?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== "SUPERADMIN") {
    redirect("/superadmin/login");
  }

  const user = await prisma.superadmin.findUnique({
    where: { id: session.id },
  });

  if (!user) {
    redirect("/superadmin/logout");
  }

  // Sembunyikan hash password dari client props
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
  };

  return <ProfileClientPage user={safeUser} />;
}
