import prisma from "@/lib/prisma";
import { AddPlanModal } from "@/components/modals/add-plan-modal";
import { Check, X, ShieldCheck } from "lucide-react";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    where: { deleted_at: null },
    include: { _count: { select: { academies: true } } },
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Plans & Pricing</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola paket berlangganan dan batasan fitur per paket.
          </p>
        </div>
        <AddPlanModal />
      </div>

      {/* Plan Cards */}
      {plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-slate-500">Belum ada paket. Klik "Tambah Paket" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan, index) => {
            const colors = [
              { badge: "bg-slate-700", accent: "border-slate-300" },
              { badge: "bg-blue-600", accent: "border-blue-400" },
              { badge: "bg-purple-600", accent: "border-purple-400" },
            ];
            const color = colors[index % colors.length];

            return (
              <div key={plan.id} className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${color.accent} shadow-sm p-6 flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`${color.badge} text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider`}>
                      {plan.name.toUpperCase()}
                    </span>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price)}
                      <span className="text-sm font-normal text-slate-500">/bln</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{plan._count.academies}</p>
                    <p className="text-xs text-slate-500">akademi aktif</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                  <FeatureRow label="Maks. Siswa" value={plan.max_students ? `${plan.max_students} siswa` : "Unlimited"} />
                  <FeatureRow label="Maks. Staff" value={plan.max_staff ? `${plan.max_staff} staff` : "Unlimited"} />
                  <FeatureRow label="Maks. Ruangan" value={plan.max_rooms ? `${plan.max_rooms} ruang` : "Unlimited"} />
                  <FeatureRow label="Payment Gateway" bool={plan.allows_payment_gateway} />
                  <FeatureRow label="Opsi Cicilan" bool={plan.allows_installment} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Table */}
      {plans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Perbandingan Paket</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Paket</th>
                  <th className="px-6 py-3">Harga</th>
                  <th className="px-6 py-3">Maks. Siswa</th>
                  <th className="px-6 py-3">Maks. Staff</th>
                  <th className="px-6 py-3">Maks. Ruangan</th>
                  <th className="px-6 py-3">Payment GW</th>
                  <th className="px-6 py-3">Cicilan</th>
                  <th className="px-6 py-3">Akademi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{plan.name}</td>
                    <td className="px-6 py-3">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price)}</td>
                    <td className="px-6 py-3">{plan.max_students ?? "∞"}</td>
                    <td className="px-6 py-3">{plan.max_staff ?? "∞"}</td>
                    <td className="px-6 py-3">{plan.max_rooms ?? "∞"}</td>
                    <td className="px-6 py-3">{plan.allows_payment_gateway ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-slate-300" />}</td>
                    <td className="px-6 py-3">{plan.allows_installment ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-slate-300" />}</td>
                    <td className="px-6 py-3 font-semibold text-blue-600">{plan._count.academies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, value, bool }: { label: string; value?: string; bool?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      {value !== undefined ? (
        <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
      ) : (
        bool ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-slate-400" />
      )}
    </div>
  );
}
