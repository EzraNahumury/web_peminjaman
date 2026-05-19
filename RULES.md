# PROJECT RULES — FASKO (Fasilitas Kampus Online)

These rules are mandatory for all contributors (humans and AI agents) working in this repository.
The goal is to maintain code quality, architectural consistency, scalability, and production readiness.

---

# 0. Platform Overview — FASKO

## Overview

**FASKO** (Fasilitas Kampus Online) is a **campus facility borrowing management web application**
designed to deliver a modern, fast, transparent, and efficient borrowing experience for all
civitas academica of Universitas Kristen Duta Wacana (UKDW) Yogyakarta.

This repository (`fasko-ukdw`) is the **full-stack layer** of the ecosystem,
built using **Next.js 14+ (App Router) with TypeScript**.

---

## Vision

Menggantikan seluruh proses peminjaman fasilitas kampus yang masih bersifat manual, tersebar,
dan tidak transparan menjadi sebuah sistem digital terpusat yang dapat diakses secara real-time
oleh seluruh civitas academica UKDW — sehingga proses yang sebelumnya memakan 2–14 hari kerja
dapat diselesaikan dalam hitungan jam dengan transparansi penuh.

---

## Positioning

- **Sistem peminjaman fasilitas kampus UKDW yang terpusat dan terintegrasi** — satu platform
  untuk semua biro (Biro 1, Biro 4, LPAIP, PPLK, KRT) tanpa perlu mendatangi masing-masing
  biro secara fisik.
- **Real-time availability checker** — kalender ketersediaan fasilitas yang diperbarui secara
  otomatis dengan deteksi overlap jadwal sebelum pengajuan diteruskan.
- **Digital validation chain** — menggantikan proses tanda tangan fisik yang memakan 1–3 hari
  kerja dengan validasi digital berjenjang (Biro III → WR3/WD3 → Admin Biro).
- **Evidence-based design** — seluruh fitur didasarkan pada hasil wawancara dengan 18 pengurus
  organisasi kemahasiswaan dan 5 admin biro UKDW (Mei 2026).

---

## Tech Stack

| Layer            | Tooling                                          |
| ---------------- | ------------------------------------------------ |
| Framework        | Next.js 14+ (App Router)                         |
| Language         | TypeScript (strict mode)                         |
| Styling          | Tailwind CSS + CSS Variables (design tokens)     |
| Linter/Formatter | ESLint + Prettier                                |
| Package Manager  | npm                                              |
| Deployment       | Vercel / VPS (TBD)                               |
| State Management | React Server Components + useActionState         |
| Data Layer       | Prisma ORM + MySQL                               |
| Auth             | NextAuth.js / Auth.js (session-based)            |
| Notification WA  | Baileys.js (open-source WhatsApp Web client)     |
| Notification Email | Nodemailer                                     |
| Validation       | Zod (server-side schema validation)              |
| UI Components    | Custom components + Lucide React icons           |

---

## High-Level Architecture

```txt
┌─────────────────────────────────────────────────────────────────┐
│                        FASKO Web App                            │
│                    Next.js 14 App Router                        │
├────────────────┬────────────────────────────────────────────────┤
│  UI Layer      │  Server Layer                                  │
│  (RSC + Client │  (Server Actions + Route Handlers)             │
│   Components)  │                                                │
│                │  ┌─────────────┐   ┌──────────────────────┐   │
│  /app          │  │   Prisma    │──▶│      MySQL DB         │   │
│  /components   │  │   (ORM)     │   │                       │   │
│  /features     │  └─────────────┘   │  Tables:              │   │
│  /hooks        │                    │  - User               │   │
│  /lib          │  ┌─────────────┐   │  - Role               │   │
│  /utils        │  │ Baileys.js  │──▶│  - Bureau             │   │
│  /types        │  │ (WA Notif)  │   │  - Facility           │   │
│  /config       │  └─────────────┘   │  - Booking            │   │
│  /styles       │                    │  - BookingFacility     │   │
│                │  ┌─────────────┐   │  - ValidationChain    │   │
│                │  │ Nodemailer  │──▶│  - BookingStatusLog   │   │
│                │  │(Email Notif)│   │  - Notification       │   │
│                │  └─────────────┘   │  - DateBlock          │   │
│                │                    └──────────────────────┘   │
└────────────────┴────────────────────────────────────────────────┘
```

---

## Core Modules

Modules are developed under:

