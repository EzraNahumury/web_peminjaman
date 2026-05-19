# PLAN.md — Eksekusi Bertahap FASKO (Revisi 1)

> Revisi setelah audit langsung terhadap RULES §0–§10 pada 2026-05-18.
> Asumsi sebelumnya ("logic sudah jalan") TIDAK benar — banyak gap signifikan
> di layer logic. Plan diurutkan: **logic dulu, baru UI**.
>
> User sudah memberi izin: schema database, server actions, dan middleware
> boleh diubah. Tidak perlu konfirmasi per perubahan.

---

## A. RINGKASAN GAP HASIL AUDIT

Tabel di bawah ini adalah temuan inti, urut dari paling kritis.

| #   | Area (RULES §)               | Gap                                                                                              | Severity |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| G1  | §4.7 Registration            | Tidak ada kolom `is_active` di tabel `users`. Pengurus baru langsung bisa login.                  | CRITICAL |
| G2  | §4.1 Middleware              | `proxy.ts` hanya cek `session?.userId`, tidak enforce role per prefix path & tidak cek `is_active`. | CRITICAL |
| G3  | §4.3 Validation chain        | Tidak ada `activity_scope` (UNIVERSITAS/FAKULTAS). Routing WR3 vs WD3 tidak dipisah.              | CRITICAL |
| G4  | §4.4 Overlap detection       | `BLOCKING_SQL` di `lib/availability.ts` kurang status: `SUBMITTED`, `WAITING_SURAT`, `REVISION_REQUESTED` tidak diblok → potensi double booking. | CRITICAL |
| G5  | §4.5 Priority scheduling     | Tidak ada `PRIORITY_LEVELS`, `activity_level`, `calculatePriorityScore`, `resolveConflict`, aging. 0% implementasi. | HIGH     |
| G6  | §4.6 Notification dispatch   | `lib/notifications.ts` hanya tulis ke DB. Tidak ada WA (Baileys) dan Email (Nodemailer).         | HIGH     |
| G7  | §4.9 Admin decision          | Hanya 3 dari 5 opsi (APPROVE/REJECT/REQUEST_REVISION). `OFFER_ALTERNATIVE` & `PENDING` tidak ada. | MEDIUM   |
| G8  | §4.2 Status enum naming      | Reality: 12 status (`SUBMITTED`, `WAITING_*`, `REJECTED_BY_*`, `WAITING_SURAT`, `REVISION_REQUESTED`, ...). RULES: 8 status (`PENDING_*`). Perlu putuskan: align RULES ke reality atau sebaliknya. | DECISION |
| G9  | §4.1 Role naming             | `PENGURUS` vs RULES `pengurus_ormawa`; `ADMIN_UNIT` vs `admin_biro`; `SUPER_ADMIN` vs `super_admin_it`. | DECISION |
| G10 | §4.8 Bureau codes            | `BIRO_I/BIRO_IV` vs RULES `BIRO_1/BIRO_4`.                                                       | DECISION |
| G11 | §9 Timezone                  | Tidak ada `date-fns-tz`. `lib/db.ts` pakai `timezone: 'local'`. Tidak eksplisit Asia/Jakarta.   | MEDIUM   |
| G12 | §9 Pagination                | Semua query list tanpa `LIMIT/OFFSET`. Tabel `RequestTable` mengandalkan client-side full fetch. | MEDIUM   |
| G13 | §10 Schema naming            | Field tabel camelCase (`createdAt`, `userId`) — RULES wajib `snake_case`. Soft delete (`deleted_at`) tidak ada. | DECISION |
| G14 | §0 Stack                     | `mysql2`+`jose` vs RULES Prisma+NextAuth+Baileys+Nodemailer.                                     | DECISION |
| G15 | §4.1 RBAC di action          | `requireRole(...)` ada (bagus). Tapi `getRequestsForRole` di `approvals.ts` tidak cek role pemanggil. | LOW      |
| G16 | §0 Folder structure          | Flat `app/`, `components/`, `lib/`, `types/` di root. RULES: `src/features/<feature>/`.          | DECISION |

Total: **6 gap kritis/tinggi yang harus diperbaiki**, **6 keputusan desain** yang
butuh kesepakatan, **4 perbaikan medium/low**.

