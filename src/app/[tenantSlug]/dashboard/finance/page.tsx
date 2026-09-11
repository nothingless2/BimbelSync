import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import FinanceClientPage from "./client-page";
import { AddInvoiceModal } from "@/components/modals/add-invoice-modal";
import { GenerateInvoicesButton } from "./generate-button";

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
  const q = resolvedSearchParams?.q as string || "";

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("bimbelsync_session")?.value;
  
  if (!sessionToken) {
    redirect(`/${tenantSlug}/login`);
  }

  const session = await decrypt(sessionToken);
  if (!session || !session.academy_id) {
    redirect(`/${tenantSlug}/login`);
  }

  // Fetch all invoices for this academy
  const invoices = await prisma.invoice.findMany({
    where: {
      academy_id: session.academy_id,
      ...(q ? {
        student: { full_name: { contains: q, mode: 'insensitive' } }
      } : {})
    },
    include: {
      student: true,
      items: true,
      verified_by: true
    },
    orderBy: {
      id: 'desc' // Newest first
    }
  });

  // Fetch active students for the AddInvoiceModal dropdown
  const students = await prisma.student.findMany({
    where: {
      academy_id: session.academy_id,
      deleted_at: null
    },
    orderBy: {
      full_name: 'asc'
    }
  });

  // Calculate some stats
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.payment_status === 'PAID');
  const unpaidInvoices = invoices.filter(i => i.payment_status === 'UNPAID');

  const totalRevenue = paidInvoices.reduce((acc, curr) => acc + curr.total_amount, 0);
  const potentialRevenue = unpaidInvoices.reduce((acc, curr) => acc + curr.total_amount, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
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
        
        <div className="flex items-center gap-2">
          <GenerateInvoicesButton academyId={session.academy_id} />
          <AddInvoiceModal students={students} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl border border-slate-700 p-5 shadow-lg flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Total Tagihan (Semua)</p>
          <div className="flex items-end gap-3 mt-1">
            <span className="text-3xl font-bold text-white">{totalInvoices}</span>
            <span className="text-sm font-medium text-slate-300 mb-1">Invoices</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl border border-emerald-600 p-5 shadow-lg flex flex-col gap-1">
          <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wider">Pendapatan Diterima (Lunas)</p>
          <div className="flex items-end gap-3 mt-1">
            <span className="text-3xl font-bold text-white">{formatRupiah(totalRevenue)}</span>
            <span className="text-sm font-medium text-emerald-200 mb-1">dari {paidInvoices.length} inv</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl border border-amber-600 p-5 shadow-lg flex flex-col gap-1">
          <p className="text-sm font-semibold text-amber-100 uppercase tracking-wider">Potensi Pendapatan (Belum Bayar)</p>
          <div className="flex items-end gap-3 mt-1">
            <span className="text-3xl font-bold text-white">{formatRupiah(potentialRevenue)}</span>
            <span className="text-sm font-medium text-amber-200 mb-1">dari {unpaidInvoices.length} inv</span>
          </div>
        </div>
      </div>

      <FinanceClientPage invoices={invoices} />
    </div>
  );
}
