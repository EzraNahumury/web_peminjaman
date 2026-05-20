# PLAN.md — FASKO (Revisi 2, 2026-05-19)

> Plan ini self-contained: berisi keputusan yang sudah diambil, apa yang sudah selesai,
> dan apa yang masih perlu dikerjakan. Bisa langsung dilanjut oleh siapapun tanpa konteks
> chat sebelumnya — cukup baca file ini + git log untuk detail teknis.

---

## 0. CARA MELANJUTKAN

1. Baca section **§1 KEPUTUSAN** — semua D1–D7 sudah diambil.
2. Lihat section **§2 STATUS** — checklist apa yang sudah/belum jadi.
3. Pilih item dari section **§3 BACKLOG**. Item paling atas = prioritas berikutnya.
4. Setelah selesai, update checklist di §2 dan tandai item di §3.
5. Branch: kerja langsung di `main` (pola yang dipakai sejauh ini). Commit message bahasa Inggris pendek.

Setup awal:
```bash
npm install
# isi .env (lihat .env.example kalau ada, atau pola DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
mysql -u root -p < database/schema.sql
mysql -u root -p < database/migration_001_managing_unit.sql
mysql -u root -p < database/migration_002_facility_blocks.sql
mysql -u root -p < database/migration_003_user_logo.sql
mysql -u root -p < database/migration_004_user_active_and_scope.sql
mysql -u root -p < database/migration_005_activity_scope.sql
mysql -u root -p < database/migration_006_admin_decision.sql
npx tsx database/seed.ts            # 36 fasilitas, 21 user, 18 peminjaman dummy
npm run dev
```

Akun demo (password semua: `password123`):
- `pengurus@kampus.test` (PENGURUS)
- `biro3@kampus.test` (BIRO_III)
- `wr3@kampus.test` (WR3_WD3, scope UNIVERSITAS)
- `wd3@kampus.test` (WR3_WD3, scope FAKULTAS)
- `adminunit@kampus.test` (ADMIN_UNIT — masih monolit, BELUM di-split)
- `superadmin@kampus.test`

Akun pengurus organisasi (semua bisa login): `damar.wicaksono@students.ukdw.ac.id`,
`naomi.hartanto@students.ukdw.ac.id`, `rafael.limanto@students.ukdw.ac.id`, dst — lihat `database/seed.ts` `ORGS[]` untuk daftar lengkap 15 LK/OK UKDW.

---

## 1. KEPUTUSAN YANG SUDAH DIAMBIL

| ID  | Keputusan | Pilihan |
|-----|-----------|---------|
| D1  | Status enum align ke mana? | **Opsi A** — pertahankan 12 status reality, RULES.md yang menyesuaikan |
| D2  | Role naming? | **Opsi A** — pertahankan `PENGURUS / BIRO_III / WR3_WD3 / ADMIN_UNIT / SUPER_ADMIN` |
| D3  | Bureau code? | **Opsi A** — pertahankan `BIRO_I / BIRO_IV` (romawi) |
| D4  | Schema naming? | **Opsi A** — pertahankan camelCase di seluruh DB |
| D5  | Stack? | **Opsi A** — pertahankan `mysql2 + jose` (tidak migrasi ke Prisma/NextAuth) |
| D6  | Folder structure? | **Opsi A** — pertahankan flat (tidak migrasi ke `src/features/*`) |
| D7  | Notification dispatch? | **Skip dulu** — implementasi DB-only sudah ada, WA/Email ditunda |
| D8 *(baru)* | Admin Unit jadi 5 role terpisah? | **Opsi B** — 5 role baru: `ADMIN_BIRO_I, ADMIN_BIRO_IV, ADMIN_PPLK, ADMIN_KRT, ADMIN_LPAIP` (belum dieksekusi, lihat §3) |
| D9 *(baru)* | Form field per-unit? | **Ya, perlu** — tiap unit punya field set berbeda (LPAIP tidak perlu kapasitas/peserta, KRT vehicle perlu tujuan rute) |
| D10 *(baru)* | OFFER_ALTERNATIVE model | Pakai status `REVISION_REQUESTED` + note terstruktur |
| D11 *(baru)* | PENDING model | Status baru `ON_HOLD` + tombol Resume |