```txt
src/features/<feature>/
```

Each module exposes a public API through:

```txt
index.ts
```

### Feature List

```txt
src/features/
├── auth/               # Login, register, session management
├── booking/            # Pengajuan peminjaman + multi-fasilitas
├── availability/       # Kalender real-time + overlap detection
├── validation/         # Validation chain: Biro III → WR3/WD3 → Admin Biro
├── notification/       # WA (Baileys.js) + Email (Nodemailer) dispatch
├── facility/           # CRUD fasilitas + date blocking
├── bureau/             # Master data biro
├── user/               # User management + role assignment
├── report/             # Laporan penggunaan fasilitas + export CSV
└── dashboard/          # Dashboard per role
```

---

## Audience & UX Principle

### Audience

**Primary users (from interview data — 18 respondents):**
- Pengurus aktif organisasi/lembaga kemahasiswaan UKDW yang berwenang mengajukan
  peminjaman fasilitas atas nama organisasinya (BEM, BPMF, HMPS, UKM, UKR, kepanitiaan)

**Secondary users (5 respondents):**
- Admin Biro: staf pengelola fasilitas di Biro 1, Biro 4, LPAIP, PPLK, dan KRT
- Biro III Kemahasiswaan: validator digital tahap 1
- Wakil Rektor 3 / Wakil Dekan 3: validator digital tahap 2 sesuai lingkup kegiatan
- Super Admin IT: system administrator (kelola user, master data, aktivasi akun)

### UX Principle

**"Dari fisik ke digital, dari berhari-hari ke berjam-jam."**

Setiap keputusan desain harus menjawab pertanyaan:
*"Apakah ini mengurangi waktu dan langkah yang sebelumnya harus dilakukan secara fisik?"*

Prioritas UX berdasarkan hasil wawancara:
1. Template surat digital terintegrasi (100% narasumber mahasiswa membutuhkan)
2. Kalender ketersediaan real-time (77,7% memilih tampilan kalender)
3. Tracking status pengajuan secara transparan
4. Notifikasi WhatsApp otomatis (77,8%) dan email (50%)
5. Routing otomatis ke biro yang tepat tanpa user perlu tahu struktur biro

### Brand Voice

**Profesional, bersih, dan terpercaya** — seperti SaaS dashboard premium, bukan tampilan
portal kampus yang kuno. Identitas warna mengacu pada hijau UKDW namun dieksekusi dengan
estetika modern. Tone komunikasi: formal namun ramah, informatif, dan efisien.

---

## Non-Negotiables

1. Clean Architecture — business logic tidak boleh bergantung pada UI
2. Self-documenting code — nama variabel, fungsi, dan komponen harus berbicara sendiri
3. Design consistency through tokens — tidak ada hardcoded hex color di komponen
4. Production-ready by default — setiap fitur harus menangani loading, empty, dan error state
5. **JANGAN UBAH** logic bisnis, server actions, API routes, Prisma queries, auth logic,
   middleware, environment variables, dan database schema tanpa instruksi eksplisit

---

# 1. Commit & Push Rules

All commits **must** follow Conventional Commits.

## Allowed Prefixes

| Prefix    | Purpose                  |
| --------- | ------------------------ |
| feat:     | New feature              |
| fix:      | Bug fix                  |
| docs:     | Documentation            |
| style:    | Formatting / UI only     |
| refactor: | Internal restructuring   |
| perf:     | Performance improvement  |
| test:     | Tests                    |
| build:    | Build/dependency changes |
| ci:       | CI/CD changes            |
| chore:    | Maintenance              |
| revert:   | Revert commit            |

## Commit Format

```txt
<type>(<scope>): <subject>

<body>

<footer>
```

### Scope Examples

```txt
feat(booking): add multi-facility submission form
fix(availability): correct overlap detection query
style(sidebar): apply UKDW green design tokens
feat(notification): integrate Baileys.js WhatsApp sender
```

## Rules

- Subject uses English, imperative mood, max 72 chars
- No generic commit messages like "update" or "fix stuff"
- Use scopes when relevant (booking, auth, validation, facility, etc.)

## Push Rules

- No force-push to protected branches (`main`, `production`)
- No `--no-verify`
- Branch naming:
  - `feat/<name>` e.g. `feat/validation-chain`
  - `fix/<name>` e.g. `fix/overlap-detection`
  - `chore/<name>` e.g. `chore/update-dependencies`
