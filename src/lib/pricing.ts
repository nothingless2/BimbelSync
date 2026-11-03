export interface PlanWithDiscounts {
  id?: string;
  name: string;
  price: number;
  discount_6_months?: number | null;
  discount_12_months?: number | null;
}

export interface PlanPriceCalculation {
  amount: number;
  originalAmount: number;
  discountPercent: number;
  savings: number;
  label: string;
  badge: string | null;
}

/**
 * Menghitung harga paket berlangganan platform BimbelSync berdasarkan durasi bulan
 * dengan diskon resmi sesuai landing page (1 Bulan, 6 Bulan Hemat 10%, 1 Tahun Hemat 2 Bulan).
 */
export function calculatePlanPrice(
  plan: PlanWithDiscounts,
  durationMonths: number
): PlanPriceCalculation {
  const price = plan.price || 0;
  const originalAmount = price * durationMonths;

  if (durationMonths === 6) {
    const discountPercent = plan.discount_6_months ?? 10;
    const rawSemesterPrice = price * 6 * (1 - discountPercent / 100);
    const amount = Math.floor(rawSemesterPrice / 1000) * 1000;
    const savings = originalAmount - amount;
    return {
      amount,
      originalAmount,
      discountPercent,
      savings,
      label: "Semester (6 Bulan)",
      badge: `HEMAT ${discountPercent}%`,
    };
  }

  if (durationMonths === 12) {
    const discountPercent = plan.discount_12_months ?? 17;
    // Diskon tahunan default 17% setara dengan bayar 10 bulan (hemat 2 bulan)
    const rawYearlyPrice =
      discountPercent === 17
        ? price * 10
        : price * 12 * (1 - discountPercent / 100);
    const amount = Math.round(rawYearlyPrice / 1000) * 1000;
    const savings = originalAmount - amount;
    return {
      amount,
      originalAmount,
      discountPercent,
      savings,
      label: "Tahunan (1 Tahun)",
      badge: "HEMAT 2 BULAN",
    };
  }

  return {
    amount: originalAmount,
    originalAmount,
    discountPercent: 0,
    savings: 0,
    label: durationMonths === 1 ? "Bulanan (1 Bulan)" : `${durationMonths} Bulan`,
    badge: null,
  };
}