> **Penting**: RULES.md belum di-update untuk mencerminkan D1–D4. Itu tugas tersendiri (PR `docs(rules): align to reality`).

---

## 2. STATUS — APA YANG SUDAH SELESAI

### Backend / Logic

- [x] **G1 Activation** (`migration_004`): `users.isActive`, login diblok kalau false, panel SuperAdmin `/dashboard/super-admin/users` untuk activate, notifikasi ke SuperAdmin saat registrasi baru.
- [x] **G2 Middleware role enforcement** (`proxy.ts`): cek role per path prefix, redirect ke dashboard role sendiri kalau mismatch, force logout kalau `!isActive`. Session payload bawa `isActive` + `userScope`.
- [x] **G3 Activity scope routing** (`migration_005`): `facility_requests.activityScope`, `users.userScope`. `approveByBiroIII` route ke WR3 vs WD3 berdasarkan scope.
- [x] **G4 Overlap detection fix** (`lib/availability.ts`): BLOCKING_SQL termasuk `SUBMITTED`, `WAITING_*`, `REVISION_REQUESTED`, `ON_HOLD`.
- [x] **G7 Admin decision lengkap** (`migration_006`): server actions `offerAlternativeByAdminUnit`, `holdByAdminUnit`, `resumeByAdminUnit`. Status `ON_HOLD` + 3 LogAction baru (`OFFER_ALTERNATIVE / HOLD / RESUME`).
- [x] **G11 Timezone helper** (`utils/date.ts`): `formatWIB`, `formatWIBDate`, `formatWIBTime` dengan `Asia/Jakarta`.
- [x] **G12 Pagination**: `getRequestsForRole` accept `{ page, pageSize }` → `{ items, total, page, pageSize }`. Komponen `Pagination` dengan prop `paramName` (untuk 2 list di 1 halaman).
- [x] **Seed dummy data**: 36 fasilitas, 15 org LK/OK UKDW + 6 user demo, 18 peminjaman tersebar -12 hingga +40 hari, distribusi status realistis, approval log trail per status.

### UI (Pengurus role saja)