- CI must pass before merge

## Secret Files — NEVER Push

Never commit:

- `.env*` (`.env.local`, `.env.production`)
- WhatsApp session files (Baileys.js session data)
- Database credentials
- NextAuth secret keys
- API tokens

Use `.env.example` for documentation only:

```txt
DATABASE_URL=mysql://user:password@localhost:3306/fasko
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASS=your-app-password
WA_SESSION_PATH=./wa-session
```

---

# 2. Clean Code Rules

## Naming

- `camelCase` → variables, functions, hooks (`bookingId`, `getUserById`, `useBookingStatus`)
- `PascalCase` → components, types, interfaces (`BookingCard`, `ValidationChain`, `UserRole`)
- `SCREAMING_SNAKE_CASE` → constants (`MAX_BOOKING_DURATION`, `PRIORITY_LEVELS`)
- `kebab-case` → file names (`booking-card.tsx`, `use-booking-status.ts`)

Booleans must start with:

- `is` → `isActive`, `isAvailable`, `isLoading`
- `has` → `hasPermission`, `hasPendingBooking`
- `should` → `shouldShowCalendar`, `shouldRedirect`
- `can` → `canApprove`, `canCancel`

## Domain Naming (use consistently)

```txt
booking       → pengajuan peminjaman
facility      → fasilitas (ruangan/alat)
bureau        → biro/unit pengelola
validator     → pihak yang memvalidasi (Biro III, WR3, WD3)
admin         → admin biro (keputusan akhir)
chain         → validation chain (urutan validator)
overlap       → tumpang tindih jadwal
priority      → tingkat prioritas kegiatan
scope         → lingkup kegiatan (UNIVERSITAS / FAKULTAS)
```

## Functions

- One function = one responsibility
- Max 30 lines preferred; split if longer
- Max 3 parameters; use object params when more needed
- Server Actions must be in `actions/` files, not inline in components

## Readability

- No magic numbers → use named constants
  ```ts
  // ❌
  if (waitTime > 72) applyAging()
  // ✅
  const MAX_WAIT_HOURS_BEFORE_AGING = 72
  if (waitTime > MAX_WAIT_HOURS_BEFORE_AGING) applyAging()
  ```
- No deep nesting → use guard clauses
- Code must be self-documenting

## Maintainability

Follow DRY, KISS, YAGNI. Write tests for:

- Priority scheduling logic (`calculatePriority`, `resolveConflict`, `applyAging`)
- Overlap detection query
- Validation chain routing (UNIVERSITAS → WR3, FAKULTAS → WD3)
- SUS score calculation

---

# 3. Architecture Rules

## Folder Structure

```txt
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Login, register pages (unauthenticated)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── pengurus/             # Pengurus ormawa pages
│   │   ├── biro-iii/             # Biro III validator pages
│   │   ├── wr3-wd3/              # WR3/WD3 validator pages
│   │   ├── admin-biro/           # Admin biro pages
│   │   └── super-admin/          # Super Admin IT pages
│   └── api/                      # API route handlers
├── features/
│   ├── auth/
│   ├── booking/
│   ├── availability/
│   ├── validation/
│   ├── notification/
│   ├── facility/
│   ├── bureau/
│   ├── user/
│   ├── report/
│   └── dashboard/
├── components/
│   ├── ui/                       # Button, Badge, Card, Input, Toast, etc.
│   ├── layout/                   # Sidebar, Topbar, DashboardLayout
│   ├── calendar/                 # AvailabilityCalendar, CalendarToggle
│   ├── booking/                  # BookingForm, BookingCard, StatusTimeline
│   ├── validation/               # ValidationModal, ValidationBadge
│   └── shared/                   # EmptyState, LoadingSkeleton, etc.
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── baileys.ts                # Baileys.js WA client
│   ├── mailer.ts                 # Nodemailer config
│   └── scheduler.ts              # Priority scheduling logic
├── hooks/
│   ├── use-booking-status.ts
│   ├── use-availability.ts
│   └── use-notification.ts
├── utils/
│   ├── overlap.ts                # Overlap detection: start < end AND end > start
│   ├── priority.ts               # Priority score calculation + aging
│   ├── fcfs.ts                   # First Come First Served tiebreaker
│   ├── date.ts                   # Date utils (WIB timezone: Asia/Jakarta)
│   └── sus-score.ts              # SUS score calculator
├── types/
│   ├── booking.types.ts
│   ├── user.types.ts
│   ├── facility.types.ts
│   └── validation.types.ts
├── config/
│   ├── roles.ts                  # Role definitions and permissions
│   ├── priority.ts               # Priority level constants
│   └── status.ts                 # Booking status constants
└── styles/
    └── globals.css               # CSS variables (design tokens)
```

