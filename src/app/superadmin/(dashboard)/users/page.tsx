import prisma from "@/lib/prisma";
import SystemUsersClient from "./client-page";

export default async function SystemUsersPage() {
  const users = await prisma.superadmin.findMany({
    orderBy: { email: 'asc' }
  });

  return <SystemUsersClient users={users} />;
}
