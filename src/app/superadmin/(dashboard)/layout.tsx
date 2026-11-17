import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuperadminNav } from "@/components/superadmin-nav";
import { SuperadminHeader } from "@/components/superadmin-header";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('bimbelsync_session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== 'SUPERADMIN') {
    redirect('/superadmin/login');
  }

  let dbUser = await prisma.superadmin.findUnique({ 
    where: { id: session.id }, 
    select: { id: true, email: true, name: true, avatar_url: true, session_version: true } 
  });
  
  if (!dbUser || dbUser.session_version !== session.session_version) {
    redirect('/superadmin/logout');
  }


  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans print:h-auto print:overflow-visible print:bg-white print:block">
      {/* Sidebar - Clean Light Theme */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-full z-20 print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BimbelSync Logo" className="w-7 h-7 object-contain rounded-md" />
            <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              BimbelSync
            </span>
          </div>
        </div>

        <SuperadminNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative print:overflow-visible print:h-auto print:block print:static">
        <div className="print:hidden">
          {dbUser && <SuperadminHeader user={dbUser} />}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 text-slate-900 dark:text-slate-100 print:overflow-visible print:p-0 print:h-auto print:block print:static">
          <div className="max-w-6xl mx-auto print:max-w-none print:w-full print:m-0 print:p-0 print:block">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

