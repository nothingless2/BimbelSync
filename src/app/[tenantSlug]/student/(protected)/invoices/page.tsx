import { requireStudentSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
      
      {/* Editorial Header Banner */}
      <div className="bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

        <div className="max-w-md mx-auto relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
            Portal Siswa
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Tagihan Saya
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Kelola pembayaran SPP dan biaya pembelajaran
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 -mt-8 relative z-20 space-y-3.5 max-w-md mx-auto">
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

        {/* Invoices List */}
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const isInstallment = invoice.payment_option === 'INSTALLMENT';
            const unpaidInstallments = invoice.installments.filter(i => i.status !== 'PAID').length;
            const hasOverdue = invoice.payment_status === 'OVERDUE' || invoice.installments.some(i => i.status === 'OVERDUE');
            const isPaid = invoice.payment_status === 'PAID';
            const isPendingProof = !isPaid && !!invoice.proof_of_payment_url;

            const invoiceCode = `INV-${invoice.id.split('-')[0].toUpperCase()}`;
            const primaryItemTitle = invoice.items[0]?.description || "Tagihan SPP Bimbel";
            const extraItemsCount = invoice.items.length - 1;

            return (
              <Link 
                href={`/${tenantSlug}/student/invoices/${invoice.id}`}
                key={invoice.id} 
                className="group block bg-white dark:bg-[#111827] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
              >
                {/* Header Baris Atas: Kode Faktur & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    {invoiceCode}
                  </span>

                  {/* Status Badge Terstandardisasi */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isPaid
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : isPendingProof
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                      : hasOverdue
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  }`}>
                    {isPaid ? 'Lunas' : isPendingProof ? 'Menunggu Verifikasi' : hasOverdue ? 'Jatuh Tempo' : 'Belum Dibayar'}
                  </span>
                </div>

                {/* Body Utama: Nama Program / Layanan & Tanggal */}
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {primaryItemTitle}
                    {extraItemsCount > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">
                        (+{extraItemsCount} item)
                      </span>
                    )}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>
                      {invoice.due_date 
                        ? `Jatuh tempo: ${format(new Date(invoice.due_date), 'd MMM yyyy', { locale: localeId })}`
                        : `Diterbitkan: ${format(new Date(invoice.created_at), 'd MMM yyyy', { locale: localeId })}`}
                    </span>
                  </div>
                </div>

                {/* Footer Baris Bawah: Skema Pembayaran & Nominal Tagihan */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isInstallment ? (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Cicilan {isPaid ? 'Selesai' : `(Sisa ${unpaidInstallments} Termin)`}
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">Sekali Bayar</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {formatRupiah(invoice.total_amount)}
                    </span>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}