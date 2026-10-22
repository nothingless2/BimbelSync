import { requireStudentSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
      select: { bank_name: true, bank_account: true }
    })
  ]);

  const unpaidInvoices = invoices.filter(i => i.payment_status === 'UNPAID' || i.payment_status === 'OVERDUE');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const earliestDueDate = unpaidInvoices
    .filter(i => i.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]?.due_date || null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* Header Profile Style */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-800 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -ml-8 -mb-8"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl mb-4">
            <CreditCard size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Tagihan Saya</h1>
          <p className="text-blue-100 bg-white/10 px-4 py-1.5 rounded-full text-sm font-medium">Kelola pembayaran SPP dan biaya lainnya</p>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-16 relative z-20 space-y-4 max-w-lg mx-auto">
        <StudentBillingBanner
          hasUnpaid={unpaidInvoices.length > 0}
          totalDebt={totalDebt}
          dueDate={earliestDueDate}
          bankName={academy?.bank_name}
          bankAccount={academy?.bank_account}
          tenantSlug={tenantSlug}
        />
        {invoices.length === 0 ? (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Belum ada tagihan</h3>
            <p className="text-sm text-slate-500">Anda tidak memiliki tagihan aktif saat ini.</p>
          </div>
        ) : (
          invoices.map((invoice) => {
            const isInstallment = invoice.payment_option === 'INSTALLMENT';
            const unpaidInstallments = invoice.installments.filter(i => i.status !== 'PAID').length;
            const hasOverdue = invoice.payment_status === 'OVERDUE' || invoice.installments.some(i => i.status === 'OVERDUE');

            return (
              <Link 
                href={`/${tenantSlug}/student/invoices/${invoice.id}`}
                key={invoice.id} 
                className="block bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${
                      invoice.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      hasOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {invoice.payment_status === 'PAID' ? <CheckCircle2 size={20} /> :
                       hasOverdue ? <AlertCircle size={20} /> :
                       <Clock size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">INV-{invoice.id.split('-')[0].toUpperCase()}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {invoice.items[0]?.description || "Tagihan Pembayaran"} 
                        {invoice.items.length > 1 && ` (+${invoice.items.length - 1} item)`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800 border-dashed">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                      invoice.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                      hasOverdue ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {invoice.payment_status}
                    </span>
                    {isInstallment && invoice.payment_status !== 'PAID' && (
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">Sisa {unpaidInstallments} Termin</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-0.5">Total</p>
                    <p className="font-black text-lg text-blue-600 dark:text-blue-400 leading-none">
                      {formatRupiah(invoice.total_amount)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