---

## B. KEPUTUSAN YANG PERLU DIAMBIL DULU (sebelum Fase Eksekusi)

Beberapa gap di atas adalah **konflik antara RULES dan reality**. Tidak ada
fase eksekusi yang aman tanpa keputusan ini lebih dulu, karena memilih satu
arah mengubah scope perubahan secara drastis.

### D1. Status enum: align ke mana? (G8)
- **Opsi A (rekomendasi)**: pertahankan 12 status yang sudah jalan, update RULES §4.2 agar match.
  Reality lebih granular (membedakan siapa yang reject, ada step surat, ada revision request).
  Konsekuensi: hanya update RULES.md. Kode hampir tidak berubah.
- **Opsi B**: paksa kode ke 8 status RULES. Konsekuensi: migrasi DB besar, kehilangan
  metadata "rejected by whom", dan harus invent ulang konsep step surat.

### D2. Role naming: align ke mana? (G9)
- **Opsi A (rekomendasi)**: pertahankan nama saat ini (`PENGURUS`, `ADMIN_UNIT`, `SUPER_ADMIN`),
  update RULES §4.1.
- **Opsi B**: rename di DB enum + semua callsite. Berisiko miss-replace.

### D3. Bureau codes: `BIRO_I` atau `BIRO_1`? (G10)
- **Opsi A (rekomendasi)**: pertahankan `BIRO_I/BIRO_IV` (romawi) — konsisten dengan "Biro III", "WR3".
- **Opsi B**: rename ke arab numeral seperti RULES.

### D4. Schema naming: camelCase vs snake_case (G13)
- **Opsi A (rekomendasi)**: pertahankan camelCase (sudah konsisten di seluruh kode).
  Update RULES §10.
- **Opsi B**: migrasi ke snake_case. Semua server action & query harus diupdate.
  Risiko bug tinggi.

### D5. Stack: tetap mysql2/jose, atau migrasi ke Prisma/NextAuth? (G14)
- **Opsi A (rekomendasi untuk skripsi)**: tetap mysql2 + jose. Update RULES §0.
  Stabil, sudah jalan, tidak menambah unknown.
- **Opsi B**: migrasi ke Prisma + NextAuth. Mahal, butuh re-test semua flow.

### D6. Folder structure: flat atau `src/features/*`? (G16)
- **Opsi A (rekomendasi untuk skripsi)**: pertahankan flat. Update RULES §3.
- **Opsi B**: migrasi struktur. Banyak import path berubah; lakukan setelah skripsi siap demo.

### D7. WA + Email dispatch: implementasi atau cukup DB? (G6)
- **Opsi A**: implementasi penuh Baileys.js + Nodemailer sesuai RULES §4.6.
  Tambah ~2-3 hari kerja + setup session WA.
- **Opsi B (rekomendasi jika waktu sempit)**: integrasi Nodemailer saja dulu (lebih mudah),
  WA dijadikan TODO/skripsi extension.
- **Opsi C**: pertahankan DB-only dengan notifikasi in-app, update RULES §4.6.

> **TINDAKAN**: Jawab D1–D7 sebelum Fase 1 mulai. Jawaban menentukan apakah
> "perbaikan" berupa kode (Opsi B) atau RULES (Opsi A).

---

## C. FASE EKSEKUSI (LOGIC DULU)

### Fase 1 — Stop the Bleeding: Gap Kritis (G1, G2, G4)

**Tujuan**: Menutup celah keamanan & data inkonsisten yang aktif sekarang.

1. **G1 — Aktivasi akun (`is_active`)**
   - Migration 005: `ALTER TABLE users ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT FALSE AFTER role;`
     - Existing user (super admin, biro): set `isActive = TRUE` lewat seed/manual.
     - Pengurus baru: default `FALSE`.
   - Update `types/index.ts` (`User.isActive: boolean`).
   - `app/actions/auth.ts` → `login()`: tolak login bila `!user.isActive`.
   - `app/actions/auth.ts` → `registerPengurus()`: tetap insert, tapi tampilkan
     pesan "Menunggu aktivasi SuperAdmin" di halaman register success.
   - SuperAdmin dashboard: tambah panel "Akun menunggu aktivasi" dengan tombol Activate
     (Server Action `activateUser(userId)` dengan `requireRole('SUPER_ADMIN')`).
   - Notifikasi ke SuperAdmin saat ada user baru register.

