"use client";

import { usePathname } from "next/navigation";
import { BillingBanner } from "./billing-banner";

interface BillingBannerWrapperProps {
  status: string;
  dueDate: Date | null;
  hasUnpaid: boolean;
  totalDebt: number;
}

export function BillingBannerWrapper({ status, dueDate, hasUnpaid, totalDebt }: BillingBannerWrapperProps) {
  const pathname = usePathname();

  // Hanya tampilkan banner di halaman utama dashboard atau halaman billing
  // pathname contoh: /bimbel-juara/dashboard atau /bimbel-juara/dashboard/billing
  const isDashboardHome = pathname.endsWith("/dashboard");
  const isBillingPage = pathname.endsWith("/dashboard/billing");

  if (!isDashboardHome && !isBillingPage) {
    return null;
  }

  return (
    <BillingBanner 
      status={status} 
      dueDate={dueDate} 
      hasUnpaid={hasUnpaid} 
      totalDebt={totalDebt} 
    />
  );
}
