const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  
  for (const plan of plans) {
    const name = plan.name.toLowerCase();
    let newPrice = plan.price;
    
    let allows_automated_email = false;
    let allows_qr_attendance = false;
    let allows_erapor = false;
    let allows_installment = false;
    let allows_audit_trail = false;
    
    if (name.includes('starter')) {
      newPrice = 149000;
    } else if (name.includes('growth')) {
      newPrice = 349000;
      allows_automated_email = true;
      allows_qr_attendance = true;
      allows_erapor = true;
    } else if (name.includes('pro') || name.includes('premium')) {
      newPrice = 899000;
      allows_automated_email = true;
      allows_qr_attendance = true;
      allows_erapor = true;
      allows_installment = true;
      allows_audit_trail = true;
    }

    await prisma.plan.update({
      where: { id: plan.id },
      data: { 
        price: newPrice,
        allows_automated_email,
        allows_qr_attendance,
        allows_erapor,
        allows_installment,
        allows_audit_trail
      }
    });
    console.log(`Updated ${plan.name} features and price to Rp ${newPrice}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