## Dependency Rules

- Business logic must NOT depend on UI
- UI may depend on business logic
- No circular dependencies
- `lib/` must not import from `features/` or `components/`
- `utils/` must be pure functions with no side effects

## Separation of Concerns

| Layer      | Responsibility                                    |
| ---------- | ------------------------------------------------- |
| components | Presentation only — no direct DB access           |
| hooks      | Reusable client-side state and effects            |
| features   | Feature-specific logic, forms, and server actions |
| lib        | Singletons and external service clients           |
| utils      | Pure functions — no imports from app layer        |
| types      | TypeScript interfaces and enums only              |
| config     | Constants and configuration values                |

## Modularity

- Each feature lives inside `src/features/<feature>/`
- Cross-feature access must go through public API (`index.ts`)
- Feature structure:
  ```txt
  src/features/booking/
  ├── index.ts              # Public API exports
  ├── actions.ts            # Server Actions
  ├── queries.ts            # Prisma read queries
  ├── schema.ts             # Zod validation schemas
  ├── types.ts              # Feature-specific types
  └── components/           # Feature-specific components
  ```

---

# 4. Domain Rules — FASKO Specific

## 4.1 User Roles & Access Control

Five roles defined in the `Role` table. **RBAC must be enforced on every Server Action and page.**

```ts
enum UserRole {
  PENGURUS_ORMAWA  = 'pengurus_ormawa',   // Pemohon
  BIRO_III         = 'biro_iii',           // Validator tahap 1
  WR3_WD3          = 'wr3_wd3',            // Validator tahap 2 Sesuai lingkup (Fakultas : WD3, Universitas : WR3)
  ADMIN_BIRO       = 'admin_biro',         // Keputusan akhir + kelola fasilitas
  SUPER_ADMIN_IT   = 'super_admin_it',     // System administrator
}
```

Role check pattern (use in every protected Server Action):

```ts
const session = await getServerSession(authOptions)
if (!session || session.user.role !== UserRole.ADMIN_BIRO) {
  throw new Error('Unauthorized')
}
```

## 4.2 Booking Status Flow

Eight statuses. Transitions must follow this exact order:

```txt
DRAFT
  └──[submit]──▶ PENDING_BIRO_III
                   ├──[tolak]──▶ REJECTED (terminal)
                   └──[setuju]──▶ PENDING_WR3 (lingkup UNIVERSITAS)
                               └──▶ PENDING_WD3 (lingkup FAKULTAS)
                                      ├──[tolak]──▶ REJECTED (terminal)
                                      └──[setuju]──▶ PENDING_ADMIN_BIRO
                                                       ├──[tolak]──▶ REJECTED (terminal)
                                                       └──[setuju]──▶ APPROVED (terminal)
[pemohon]──▶ CANCELLED (dari DRAFT atau PENDING_* manapun)
```

```ts
enum BookingStatus {
  DRAFT              = 'DRAFT',
  PENDING_BIRO_III   = 'PENDING_BIRO_III',
  PENDING_WR3        = 'PENDING_WR3',
  PENDING_WD3        = 'PENDING_WD3',
  PENDING_ADMIN_BIRO = 'PENDING_ADMIN_BIRO',
  APPROVED           = 'APPROVED',
  REJECTED           = 'REJECTED',
  CANCELLED          = 'CANCELLED',
}
```

## 4.3 Validation Chain Routing

Routing ditentukan oleh field `activity_scope` pada form pengajuan:

```ts
function buildValidationChain(bookingId: string, scope: 'UNIVERSITAS' | 'FAKULTAS') {
  const chain = [
    { step: 1, role: UserRole.BIRO_III },
    { step: 2, role: scope === 'UNIVERSITAS' ? UserRole.WR3_WD3 : UserRole.WR3_WD3 },
    { step: 3, role: UserRole.ADMIN_BIRO },
  ]
  // Save to ValidationChain table
}
```

## 4.4 Overlap Detection

Wajib dijalankan SEBELUM booking disimpan ke database:

