export default async function DashboardHome({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug || "Bimbel";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ikhtisar</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Selamat datang di panel admin {tenantSlug}. Berikut ringkasan hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Siswa Aktif</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        
        {/* Card 2 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Kelas Hari Ini</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tunggakan (Piutang)</h3>
          <p className="text-3xl font-bold mt-2">Rp 0</p>
        </div>
      </div>
    </div>
  );
}