- [x] **Design tokens** (`globals.css`): palette UKDW green, neutrals, status colors, accent gold, radius, shadow.
- [x] **shadcn-style primitives** (`components/ui/*`): Button, Card, Dialog, DropdownMenu, Field, Tooltip, Pagination, StatusBadge, Toaster (sonner), PageTransition (framer-motion).
- [x] **Sidebar** (`components/dashboard/Sidebar.tsx`): brand FASKO, section label per-role, menu items dengan unread badge, profile card pinned bottom + logout. (Menu "Kalender Fasilitas" sudah dihapus, route `/dashboard/pengurus/calendar` masih hidup sebagai dead code.)
- [x] **Topbar** (`components/dashboard/Navbar.tsx`): breadcrumb auto-generate dari pathname + bell notifikasi. CTA "+ Pinjam" dihapus (Pinjam per-fasilitas saja).
- [x] **Dashboard Pengurus** (`app/dashboard/pengurus/page.tsx`): hero greeting hijau, 4 stat cards, 2-col aktif/recent, grid fasilitas populer.
- [x] **Status Peminjaman list** (`app/dashboard/pengurus/requests/page.tsx`): 6 tab pills (Semua/Menunggu/Disetujui/Perlu Revisi/Ditolak/Selesai), tabel dengan inline expansion banner (alasan tolak / note revisi / tip disetujui).
- [x] **Status Peminjaman detail** (`app/dashboard/pengurus/requests/[id]/page.tsx`): hero hijau + status banner kontekstual + section Jadwal/Detail + timeline approval.
- [x] **Form Peminjaman** (`components/forms/RequestForm.tsx`): 2-kolom dengan summary panel kanan sticky. Field sekarang: Fasilitas (picker) → Tanggal mulai + Tanggal selesai (custom DatePicker) → Jam mulai + Jam selesai → Nama kegiatan → Jumlah peserta + Penanggung jawab → Org + Lingkup → Dokumen pendukung. Tujuan peminjaman jadi Select 10 opsi. Hidden inputs `startDateTime`/`endDateTime` compose dari 4 field. Dual mode: `lockedFacility` (dari card click) atau dropdown picker.
- [x] **FacilityPicker** (`components/forms/FacilityPicker.tsx`): inline popover (bukan modal), 5 unit accordion default expanded, search realtime, aksen warna per unit (Biro I=sky, Biro IV=violet, PPLK=emerald, KRT=amber, LPAIP=rose), bar samping berwarna sebagai pembatas.
- [x] **DatePicker** (`components/forms/DatePicker.tsx`): popover custom, header gradient hijau, 4 navigasi (« ‹ › »), grid 6 baris fix, hari ini badge, Minggu rose, footer "Hari ini" / "Tutup", support `min` prop.
- [x] **Daftar Fasilitas** (`app/dashboard/facilities/page.tsx`): accordion 5 unit (default open), search `?q=`, kartu fasilitas dengan gradient header + tombol Pinjam per kartu.
- [x] **Detail Fasilitas** (`app/dashboard/facilities/[id]/page.tsx`): hero hijau gradient, 2-kolom (deskripsi + aturan + 4-stat / kalender + jadwal mendatang + tip). Kalender pakai `FacilityAvailabilityCalendar` (lihat di bawah).
- [x] **FacilityAvailabilityCalendar** (`components/dashboard/FacilityAvailabilityCalendar.tsx`): navigasi bulan, hover (radix tooltip) memunculkan popup floating per tanggal berisi nama hari + tanggal + holiday badge + list booking (org/jam/status). Holiday 2026 ID hardcoded (13 hari).
- [x] **Notifikasi** (`app/dashboard/notifications/page.tsx`): 2-kolom (saringan sidebar + list), filter Semua/Belum dibaca/Menunggu/Disetujui/Jadwal Ulang/Ditolak dengan count badge, list dengan icon tinted + pill + "BARU" badge + relative timestamp.

---

## 3. BACKLOG — APA YANG BELUM (urut prioritas)

### Prioritas 1 — Split Admin Unit jadi 5 role (Phase 2 dari diskusi terakhir)

> **Keputusan**: D8 = Opsi B (5 role baru, bukan 1 role + kolom managingUnit)

Subtask:
- [ ] **Migration 007** — extend `users.role` enum: tambah `ADMIN_BIRO_I`, `ADMIN_BIRO_IV`, `ADMIN_PPLK`, `ADMIN_KRT`, `ADMIN_LPAIP`. Pertahankan `ADMIN_UNIT` lama untuk migrasi data, atau rename existing rows ke salah satu role baru.
- [ ] **types/index.ts** — update `Role` union.
- [ ] **proxy.ts** — recognize 5 role baru, semua tetap akses prefix `/dashboard/admin-unit/**` (atau dipecah jadi sub-path per unit, terserah implementor).
- [ ] **lib/auth.ts** — `dashboardPathForRole` map 5 role baru ke `/dashboard/admin-unit`.
- [ ] **components/dashboard/Sidebar.tsx** — MENUS config: 5 role baru pakai menu yang sama dengan ADMIN_UNIT.
- [ ] **app/actions/approvals.ts** — semua server action admin (`approveByAdminUnit`, `rejectByAdminUnit`, `requestRevisionByAdminUnit`, `offerAlternativeByAdminUnit`, `holdByAdminUnit`, `resumeByAdminUnit`) → `requireRole` accept 5 role + filter request berdasarkan `facility.managingUnit === ADMIN_ROLE_TO_UNIT[session.role]`.
- [ ] **`getRequestsForRole`** — filter request supaya admin role hanya lihat request yang `f.managingUnit` sesuai unit-nya.
- [ ] **Notification routing** — saat WR3/WD3 approve, `createNotificationForRole('ADMIN_UNIT', ...)` → ganti jadi `createNotificationForRole(adminRoleByUnit[facility.managingUnit], ...)`.
- [ ] **Seed** — tambah 5 user admin per unit: `adminbirog1@kampus.test`, `adminbiroiv@kampus.test`, `adminpplk@kampus.test`, `adminkrt@kampus.test`, `adminlpaip@kampus.test`. Hapus `adminunit@kampus.test` lama atau jadikan `ADMIN_BIRO_IV` (paling banyak fasilitas).

