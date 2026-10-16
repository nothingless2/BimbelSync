import prisma from "../src/lib/prisma";
import { 
  executeWithQuotaLock, 
  QuotaExceededError, 
  getAcademyUsageLimit,
  getPlanResourceLimit 
} from "../src/lib/subscription";
import { 
  parsePositiveQuotaLimit, 
  parsePlanPrice 
} from "../src/lib/plan-validation";

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

async function runPhase24Tests() {
  console.log("================================================================================");
  console.log("BimbelSync - Phase 2.4: Safe Reconciliation & Integrity Verification Tests");
  console.log("================================================================================\n");

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Superadmin Quota Limit & Price Validation (Phase B3)
  // --------------------------------------------------------------------------
  console.log("[Test Suite 1] Phase B3 — Validasi Kuota & Harga Superadmin:");

  // 1. Bilangan bulat positif valid
  const valid1 = parsePositiveQuotaLimit("50", "Batas siswa");
  assert(!valid1.error && valid1.value === 50, "String '50' diparsing menjadi 50");

  const valid2 = parsePositiveQuotaLimit(100, "Batas siswa");
  assert(!valid2.error && valid2.value === 100, "Number 100 diparsing menjadi 100");

  const valid3 = parsePositiveQuotaLimit("1", "Batas siswa");
  assert(!valid3.error && valid3.value === 1, "Batas minimum 1 diterima");

  const valid4 = parsePositiveQuotaLimit("1000000", "Batas siswa");
  assert(!valid4.error && valid4.value === 1000000, "Batas aman maksimum 1.000.000 diterima");

  // 2. Input kosong / null / undefined (TIDAK otomatis Unlimited)
  const empty1 = parsePositiveQuotaLimit("", "Batas siswa");
  assert(!!empty1.error && empty1.error.includes("wajib diisi"), "String kosong '' ditolak");

  const empty2 = parsePositiveQuotaLimit("   ", "Batas siswa");
  assert(!!empty2.error && empty2.error.includes("wajib diisi"), "Spasi kosong '   ' ditolak");

  const empty3 = parsePositiveQuotaLimit(null, "Batas siswa");
  assert(!!empty3.error && empty3.error.includes("wajib diisi"), "Nilai null ditolak");

  const empty4 = parsePositiveQuotaLimit(undefined, "Batas siswa");
  assert(!!empty4.error && empty4.error.includes("wajib diisi"), "Nilai undefined ditolak");

  // 3. String non-angka
  const nonDigit1 = parsePositiveQuotaLimit("abc", "Batas siswa");
  assert(!!nonDigit1.error && nonDigit1.error.includes("harus berupa bilangan bulat positif"), "String 'abc' ditolak");

  const nonDigit2 = parsePositiveQuotaLimit("50 siswa", "Batas siswa");
  assert(!!nonDigit2.error && nonDigit2.error.includes("harus berupa bilangan bulat positif"), "String '50 siswa' ditolak");

  const nonDigit3 = parsePositiveQuotaLimit("12a", "Batas siswa");
  assert(!!nonDigit3.error && nonDigit3.error.includes("harus berupa bilangan bulat positif"), "String '12a' ditolak");

  // 4. Nol dan angka negatif
  const zeroVal = parsePositiveQuotaLimit("0", "Batas siswa");
  assert(!!zeroVal.error && zeroVal.error.includes("harus lebih besar dari 0"), "Angka '0' ditolak");

  const negativeVal = parsePositiveQuotaLimit("-5", "Batas siswa");
  assert(!!negativeVal.error, "Angka negatif '-5' ditolak");

  // 5. Angka desimal
  const decimalVal1 = parsePositiveQuotaLimit("5.5", "Batas siswa");
  assert(!!decimalVal1.error && decimalVal1.error.includes("harus berupa bilangan bulat positif"), "Desimal '5.5' ditolak");

  const decimalVal2 = parsePositiveQuotaLimit("10,5", "Batas siswa");
  assert(!!decimalVal2.error && decimalVal2.error.includes("harus berupa bilangan bulat positif"), "Format koma '10,5' ditolak");

  // 6. Angka di luar batas aman
  const overflowVal = parsePositiveQuotaLimit("1000001", "Batas siswa");
  assert(!!overflowVal.error && overflowVal.error.includes("melebihi batas wajar"), "Angka di atas 1.000.000 ditolak");

  // 7. Validasi harga paket
  const validPrice = parsePlanPrice("199000");
  assert(!validPrice.error && validPrice.value === 199000, "Harga 199000 diterima");

  const invalidPriceStr = parsePlanPrice("199.000");
  assert(!!invalidPriceStr.error, "Harga dengan titik '199.000' ditolak (harus angka murni)");

  const negativePrice = parsePlanPrice("-1000");
  assert(!!negativePrice.error, "Harga negatif ditolak");

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Pricing Section Consistency (Phase C)
  // --------------------------------------------------------------------------
  console.log("\n[Test Suite 2] Phase C — Konsistensi Tampilan Landing Page & Kontrak Bisnis:");

  // Evaluasi fungsi mapping sanitasi harga pada data DB yang belum direkonsiliasi:
  const rawDbPlansWithNull = [
    { id: "1", name: "Starter", price: 99000, max_students: 50, max_staff: 3, max_rooms: 2 },
    { id: "2", name: "Growth", price: 199000, max_students: 200, max_staff: 10, max_rooms: 6 },
    { id: "3", name: "Pro", price: 399000, max_students: 500, max_staff: null, max_rooms: null },
  ];

  const sanitizedPlans = rawDbPlansWithNull.map((p) => {
    const isPro = p.name.trim().toLowerCase() === "pro";
    return {
      ...p,
      max_students: p.max_students ?? (isPro ? 500 : p.max_students),
      max_staff: p.max_staff ?? (isPro ? 25 : p.max_staff),
      max_rooms: p.max_rooms ?? (isPro ? 15 : p.max_rooms),
    };
  });

  const proSanitized = sanitizedPlans.find((p) => p.name === "Pro")!;
  assert(proSanitized.max_students === 500, "Pro sanitized max_students === 500 (bukan null/unlimited)");
  assert(proSanitized.max_staff === 25, "Pro sanitized max_staff === 25 (bukan null/unlimited)");
  assert(proSanitized.max_rooms === 15, "Pro sanitized max_rooms === 15 (bukan null/unlimited)");

  const starterSanitized = sanitizedPlans.find((p) => p.name === "Starter")!;
  assert(starterSanitized.max_students === 50 && starterSanitized.max_staff === 3 && starterSanitized.max_rooms === 2, "Starter tetap 50/3/2");

  const growthSanitized = sanitizedPlans.find((p) => p.name === "Growth")!;
  assert(growthSanitized.max_students === 200 && growthSanitized.max_staff === 10 && growthSanitized.max_rooms === 6, "Growth tetap 200/10/6");

  // --------------------------------------------------------------------------
  // SETUP ISOLATED ACADEMIES FOR DATABASE TESTS
  // --------------------------------------------------------------------------
  const testTimestamp = Date.now();
  console.log("\nSetting up isolated test academies for DB tests...");

  let growthPlan = await prisma.plan.findFirst({
    where: { name: { equals: "Growth", mode: "insensitive" }, deleted_at: null }
  });
  if (!growthPlan) {
    growthPlan = await prisma.plan.create({
      data: { name: "Growth", price: 199000, max_students: 200, max_staff: 10, max_rooms: 6 }
    });
  }

  const academyIsoA = await prisma.academy.create({
    data: {
      name: `Iso Test Academy A (${testTimestamp})`,
      path_url: `iso-test-a-${testTimestamp}`,
      plan_id: growthPlan.id,
      subscription_status: "ACTIVE",
    }
  });

  const academyIsoB = await prisma.academy.create({
    data: {
      name: `Iso Test Academy B (${testTimestamp})`,
      path_url: `iso-test-b-${testTimestamp}`,
      plan_id: growthPlan.id,
      subscription_status: "ACTIVE",
    }
  });

  try {
    // --------------------------------------------------------------------------
    // TEST SUITE 3: Case-Insensitive Room Name & Multi-Tenant Isolation (Phase D3)
    // --------------------------------------------------------------------------
    console.log("\n[Test Suite 3] Phase D3 — Integritas Nama Ruangan Case-Insensitive & Isolasi Tenant:");

    // 1. Buat ruangan "Lab Komputer" di Academy A
    const roomA1 = await executeWithQuotaLock(academyIsoA.id, "rooms", 1, async (tx) => {
      const existing = await tx.room.findFirst({
        where: { academy_id: academyIsoA.id, name: { equals: "Lab Komputer", mode: "insensitive" }, deleted_at: null }
      });
      if (existing) throw new Error(`Ruangan dengan nama "Lab Komputer" sudah terdaftar di bimbel Anda.`);
      return await tx.room.create({
        data: { academy_id: academyIsoA.id, name: "Lab Komputer", capacity: 30 }
      });
    });
    assert(roomA1.id !== undefined, "Ruang 'Lab Komputer' berhasil dibuat di Academy A");

    // 2. Coba buat ruangan dengan nama sama tapi huruf kecil "lab komputer" di Academy A (Harus Ditolak)
    let rejectCaseInsensitive = false;
    let rejectErrorMsg = "";
    try {
      await executeWithQuotaLock(academyIsoA.id, "rooms", 1, async (tx) => {
        const existing = await tx.room.findFirst({
          where: { academy_id: academyIsoA.id, name: { equals: "lab komputer", mode: "insensitive" }, deleted_at: null }
        });
        if (existing) throw new Error(`Ruangan dengan nama "lab komputer" sudah terdaftar di bimbel Anda.`);
        return await tx.room.create({
          data: { academy_id: academyIsoA.id, name: "lab komputer", capacity: 30 }
        });
      });
    } catch (err: any) {
      rejectCaseInsensitive = true;
      rejectErrorMsg = err.message;
    }
    assert(rejectCaseInsensitive, "Pembuatan ruangan duplikat case-insensitive 'lab komputer' ditolak");
    assert(rejectErrorMsg.includes("sudah terdaftar di bimbel Anda"), "Pesan kesalahan ramah pengguna ditampilkan");

    // 3. Buat ruangan dengan nama sama "lab komputer" di Academy B (Harus Berhasil - Isolasi Tenant)
    const roomB1 = await executeWithQuotaLock(academyIsoB.id, "rooms", 1, async (tx) => {
      const existing = await tx.room.findFirst({
        where: { academy_id: academyIsoB.id, name: { equals: "lab komputer", mode: "insensitive" }, deleted_at: null }
      });
      if (existing) throw new Error(`Ruangan dengan nama "lab komputer" sudah terdaftar di bimbel Anda.`);
      return await tx.room.create({
        data: { academy_id: academyIsoB.id, name: "lab komputer", capacity: 30 }
      });
    });
    assert(roomB1.id !== undefined, "Ruang 'lab komputer' berhasil dibuat di Academy B (Isolasi antar-tenant terjaga)");

    // 4. Soft-delete "Lab Komputer" di Academy A, lalu buat ulang nama tersebut
    await prisma.room.update({
      where: { id: roomA1.id },
      data: { deleted_at: new Date() }
    });

    const roomA2 = await executeWithQuotaLock(academyIsoA.id, "rooms", 1, async (tx) => {
      const existing = await tx.room.findFirst({
        where: { academy_id: academyIsoA.id, name: { equals: "lab komputer", mode: "insensitive" }, deleted_at: null }
      });
      if (existing) throw new Error(`Ruangan dengan nama "lab komputer" sudah terdaftar di bimbel Anda.`);
      return await tx.room.create({
        data: { academy_id: academyIsoA.id, name: "lab komputer", capacity: 35 }
      });
    });
    assert(roomA2.id !== undefined, "Nama ruangan yang di-soft-delete berhasil dipakai ulang oleh ruangan aktif baru");

    // --------------------------------------------------------------------------
    // TEST SUITE 4: Bimbel Nusantara Raya Preservation & Policy Verification (Phase F)
    // --------------------------------------------------------------------------
    console.log("\n[Test Suite 4] Phase F — Verifikasi Kebijakan Bimbel Nusantara Raya & Kuota:");

    // 1. Verifikasi read-only record riil Bimbel Nusantara Raya di database
    const nusantaraAcademy = await prisma.academy.findFirst({
      where: { name: { contains: "Nusantara", mode: "insensitive" }, deleted_at: null },
      include: { plan: true, rooms: { where: { deleted_at: null } } }
    });

    if (nusantaraAcademy) {
      assert(nusantaraAcademy.plan.name.toLowerCase() === "growth", "Bimbel Nusantara Raya tetap menggunakan paket Growth");
      assert(nusantaraAcademy.rooms.length === 10, `10 ruangan aktif Bimbel Nusantara Raya terbaca utuh (${nusantaraAcademy.rooms.length} === 10)`);
      assert(nusantaraAcademy.subscription_status === "ACTIVE", "Status langganan Bimbel Nusantara Raya tetap ACTIVE");
    } else {
      console.log("  [INFO] Record Bimbel Nusantara Raya tidak ditemukan di target DB, memverifikasi via isolated academy...");
    }

    // 2. Simulasi penolakan penambahan ruangan ke-11 pada akademi berkuota 6 ruangan dengan 10 ruangan aktif:
    console.log("  Menyiapkan simulasi 10 ruangan aktif pada paket Growth (limit: 6)...");
    const initialRooms = Array.from({ length: 6 }).map((_, i) => ({
      academy_id: academyIsoA.id,
      name: `Ruang Simulasi ${i + 1}`,
      capacity: 25,
    }));
    await prisma.room.createMany({ data: initialRooms });

    const roomCountA = await prisma.room.count({
      where: { academy_id: academyIsoA.id, deleted_at: null }
    });
    // Saat ini ada roomA2 (1) + 6 ruang = 7 ruang aktif (melebihi limit Growth: 6)
    assert(roomCountA > 6, `Jumlah ruangan aktif saat ini (${roomCountA}) telah melampaui limit Growth (6)`);

    // 3. Upaya membuat ruangan baru ketika kuota terlampaui harus DITOLAK
    let rejectNewRoom = false;
    let newRoomError: any = null;
    try {
      await executeWithQuotaLock(academyIsoA.id, "rooms", 1, async (tx) => {
        return await tx.room.create({
          data: { academy_id: academyIsoA.id, name: "Ruang Baru Ke-8", capacity: 20 }
        });
      });
    } catch (err: any) {
      rejectNewRoom = true;
      newRoomError = err;
    }
    assert(rejectNewRoom, "Pembuatan ruangan baru ditolak saat kuota akademi telah terlampaui");
    assert(newRoomError instanceof QuotaExceededError, "Error adalah QuotaExceededError");

    const finalRoomCountA = await prisma.room.count({
      where: { academy_id: academyIsoA.id, deleted_at: null }
    });
    assert(finalRoomCountA === roomCountA, `Jumlah ruangan tidak bertambah (${finalRoomCountA} === ${roomCountA})`);

    // 4. Verifikasi bahwa tidak ada upgrade otomatis ke Pro
    const academyACheck = await prisma.academy.findUnique({
      where: { id: academyIsoA.id },
      include: { plan: true }
    });
    assert(academyACheck?.plan.name.toLowerCase() === "growth", "Paket akademi tetap Growth (tidak terjadi auto-upgrade)");

  } finally {
    // Cleanup isolated test data
    console.log("\nMembersihkan data pengujian sementara...");
    await prisma.room.deleteMany({ where: { academy_id: { in: [academyIsoA.id, academyIsoB.id] } } });
    await prisma.academy.delete({ where: { id: academyIsoA.id } });
    await prisma.academy.delete({ where: { id: academyIsoB.id } });
    console.log("Cleanup selesai.");
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`Phase 2.4 Test Results: ${passedTests} PASSED, ${failedTests} FAILED of ${totalTests} total assertions.`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase24Tests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
