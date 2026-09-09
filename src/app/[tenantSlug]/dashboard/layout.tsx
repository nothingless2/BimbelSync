import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserCog } from "lucide-react";
import { TenantNav } from "@/components/tenant-nav";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug || "Bimbel";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 transition-colors">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              {tenantSlug.charAt(0).toUpperCase()}
            </div>
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
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center">
               <UserCog className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
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