```ts
// Overlap condition: existing.start_time < requested.end_time AND existing.end_time > requested.start_time
const overlapping = await prisma.booking.findFirst({
  where: {
    facility_id: requestedFacilityId,
    event_date: requestedDate,
    status: { in: ['APPROVED', 'PENDING_BIRO_III', 'PENDING_WR3', 'PENDING_WD3', 'PENDING_ADMIN_BIRO'] },
    AND: [
      { start_time: { lt: requestedEndTime } },
      { end_time:   { gt: requestedStartTime } },
    ]
  }
})
if (overlapping) throw new Error('FACILITY_NOT_AVAILABLE')
```

## 4.5 Priority Scheduling

```ts
const PRIORITY_LEVELS = {
  AKADEMIK:        3,   // Kegiatan akademik (kuliah, ujian, P3DM)
  INSTITUSIONAL:   2,   // Kegiatan institusional kampus
  KEMAHASISWAAN:   1,   // Kegiatan organisasi kemahasiswaan
} as const

// Priority score with aging (mencegah starvation)
// S(baru) = S(awal) + α × t_tunggu
const AGING_RATE = 0.1  // α

function calculatePriorityScore(booking: Booking): number {
  const basePriority = PRIORITY_LEVELS[booking.activity_level]
  const waitHours = differenceInHours(new Date(), booking.submitted_at)
  return basePriority + AGING_RATE * waitHours
}

// Conflict resolution: higher score wins; equal score = FCFS (submitted_at)
function resolveConflict(b1: Booking, b2: Booking): Booking {
  const s1 = calculatePriorityScore(b1)
  const s2 = calculatePriorityScore(b2)
  if (s1 > s2) return b1
  if (s2 > s1) return b2
  return b1.submitted_at < b2.submitted_at ? b1 : b2  // FCFS
}
```

## 4.6 Notification Rules

Notifikasi WAJIB dikirim pada setiap perubahan status booking.

```ts
// Trigger notification on every status change
async function sendStatusNotification(booking: Booking, newStatus: BookingStatus) {
  const message = buildNotificationMessage(booking, newStatus)
  await Promise.allSettled([
    sendWhatsApp(booking.user.phone, message),   // Baileys.js
    sendEmail(booking.user.email, message),       // Nodemailer
    saveNotificationLog(booking.id, message),     // DB log
  ])
}
```

Dua kanal wajib (berdasarkan hasil wawancara: 77,8% WA + 50% email):

- **WhatsApp via Baileys.js** — notifikasi cepat dan informal
- **Email via Nodemailer** — konfirmasi formal dengan dokumentasi

## 4.7 Registration Flow

```txt
Pengurus baru → self-register → is_active = false → Super Admin IT verifikasi → is_active = true
```

- Akun yang belum diaktifkan TIDAK BOLEH bisa login
- Middleware harus cek `is_active` setiap request
- Super Admin IT mendapat notifikasi saat ada akun baru menunggu aktivasi

## 4.8 Five Bureaus — Master Data

```ts
const BUREAUS = [
  { code: 'BIRO_1',  name: 'Biro I',  description: 'Ruang kelas, ruang hybrid, ruang tutorial' },
  { code: 'BIRO_4',  name: 'Biro IV', description: 'Studio foto, kamera, ruang podcast H.1.1' },
  { code: 'LPAIP',   name: 'LPAIP',   description: 'Kamera, stabilizer, tripod, saramonic' },
  { code: 'PPLK',    name: 'PPLK',    description: 'Lab komputer A–I, proyektor, laptop, soundcard' },
  { code: 'KRT',     name: 'KRT',     description: 'Auditorium, sound system, kendaraan' },
] as const
```

## 4.9 Admin Decision Options

Admin biro memiliki LIMA opsi keputusan (berdasarkan hasil wawancara):

```ts
enum AdminDecision {
  APPROVE           = 'APPROVE',          // → status APPROVED
  REJECT            = 'REJECT',           // → status REJECTED + wajib isi alasan
  REQUEST_REVISION  = 'REQUEST_REVISION', // → status kembali ke DRAFT
  OFFER_ALTERNATIVE = 'OFFER_ALTERNATIVE',// → admin pilihkan slot/fasilitas lain
  PENDING           = 'PENDING',          // → status tetap PENDING_ADMIN_BIRO
}
```

---

# 5. Clean Files Rules

Forbidden:

