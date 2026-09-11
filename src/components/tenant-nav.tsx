"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCog, Calendar, CreditCard, Box, BookOpen, HelpCircle, LogOut, FileText, Library } from "lucide-react";

export function TenantNav({ tenantSlug, userRole }: { tenantSlug: string, userRole?: string }) {
  const pathname = usePathname();

  const isRouteActive = (route: string) => {
    // Exact match for dashboard home
    if (route === `/${tenantSlug}/dashboard`) {
      return pathname === route;
    }
    // Partial match for sub-routes
    return pathname.startsWith(route);
  };

  return (
    <>
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        <NavItem 
          href={`/${tenantSlug}/dashboard`} 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          active={pathname === `/${tenantSlug}/dashboard`} 
        />
        
        {userRole !== 'TUTOR' && (
          <>
            <div className="pt-6 pb-2">
              <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Master Data
              </p>
            </div>
            <NavItem 
              href={`/${tenantSlug}/dashboard/master-data/rooms`} 
              icon={<Box size={18} />} 
              label="Rooms" 
              active={isRouteActive(`/${tenantSlug}/dashboard/master-data/rooms`)} 
            />
            <NavItem 
              href={`/${tenantSlug}/dashboard/master-data/programs`} 
              icon={<BookOpen size={18} />} 
              label="Programs" 
              active={isRouteActive(`/${tenantSlug}/dashboard/master-data/programs`)} 
            />
            <NavItem 
              href={`/${tenantSlug}/dashboard/master-data/students`} 
              icon={<Users size={18} />} 
              label="Students" 
              active={isRouteActive(`/${tenantSlug}/dashboard/master-data/students`)} 
            />
            <NavItem 
              href={`/${tenantSlug}/dashboard/master-data/staff`} 
              icon={<UserCog size={18} />} 
              label="Staff" 
              active={isRouteActive(`/${tenantSlug}/dashboard/master-data/staff`)} 
            />
          </>
        )}

        <div className="pt-6 pb-2">
          <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Operational
          </p>
        </div>
        <NavItem 
          href={`/${tenantSlug}/dashboard/schedules`} 
          icon={<Calendar size={18} />} 
          label="Schedules & Attendance" 
          active={isRouteActive(`/${tenantSlug}/dashboard/schedules`)} 
        />
        <NavItem 
          href={`/${tenantSlug}/dashboard/materials`} 
          icon={<Library size={18} />} 
          label="Learning Materials" 
          active={isRouteActive(`/${tenantSlug}/dashboard/materials`)} 
        />
        {userRole !== 'TUTOR' && (
          <NavItem 
            href={`/${tenantSlug}/dashboard/finance`} 
            icon={<CreditCard size={18} />} 
            label="Finance" 
            active={isRouteActive(`/${tenantSlug}/dashboard/finance`)} 
          />
        )}
        
        {userRole === 'ADMIN' && (
          <>
            <div className="pt-6 pb-2">
              <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                System
              </p>
            </div>
            <NavItem 
              href={`/${tenantSlug}/dashboard/audit-logs`} 
              icon={<FileText size={18} />} 
              label="Audit Logs" 
              active={isRouteActive(`/${tenantSlug}/dashboard/audit-logs`)} 
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          href={`/${tenantSlug}/dashboard/support`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <HelpCircle size={18} />
          Support
        </Link>
        <a 
          href={`/${tenantSlug}/logout`} 
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={18} />
          Logout
        </a>
      </div>
    </>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
        active 
          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
