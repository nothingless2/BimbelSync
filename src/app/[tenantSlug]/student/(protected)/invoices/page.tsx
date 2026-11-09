import { requireStudentSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditCard, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { StudentBillingBanner } from "@/components/student-billing-banner";

export default async function StudentInvoicesPage({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;

  const auth = await requireStudentSession();
  if ('error' in auth) {
    redirect(`/${tenantSlug}/student/login`);
  }

  const session = auth.session;
  const studentId = session.id;

  const [invoices, academy] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        student_id: studentId,
        academy_id: session.academy_id,
      },
      include: {
        items: true,
        installments: true
      },
      orderBy: {
        id: 'desc'
      }
    }),
    prisma.academy.findUnique({
      where: { id: session.academy_id },
      select: { name: true, bank_name: true, bank_account: true }
    })
  ]);

  const unpaidInvoices = invoices.filter(i => i.payment_status === 'UNPAID' || i.payment_status === 'OVERDUE');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const firstUnpaidInvoice = unpaidInvoices
    .filter(i => i.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0] || unpaidInvoices[0] || null;
  const earliestDueDate = firstUnpaidInvoice?.due_date || null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
      
      {/* Header Profile Style */}
      <div className="bg-blue-600 pt-10 sm:pt-14 pb-20 sm:pb-24 px-4 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg mb-3">
            <CreditCard size={32} className="text-white sm:w-9 sm:h-9" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">Tagihan Saya</h1>
          <span className="text-blue-100 bg-blue-500/50 border border-blue-400/30 px-4 py-1 rounded-full text-xs font-normal inline-block shadow-xs">
            Kelola pembayaran SPP dan biaya lainnya
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-14 sm:-mt-16 relative z-20 space-y-3.5 max-w-md mx-auto">
        {/* Prominent Floating Card (Matching Mockup) */}
        <StudentBillingBanner
          hasUnpaid={unpaidInvoices.length > 0}
          totalDebt={totalDebt}
          dueDate={earliestDueDate}
          bankName={academy?.bank_name}
          bankAccount={academy?.bank_account}
          academyName={academy?.name}
          tenantSlug={tenantSlug}
          targetInvoiceId={firstUnpaidInvoice?.id}
        />

        {/* All Invoices Paid Banner */}
        {unpaidInvoices.length === 0 && invoices.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-950/40 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Semua Tagihan Lunas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Terima kasih! Seluruh kewajiban pembayaran SPP Anda telah selesai.
            </p>
          </div>
        )}

        {/* Empty State */}
        {invoices.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <CreditCard size={28} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Belum Ada Tagihan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Anda tidak memiliki tagihan aktif saat ini.</p>
          </div>
        )}

        {/* Invoices List (Matching Mockup) */}
        {invoices.map((invoice) => {
          const isInstallment = invoice.payment_option === 'INSTALLMENT';
          const unpaidInstallments = invoice.installments.filter(i => i.status !== 'PAID').length;
          const hasOverdue = invoice.payment_status === 'OVERDUE' || invoice.installments.some(i => i.status === 'OVERDUE');

          return (
            <Link 
              href={`/${tenantSlug}/student/invoices/${invoice.id}`}
              key={invoice.id} 
              className="block bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 active:scale-[0.99] transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    invoice.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    hasOverdue ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
                    'bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}>
                    {invoice.payment_status === 'PAID' ? <CheckCircle2 size={18} /> :
                     hasOverdue ? <AlertCircle size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                      INV-{invoice.id.split('-')[0].toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {invoice.items[0]?.description || "Tagihan SPP Bimbel"} 
                      {invoice.items.length > 1 && ` (+${invoice.items.length - 1} item)`}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
              </div>

              <div className="my-3.5 border-t border-slate-100 dark:border-slate-800 border-dashed"></div>

              <div className="flex items-end justify-between">
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider inline-block ${
                    invoice.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40' :
                    hasOverdue ? 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40' :
                    'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40'
                  }`}>
                    {invoice.payment_status === 'PAID' ? 'LUNAS' : hasOverdue ? 'LEWAT JATUH TEMPO' : 'BELUM LUNAS'}
                  </span>
                  {isInstallment && invoice.payment_status !== 'PAID' && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Sisa {unpaidInstallments} Termin</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-0.5">Total</p>
                  <p className="font-extrabold text-base sm:text-lg text-blue-600 dark:text-blue-400 leading-tight">
                    {formatRupiah(invoice.total_amount)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}