- Dead code
- Backup files (`file.bak`, `file.old`, `file.copy`)
- `console.log` (use proper logging)
- `debugger`
- Commented-out code
- Credentials or secrets

Rules:

- One file = one responsibility
- Split files >300 lines when needed
- Remove unused imports
- Baileys.js session files must NEVER be committed (add to `.gitignore`)

---

# 6. No Comment Rule

## Forbidden

- Comments explaining WHAT code does (code should be self-documenting)
- Decorative comments (`// ============`)
- Commented-out code

## Allowed

- Public API JSDoc (for utils and lib functions)
- Important domain logic explanation (e.g., priority scheduling formula)
- `TODO` with owner and issue link: `// TODO(@garry): fix aging rate — issue #42`
- Legal license headers

---

# 7. Design System Rules

## Design Identity

UKDW Green Professional — tema hijau kampus UKDW dieksekusi dengan estetika
SaaS dashboard modern, bersih, dan premium.

```txt
Primary:  #22A050 (UKDW Green — button utama, sidebar aktif)
Dark:     #145A2E (sidebar background)
Light:    #E8F8EE (tag background, hover state)
Accent:   #C9A227 (gold accent untuk elemen premium)
```

## Color Tokens

Defined in `src/styles/globals.css`:

```css
:root {
  /* Primary — UKDW Green */
  --primary-900: #0A3D1F;
  --primary-800: #145A2E;   /* sidebar background */
  --primary-700: #1A7A3C;   /* section heading */
  --primary-600: #22A050;   /* button primary, active nav */
  --primary-500: #2DC96A;   /* hover state */
  --primary-100: #E8F8EE;   /* badge background, tag */
  --primary-50:  #F2FBF5;   /* card background, row hover */

  /* Neutral */
  --neutral-900: #111827;   /* text utama */
  --neutral-700: #374151;   /* text sekunder */
  --neutral-500: #6B7280;   /* placeholder, caption */
  --neutral-300: #D1D5DB;   /* border input */
  --neutral-200: #E5E7EB;   /* divider, border card */
  --neutral-100: #F3F4F6;   /* page background */
  --neutral-50:  #F9FAFB;   /* table header */
  --white:       #FFFFFF;

  /* Booking Status Colors */
  --status-approved:  #16A34A;   /* APPROVED  — hijau */
  --status-pending:   #D97706;   /* PENDING_* — amber */
  --status-rejected:  #DC2626;   /* REJECTED  — merah */
  --status-cancelled: #6B7280;   /* CANCELLED — abu */
  --status-draft:     #3B82F6;   /* DRAFT     — biru */

  /* Accent */
  --accent-gold: #C9A227;

  /* Shape */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.07);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
}
```

## Typography

```css
/* Import in layout.tsx */
font-family: 'Inter', sans-serif;
/* Base: 14px dashboard, 16px form */
/* Heading: weight 600-700 */
/* Mono (ID, status, code): JetBrains Mono */
```

## Usage Rules

- Primary actions ALWAYS use `var(--primary-600)`
- Page background ALWAYS uses `var(--neutral-100)`
- Card background ALWAYS uses `var(--white)` with border `var(--neutral-200)`
- Status badges ALWAYS use semantic status colors (never ad-hoc colors)
- **NO hardcoded hex values in components** — always use CSS variables
- Sidebar background ALWAYS uses `var(--primary-800)`

## Component Specs

### Sidebar

```txt
background:    var(--primary-800)
width:         240px (collapsed: 64px mobile)
nav-item:      padding 10px 16px, radius 8px
nav-active:    background var(--primary-600), text white
nav-hover:     background var(--primary-700)
text:          white / opacity 85%
icon-size:     18px (Lucide React, stroke-based)
bottom:        avatar + nama + role badge
```

### Topbar

```txt
background:    white
height:        60px
border-bottom: 1px solid var(--neutral-200)
shadow:        var(--shadow-sm)
right:         bell icon (unread badge) + avatar dropdown
left:          breadcrumb "/" separator + page title weight 600
```

### Button Variants

```txt
Primary:   bg var(--primary-600), hover var(--primary-700), radius var(--radius-md), h 38px
Secondary: bg white, border 1.5px var(--neutral-300), hover bg var(--neutral-50)
Danger:    bg #DC2626, hover #B91C1C
Ghost:     bg transparent, color var(--primary-600), hover bg var(--primary-50)
```

### Badge — Booking Status