### Prioritas 2 — Form per-unit (D9)

> Tiap unit punya kebutuhan field berbeda. Contoh:
> - LPAIP (kamera/multimedia): tidak perlu kapasitas/peserta, perlu lokasi shoot, durasi
> - KRT kendaraan: perlu tujuan rute, kapasitas penumpang, supir
> - BIRO_I/IV (ruangan): kapasitas wajib
> - PPLK lab: jumlah peserta wajib

Subtask:
- [ ] Definisikan `FIELD_CONFIG_BY_UNIT` di file baru (mis. `lib/form-config.ts`):
  - per ManagingUnit: list field yang shown / required / hidden
  - Mungkin perlu nambah kolom DB: `routeDestination`, `driverName`, dll — putuskan lagi saat eksekusi.
- [ ] Refactor `RequestForm.tsx` untuk pakai config (conditional render field).
- [ ] Update `lib/validations.ts` agar field opsional per unit.
- [ ] (Opsional) Migration tambah kolom DB baru kalau dibutuhkan.

### Prioritas 3 — Fase 4 RULES: Priority Scheduling (G5)

Lihat Plan.md revisi 1 §C-Fase 4 (sudah ter-include di history). Ringkas:
- [ ] Migration 008 — `facility_requests.activityLevel` enum.
- [ ] `utils/priority.ts` — `PRIORITY_LEVELS`, `calculatePriorityScore`, aging, `resolveConflict`.
- [ ] Antrian validator order by priority score.
- [ ] Form pengurus pilih `activityLevel`.

> Catatan: priority bermakna penuh hanya jika ada konflik. Tentukan dulu apakah dipakai untuk ordering antrian atau tiebreaker overlap.

### Prioritas 4 — Fase 6 Notification Dispatch (G6, D7)

Saat ini DB-only. Kalau mau lengkap:
- [ ] Pasang Baileys + Nodemailer
- [ ] Wrap `createNotification*` jadi trigger WA + Email via `Promise.allSettled`
- [ ] Builder `buildStatusMessage(req, status)` agar konsisten lintas kanal

### Prioritas 5 — Fase 7 UI sisa (role non-Pengurus)

UI Pengurus sudah selesai. Sisa:
- [ ] Redesign halaman BIRO_III (dashboard, antrian, detail)
- [ ] Redesign halaman WR3_WD3 (dashboard, antrian, detail)
- [ ] Redesign halaman ADMIN_UNIT (dashboard, requests, blocks, facilities CRUD) — setelah Prioritas 1 (role split) selesai
- [ ] Redesign halaman SUPER_ADMIN (users management)

Pola visual sudah ditetapkan oleh Pengurus side, tinggal apply ke role lain.

### Prioritas 6 — Cleanup & Production

- [ ] Update **RULES.md** untuk mencerminkan D1–D4 (commit terpisah `docs(rules): align to reality`)
- [ ] Hapus dead route `/dashboard/pengurus/calendar` (folder + files)
- [ ] Migrasi `mysql2` Promise mode untuk MariaDB compat (sudah jalan, monitoring saja)
- [ ] Audit accessibility (focus rings, ARIA, keyboard nav)
- [ ] Responsive pass (mobile breakpoint)
- [ ] Production checklist (RULES §11 — lihat versi update)

---

## 4. PETA FILE PENTING