2. **G2 — Middleware role-based**
   - `proxy.ts` saat ini hanya cek login. Tambahkan:
     - Cek `session.isActive` (perlu disuntik ke session payload — update `createSession`).
     - Cek prefix path vs role:
       - `/dashboard/pengurus/**` → `PENGURUS`
       - `/dashboard/biro-iii/**` → `BIRO_III`
       - `/dashboard/wr3-wd3/**` → `WR3_WD3`
       - `/dashboard/admin-unit/**` → `ADMIN_UNIT`
       - `/dashboard/super-admin/**` → `SUPER_ADMIN` (route belum ada, tambah saat
         implementasi panel aktivasi user).
     - Mismatch → redirect ke `dashboardPathForRole(session.role)`.
   - Catatan: `verifySession`/`requireRole` di server action **tetap dipertahankan**
     sebagai defense-in-depth (middleware bisa dibypass di edge cases).

3. **G4 — Overlap detection status filter**
   - `lib/availability.ts`: ganti `BLOCKING_SQL` jadi:
     ```ts
     const BLOCKING_SQL = "('APPROVED','SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_SURAT','WAITING_ADMIN_UNIT','REVISION_REQUESTED')"
     ```
   - Sinkronkan `BLOCKING_STATUSES` di `types/index.ts` dengan list yang sama.
   - Test manual: dua pengurus submit overlap → pengurus kedua harus ditolak
     bahkan saat pengurus pertama masih di status `WAITING_SURAT`.

**Kriteria selesai Fase 1**:
- Pengurus baru tidak bisa login sampai diaktivasi.
- User dengan role salah tidak bisa akses path role lain (bukan hanya redirect
  ke `/dashboard`, melainkan ke dashboard rolenya sendiri).
- Tidak ada celah double booking lewat status transisi `WAITING_SURAT` /
  `REVISION_REQUESTED`.
- `npm run build` sukses, manual smoke test pass.

---

### Fase 2 — Validation Chain & Activity Scope (G3)

**Tujuan**: implementasi routing WR3 vs WD3 berdasarkan lingkup kegiatan.

1. Migration 006: tambah kolom ke `facility_requests`:
   ```sql
   ALTER TABLE facility_requests
     ADD COLUMN activityScope ENUM('UNIVERSITAS','FAKULTAS') NOT NULL DEFAULT 'UNIVERSITAS' AFTER description;
   ```
2. `types/index.ts`: tambah `ActivityScope` type + field di `FacilityRequest`.
3. `lib/validations.ts`: tambah `activityScope` di `FacilityRequestSchema`.
4. `components/forms/RequestForm.tsx`: tambah field radio/select "Lingkup Kegiatan".
5. Pisahkan role tahap 2 di DB (opsional, tergantung D2):
   - **Pertahankan satu role `WR3_WD3`** tapi tambah kolom `userScope ENUM('UNIVERSITAS','FAKULTAS')` di `users` agar WR3 (UNIVERSITAS) dan WD3 (FAKULTAS) bisa dibedakan saat assign approver.
   - ATAU pecah jadi dua role baru `WR3` dan `WD3`. Pilih satu, dokumentasikan.
6. Update `approveByBiroIII` → routing ke role yang sesuai berdasarkan `activityScope`.
7. Update notifikasi target: hanya WR3 (UNIVERSITAS) atau WD3 (FAKULTAS), tidak broadcast ke semua.
8. (Opsional, sesuai RULES) buat tabel `validation_chains` untuk audit trail step routing.

**Kriteria selesai**:
- Pengajuan UNIVERSITAS → masuk antrian WR3 saja.
- Pengajuan FAKULTAS → masuk antrian WD3 saja.
- Notifikasi tidak bocor ke role yang tidak relevan.

---

### Fase 3 — Notification Dispatch Lengkap (G6, sesuai D7)

**Tujuan**: penuhi RULES §4.6 sesuai keputusan D7.

