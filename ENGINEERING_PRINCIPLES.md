# BimbelSync — Advanced Software Engineering & Architecture Guide

Dokumen panduan komprehensif mengenai prinsip rekayasa perangkat lunak modern, arsitektur sistem *multi-tenant*, kontrol konkurensi, keamanan transaksi finansial, dan standar penulisan kode berbasis **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **PostgreSQL (Prisma ORM)**.

Dokumen ini dirancang sebagai acuan standar rekayasa (*gold standard*) bagi setiap pengembang dan agen AI yang bekerja pada codebase **BimbelSync**.

---

## Daftar Isi
1. [Hirarki 4 Tingkat Software Engineer](#1-hirarki-4-tingkat-software-engineer)
2. [Pilar 1: Tipifikasi Kuat & Kontrak Data (TypeScript)](#2-pilar-1-tipifikasi-kuat--kontrak-data-typescript)
3. [Pilar 2: Asinkronitas & Model Eksekusi Non-Blocking](#3-pilar-2-asinkronitas--model-eksekusi-non-blocking)
4. [Pilar 3: Keamanan Konkurensi & Integritas Transaksi Database](#4-pilar-3-keamanan-konkurensi--integritas-transaksi-database)
5. [Pilar 4: Idempotensi (Pertahanan Dobel Transaksi)](#5-pilar-4-idempotensi-pertahanan-dobel-transaksi)
6. [Pilar 5: Performa Antarmuka Modern (Next.js 16 & React 19)](#6-pilar-5-performa-antarmuka-modern-nextjs-16--react-19)
7. [Pilar 6: Kinerja Database & Arsitektur Multi-Tenant](#7-pilar-6-kinerja-database--arsitektur-multi-tenant)
8. [Pilar 7: Keandalan Sistem, Graceful Degradation & Observabilitas](#8-pilar-7-keandalan-sistem-graceful-degradation--observabilitas)

---

## 1. Hirarki 4 Tingkat Software Engineer

Dalam rekayasa perangkat lunak enterprise, keahlian dibedakan menjadi 4 tingkatan kompetensi:

```
          ▲
         / \     Tingkat 4: ARCHITECT (Trade-offs, Skalabilitas, Indexing, Observabilitas, SPOF)
        /   \    Tingkat 3: SENIOR (Concurrency, Pessimistic Locking, ACID, Idempotency, Deadlock)
       /     \   Tingkat 2: INTERMEDIATE (Async/Await, Promise, Generics, Serialization, Middleware)
      /_______\  Tingkat 1: JUNIOR (Sintaks Dasar, Scope, Closure, Immutability, DRY & KISS)
```

| Tingkatan | Fokus Utama | Pertanyaan yang Diajukan |
| :--- | :--- | :--- |
| **Tingkat 1: Junior** | Sintaks & Logika Dasar | *"Bagaimana cara membuat fungsi ini berjalan?"* |
| **Tingkat 2: Intermediate** | Aliran Data & Tipe Data | *"Bagaimana data mengalir dari database sampai ke layar client secara aman tanpa error tipe?"* |
| **Tingkat 3: Senior** | Keandalan & Konkurensi | *"Apa yang terjadi jika 2 user mengklik tombol ini di milidetik yang sama atau koneksi internet putus?"* |
| **Tingkat 4: Architect** | Skalabilitas & Trade-Off | *"Bagaimana sistem ini bertahan saat melayani 50.000 user, dan apa risiko/biaya dari keputusan arsitektur ini?"* |

---

## 2. Pilar 1: Tipifikasi Kuat & Kontrak Data (TypeScript)

### A. Kontrak Objek (`interface` vs `type`)
- Gunakan **`interface`** untuk mendefinisikan bentuk data entitas dan props komponen React (lebih mudah di-extend).
- Gunakan **`type`** untuk kombinasi pilihan khusus (*Union Types*), tipe fungsi, atau hasil kalkulasi komputasi.

```typescript
// Kontrak data kuis yang dikirim dari server ke antarmuka client
export interface QuizItem {
  id: string;
  title: string;
  description: string | null; // Nullable: eksplisit bisa bernilai null di database
  durationMinutes: number;
  evaluationType?: "EXAM" | "HOMEWORK" | "MONTHLY_REPORT"; // Optional & Literal Union
  isPublished: boolean;
  totalQuestions: number;
  avgScore: number | null;
}
```

### B. Pertahanan Anti-Crash: Null Safety (`| null` dan `?`)
Penyebab utama aplikasi crash di browser adalah `TypeError: Cannot read properties of undefined/null`.
- Kolom yang di database bersifat opsional **WAJIB** bertipe `Type | null`.
- TypeScript akan memaksa pengembang menulis pengecekan (*Defensive Guard*) sebelum data ditampilkan:
```tsx
{quiz.description ? (
  <p className="text-slate-600">{quiz.description}</p>
) : (
  <p className="text-slate-400 italic">Belum ada deskripsi.</p>
)}
```

### C. Literal Union Types (Anti-Typo)
Jangan gunakan `string` bebas untuk data status atau peranan (*role*). Gunakan himpunan nilai pasti:
```typescript
export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "UNRECORDED";
export type UserRole = "SUPERADMIN" | "ADMIN" | "TUTOR" | "STUDENT";
```

### D. Discriminated Unions pada Autentikasi & Server Actions
Untuk mengembalikan hasil operasi yang bisa sukses atau gagal tanpa melempar runtime exception liar:
```typescript
export type AuthResult = 
  | { error: string; session?: never }
  | { session: StudentSession; error?: never };

// Pengecekan aman di halaman:
const auth = await requireStudentSession(tenantSlug);
if ('error' in auth) {
  redirect(`/${tenantSlug}/student/login`);
}
// Di bawah baris ini, TypeScript otomatis menjamin auth.session 100% ada:
console.log(auth.session.studentName);
```

---

## 3. Pilar 2: Asinkronitas & Model Eksekusi Non-Blocking

### A. Mental Model: Synchronous vs Asynchronous
- **Synchronous (Blocking):** Thread utama berhenti dan membeku menunggu operasi I/O selesai. Pengguna lain tidak bisa mengakses server.
- **Asynchronous (Non-Blocking):** Operasi I/O (database, jaringan, file) dilempar ke sistem operasi latar belakang. Thread JavaScript tetap bebas melayani request pengguna lain.

### B. Cara Kerja `async` dan `await`
- `async` adalah penanda bahwa fungsi menghasilkan sebuah `Promise`.
- `await` adalah instruksi untuk **menjeda alur di baris tersebut secara berurutan** (*Sequential*) sampai Promise selesai, **tanpa membekukan server**.

```typescript
// Alur Berurutan (Sequential): Baris 2 baru jalan setelah Baris 1 selesai!
export default async function SchedulesPage({ params }: PageProps) {
  const { tenantSlug } = await params; // 1. Tunggu params
  const schedules = await prisma.schedule.findMany({ // 2. Baru query DB setelah punya slug
    where: { academy: { slug: tenantSlug } }
  });
  return <SchedulesClientPage schedules={schedules} />;
}
```

### C. Pola Konkurensi: Sequential vs Parallel vs Broadcast
1. **Sequential (`await a; await b;`):** Gunakan ketika tugas kedua **bergantung** pada hasil tugas pertama.
2. **Parallel (`Promise.all`):** Gunakan ketika tugas independen dan aman dibatalkan bersamaan jika salah satu gagal (*Fail-Fast*). Menghemat hingga 50-70% waktu tunggu.
   ```typescript
   // Diambil serentak di latar belakang:
   const [students, rooms] = await Promise.all([
     prisma.student.findMany({ where: { academy_id } }),
     prisma.room.findMany({ where: { academy_id } }),
   ]);
   ```
3. **Tolerant Broadcast (`Promise.allSettled`):** Gunakan saat mengirim notifikasi/email massal ke puluhan user. Kegagalan pada 1 user tidak boleh membatalkan pengiriman ke user lain.

---

## 4. Pilar 3: Keamanan Konkurensi & Integritas Transaksi Database

### A. Bahaya *Race Condition* pada Kuota
**Skenario Kasus:** Paket Starter kuota 50 siswa. Saat ini terdaftar 49 siswa (sisa 1 kursi).
Admin A mendaftarkan Budi, Admin B mendaftarkan Siti di detik yang sama.
Tanpa proteksi konkurensi:
- Keduanya membaca jumlah siswa = 49.
- Keduanya lolos validasi `49 + 1 <= 50`.
- Keduanya melakukan `INSERT` $\rightarrow$ Total siswa menjadi 51 (**Bocor Kuota!**).

### B. Solusi: *Pessimistic Locking* (`SELECT ... FOR UPDATE`)
Di BimbelSync, seluruh mutasi kuota (siswa, staf, ruangan) wajib dibungkus dalam `executeWithQuotaLock` ([`src/lib/subscription.ts`](file:///d:/bimbelsync/src/lib/subscription.ts)):

```typescript
// PostgreSQL Row-Level Lock pada baris Academy
const lockedAcademies = await tx.$queryRaw<Array<{ id: string; plan_id: string }>>`
  SELECT id, plan_id FROM "Academy" 
  WHERE id = ${academyId}::uuid AND deleted_at IS NULL 
  FOR UPDATE
`;
```
- Transaksi kedua otomatis ditahan (*serialized waiting*) oleh PostgreSQL sampai transaksi pertama melakukan commit/rollback.
- Transaksi kedua membaca jumlah siswa terbaru (50 orang), mendeteksi kuota habis, dan melempar `QuotaExceededError`. Kuota terjamin konsisten!

### C. Hukum Transaksi ACID (`prisma.$transaction`)
Setiap mutasi multi-entitas (misal: simpan siswa + daftarkan program + terbitkan tagihan SPP) wajib dibungkus dalam transaksi atomik:
- **Atomicity:** Jika pembuatan invoice gagal, entitas siswa otomatis dibatalkan (*Rollback*).
- **Consistency:** Validasi integritas skema (unik, foreign key) terpenuhi.
- **Isolation:** Transaksi lain tidak melihat data setengah jadi (*Dirty Read*).
- **Durability:** Data yang sudah committed tersimpan permanen di penyimpanan persisten.

---

## 5. Pilar 4: Idempotensi (Pertahanan Dobel Transaksi)

Idempoten memastikan sebuah aksi menghasilkan status akhir yang sama meskipun dieksekusi berkali-kali.

### Lapis 1: Kunci Frontend (Tombol Form)
Setiap tombol aksi wajib memiliki state `isLoading`/`isPending`, otomatis di-`disabled`, dan menampilkan spinner visual:
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  if (isLoading) return; // 🛑 Blokir klik susulan
  setIsLoading(true);
  try {
    await submitAction();
  } finally {
    setIsLoading(false);
  }
};

<button disabled={isLoading} className="disabled:opacity-50 flex items-center gap-2">
  {isLoading ? <Loader2 className="animate-spin" /> : "Simpan"}
</button>
```

### Lapis 2: *State Guard* Backend
Server Action wajib memeriksa status awal entitas sebelum mutasi:
```typescript
// src/app/superadmin/(dashboard)/billing/actions.ts
const invoice = await prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
if (invoice.payment_status === "PAID") {
  return { error: "Invoice ini sudah berstatus Lunas." }; // Langsung tolak klik kedua
}
```

---

## 6. Pilar 5: Performa Antarmuka Modern (Next.js 16 & React 19)

### A. Streaming SSR & `<Suspense>`
Next.js App Router memecah halaman menjadi potongan-potongan kecil (*streaming chunks*):
1. **Level Halaman Otomatis:** Sediakan file konvensi `loading.tsx` yang memanggil Skeleton UI (misal: `src/app/[tenantSlug]/dashboard/loading.tsx`).
2. **Level Komponen Granular:** Bungkus komponen lambat dengan `<Suspense fallback={<Skeleton />}>` agar bagian header/navigasi yang cepat bisa tampil dalam hitungan 0.05 detik.

### B. *Debouncing* pada Input Pencarian
Jangan mengirim query database pada setiap ketukan huruf pengguna. Berikan jeda waktu (300ms) menggunakan timer dan cleanup function:
```tsx
// src/components/search-bar.tsx
useEffect(() => {
  const handler = setTimeout(() => {
    // Jalankan pencarian setelah user berhenti mengetik 300ms
    router.replace(`${pathname}?q=${encodeURIComponent(query)}`);
  }, 300);

  // Batalkan timer lama jika ada huruf baru yang diketik sebelum 300ms
  return () => clearTimeout(handler);
}, [query]);
```

### C. *Optimistic UI* (`useOptimistic`)
Ubah tampilan antarmuka secara instan (0ms) seolah-olah server sudah berhasil, sembari mengirim request di latar belakang. Jika terjadi kegagalan jaringan, antarmuka otomatis kembali (*rollback*) ke kondisi asal.

---

## 7. Pilar 6: Kinerja Database & Arsitektur Multi-Tenant

### A. Pencegahan Bahaya *N+1 Query Problem*
DILARANG mengeksekusi query database di dalam perulangan (`for`, `map`, `forEach`).
- **Salah:** Mengambil 50 siswa, lalu di dalam perulangan melakukan `prisma.enrollment.findFirst` sebanyak 50 kali (total 51 query!).
- **Benar:** Gunakan Eager Loading relasional (`include` atau `select` bersarang) agar diselesaikan dalam 1 kali SQL JOIN:
```typescript
const students = await prisma.student.findMany({
  where: { academy_id: session.academy_id, deleted_at: null },
  include: {
    enrollments: {
      include: { program: true }
    }
  }
});
```

### B. Isolasi Ketat Multi-Tenant (Pencegahan *Tenant Leakage*)
Setiap query database pada portal tenant **WAJIB** menyertakan `academy_id` yang diambil dari sesi terverifikasi (`session.academy_id`):
```typescript
// ❌ RAWAN KEBOCORAN DATA:
const data = await prisma.invoice.findMany();

// ✅ MULTI-TENANT ISOLATED:
const data = await prisma.invoice.findMany({
  where: {
    academy_id: session.academy_id,
    deleted_at: null,
  }
});
```

### C. Integritas Data & *Soft Delete*
Dalam sistem finansial dan akademik B2B SaaS, pantang menghapus baris data secara fisik (`DELETE`):
- Menghapus fisik akan mematahkan relasi histori transaksi dan kwitansi akuntansi.
- Gunakan stempel lunak: `data: { deleted_at: new Date() }`.
- Seluruh query filter wajib menyertakan: `deleted_at: null`.

---

## 8. Pilar 7: Keandalan Sistem, Graceful Degradation & Observabilitas

### A. *Graceful Degradation* (Ketahanan Sistem)
Kegagalan pada komponen sekunder/eksternal **TIDAK BOLEH** menggagalkan alur bisnis utama:
```typescript
// src/lib/audit.ts
try {
  await prisma.auditLog.create({ ... });
} catch (error) {
  console.error("Gagal mencatat audit log:", error);
  // Jangan re-throw! Simpan siswa/bayar SPP tetap harus sukses.
}
```
Untuk penyedia layanan pihak ketiga (email/SMS/WhatsApp), sediakan alur fallback multi-tingkat (misal: REST API Brevo $\rightarrow$ SMTP Relay $\rightarrow$ Development Log).

### B. Pemisahan Beban Komputasi (*Background Jobs & Cron*)
Tugas massal ribuan data (seperti penerbitan tagihan SPP bulanan atau blast pengingat jatuh tempo) dilarang dieksekusi di dalam siklus HTTP request pengguna:
- Tempatkan di rute terisolasi `src/app/api/cron/*`.
- Lindungi dengan header otorisasi ketat: `Authorization: Bearer CRON_SECRET`.

### C. *Observability & Audit Trail*
Aktivitas sensitif (penghapusan invoice, pembatalan pendaftaran, perubahan nilai rapor, atau penggantian paket bimbel) wajib mencatat jejak audit ke tabel `AuditLog`:
- Siapa yang mengubah? (`staff_id` / `superadmin_id`)
- Aksi apa? (`CREATE`, `UPDATE`, `DELETE`, `VERIFY`)
- Entitas apa dan rincian perubahan data lama vs baru.

### D. Skalabilitas Horizontal (*Stateless JWT Session*)
BimbelSync menggunakan sesi terenkripsi JWT (HS256 via `jose`) yang disimpan pada cookie `HttpOnly` (`bimbelsync_session`):
- Server tidak memerlukan dependensi eksternal stateful (seperti Redis) untuk memverifikasi siapa yang sedang login.
- Sistem siap di-scale secara horizontal ke beberapa container/server di balik *Load Balancer* tanpa risiko sesi pengguna terputus.

---

> **Komitmen Rekayasa:**  
> Seluruh kode baru yang ditambahkan ke repositori **BimbelSync** wajib mematuhi standar arsitektur dan keselamatan data pada dokumen ini tanpa pengecualian.
