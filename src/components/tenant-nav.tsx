"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCog, Calendar, CreditCard, Box, Settings } from "lucide-react";

export function TenantNav({ tenantSlug }: { tenantSlug: string }) {
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
        
        <div className="pt-6 pb-2">
          <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Data Master
          </p>
        </div>
        <NavItem 
          href={`/${tenantSlug}/dashboard/master-data/rooms`} 
          icon={<Box size={18} />} 
          label="Ruangan" 
          active={isRouteActive(`/${tenantSlug}/dashboard/master-data/rooms`)} 
        />
        <NavItem 
          href={`/${tenantSlug}/dashboard/master-data/programs`} 
          icon={<Box size={18} />} 
          label="Program" 
          active={isRouteActive(`/${tenantSlug}/dashboard/master-data/programs`)} 
        />
        <NavItem 
          href={`/${tenantSlug}/dashboard/master-data/students`} 
          icon={<Users size={18} />} 
          label="Siswa" 
          active={isRouteActive(`/${tenantSlug}/dashboard/master-data/students`)} 
        />
        <NavItem 
          href={`/${tenantSlug}/dashboard/master-data/staff`} 
          icon={<UserCog size={18} />} 
          label="Staff" 
          active={isRouteActive(`/${tenantSlug}/dashboard/master-data/staff`)} 
        />

        <div className="pt-6 pb-2">
          <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Operasional
          </p>
        </div>
        <NavItem 
          href={`/${tenantSlug}/dashboard/schedule`} 
          icon={<Calendar size={18} />} 
          label="Jadwal & Presensi" 
          active={isRouteActive(`/${tenantSlug}/dashboard/schedule`)} 
        />
        <NavItem 
          href={`/${tenantSlug}/dashboard/finance`} 
          icon={<CreditCard size={18} />} 
          label="Keuangan" 
          active={isRouteActive(`/${tenantSlug}/dashboard/finance`)} 
        />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <NavItem 
          href={`/${tenantSlug}/dashboard/settings`} 
          icon={<Settings size={18} />} 
          label="Pengaturan" 
          active={isRouteActive(`/${tenantSlug}/dashboard/settings`)} 
        />
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
