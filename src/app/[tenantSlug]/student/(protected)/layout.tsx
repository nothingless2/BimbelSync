import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import Link from 'next/link';
import { Home, QrCode, User, CreditCard } from 'lucide-react';
import { StudentMobileNav } from './mobile-nav';

export default async function StudentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('bimbelsync_session')?.value;
  const session = sessionToken ? await decrypt(sessionToken) : null;
  const { tenantSlug } = await params;

  if (!session || session.role !== 'STUDENT') {
    redirect(`/${tenantSlug}/student/login`);
  }

  if (session.tenant_slug !== tenantSlug) {
    redirect(`/${session.tenant_slug}/student/dashboard`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <BookOpen size={20} />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">Portal Siswa</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <DesktopNavLink href={`/${tenantSlug}/student/dashboard`} icon={<Home size={20} />} label="Beranda" />
          <DesktopNavLink href={`/${tenantSlug}/student/scan`} icon={<QrCode size={20} />} label="Scan Absen" />
          <DesktopNavLink href={`/${tenantSlug}/student/invoices`} icon={<CreditCard size={20} />} label="Tagihan" />
          <DesktopNavLink href={`/${tenantSlug}/student/profile`} icon={<User size={20} />} label="Profil" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <StudentMobileNav tenantSlug={tenantSlug} />
    </div>
  );
}

function DesktopNavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-all font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

// Temporary BookOpen icon just for desktop sidebar
function BookOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
