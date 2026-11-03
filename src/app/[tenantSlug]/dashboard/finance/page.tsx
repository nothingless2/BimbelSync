import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FinanceClientPage from "./client-page";
import { AddInvoiceModal } from "@/components/modals/add-invoice-modal";
import { GenerateInvoicesButton } from "./generate-button";
import { BulkEmailInvoicesButton } from "./bulk-email-button";
import { Prisma } from "@prisma/client";
import { formatRupiah } from "@/lib/session";
import { Receipt, CheckCircle2, Clock } from "lucide-react";

export default async function FinancePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams.tenantSlug;
  const resolvedSearchParams = await searchParams;
  
  const q = (resolvedSearchParams?.q as string) || "";
  const statusParam = (resolvedSearchParams?.status as string) || "ALL";
  const pageParam = Number(resolvedSearchParams?.page) || 1;
  const page = pageParam > 0 ? pageParam : 1;
  const PAGE_SIZE = 10;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Calculate global stats using aggregations (fast, O(1) memory)
  const [totalInvoices, paidAgg, unpaidAgg] = await Promise.all([
    prisma.invoice.count({ where: { academy_id: session.academy_id } }),
    prisma.invoice.aggregate({
      _sum: { total_amount: true },
      _count: { id: true },
      where: { academy_id: session.academy_id, payment_status: 'PAID' }
    }),
    prisma.invoice.aggregate({
      _sum: { total_amount: true },
      _count: { id: true },
      where: { academy_id: session.academy_id, payment_status: 'UNPAID' }
    })
  ]);

  const totalRevenue = paidAgg._sum.total_amount || 0;
  const potentialRevenue = unpaidAgg._sum.total_amount || 0;
  const paidCount = paidAgg._count.id;
  const unpaidCount = unpaidAgg._count.id;

  // Fetch invoices akademi (client-side state murni seperti Superadmin Billing agar filter instan 0ms)
  const [invoices, students, academy] = await Promise.all([
    prisma.invoice.findMany({
      where: { academy_id: session.academy_id },
      include: {
        student: true,
        items: true,
        verified_by: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 300
    }),
    prisma.student.findMany({
      where: {
        academy_id: session.academy_id,
        deleted_at: null
      },
      orderBy: {
        full_name: 'asc'
      }
    }),
    prisma.academy.findUnique({
      where: { id: session.academy_id },
      select: { bank_name: true, bank_account: true, name: true, is_smtp_active: true }
    })
  ]);

  const bankInfo = {
    bankName: academy?.bank_name || "",
    bankAccount: academy?.bank_account || "",
    academyName: academy?.name || "Bimbel"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Keuangan & Tagihan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola tagihan SPP, biaya registrasi, dan verifikasi pembayaran siswa.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <BulkEmailInvoicesButton 
            unpaidCount={unpaidCount}
            isSmtpActive={Boolean(academy?.is_smtp_active)}
            tenantSlug={tenantSlug}
          />
          <GenerateInvoicesButton 
            academyId={session.academy_id} 
            isSmtpActive={Boolean(academy?.is_smtp_active)}
            tenantSlug={tenantSlug}
          />
          <AddInvoiceModal students={students} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Total Tagihan (Semua)</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
              <Receipt size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{totalInvoices}</span>
              <span className="text-xs font-medium text-slate-500">Invoices</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Diterbitkan untuk siswa</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Pendapatan Diterima (Lunas)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formatRupiah(totalRevenue)}</span>
            </div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              Lunas dari {paidCount} invoice
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Potensi Pendapatan (Belum Bayar)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{formatRupiah(potentialRevenue)}</span>
            </div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              Menunggu dari {unpaidCount} invoice
            </p>
          </div>
        </div>
      </div>

      <FinanceClientPage 
        invoices={invoices} 
        initialBankInfo={bankInfo}
      />
    </div>
  );
}
