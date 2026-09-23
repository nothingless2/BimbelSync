const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const acad = await prisma.academy.findFirst({
    where: { name: { contains: 'cita' } },
    select: { id: true, name: true, subscription_due_date: true, pending_plan_date: true, pending_plan_id: true, plan: { select: { name: true } } }
  });
  console.log('Before:', acad);

  if (acad && acad.pending_plan_date) {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 2); // Set 2 days in the past
    await prisma.academy.update({
      where: { id: acad.id },
      data: { pending_plan_date: newDate }
    });
    console.log('Updated pending_plan_date to', newDate);
  } else {
    console.log('No pending plan date found for this academy.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
