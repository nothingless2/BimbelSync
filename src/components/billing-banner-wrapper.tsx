"use client";

import { usePathname } from "next/navigation";
import { BillingBanner } from "./billing-banner";

interface BillingBannerWrapperProps {
  status: string;
  dueDate: Date | string | null;
  hasUnpaid: boolean;
  totalDebt: number;
  bankName?: string;
  bankAccount?: string;
  tenantSlug?: string;
}

export function BillingBannerWrapper({ 
  status, 
  dueDate, 
  hasUnpaid, 
  totalDebt,
  bankName,
  bankAccount,
  tenantSlug
}: BillingBannerWrapperProps) {
  const pathname = usePathname();

  // Hanya tampilkan banner di halaman utama dashboard atau halaman subscription
  const isDashboardHome = pathname ? (pathname.endsWith("/dashboard") || pathname.endsWith("/dashboard/")) : false;
  const isSubscriptionPage = pathname ? (pathname.includes("/dashboard/subscription") || pathname.includes("/dashboard/billing")) : false;

  if (!isDashboardHome && !isSubscriptionPage) {
    return null;
  }

  return (
    <BillingBanner 
      status={status} 
      dueDate={dueDate} 
      hasUnpaid={hasUnpaid} 
      totalDebt={totalDebt} 
      bankName={bankName}
      bankAccount={bankAccount}
      tenantSlug={tenantSlug}
    />
  );
}
