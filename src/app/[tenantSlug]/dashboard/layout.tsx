import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { TenantNav } from "@/components/tenant-nav";
import { UserAvatar } from "@/components/user-avatar";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug || "Bimbel";

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bimbelsync_session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Find the staff user (or superadmin if impersonating, but standard is staff)
  const dbUser = await prisma.staff.findUnique({
    where: { id: session.id },
    select: { id: true, email: true }
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 transition-colors">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BimbelSync Logo" className="w-7 h-7 object-contain rounded-md" />
            <span className="text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <TenantNav tenantSlug={tenantSlug} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Admin Portal</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{tenantSlug}</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {dbUser && (
              <Link href={`/${tenantSlug}/dashboard/profile`} className="block hover:opacity-80 transition cursor-pointer" title="Edit Profile">
                <UserAvatar id={dbUser.id} email={dbUser.email} avatarUrl={null} size={32} />
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-900 dark:text-slate-100 transition-colors">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

