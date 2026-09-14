import Link from "next/link";
import Image from "next/image";
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
    select: { id: true, email: true, avatar_url: true, role: true }
  });

  const academy = await prisma.academy.findUnique({
    where: { id: session.academy_id },
    select: { subscription_status: true, subscription_due_date: true }
  });

  if (academy) {
    const isSuspended = academy.subscription_status === 'SUSPENDED';
    // Gunakan setHours(0,0,0,0) agar membandingkan harinya, bukan jam saat ini persis.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = academy.subscription_due_date ? new Date(academy.subscription_due_date) : null;
    if (dueDate) dueDate.setHours(0,0,0,0);
    
    const isPastDue = dueDate && dueDate < today;
    
    if (isSuspended || isPastDue) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 px-4 font-sans transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
             <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             </div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Akses Ditangguhkan</h1>
             <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">
               Masa berlangganan Bimbel Anda telah berakhir atau sistem sedang ditangguhkan. Silakan lunasi tagihan atau hubungi Superadmin untuk memulihkan akses.
             </p>
             <Link href={`/${tenantSlug}/logout`} className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition rounded-xl w-full shadow-lg shadow-red-600/20">
                Keluar dari Sistem
             </Link>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 transition-colors">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="BimbelSync Logo" width={28} height={28} className="object-contain rounded-md" />
            <span className="text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <TenantNav tenantSlug={tenantSlug} userRole={dbUser?.role} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">
              {dbUser?.role === 'TUTOR' ? 'Tutor Portal' : 'Admin Portal'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{tenantSlug}</span>
          </div>
          <div className="flex items-center gap-5">
            <ThemeToggle />
            {dbUser && (
              <Link href={`/${tenantSlug}/dashboard/profile`} className="block hover:opacity-80 transition cursor-pointer" title="Edit Profile">
                <UserAvatar id={dbUser.id} email={dbUser.email} avatarUrl={dbUser.avatar_url} size={32} />
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

