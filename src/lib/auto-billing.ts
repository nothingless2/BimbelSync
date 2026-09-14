import prisma from "./prisma";

export async function runAutoBillingEngine() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // H-7 dari hari ini
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 7);

    // Cari akademi yang aktif atau trial, yang jatuh temponya kurang dari atau sama dengan H-7
    const academiesNearExpiry = await prisma.academy.findMany({
      where: {
        subscription_status: { in: ["ACTIVE", "TRIAL"] },
        subscription_due_date: {
          not: null,
          lte: targetDate, // kurang dari atau sama dengan H-7
        }
      },
      include: {
        plan: true
      }
    });

    if (academiesNearExpiry.length === 0) return;

    for (const academy of academiesNearExpiry) {
      // Periksa apakah bulan depan sudah ada tagihan UNPAID atau PAID
      // Kita asumsikan periode tagihan baru adalah bulan depan dari due_date saat ini
      const currentDueDate = new Date(academy.subscription_due_date!);
      const nextBillingPeriod = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, 1);
      const nextDueDate = new Date(currentDueDate);
      nextDueDate.setMonth(currentDueDate.getMonth() + 1);

      // Cek apakah sudah ada tagihan untuk bulan tersebut (toleransi bulan dan tahun sama)
      const existingInvoice = await prisma.platformInvoice.findFirst({
        where: {
          academy_id: academy.id,
          billing_period: {
            gte: new Date(nextBillingPeriod.getFullYear(), nextBillingPeriod.getMonth(), 1),
            lt: new Date(nextBillingPeriod.getFullYear(), nextBillingPeriod.getMonth() + 1, 1)
          }
        }
      });

      // Jika belum ada invoice untuk bulan depan, buatkan otomatis
      if (!existingInvoice) {
        await prisma.platformInvoice.create({
          data: {
            academy_id: academy.id,
            plan_id: academy.plan_id,
            amount: academy.plan.price,
            billing_period: nextBillingPeriod,
            due_date: nextDueDate,
            payment_status: "UNPAID",
          }
        });
        
        // Catat di audit log secara opsional (jika sistem audit log di-setup secara global)
        // console.log(`[Auto-Billing] Created invoice for academy ${academy.id} for period ${nextBillingPeriod.toISOString()}`);
      }
    }
  } catch (error) {
    console.error("[Auto-Billing Error]:", error);
  }
}
