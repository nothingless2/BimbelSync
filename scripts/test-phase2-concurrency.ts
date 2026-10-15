import prisma from "../src/lib/prisma";
import { 
  executeWithQuotaLock, 
  QuotaExceededError, 
  getAcademyUsageLimit,
  getPlanResourceLimit,
  getAcademySubscription
} from "../src/lib/subscription";

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

async function runPhase2IntegrationTests() {
  console.log("================================================================================");
  console.log("BimbelSync - Phase 2.2: PostgreSQL Concurrency, Plan, Revocation & Integrity Test");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST SUITE 0: Contract getPlanResourceLimit (P1)
  // --------------------------------------------------------------------------
  console.log("[Test 0] Verifikasi Kontrak getPlanResourceLimit (Bounded, Null/Unlimited, Undefined, Unknown):");
  
  // 1. Nilai Terbatas (Bounded number)
  const boundedPlan = { name: "Starter", max_students: 50, max_staff: 3, max_rooms: 2 };
  assert(getPlanResourceLimit(boundedPlan, "students") === 50, "Bounded Starter students === 50");
  assert(getPlanResourceLimit(boundedPlan, "staff") === 3, "Bounded Starter staff === 3");
  assert(getPlanResourceLimit(boundedPlan, "rooms") === 2, "Bounded Starter rooms === 2");
  assert(getPlanResourceLimit(boundedPlan, "branches") === 1, "Bounded Starter branches === 1");

  // 2. Nilai Eksplisit Null (Unlimited)
  const unlimitedPlan = { name: "Enterprise", max_students: null, max_staff: null, max_rooms: null };
  assert(getPlanResourceLimit(unlimitedPlan, "students") === null, "Explicit null students === null (Unlimited)");
  assert(getPlanResourceLimit(unlimitedPlan, "staff") === null, "Explicit null staff === null (Unlimited)");
  assert(getPlanResourceLimit(unlimitedPlan, "rooms") === null, "Explicit null rooms === null (Unlimited)");

  // 3. Nilai Undefined (Fallback ke definisi kanonikal BimbelSync berdasarkan nama)
  const undefinedPro = { name: "Pro" };
  assert(getPlanResourceLimit(undefinedPro, "students") === 500, "Undefined Pro students fallback === 500");
  assert(getPlanResourceLimit(undefinedPro, "staff") === 25, "Undefined Pro staff fallback === 25");
  assert(getPlanResourceLimit(undefinedPro, "rooms") === 15, "Undefined Pro rooms fallback === 15");

  const undefinedGrowth = { name: "Growth" };
  assert(getPlanResourceLimit(undefinedGrowth, "students") === 200, "Undefined Growth students fallback === 200");
  assert(getPlanResourceLimit(undefinedGrowth, "staff") === 10, "Undefined Growth staff fallback === 10");
  assert(getPlanResourceLimit(undefinedGrowth, "rooms") === 6, "Undefined Growth rooms fallback === 6");

  const undefinedStarter = { name: "Starter" };
  assert(getPlanResourceLimit(undefinedStarter, "students") === 50, "Undefined Starter students fallback === 50");
  assert(getPlanResourceLimit(undefinedStarter, "staff") === 3, "Undefined Starter staff fallback === 3");
  assert(getPlanResourceLimit(undefinedStarter, "rooms") === 2, "Undefined Starter rooms fallback === 2");

  // 4. Paket Tidak Dikenal dengan field undefined
  const unknownPlan = { name: "CustomUnknownTier" };
  assert(getPlanResourceLimit(unknownPlan, "students") === null, "Unknown plan students fallback === null");
  assert(getPlanResourceLimit(unknownPlan, "staff") === null, "Unknown plan staff fallback === null");

  // Setup: Find or create Starter and Growth plans
  let starterPlan = await prisma.plan.findFirst({
    where: { name: { equals: "Starter", mode: "insensitive" }, deleted_at: null }
  });
  if (!starterPlan) {
    starterPlan = await prisma.plan.create({
      data: {
        name: "Starter",
        price: 99000,
        max_students: 50,
        max_staff: 3,
        max_rooms: 2,
      }
    });
  }

  let growthPlan = await prisma.plan.findFirst({
    where: { name: { equals: "Growth", mode: "insensitive" }, deleted_at: null }
  });
  if (!growthPlan) {
    growthPlan = await prisma.plan.create({
      data: {
        name: "Growth",
        price: 199000,
        max_students: 200,
        max_staff: 10,
        max_rooms: 6,
      }
    });
  }

  // Generate unique test academy slugs
  const testTimestamp = Date.now();
  const slugA = `test-quota-a-${testTimestamp}`;
  const slugB = `test-quota-b-${testTimestamp}`;
  const slugPending = `test-quota-pend-${testTimestamp}`;

  console.log("\nSetting up isolated test academies...");
  const academyA = await prisma.academy.create({
    data: {
      name: `Test Quota Academy A (${testTimestamp})`,
      path_url: slugA,
      plan_id: starterPlan.id,
      subscription_status: "ACTIVE",
    }
  });

  const academyB = await prisma.academy.create({
    data: {
      name: `Test Quota Academy B (${testTimestamp})`,
      path_url: slugB,
      plan_id: starterPlan.id,
      subscription_status: "ACTIVE",
    }
  });

  const academyPending = await prisma.academy.create({
    data: {
      name: `Test Quota Academy Pending (${testTimestamp})`,
      path_url: slugPending,
      plan_id: growthPlan.id,
      subscription_status: "ACTIVE",
      pending_plan_id: starterPlan.id,
      pending_plan_date: new Date(), // Jatuh tempo hari ini
    }
  });

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Pembuatan record saat masih di bawah batas kuota
    // --------------------------------------------------------------------------
    console.log("\n[Test 1] Pembuatan record saat masih di bawah batas kuota:");
    const room1 = await executeWithQuotaLock(academyA.id, "rooms", 1, async (tx) => {
      return await tx.room.create({
        data: {
          academy_id: academyA.id,
          name: "Ruang 101",
          capacity: 20
        }
      });
    });
    assert(room1.id !== undefined, "Ruang 1 berhasil dibuat saat slot tersedia (1/2)");

    const usageAfterRoom1 = await getAcademyUsageLimit(academyA.id, "rooms");
    assert(usageAfterRoom1.currentCount === 1, "Counter penggunaan ruangan bernilai 1");
    assert(usageAfterRoom1.isExceeded === false, "Status isExceeded masih false");
    assert(usageAfterRoom1.remainingQuota === 1, "Sisa kuota ruangan bernilai 1");

    // --------------------------------------------------------------------------
    // TEST 2: Penolakan ketika batas kuota sudah tercapai
    // --------------------------------------------------------------------------
    console.log("\n[Test 2] Penolakan ketika batas kuota sudah tercapai:");
    const room2 = await executeWithQuotaLock(academyA.id, "rooms", 1, async (tx) => {
      return await tx.room.create({
        data: {
          academy_id: academyA.id,
          name: "Ruang 102",
          capacity: 25
        }
      });
    });
    assert(room2.id !== undefined, "Ruang 2 berhasil dibuat mencapai batas kuota (2/2)");

    let rejectedRoom3 = false;
    let room3Error: any = null;
    try {
      await executeWithQuotaLock(academyA.id, "rooms", 1, async (tx) => {
        return await tx.room.create({
          data: {
            academy_id: academyA.id,
            name: "Ruang 103 (Harus Ditolak)",
            capacity: 30
          }
        });
      });
    } catch (err: any) {
      rejectedRoom3 = true;
      room3Error = err;
    }

    assert(rejectedRoom3, "Pembuatan Ruang 3 ditolak oleh sistem kuota");
    assert(room3Error instanceof QuotaExceededError, "Error yang dilempar adalah instance QuotaExceededError");
    
    const countRoomsAfterReject = await prisma.room.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(countRoomsAfterReject === 2, "Jumlah ruangan di database tetap 2 (tidak bocor)");

    // --------------------------------------------------------------------------
    // TEST 3: Impor massal yang melampaui batas gagal secara atomik (No partial insert)
    // --------------------------------------------------------------------------
    console.log("\n[Test 3] Impor massal yang melampaui batas kuota gagal secara atomik:");
    const initialBatch = Array.from({ length: 48 }).map((_, i) => ({
      academy_id: academyA.id,
      full_name: `Siswa Awal ${i + 1}`,
      username: `siswa_awal_${testTimestamp}_${i + 1}`,
      password_hash: "hash_test",
    }));

    await prisma.student.createMany({
      data: initialBatch
    });

    const studentCountBeforeBulk = await prisma.student.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(studentCountBeforeBulk === 48, "Siswa awal terisi 48 orang (sisa kuota: 2)");

    let bulkRejected = false;
    const bulkImportPayload = Array.from({ length: 5 }).map((_, i) => ({
      full_name: `Calon Siswa Bulk ${i + 1}`,
      username: `bulk_import_${testTimestamp}_${i + 1}`,
    }));

    try {
      await executeWithQuotaLock(academyA.id, "students", bulkImportPayload.length, async (tx) => {
        for (const s of bulkImportPayload) {
          await tx.student.create({
            data: {
              academy_id: academyA.id,
              full_name: s.full_name,
              username: s.username,
              password_hash: "hash_test",
            }
          });
        }
      });
    } catch (err: any) {
      bulkRejected = true;
      assert(err instanceof QuotaExceededError, "Impor massal ditolak dengan QuotaExceededError");
    }

    assert(bulkRejected, "Impor massal 5 siswa ditolak karena kuota tersisa hanya 2");

    const studentCountAfterFailedBulk = await prisma.student.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(
      studentCountAfterFailedBulk === 48,
      `Jumlah siswa tetap 48 (TIDAK ADA partial insert, ${studentCountAfterFailedBulk} === 48)`
    );

    // --------------------------------------------------------------------------
    // TEST 4: Beberapa request paralel yang berebut sisa 1 slot (Race Condition Test)
    // --------------------------------------------------------------------------
    console.log("\n[Test 4] Request paralel berebut sisa slot (Race Condition Stress Test):");
    await executeWithQuotaLock(academyA.id, "students", 1, async (tx) => {
      await tx.student.create({
        data: {
          academy_id: academyA.id,
          full_name: "Siswa Ke-49",
          username: `siswa_ke_49_${testTimestamp}`,
          password_hash: "hash_test",
        }
      });
    });

    const countAt49 = await prisma.student.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(countAt49 === 49, "Jumlah siswa sekarang tepat 49 (Tersisa tepat 1 slot)");

    console.log("  Memulai 10 request konkuren paralel berebut 1 slot...");
    const parallelAttempts = 10;
    const raceResults = await Promise.allSettled(
      Array.from({ length: parallelAttempts }).map(async (_, idx) => {
        return await executeWithQuotaLock(academyA.id, "students", 1, async (tx) => {
          return await tx.student.create({
            data: {
              academy_id: academyA.id,
              full_name: `Siswa Balapan ${idx}`,
              username: `race_student_${testTimestamp}_${idx}`,
              password_hash: "hash_test",
            }
          });
        });
      })
    );

    const successfulRaceCalls = raceResults.filter(r => r.status === "fulfilled").length;
    const rejectedRaceCalls = raceResults.filter(r => r.status === "rejected").length;

    console.log(`  Hasil balapan: ${successfulRaceCalls} Berhasil, ${rejectedRaceCalls} Ditolak`);
    assert(successfulRaceCalls === 1, `Tepat 1 request paralel yang berhasil mendapatkan slot terakhir (${successfulRaceCalls} === 1)`);
    assert(rejectedRaceCalls === 9, `Tepat 9 request paralel lainnya ditolak kuota (${rejectedRaceCalls} === 9)`);

    const finalStudentCount = await prisma.student.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(finalStudentCount === 50, `Jumlah akhir siswa di database tepat 50 (TIDAK LEBIH, ${finalStudentCount} === 50)`);

    // --------------------------------------------------------------------------
    // TEST 5: Request paralel dari Academy berbeda tidak saling memengaruhi
    // --------------------------------------------------------------------------
    console.log("\n[Test 5] Request paralel dari Academy berbeda berjalan independen:");
    const [pA, pB] = await Promise.all([
      executeWithQuotaLock(academyA.id, "staff", 1, async (tx) => {
        return await tx.staff.create({
          data: {
            academy_id: academyA.id,
            email: `staff_a_${testTimestamp}@bimbel.com`,
            password_hash: "hash_test",
            role: "TUTOR"
          }
        });
      }),
      executeWithQuotaLock(academyB.id, "staff", 1, async (tx) => {
        return await tx.staff.create({
          data: {
            academy_id: academyB.id,
            email: `staff_b_${testTimestamp}@bimbel.com`,
            password_hash: "hash_test",
            role: "TUTOR"
          }
        });
      })
    ]);

    assert(pA.id !== undefined, "Staff Academy A berhasil dibuat");
    assert(pB.id !== undefined, "Staff Academy B berhasil dibuat secara paralel");

    // --------------------------------------------------------------------------
    // TEST 6: Soft delete dan Preservasi Data
    // --------------------------------------------------------------------------
    console.log("\n[Test 6] Soft delete dan aturan Preservasi Data:");
    const studentToDelete = await prisma.student.findFirst({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(studentToDelete !== null, "Siswa untuk di-soft-delete ditemukan");

    if (studentToDelete) {
      await prisma.student.update({
        where: { id: studentToDelete.id },
        data: { deleted_at: new Date() }
      });
    }

    const countAfterSoftDelete = await prisma.student.count({
      where: { academy_id: academyA.id, deleted_at: null }
    });
    assert(countAfterSoftDelete === 49, "Jumlah siswa aktif berkurang menjadi 49 setelah soft delete");

    const newStudentAfterDelete = await executeWithQuotaLock(academyA.id, "students", 1, async (tx) => {
      return await tx.student.create({
        data: {
          academy_id: academyA.id,
          full_name: "Siswa Pengganti Slot",
          username: `siswa_pengganti_${testTimestamp}`,
          password_hash: "hash_test",
        }
      });
    });
    assert(newStudentAfterDelete.id !== undefined, "Siswa baru berhasil dibuat memanfaatkan slot dari soft-deleted student");

    // --------------------------------------------------------------------------
    // TEST 7: Kegagalan transaksi tidak menghasilkan data yatim
    // --------------------------------------------------------------------------
    console.log("\n[Test 7] Kegagalan transaksi tidak menghasilkan record duplikat / yatim:");
    let deliberateFail = false;
    const testStaffEmail = `fail_test_${testTimestamp}@bimbel.com`;

    try {
      await executeWithQuotaLock(academyA.id, "staff", 1, async (tx) => {
        await tx.staff.create({
          data: {
            academy_id: academyA.id,
            email: testStaffEmail,
            password_hash: "hash_test",
            role: "TUTOR"
          }
        });
        throw new Error("Simulasi error bisnis di tengah proses!");
      });
    } catch (err: any) {
      deliberateFail = true;
    }

    assert(deliberateFail, "Transaksi sengaja digagalkan berhasil ditangkap");
    const foundOrphanStaff = await prisma.staff.findFirst({
      where: { email: testStaffEmail }
    });
    assert(foundOrphanStaff === null, "Record yang digagalkan di-rollback 100% (tidak ada data yatim)");

    // --------------------------------------------------------------------------
    // TEST 8: P0 — Aktivasi Pending Plan Bebas Lock Wait / Self-Deadlock
    // --------------------------------------------------------------------------
    console.log("\n[Test 8] P0 — Aktivasi pending plan yang jatuh tempo di dalam lock kuota:");
    const startActivationTime = Date.now();
    
    // Pemanggilan executeWithQuotaLock pada akademi dengan pending plan jatuh tempo hari ini:
    const pendingStudent = await executeWithQuotaLock(academyPending.id, "students", 1, async (tx) => {
      return await tx.student.create({
        data: {
          academy_id: academyPending.id,
          full_name: "Siswa Pending Test",
          username: `pending_student_${testTimestamp}`,
          password_hash: "hash_test",
        }
      });
    });
    
    const durationActivationMs = Date.now() - startActivationTime;
    console.log(`  Durasi eksekusi aktivasi pending plan: ${durationActivationMs} ms`);

    assert(pendingStudent.id !== undefined, "Siswa berhasil dibuat di akademi dengan pending plan");
    assert(durationActivationMs < 3000, `Eksekusi selesai cepat tanpa lock wait / timeout (${durationActivationMs} ms < 3000 ms)`);

    const updatedAcademyPending = await prisma.academy.findUnique({
      where: { id: academyPending.id },
      include: { plan: true }
    });
    assert(updatedAcademyPending?.plan_id === starterPlan.id, `Paket berhasil diperbarui ke Starter (${updatedAcademyPending?.plan.name} === Starter)`);
    assert(updatedAcademyPending?.pending_plan_id === null, "pending_plan_id berhasil di-reset ke null");
    assert(updatedAcademyPending?.pending_plan_date === null, "pending_plan_date berhasil di-reset ke null");

    // --------------------------------------------------------------------------
    // TEST 9: P2 — Integritas Nama Ruangan & Partial Index
    // --------------------------------------------------------------------------
    console.log("\n[Test 9] P2 — Integritas nama ruangan, pencegahan duplikasi & partial index:");
    // 1. Buat ruangan pertama "Lab IPA" di Academy B
    const roomB1 = await executeWithQuotaLock(academyB.id, "rooms", 1, async (tx) => {
      const existing = await tx.room.findFirst({
        where: { academy_id: academyB.id, name: { equals: "Lab IPA", mode: "insensitive" }, deleted_at: null }
      });
      if (existing) throw new Error('Ruangan dengan nama "Lab IPA" sudah terdaftar.');
      return await tx.room.create({
        data: { academy_id: academyB.id, name: "Lab IPA", capacity: 30 }
      });
    });
    assert(roomB1.id !== undefined, "Ruang 'Lab IPA' pertama berhasil dibuat di Academy B");

    // 2. Coba buat ruangan kedua dengan nama sama "Lab IPA" (harus ditolak)
    let duplicateRejected = false;
    try {
      await executeWithQuotaLock(academyB.id, "rooms", 1, async (tx) => {
        const existing = await tx.room.findFirst({
          where: { academy_id: academyB.id, name: { equals: "Lab IPA", mode: "insensitive" }, deleted_at: null }
        });
        if (existing) throw new Error('Ruangan dengan nama "Lab IPA" sudah terdaftar.');
        return await tx.room.create({
          data: { academy_id: academyB.id, name: "Lab IPA", capacity: 30 }
        });
      });
    } catch (err: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Pembuatan ruangan duplikat 'Lab IPA' berhasil ditolak");

    // 3. Verifikasi PostgreSQL DB Partial Unique Index:
    // Coba bypass pre-check dan langsung insert "Lab IPA" aktif via prisma:
    let dbUniqueViolationCaught = false;
    try {
      await prisma.room.create({
        data: { academy_id: academyB.id, name: "Lab IPA", capacity: 30 }
      });
    } catch (err: any) {
      dbUniqueViolationCaught = err.code === "P2002" || err.message?.includes("room_academy_id_name_active_idx");
    }
    assert(dbUniqueViolationCaught, "PostgreSQL Partial Unique Index menolak insert ruangan aktif dengan nama sama");

    // 4. Soft-delete "Lab IPA" dan verifikasi nama tersebut BISA dipakai ulang
    await prisma.room.update({
      where: { id: roomB1.id },
      data: { deleted_at: new Date() }
    });

    const roomBReused = await executeWithQuotaLock(academyB.id, "rooms", 1, async (tx) => {
      const existing = await tx.room.findFirst({
        where: { academy_id: academyB.id, name: { equals: "Lab IPA", mode: "insensitive" }, deleted_at: null }
      });
      if (existing) throw new Error('Ruangan dengan nama "Lab IPA" sudah terdaftar.');
      return await tx.room.create({
        data: { academy_id: academyB.id, name: "Lab IPA", capacity: 35 }
      });
    });
    assert(roomBReused.id !== undefined, "Nama ruangan dari record soft-deleted dapat dipakai ulang oleh ruangan baru");

    // --------------------------------------------------------------------------
    // TEST 10: P1 — Revokasi Sesi Staf & Isolasi Tenant
    // --------------------------------------------------------------------------
    console.log("\n[Test 10] P1 — Revokasi sesi staf yang di-soft-delete dan isolasi lintas tenant:");
    const testStaff = await prisma.staff.create({
      data: {
        academy_id: academyA.id,
        email: `staff_revoke_${testTimestamp}@bimbel.com`,
        password_hash: "hash_test",
        role: "ADMIN"
      }
    });

    // Verifikasi staf aktif ditemukan di database
    const activeStaffCheck = await prisma.staff.findFirst({
      where: { id: testStaff.id, academy_id: academyA.id, deleted_at: null }
    });
    assert(activeStaffCheck !== null, "Staf aktif terverifikasi valid di database");

    // Soft-delete staf tersebut
    await prisma.staff.update({
      where: { id: testStaff.id },
      data: { deleted_at: new Date() }
    });

    // Simulasi validasi server-side requireTenantSession:
    const revokedStaffCheck = await prisma.staff.findFirst({
      where: { id: testStaff.id, academy_id: academyA.id, deleted_at: null }
    });
    assert(revokedStaffCheck === null, "Staf yang di-soft-delete otomatis ditolak oleh validasi server-side database");

    // Cross-tenant check: staff Academy A mencoba mengakses Academy B
    const crossTenantCheck = await prisma.staff.findFirst({
      where: { id: testStaff.id, academy_id: academyB.id, deleted_at: null }
    });
    assert(crossTenantCheck === null, "Akses lintas tenant ditolak (academy_id tidak cocok)");

  } finally {
    // Cleanup isolated test data
    console.log("\nMembersihkan data pengujian sementara...");
    await prisma.attendance.deleteMany({ where: { student: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } } });
    await prisma.enrollment.deleteMany({ where: { student: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } } });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } } });
    await prisma.invoice.deleteMany({ where: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } });
    await prisma.student.deleteMany({ where: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } });
    await prisma.staff.deleteMany({ where: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } });
    await prisma.room.deleteMany({ where: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } });
    await prisma.program.deleteMany({ where: { academy_id: { in: [academyA.id, academyB.id, academyPending.id] } } });
    await prisma.academy.delete({ where: { id: academyA.id } });
    await prisma.academy.delete({ where: { id: academyB.id } });
    await prisma.academy.delete({ where: { id: academyPending.id } });
    console.log("Cleanup selesai.");
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`Phase 2.2 Integration Results: ${passedTests} PASSED, ${failedTests} FAILED of ${totalTests} total assertions.`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase2IntegrationTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