#### Jika D7 = Opsi A (WA + Email penuh)
1. `npm i baileys @whiskeysockets/baileys nodemailer`
2. `lib/baileys.ts`: client + session persistence di `./wa-session` (sudah di `.gitignore`).
3. `lib/mailer.ts`: nodemailer transport pakai env `NODEMAILER_USER`, `NODEMAILER_PASS`.
4. Wrap `createNotification`/`createNotificationForRole` → trigger juga `sendWhatsApp`
   + `sendEmail` via `Promise.allSettled`.
5. Builder pesan: 1 fungsi `buildStatusMessage(req, status)` agar konsisten lintas kanal.

#### Jika D7 = Opsi B (Email only)
1. `npm i nodemailer @types/nodemailer`
2. `lib/mailer.ts` saja. WA dijadikan TODO dengan komentar di `lib/notifications.ts`.

#### Jika D7 = Opsi C (DB only)
1. Update RULES §4.6 agar tidak mewajibkan WA/Email.
2. Pastikan UI notifikasi in-app (badge bell, halaman notif) sudah lengkap.

**Kriteria selesai**: setiap status change men-trigger semua kanal yang dipilih,
kegagalan satu kanal tidak menggagalkan perubahan status (pakai `Promise.allSettled`).

---

### Fase 4 — Priority Scheduling (G5)

**Tujuan**: implementasi RULES §4.5 (priority + aging + FCFS).

> Catatan: priority scheduling bermakna penuh hanya bila ada **konflik**.
> Sistem saat ini menolak overlap di awal — jadi konflik praktis tidak terjadi.
> Diskusikan dulu: apakah priority dipakai untuk **antrian validator**
> (decide siapa yang dilihat dulu) atau untuk **tiebreaker overlap**
> (mengganti penolakan jadi seleksi)?

1. Migration 007:
   ```sql
   ALTER TABLE facility_requests
     ADD COLUMN activityLevel ENUM('AKADEMIK','INSTITUSIONAL','KEMAHASISWAAN') NOT NULL DEFAULT 'KEMAHASISWAAN' AFTER activityScope;
   ```
2. `utils/priority.ts` (file baru):
   ```ts
   export const PRIORITY_LEVELS = { AKADEMIK: 3, INSTITUSIONAL: 2, KEMAHASISWAAN: 1 } as const;
   export const AGING_RATE = 0.1;
   export function calculatePriorityScore(req: { activityLevel: keyof typeof PRIORITY_LEVELS; submittedAt: Date }): number { ... }
   export function resolveConflict(a, b) { ... }
   ```
3. Konsumsi:
   - Ordering antrian validator: `ORDER BY priority_score DESC, submittedAt ASC`.
   - (Opsi konflik): saat dua submission masuk hampir bersamaan, panggil `resolveConflict`.
4. Form pengajuan: pengurus pilih `activityLevel` (default KEMAHASISWAAN, tidak bisa pilih AKADEMIK kecuali ada flag/role).

**Kriteria selesai**:
- Test unit `utils/priority.ts` lulus (kasus aging, FCFS tiebreaker).
- Antrian biro III/WR3/WD3 menampilkan urut berdasar priority score, bukan
  hanya createdAt.

---

### Fase 5 — Admin Decision Lengkap (G7)

**Tujuan**: tambah dua opsi yang hilang.

1. **`OFFER_ALTERNATIVE`**: admin pilih facility/slot lain.
   - Update `LogAction` enum + `approval_logs.action` enum.
   - Server action `offerAlternativeByAdminUnit(requestId, alternativeFacilityId, alternativeStart, alternativeEnd, note)`.
   - Status baru? RULES tidak jelaskan. Opsi:
     - Set status `REVISION_REQUESTED` dengan note alternatif → pengurus accept/decline.
     - ATAU buat status `ALTERNATIVE_OFFERED` baru.
   - **Keputusan butuh diambil sebelum eksekusi.**
2. **`PENDING`**: admin tahan keputusan.
   - Cukup tombol "Tunda" yang **tidak** ubah status (tetap `WAITING_ADMIN_UNIT`)
     tapi tulis log `PENDING` dengan reminder time.
   - Atau status baru `ON_HOLD`.

**Kriteria selesai**:
- UI admin punya 5 tombol keputusan.
- Tiap keputusan ter-log di `approval_logs` dengan action sesuai.

