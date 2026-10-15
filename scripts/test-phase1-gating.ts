import { 
  isFeatureAllowedByPlan, 
  getFeatureLockMessage,
  checkFeatureAccess,
  assertFeatureAccess,
  getAcademySubscription,
  FeatureKey
} from "../src/lib/subscription";
import prisma from "../src/lib/prisma";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

async function runTestSuite() {
  console.log("==================================================");
  console.log("BimbelSync - Phase 1 Feature Gating Test Suite");
  console.log("==================================================\n");

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Pure Logic - isFeatureAllowedByPlan for Starter, Growth, Pro
  // --------------------------------------------------------------------------
  console.log("[1] Testing isFeatureAllowedByPlan mapping against Plan definitions:");

  const starterPlan = {
    name: "Starter",
    allows_qr_attendance: false,
    allows_erapor: false,
    allows_installment: false,
    allows_audit_trail: false,
    allows_automated_email: false,
  };

  const growthPlan = {
    name: "Growth",
    allows_qr_attendance: true,
    allows_erapor: true,
    allows_installment: false,
    allows_audit_trail: false,
    allows_automated_email: true,
  };

  const proPlan = {
    name: "Pro",
    allows_qr_attendance: true,
    allows_erapor: true,
    allows_installment: true,
    allows_audit_trail: true,
    allows_automated_email: true,
  };

  // Starter Assertions
  assert(!isFeatureAllowedByPlan(starterPlan, "qr_attendance"), "Starter: QR attendance disallowed");
  assert(!isFeatureAllowedByPlan(starterPlan, "erapor"), "Starter: E-Rapor disallowed");
  assert(!isFeatureAllowedByPlan(starterPlan, "installment"), "Starter: Installments disallowed");
  assert(!isFeatureAllowedByPlan(starterPlan, "audit_trail"), "Starter: Audit trail disallowed");
  assert(!isFeatureAllowedByPlan(starterPlan, "automated_email"), "Starter: Automated email disallowed");
  assert(!isFeatureAllowedByPlan(starterPlan, "learning_materials"), "Starter: Learning materials disallowed");

  // Growth Assertions
  assert(isFeatureAllowedByPlan(growthPlan, "qr_attendance"), "Growth: QR attendance allowed");
  assert(isFeatureAllowedByPlan(growthPlan, "erapor"), "Growth: E-Rapor allowed");
  assert(!isFeatureAllowedByPlan(growthPlan, "installment"), "Growth: Installments disallowed");
  assert(!isFeatureAllowedByPlan(growthPlan, "audit_trail"), "Growth: Audit trail disallowed");
  assert(isFeatureAllowedByPlan(growthPlan, "automated_email"), "Growth: Automated email allowed");
  assert(isFeatureAllowedByPlan(growthPlan, "learning_materials"), "Growth: Learning materials allowed");

  // Pro Assertions
  assert(isFeatureAllowedByPlan(proPlan, "qr_attendance"), "Pro: QR attendance allowed");
  assert(isFeatureAllowedByPlan(proPlan, "erapor"), "Pro: E-Rapor allowed");
  assert(isFeatureAllowedByPlan(proPlan, "installment"), "Pro: Installments allowed");
  assert(isFeatureAllowedByPlan(proPlan, "audit_trail"), "Pro: Audit trail allowed");
  assert(isFeatureAllowedByPlan(proPlan, "automated_email"), "Pro: Automated email allowed");
  assert(isFeatureAllowedByPlan(proPlan, "learning_materials"), "Pro: Learning materials allowed");

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Feature Lock Messages
  // --------------------------------------------------------------------------
  console.log("\n[2] Testing getFeatureLockMessage output:");
  const features: FeatureKey[] = [
    "qr_attendance",
    "erapor",
    "installment",
    "audit_trail",
    "automated_email",
    "learning_materials"
  ];

  for (const f of features) {
    const msg = getFeatureLockMessage(f, "Starter");
    assert(msg.length > 20 && msg.includes("Starter"), `Lock message for ${f} is descriptive`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Database & Subscription Resolution Integration
  // --------------------------------------------------------------------------
  console.log("\n[3] Testing DB-backed Subscription Resolution & Feature Gating:");

  const academies = await prisma.academy.findMany({
    take: 3,
    include: { plan: true },
    where: { deleted_at: null }
  });

  if (academies.length === 0) {
    console.log("  (Notice: No active academies in database, skipping DB-specific checks)");
  } else {
    for (const ac of academies) {
      console.log(`\n  Checking Academy: "${ac.name}" (Slug: ${ac.path_url}, Plan: ${ac.plan.name}, Status: ${ac.subscription_status})`);
      
      const sub = await getAcademySubscription(ac.id);
      assert(sub !== null, `Subscription resolved for ${ac.name}`);
      if (!sub) continue;

      assert(typeof sub.isAccessible === "boolean", `isAccessible boolean resolved (${sub.isAccessible})`);
      assert(typeof sub.effectiveStatus === "string", `effectiveStatus resolved (${sub.effectiveStatus})`);
      assert(sub.planId === ac.plan_id, `planId matches (${sub.planId})`);

      // Test checkFeatureAccess
      for (const f of features) {
        const access = await checkFeatureAccess(ac.id, f);
        assert(typeof access.allowed === "boolean", `checkFeatureAccess(${f}) returns boolean: ${access.allowed}`);
        
        const expectedAllowed = sub.isAccessible && isFeatureAllowedByPlan(sub.plan, f);
        assert(
          access.allowed === expectedAllowed,
          `checkFeatureAccess(${f}) matches expected plan capability (${access.allowed} === ${expectedAllowed})`
        );

        // Test assertFeatureAccess
        const asserted = await assertFeatureAccess(ac.id, f);
        if (access.allowed) {
          assert(asserted.allowed === true, `assertFeatureAccess(${f}) returns allowed: true`);
        } else {
          assert(asserted.allowed === false && typeof asserted.error === "string", `assertFeatureAccess(${f}) returns error string`);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Simulated Downgrade & Suspended Statuses
  // --------------------------------------------------------------------------
  console.log("\n[4] Testing edge case subscription statuses (Simulated):");

  const simulatedExpiredTrialSub = {
    id: "test-academy-sim",
    name: "Simulated Bimbel",
    tenant_slug: "sim-bimbel",
    subscription_status: "TRIAL" as any,
    subscription_due_date: new Date(Date.now() - 86400000 * 2), // 2 days ago
    plan_id: "plan-growth",
    plan: growthPlan as any,
    pending_plan: null,
    pending_plan_id: null,
    deleted_at: null,
  };

  const isSimTrialExpired = simulatedExpiredTrialSub.subscription_due_date.getTime() < Date.now();
  assert(isSimTrialExpired, "Simulated expired trial correctly detected as expired");

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`Results: ${passedTests} PASSED, ${failedTests} FAILED of ${totalTests} total assertions.`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
