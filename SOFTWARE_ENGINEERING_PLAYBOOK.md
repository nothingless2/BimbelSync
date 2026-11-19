# Universal Software Engineering & Architecture Playbook
### Standard Blueprint & Golden Rules for Building Production-Grade Software

> **Tujuan Dokumen:**  
> Ini adalah buku panduan arsitektur rekayasa perangkat lunak universal (*Framework-Agnostic & Stack-Ready*). Dokumen ini dirancang sebagai referensi baku yang dapat disalin ke proyek perangkat lunak apa pun di masa depan (E-Commerce, Fintech, ERP, Booking Platform, Multi-Tenant SaaS, atau HealthTech) agar pengembang maupun agen AI membangun sistem dengan standar industri tertinggi: **aman dari *race condition*, cepat, idempoten, dan tidak mudah *crash* di produksi.**

---

## Daftar Isi
1. [Filosofi & Hirarki 4 Tingkat Rekayasa Software](#1-filosofi--hirarki-4-tingkat-rekayasa-software)
2. [Pilar 1: Tipifikasi Kuat & Kontrak Data Anti-Crash (TypeScript)](#2-pilar-1-tipifikasi-kuat--kontrak-data-anti-crash-typescript)
3. [Pilar 2: Asinkronitas & Model Eksekusi Non-Blocking](#3-pilar-2-asinkronitas--model-eksekusi-non-blocking)
4. [Pilar 3: Kontrol Konkurensi & Keamanan Transaksi Database](#4-pilar-3-kontrol-konkurensi--keamanan-transaksi-database)
5. [Pilar 4: Idempotensi (Pertahanan Eksekusi Dobel)](#5-pilar-4-idempotensi-pertahanan-eksekusi-dobel)
6. [Pilar 5: Kinerja Database & Integritas Relasi Data](#6-pilar-5-kinerja-database--integritas-relasi-data)
7. [Pilar 6: Performa Antarmuka & Reaktivitas Modern (UI/UX)](#7-pilar-6-performa-antarmuka--reaktivitas-modern-uiux)
8. [Pilar 7: Keandalan Sistem, Graceful Degradation & Observabilitas](#8-pilar-7-keandalan-sistem-graceful-degradation--observabilitas)

---

## 1. Filosofi & Hirarki 4 Tingkat Rekayasa Software

Sebuah aplikasi dikatakan siap produksi (*production-grade*) bukan hanya ketika kodenya berjalan di lingkungan lokal (*"it works on my machine"*), melainkan ketika sistem mampu bertahan dari lonjakan beban, koneksi terputus, klik beruntun dari pengguna, dan manipulasi data konkuren.

```
          ▲
         / \     Tingkat 4: ARCHITECT (Trade-offs, Skalabilitas, Indexing, Observabilitas, SPOF)
        /   \    Tingkat 3: SENIOR (Concurrency, Pessimistic Locking, ACID, Idempotency, Deadlock)
       /     \   Tingkat 2: INTERMEDIATE (Async/Await, Promise Lifecycle, Generics, Middleware)
      /_______\  Tingkat 1: JUNIOR (Sintaks Dasar, Scope, Closure, Immutability, DRY & KISS)
```

---

## 2. Pilar 1: Tipifikasi Kuat & Kontrak Data Anti-Crash (TypeScript)

### A. Aturan Penggunaan `interface` vs `type`
- **Gunakan `interface`** untuk mendefinisikan bentuk objek data domain, kontrak API, dan properti komponen:
  ```typescript
  export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null; // Wajib eksplisit null jika data opsional di database
    role: "ADMIN" | "MEMBER" | "GUEST"; // Literal Union: Anti-Typo
    createdAt: string;
  }
  ```
- **Gunakan `type`** untuk Union, tipe primitif custom, atau utility types:
  ```typescript
  export type PaymentMethod = "BANK_TRANSFER" | "E_WALLET" | "CREDIT_CARD";
  export type Result<T> = { success: true; data: T } | { success: false; error: string };
  ```

### B. Pertahanan Anti-Crash: Null Safety
Penyebab nomor satu web crash adalah `TypeError: Cannot read properties of undefined/null`.
- **Aturan:** Setiap properti yang nilainya bisa kosong di database **WAJIB** ditandai `| null`.
- **Defensive Rendering:** Selalu sediakan nilai fallback atau percabangan saat menampilkan data:
  ```tsx
  {user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
      {user.fullName.charAt(0)}
    </div>
  )}
  ```

### C. Pola Respon Tanpa Exception (*Discriminated Unions / Result Pattern*)
Hindari melempar error tak terduga (*uncaught exception*) pada alur bisnis biasa. Kembalikan objek seragam:
```typescript
type ActionResult<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: string; data?: never };

// Konsumsi yang 100% Type-Safe:
const res = await processOrder(orderId);
if (!res.success) {
  showNotification(res.error);
  return;
}
// Di sini TypeScript tahu pasti bahwa res.data ada dan valid!
console.log(res.data.receiptNumber);
```

---

## 3. Pilar 2: Asinkronitas & Model Eksekusi Non-Blocking

### A. Konsep Inti
- **Synchronous (Blocking):** Thread CPU berhenti mematung menunggu operasi I/O (jaringan/database). Seluruh server membeku.
- **Asynchronous (Non-Blocking):** Operasi I/O dilempar ke sistem operasi. Thread utama bebas melayani request pengguna lain.

### B. Mengapa `await` Berurutan, Bukan Paralel
Kata kunci `await` memerintahkan komputer untuk **menjeda alur di baris tersebut** sampai hasilnya siap, lalu lanjut ke baris berikutnya.
```typescript
// ⏳ Berurutan (Sequential): Tugas B butuh hasil dari Tugas A
const user = await getUserById(userId);
const orders = await getOrdersByUser(user.accountId); // Butuh user.accountId
```

### C. Tiga Pola Eksekusi Konkuren
1. **Pola Paralel Penuh (`Promise.all`) — Fail-Fast:**
   Gunakan jika beberapa tugas tidak saling membutuhkan dan **wajib sukses semua**:
   ```typescript
   // Kedua query dikirim serentak ke database (Hemat waktu hingga 50%)
   const [products, categories] = await Promise.all([
     getProducts(),
     getCategories(),
   ]);
   ```
2. **Pola Toleran Sebagian (`Promise.allSettled`) — Broadcast Safe:**
   Gunakan saat melakukan pengiriman massal (email, webhook, notifikasi push). Kegagalan 1 entitas tidak boleh membatalkan entitas lainnya:
   ```typescript
   const results = await Promise.allSettled(
     phoneNumbers.map((phone) => sendSms(phone, message))
   );
   ```
3. **Pembatalan Request Usang (`AbortController`):**
   Gunakan untuk membatalkan panggilan fetch lama saat pengguna mengetik kata kunci baru atau meninggalkan halaman:
   ```typescript
   const controller = new AbortController();
   fetch(`/api/search?q=${query}`, { signal: controller.signal });
   
   // Batalkan seketika jika query berubah:
   controller.abort();
   ```

---

## 4. Pilar 3: Kontrol Konkurensi & Keamanan Transaksi Database

### A. Bahaya *Race Condition* di Dunia Nyata
- **Kasus E-Commerce:** Stok produk sisa 1 barang. Dua pembeli menekan tombol "Beli" di detik yang sama. Keduanya membaca stok = 1, keduanya lolos, dan stok akhir menjadi minus -1.
- **Kasus Booking Kamar Hotel:** 2 tamu memesan kamar yang sama pada detik yang sama.
- **Kasus Dompet Digital:** Saldo Rp 100.000 ditarik di dua ATM berbeda di milidetik yang sama.

### B. Solusi: *Pessimistic Locking* (`SELECT ... FOR UPDATE`)
Kunci baris data di level database sehingga transaksi kedua dipaksa antre di pintu sampai transaksi pertama selesai:

```typescript
// Contoh Transaksi Kunci Stok Produk
await db.$transaction(async (tx) => {
  // 🔒 1. Kunci baris produk secara eksklusif
  const product = await tx.$queryRaw`
    SELECT id, stock FROM "Product" 
    WHERE id = ${productId} 
    FOR UPDATE
  `;

  // 🛑 2. Verifikasi ketersediaan di dalam kondisi terkunci
  if (product.stock < requestedQty) {
    throw new Error("Stok barang habis atau sedang dipesan pengguna lain.");
  }

  // 📝 3. Kurangi stok dan buat pesanan
  await tx.product.update({
    where: { id: productId },
    data: { stock: product.stock - requestedQty },
  });

  await tx.order.create({ data: { productId, qty: requestedQty } });
});
```

### C. Hukum Transaksi ACID
Seluruh mutasi yang melibatkan lebih dari satu entitas wajib dibungkus dalam transaksi database atomik:
- **Atomicity:** Semua berhasil atau semua dibatalkan (*All or Nothing*).
- **Consistency:** Skema data dan aturan validasi tidak boleh dilanggar.
- **Isolation:** Operasi transaksi lain tidak dapat mengintip data setengah jadi.
- **Durability:** Data yang sudah di-commit dijamin aman di penyimpanan fisik.

### D. Pencegahan *Deadlock* (Saling Kunci)
Jika sebuah alur butuh mengunci beberapa tabel, **selalu kunci dengan urutan yang sama** di seluruh sistem (misal: selalu urut kunci `Akun`, baru kemudian `Transaksi`).

---

## 5. Pilar 4: Idempotensi (Pertahanan Eksekusi Dobel)

> **Prinsip:** Sebuah operasi yang dipanggil berkali-kali secara tidak sengaja harus menghasilkan dampak yang sama persis seperti dipanggil 1 kali.

### Lapis 1 (Frontend): Kunci Tombol & State Guard
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleCheckout = async () => {
  if (isSubmitting) return; // 🛑 Blokir klik susulan
  setIsSubmitting(true);
  try {
    await submitOrder();
  } finally {
    setIsSubmitting(false);
  }
};

<button disabled={isSubmitting} className="disabled:opacity-50">
  {isSubmitting ? "Memproses Pesanan..." : "Bayar Sekarang"}
</button>
```

### Lapis 2 (Backend): *State Guard & Idempotency Key*
1. **State Guard:** Periksa status data sebelum melakukan perubahan.
   ```typescript
   const order = await db.order.findUnique({ where: { id: orderId } });
   if (order.status === "PAID") {
     return { message: "Pesanan ini sudah dibayar sebelumnya." };
   }
   ```
2. **Idempotency Key (Fintech & Webhook):**  
   Simpan ID unik transaksi (*Idempotency-Key*) di database/cache dengan waktu kedaluwarsa. Jika request dengan key yang sama masuk kembali, langsung kembalikan respon sebelumnya tanpa memotong saldo ulang.

---

## 6. Pilar 5: Kinerja Database & Integritas Relasi Data

### A. Pencegahan *N+1 Query Problem*
- **Gejala Buruk:** Mengambil 100 data induk, lalu di dalam perulangan melakukan query ke data anak sebanyak 100 kali (Total 101 kali query).
- **Standar Eager Loading:** Selalu gunakan klausa `include`, `select` bersarang, atau `JOIN` SQL sehingga diselesaikan dalam 1 operasi batch query:
  ```typescript
  // ✅ Mengambil order sekaligus pembeli dan detail barangnya dalam 1 batch
  const orders = await db.order.findMany({
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });
  ```

### B. Strategi Indexing Database
- Berikan index B-Tree pada kolom yang sering digunakan di klausa `WHERE`, `JOIN`, dan `ORDER BY` (seperti `user_id`, `created_at`, `status`).
- **Composite Index:** Jika query sering memfilter 2 kolom sekaligus (misal: `tenant_id` dan `deleted_at`), buat index gabungan `@@index([tenant_id, deleted_at])` untuk mempercepat query dari hitungan ratusan milidetik menjadi hitungan mikrodetik.

### C. *Soft Delete* vs *Hard Delete*
Dalam sistem bisnis, finansial, dan audit, **pantang menghapus baris data secara permanen (`DELETE`)**:
- Menghapus data fisik merusak integritas relasi foreign key dan menghancurkan laporan historis.
- Gunakan kolom penanda: `deleted_at: DateTime?`.
- Seluruh query umum wajib menyertakan filter: `where: { deleted_at: null }`.

---

## 7. Pilar 6: Performa Antarmuka & Reaktivitas Modern (UI/UX)

### A. Streaming SSR & `<Suspense>`
Jangan biarkan pengguna melihat layar putih kosong saat data lambat sedang dimuat:
- Pecah antarmuka: tampilkan kerangka navigasi dan header seketika.
- Bungkus komponen yang lambat dengan `<Suspense fallback={<SkeletonLoader />}>`.

### B. *Debouncing* pada Input Pencarian
Cegah banjir request ke server saat pengguna mengetik di input pencarian:
```typescript
// Tunda eksekusi selama 300ms setelah pengguna berhenti mengetik
useEffect(() => {
  const handler = setTimeout(() => {
    executeSearch(searchTerm);
  }, 300);

  return () => clearTimeout(handler);
}, [searchTerm]);
```

### C. *Optimistic UI*
Untuk aksi sederhana (seperti tombol Like, Bookmark, atau Toggle Status Hadir):
- Perbarui antarmuka di layar seketika (0 milidetik).
- Kirim request mutasi di latar belakang.
- Jika server gagal, kembalikan (*rollback*) antarmuka ke keadaan semula dan tampilkan pesan error.

---

## 8. Pilar 7: Keandalan Sistem, Graceful Degradation & Observabilitas

### A. *Graceful Degradation* (Ketahanan Sistem terhadap Kegagalan Parsial)
Kegagalan pada komponen sekunder (layanan analitik, notifikasi WhatsApp, log audit) **TIDAK BOLEH** menggagalkan transaksi bisnis utama:
```typescript
try {
  // Transaksi Utama: Wajib Sukses
  await processPayment();
} catch (error) {
  throw error; // Rollback jika transaksi utama gagal
}

try {
  // Proses Sekunder: Jangan gagalkan pembayaran jika email gagal terkirim
  await sendReceiptEmail();
} catch (emailErr) {
  console.error("Gagal mengirim email tanda terima:", emailErr);
}
```

### B. Pemisahan Beban Komputasi (*Background Jobs & Queues*)
Proses berat (pembuatan laporan PDF bulanan, rekonsiliasi data, kirim blast email ke 10.000 user) **DILARANG** diproses di dalam siklus HTTP request pengguna karena batas timeout browser (15-30 detik).
- Gunakan Worker / Cron Job terisolasi.
- Lindungi endpoint cron dengan secret key: `Authorization: Bearer CRON_SECRET`.

### C. Observabilitas & *Audit Trail*
Setiap perubahan pada entitas sensitif (uang, hak akses, status langganan, hapus data) harus meninggalkan jejak digital yang tidak bisa dipalsukan:
- **Siapa** yang mengubah? (`userId` dari sesi terotentikasi).
- **Kapan** diubah? (`timestamp`).
- **Apa** aksinya? (`action`, nilai sebelum vs nilai sesudah).
- **Dari mana** asalnya? (`ip_address`, `user_agent`).

### D. Skalabilitas Horizontal (*Stateless Session*)
- Utamakan penggunaan token terenkripsi stateless (seperti JWT di cookie `HttpOnly`) daripada sesi stateful berbasis memori server lokal.
- Ini memungkinkan aplikasi di-scale menjadi puluhan container/server di balik *Load Balancer* tanpa risiko pengguna tiba-tiba ter-logout.

---

## Ringkasan Standar Evaluasi Kode (*Code Review Checklist*)

Sebelum meluncurkan fitur apa pun ke lingkungan produksi, pastikan telah lolos 7 pertanyaan audit berikut:

1. [ ] **Type-Safe:** Apakah seluruh input, output, dan parameter memiliki tipe data eksplisit tanpa `any`?
2. [ ] **Null-Safe:** Apakah semua properti opsional sudah diberi penanganan fallback dan tidak berasumsi data selalu ada?
3. [ ] **Concurrency-Safe:** Apakah operasi yang melibatkan kuota, stok, atau saldo sudah dilindungi *Pessimistic Lock* (`FOR UPDATE`)?
4. [ ] **Idempotent:** Apakah tombol memiliki proteksi anti-dobel klik dan backend memiliki pengecekan status awal?
5. [ ] **No N+1 Query:** Apakah seluruh query relasional menggunakan batching / eager loading (`include`/`JOIN`)?
6. [ ] **Multi-Tenant Clean:** Apakah query data sudah terkunci pada tenant pengakses tanpa celah kebocoran data?
7. [ ] **Resilient:** Apakah proses sekunder (email/log) tidak membatalkan transaksi utama jika terjadi kegagalan jaringan?