```txt
APPROVED:        bg #DCFCE7  text #15803D
PENDING_*:       bg #FEF3C7  text #B45309
REJECTED:        bg #FEE2E2  text #B91C1C
CANCELLED:       bg #F3F4F6  text #6B7280
DRAFT:           bg #DBEAFE  text #1D4ED8
border-radius:   999px (full pill)
padding:         3px 10px
font-size:       12px, weight 500
```

### Table

```txt
header:          bg var(--neutral-50), font-weight 600, 12px, uppercase, letter-spacing 0.5px
row-hover:       bg var(--primary-50)
row-border:      1px solid var(--neutral-100)
cell-padding:    12px 16px
```

### Form Input

```txt
height:          40px
border:          1.5px solid var(--neutral-300)
border-radius:   var(--radius-md)
focus:           border var(--primary-600) + box-shadow 0 0 0 3px var(--primary-100)
label:           13px, weight 500, var(--neutral-700), mb 6px
required:        asterisk merah, 12px
```

### Availability Calendar

```txt
Toggle:          Bulanan | Mingguan (berdasarkan preferensi 77,7% narasumber)
Available slot:  bg var(--primary-50), border var(--primary-200)
Booked slot:     bg #FEE2E2, border #FECACA + tooltip nama organisasi peminjam
Blocked date:    bg var(--neutral-200) strikethrough pattern
Today:           border 2px var(--primary-600)
```

### Status Timeline (Tracking Pengajuan)

```txt
Step selesai:    circle var(--primary-600) + checkmark icon
Step aktif:      circle var(--primary-600) filled, label bold
Step menunggu:   circle var(--neutral-300), label var(--neutral-400)
Step ditolak:    circle #DC2626 + X icon
Connector line:  2px solid var(--neutral-200)
```

---

# 8. UI/UX Rules

## Principles

- Minimalist — tidak ada elemen dekoratif yang tidak berfungsi
- Clear hierarchy — heading > subheading > body > caption
- Consistent spacing — gunakan kelipatan 4px (4, 8, 12, 16, 20, 24, 32, 48)
- Consistent interaction — semua aksi yang sejenis memiliki feedback yang sama
- Responsive by default — mobile-first

## Layout

- 12-column grid
- 4px spacing scale
- Consistent radius: `var(--radius-sm/md/lg)`
- Consistent shadow: `var(--shadow-sm/md/lg)`
- Dashboard content area: `max-width: 1200px`, padding `24px`

## Interaction

Every action MUST have all four states:

```txt
✅ Loading state  — skeleton loader (bukan spinner) untuk konten utama
                  — spinner kecil var(--primary-600) untuk button action
✅ Empty state    — icon SVG 48px (var(--primary-300)) + judul + deskripsi + CTA
✅ Error state    — toast merah + pesan error yang ramah pengguna (bukan stack trace)
✅ Success state  — toast hijau, auto-dismiss 4 detik, pojok kanan bawah
```

## Dashboard Layout per Role

```txt
Pengurus Ormawa:
  Sidebar: Dashboard | Ajukan Peminjaman | Riwayat | Notifikasi | Profil
  Dashboard: Kartu status terkini + kalender mini + shortcut ajukan

Biro III & WR3/WD3:
  Sidebar: Dashboard | Antrian Validasi | Riwayat Validasi | Notifikasi
  Dashboard: Badge jumlah menunggu + tabel pengajuan masuk

Admin Biro:
  Sidebar: Dashboard | Pengajuan Masuk | Kelola Fasilitas | Blokir Tanggal | Laporan
  Dashboard: Statistik fasilitas + grafik penggunaan bulanan

Super Admin IT:
  Sidebar: Dashboard | Manajemen User | Master Fasilitas | Master Biro | Log Sistem
  Dashboard: Ringkasan sistem + daftar akun menunggu aktivasi (highlight khusus)
```

## Accessibility

- Semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<button>`)
- Visible focus states (outline `var(--primary-600)`)
- Keyboard accessible (Tab order, Enter/Space for actions)
- Proper `aria-label` for icon-only buttons
- Proper `alt` text for images

## Responsive

- Mobile-first (base styles for mobile, expand for desktop)
- Touch targets ≥ 44×44px
- Sidebar collapsed to icon-only on mobile
- Tailwind default breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`

---

# 9. Next.js Specific Rules

## Server vs Client Components

