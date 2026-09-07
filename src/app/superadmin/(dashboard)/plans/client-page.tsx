"use client";

import { useState } from "react";
import { Check, X, ShieldCheck, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { AddPlanModal } from "@/components/modals/add-plan-modal";
import { EditPlanModal } from "@/components/modals/edit-plan-modal";
import { DeletePlanModal } from "@/components/modals/delete-plan-modal";

export default function PlansClientPage({ plans }: { plans: any[] }) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openEditModal = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (plan: any) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

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

      {plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum ada paket tersedia</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Buat paket pertama Anda untuk mulai mengatur batasan fitur pada setiap akademi berlangganan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative group">
              
              {/* Dropdown Menu Actions */}
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(plan)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => openDeleteModal(plan)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(plan.price).replace(",00", "")}
                  </span>
                  <span className="text-sm text-slate-500">/bln</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-800/20">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Maks <strong className="font-semibold">{plan.max_students === null ? 'Unlimited' : plan.max_students}</strong> Siswa</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Maks <strong className="font-semibold">{plan.max_staff === null ? 'Unlimited' : plan.max_staff}</strong> Staff/Tutor</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Maks <strong className="font-semibold">{plan.max_rooms === null ? 'Unlimited' : plan.max_rooms}</strong> Ruangan</span>
                  </li>
                  <li className={`flex items-center gap-3 text-sm ${plan.allows_payment_gateway ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 opacity-60'}`}>
                    {plan.allows_payment_gateway ? <Check className="w-5 h-5 text-emerald-500 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                    <span>Payment Gateway Integrasi</span>
                  </li>
                  <li className={`flex items-center gap-3 text-sm ${plan.allows_installment ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500 opacity-60'}`}>
                    {plan.allows_installment ? <Check className="w-5 h-5 text-emerald-500 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
                    <span>Fitur Tagihan Cicilan (Termin)</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center text-sm text-slate-500">
                <span>{plan._count?.academies || 0} akademi menggunakan</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EditPlanModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} plan={selectedPlan} />
      <DeletePlanModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} plan={selectedPlan} />

    </div>
  );
}