```
app/
  actions/           → server actions (auth, approvals, requests, notifications, users)
  dashboard/
    layout.tsx       → wraps Sidebar + Navbar
    page.tsx         → router dashboard berdasarkan role
    pengurus/        → halaman pengurus (UI sudah final)
    biro-iii/        → halaman biro III (UI masih versi lama)
    wr3-wd3/         → halaman WR3/WD3 (UI masih versi lama)
    admin-unit/      → halaman admin unit (UI versi lama, akan di-split per role di Prioritas 1)
    super-admin/     → halaman super admin
    facilities/      → daftar + detail fasilitas (UI final)
    notifications/   → notifikasi (UI final)
  surat/[id]/        → halaman surat persetujuan (PDF-able)

components/
  dashboard/
    Sidebar.tsx                    → menu navigasi + profile
    Navbar.tsx                     → breadcrumb + bell
    Timeline.tsx                   → riwayat approval
    NotificationList.tsx           → row notifikasi (legacy, sudah tidak dipakai di list page)
    FacilityCalendar.tsx           → kalender admin/global (legacy)
    FacilityAvailabilityCalendar   → kalender mini per-fasilitas dengan hover popup
    AdminUnitActions.tsx           → 5 tombol keputusan admin (approve/reject/revision/offer/hold/resume)
    ApprovalActions.tsx            → 3 tombol generic untuk biro III & WR3/WD3
    ApproverRequestDetail.tsx      → layout detail untuk validator
    RequestTable.tsx               → tabel request generic (validator)
  forms/
    RequestForm.tsx                → form pengajuan (final layout)
    FacilityPicker.tsx             → picker inline dengan accordion per unit
    DatePicker.tsx                 → date picker custom
  ui/                              → primitives shadcn-style

lib/
  db.ts             → mysql2 pool helpers (query, queryOne, execute)
  auth.ts           → verifySession, requireRole, getCurrentUser, dashboardPathForRole
  session.ts        → jose JWT session payload
  validations.ts    → Zod schemas
  availability.ts   → overlap check (BLOCKING_SQL termasuk ON_HOLD)
  notifications.ts  → DB notifications + per-role broadcast
  request-code.ts   → kode + formatter datetime

database/
  schema.sql            → schema utama (latest dengan ON_HOLD + admin actions)
  migration_001..006    → migrations urut
  seed.ts               → seed 36 fasilitas + 21 user + 18 request

utils/
  date.ts           → formatWIB, formatWIBDate, formatWIBTime, nowWIB

proxy.ts            → middleware Next.js (role enforcement)
types/index.ts      → semua type DB + Role/RequestStatus/LogAction unions
```

---

## 5. KONVENSI & CATATAN

- Migration SQL idempotent atau punya catatan urutan — gunakan `migration_00N_<deskripsi>.sql`.
- Naming: file `kebab-case`, komponen `PascalCase`, types `PascalCase`, server actions `camelCase`.
- Edit langsung di main branch (pola tim saat ini). Commit message bahasa Inggris pendek.
- `npx tsc --noEmit` wajib bersih sebelum commit.
- Tambah dummy data lebih banyak via `seed.ts`, jangan via SQL manual.
- Jangan pakai timezone `local`; storage MySQL DATETIME naive, helper `utils/date.ts` handle ke WIB.
- `lockedFacility` dari form Pengurus diambil dari `?facility=ID`. Kalau tidak ada → picker accordion muncul.
- Holiday list 2026 hardcoded di `FacilityAvailabilityCalendar.tsx`. Update saat ganti tahun.

---

## 6. HISTORI REVISI

- **Revisi 0** (2026-05-17) — Plan awal UI design system saja.
- **Revisi 1** (2026-05-18) — Audit logic gap G1–G16. 6 keputusan D1–D7.
- **Revisi 2** (2026-05-19) — Semua keputusan D1–D11 final. Fase 1–2 + Fase 5 + Fase 6 sebagian + UI Pengurus lengkap. Tambah Prioritas split admin role (D8).