```txt
Server Components (default):
  - Data fetching (Prisma queries)
  - Page layouts
  - Static content

Client Components ('use client'):
  - Interactive forms
  - Calendar (date interactions)
  - Toast notifications
  - Dropdown menus
  - Anything using useState/useEffect
```

## Server Actions

- SEMUA mutasi data (create, update, delete) menggunakan Server Actions
- Bukan API Routes, kecuali untuk Baileys.js webhook
- Pattern wajib:

```ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function submitBooking(formData: FormData) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')

  // 2. Role check
  if (session.user.role !== 'pengurus_ormawa') throw new Error('Forbidden')

  // 3. Input validation with Zod
  const schema = z.object({ /* ... */ })
  const input = schema.parse(Object.fromEntries(formData))

  // 4. Business logic
  // 5. DB operation
  // 6. Trigger notification
  // 7. Return result
}
```

## Date & Timezone

- SEMUA tanggal dan waktu menggunakan timezone `Asia/Jakarta` (WIB, UTC+7)
- Gunakan `date-fns` dengan `date-fns-tz` untuk operasi tanggal
- Simpan ke database dalam format UTC, tampilkan dalam WIB

## Pagination

- SEMUA tabel menggunakan server-side pagination
- TIDAK menggunakan client-side library untuk tabel
- Default page size: 10 items

---

# 10. Database Rules

## Prisma Schema Conventions

- Model names: `PascalCase` singular (`User`, `Booking`, `Facility`)
- Field names: `snake_case` (`created_at`, `booking_id`, `is_active`)
- Always include: `id`, `created_at`, `updated_at` on every model
- Soft delete: gunakan `deleted_at` nullable daripada hard delete

## Query Rules

- TIDAK menggunakan raw SQL kecuali terpaksa (dokumentasikan alasannya)
- Selalu gunakan `select` untuk membatasi field yang di-fetch
- Pagination: gunakan `skip` dan `take`
- Transactions: gunakan `prisma.$transaction` untuk operasi multi-tabel

## Critical Queries

```ts
// Overlap detection (JANGAN dimodifikasi tanpa pertimbangan matang)
prisma.booking.findFirst({
  where: {
    facility_id: facilityId,
    event_date: date,
    status: { in: ['APPROVED','PENDING_BIRO_III','PENDING_WR3','PENDING_WD3','PENDING_ADMIN_BIRO'] },
    AND: [
      { start_time: { lt: endTime } },
      { end_time: { gt: startTime } },
    ]
  }
})
```

---

# 11. Production Ready Checklist

Before every merge to `main`:

- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run build` succeeds
- [ ] No `console.log` or `debugger` in code
- [ ] No secrets committed (check with `git diff --staged`)
- [ ] `.env.example` updated if new env vars added
- [ ] Loading state handled ✅
- [ ] Empty state handled ✅
- [ ] Error state handled ✅
- [ ] Success feedback implemented ✅
- [ ] Responsive tested on mobile (375px) and desktop (1280px)
- [ ] Role-based access control verified for new routes/actions
- [ ] Overlap detection still passing for booking-related changes
- [ ] Notification triggered correctly on status changes
- [ ] PR description complete (what changed, why, how to test)

---

# 12. Enforcement

Rules are enforced through:

- **ESLint** — code quality and import rules
- **TypeScript strict mode** — type safety
- **Prettier** — code formatting
- **Zod** — runtime input validation on all Server Actions
- **NextAuth middleware** — route protection and role checking

Repeated violations may block PR approval.

---

## Notes

Rules exist to maintain consistency, scalability, and long-term maintainability of FASKO.

**Context untuk AI Agent (Claude Code):**
- Sistem ini adalah skripsi S1 Informatika UKDW oleh Garry Bastian Lake (NIM: 71220947)
- Pembimbing: Willy Sudiarto Raharjo (teknis) & Restyandito, Ph.D. (metodologi)
- Metode: SDLC + Goal-Directed Design + Mixed Method Research
- Pengujian: Black Box Testing (19 kebutuhan fungsional) + SUS (7 skenario, target ≥68)
- Semua keputusan desain dan fitur didasarkan pada wawancara empiris dengan 23 responden
- Jangan mengubah business logic tanpa konfirmasi eksplisit dari peneliti
- Prioritas saat ini: UI/styling sesuai design system di atas, logic sudah berjalan

If a rule becomes counterproductive, propose a revision through PR discussion.