---

### Fase 6 — Timezone, Pagination, Soft Delete (G11, G12)

1. **Timezone (G11)**
   - `npm i date-fns date-fns-tz`
   - `utils/date.ts`: helper `formatWIB`, `toUtcFromWIB`, `nowWIB`.
   - Tampilan: semua format datetime via helper, default `Asia/Jakarta`.
   - Storage: tetap MySQL DATETIME (server bebas timezone, helper handle konversi).
   - Optional: `pool` config `timezone: '+07:00'` agar konsisten.

2. **Pagination (G12)**
   - Refactor query list (`getMyRequests`, `getRequestsForRole`, listing facility):
     - Terima `{ page, pageSize = 10 }`.
     - Return `{ items, total, page, pageSize }`.
   - Komponen `RequestTable`: konsumsi pagination, render kontrol page nav.
   - URL params: `?page=2` agar bisa di-share.

3. **Soft delete (G13 partial — bisa skip kalau D4 = Opsi A)**
   - Jika diputuskan diperlukan: tambah `deletedAt` di tabel yang relevan
     (`facilities`, `facility_requests`?).

**Kriteria selesai**: semua tampilan datetime konsisten WIB; tabel pakai
server-side pagination 10/page.

---

### Fase 7 — Audit Pasca-Logic + UI Pass

Setelah G1–G15 ditangani, **baru** lanjut ke perbaikan UI/design system.
Re-ambil 7 sub-fase dari Plan.md sebelumnya:

- 7.1 — Audit hex hardcode & token (read-only).
- 7.2 — Hardening `components/ui/*`.
- 7.3 — Sidebar / Topbar / Dashboard layout.
- 7.4 — Empat state wajib (loading/empty/error/success).
- 7.5 — Form / Tabel / Kalender / Timeline component specs.
- 7.6 — Aksesibilitas & responsive pass.
- 7.7 — Production-ready checklist (RULES §11).

Detail tiap sub-fase identik dengan Plan.md revisi 0. Tidak dimuat ulang di sini
agar dokumen tidak duplikatif — lihat history git untuk referensi.

---

## D. URUTAN PR YANG DISARANKAN

Satu PR = satu Fase atau lebih kecil. Tidak boleh campur:

1. **PR-1**: Migration 005 + `is_active` flow + SuperAdmin activate panel (G1).
2. **PR-2**: Middleware role enforcement (G2). Depends on PR-1.
3. **PR-3**: Overlap status filter fix (G4). Standalone, prioritas tinggi.
4. **PR-4**: Migration 006 + activity scope + WR3/WD3 routing (G3).
5. **PR-5**: Notification dispatch sesuai keputusan D7 (G6).
6. **PR-6**: Priority scheduling (G5). Bisa pararel dengan PR-4 jika tim memungkinkan.
7. **PR-7**: Admin decision OFFER_ALTERNATIVE + PENDING (G7).
8. **PR-8**: Timezone + pagination (G11, G12).
9. **PR-9..n**: UI/design system per sub-fase 7.x.

---

## E. APA YANG TIDAK DIKERJAKAN (Sengaja)

- **Migrasi ke Prisma/NextAuth** (D5): tidak dijadwal sampai user pilih Opsi B.
- **Migrasi ke `src/features/*`** (D6): tidak dijadwal sampai user pilih Opsi B.
- **Rename role/bureau/status enum** (D1–D3): tidak dijadwal sampai keputusan diambil.
  Default rekomendasi: pertahankan reality, update RULES.md.

---

## F. CATATAN EKSEKUSI

- Sebelum mulai PR-1, **putuskan D1–D7 dulu**. Tanpa itu beberapa fase ambigu.
- Setiap migration SQL **wajib idempotent atau punya catatan urutan jalannya**.
  File: `database/migration_00X_<name>.sql` mengikuti pola eksisting.
- Setiap perubahan server action: tambah unit test bila ada logic non-trivial
  (overlap, priority, routing). Skripsi membutuhkan Black Box Testing 19 FR — gunakan
  itu sebagai test charter.
- Update RULES.md di PR terpisah (`docs(rules): align ... to reality`) setelah
  semua keputusan D1–D7 diambil.
