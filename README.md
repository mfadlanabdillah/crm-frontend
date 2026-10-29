# crm-frontend

> Boilerplate frontend untuk aplikasi CRM: satu **shell** (login, menu, router) yang memuat layar bisnis dari
> **remote** terpisah. React 19, Vite, TanStack, MSW. Berjalan penuh di atas backend tiruan.

Repo ini bukan satu aplikasi CRM jadi. Ia adalah kerangka yang dipakai ulang: bagian kerangka (shell)
disiapkan, sedangkan layar bisnis dipasang sebagai remote. Di `examples/` ada contoh yang bisa dijalankan,
termasuk satu domain lengkap (customer service: daftar case, detail, balasan, profil customer).

|                                           |                                             |
| ----------------------------------------- | ------------------------------------------- |
| ![Daftar case](docs/images/case-list.png) | ![Detail case](docs/images/case-detail.png) |

_Gambar di atas adalah layar contoh `examples/crm-cs`, bukan bagian dari shell._

## Baru di sini? Mulai dari sini

1. **Jalankan dulu** (bagian di bawah, 5 menit) supaya kamu punya sesuatu untuk diutak-atik.
2. **Baca [docs/onboarding.md](docs/onboarding.md)**: peta folder, alur satu layar dari URL sampai data,
   siapa boleh memakai siapa, dan latihan pertama. Ditulis untuk developer frontend pemula.
3. Saat mengerjakan tugas, buka [docs/agents/recipes.md](docs/agents/recipes.md) untuk langkah per jenis tugas.

## Mulai dalam 5 menit

Butuh Node >= 22.12 (lihat `.nvmrc`) dan pnpm >= 12 (`corepack enable`).

```bash
pnpm install
cp apps/crm-console/.env.example apps/crm-console/.env.local
pnpm dev:examples     # buka http://localhost:5173
```

Kamu langsung masuk sebagai **supervisor** (sesi mock) dan melihat menu Case, Customer, Finance,
Investigator, dan Monitor. Untuk melihat tampilan peran lain, tambahkan `?role=l1` (atau `l2`, `admin`) di URL.

Dua cara menjalankan:

| Perintah            | Yang berjalan                                         | Kapan dipakai                                         |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `pnpm dev:examples` | shell + empat contoh remote, dengan data tiruan       | Belajar, mencoba, dan menjalankan e2e                 |
| `pnpm dev`          | shell saja: menampilkan layar kosong "Belum ada menu" | Mengerjakan kerangkanya sendiri, tanpa domain apa pun |

Layar kosong pada `pnpm dev` itu benar, bukan galat: shell tidak punya layar bisnis.

**Start pertama lebih lambat.** Saat `pnpm dev:examples` pertama kali dijalankan (cache Vite masih kosong), kelima server mengoptimasi dependensi bersamaan dan bisa butuh satu sampai dua menit. Kalau halaman menampilkan banner "Sebagian layar gagal dimuat" dan menu kosong, tunggu sampai semua server mencetak `ready` dan terminal diam, lalu muat ulang halaman. Start berikutnya cepat.

Sebelum membuat PR, jalankan `pnpm check`. Untuk e2e (`pnpm test:e2e`), pasang browser Playwright sekali:

```bash
pnpm --filter @crm/crm-console exec playwright install chromium
# Linux/WSL yang baru: tambahkan --with-deps (butuh sudo), seperti di CI
```

Langkah ini tidak diperlukan untuk `pnpm dev` atau `pnpm check`.

## Peta singkat

```text
apps/
  crm-console/   shell: login, layout, menu, router. Tanpa layar bisnis
examples/
  crm-cs/        contoh lengkap: modul Case dan Customer (acuan utama)
  mock-backend/  data dan handler tiruan untuk contoh
  ...            tiga contoh kecil lain, dan e2e lintas aplikasi
packages/
  ui/            komponen dan token desain bersama (@crm/ui)
  app-kit/       helper bersama shell dan remote (klien API, format, guard izin)
  api-client/    tipe dan klien dari kontrak OpenAPI
  auth/          peran, izin, masking data pribadi
  i18n/          teks id-ID dan en-US milik shell
  module-contract/  tipe "apa yang diekspor sebuah remote"
docs/            dokumentasi
```

Pegangan mudah: **`apps/` = yang dijalankan, `examples/` = yang ditiru, `packages/` = yang dipakai bersama.**
Penjelasan tiap folder dan hubungan antar-paket ada di [docs/onboarding.md](docs/onboarding.md).

Tiga aturan utama. Aturan 1 dan larangan `fetch` di komponen ditegakkan ESLint; sisanya dijaga lewat resep, tes, dan review:

1. **Modul saling terpisah.** Satu modul tidak boleh mengimpor modul lain kecuali lewat `public.ts`-nya; remote tidak boleh mengimpor shell.
2. **Data server hanya di TanStack Query.** Tidak ada `fetch` di komponen dan tidak ada data server di Zustand.
3. **Filter hidup di URL**, jadi tampilan bisa di-bookmark dan dibagikan.

## Perintah sehari-hari

| Perintah            | Fungsi                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev:examples` | Shell dan empat contoh remote dengan data tiruan (`pnpm dev` untuk shell saja)                  |
| `pnpm check`        | Sama dengan CI: format, lint, typecheck, test, build, size, drift codegen. Jalankan sebelum PR  |
| `pnpm test`         | Unit/komponen (Vitest) + lantai cakupan (`vitest.config.ts`)                                    |
| `pnpm test:e2e`     | E2E Playwright: tes shell sendiri dan alur CS dengan remote contoh, termasuk pindai axe WCAG AA |
| `pnpm new:remote`   | Buat aplikasi remote baru di `apps/crm-<id>`                                                    |
| `pnpm new:endpoint` | Tambah endpoint GET ke satu modul (kontrak, klien, facade, query hook, mock)                    |
| `pnpm codegen:api`  | Generate ulang klien dari `packages/api-client/openapi/`                                        |
| `pnpm format`       | Prettier (`pnpm format:check` untuk cek saja, dipakai CI)                                       |

Perintah lain (`pnpm size`, `pnpm test:e2e:mfe`, `pnpm new:module`, dan pengukuran performa `perf`) dijelaskan di
[AGENTS.md](AGENTS.md) dan [docs/agents/recipes.md](docs/agents/recipes.md).

## Ingin menambah sesuatu?

| Tujuan                          | Caranya                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| Aplikasi remote baru (tim baru) | `pnpm new:remote <id> --icon Receipt --permission case.export`, lalu langkah yang dicetaknya |
| Endpoint GET baru               | `pnpm new:endpoint`; selebihnya di recipe "Add an API endpoint"                              |
| Halaman, form, izin, teks, tes  | [docs/agents/recipes.md](docs/agents/recipes.md)                                             |
| Komponen UI bersama             | `packages/ui/src/` dan aturan di [docs/ui-standards.md](docs/ui-standards.md)                |

## Status dan batasan

- **Backend belum ada di repo ini.** Semua data berasal dari mock (MSW). Kontrak API di `packages/api-client/openapi/openapi.yaml` masih sementara; tipe dan klien di-generate darinya. Status tiap endpoint ada di [docs/contract-status.md](docs/contract-status.md).
- **Domain contoh masih generik** (4 status, antrean l1/l2/escalated, 4 peran). Perlakukan sebagai contoh pola, bukan model final. Izin contoh (`case.*`, `customer.view`) dan path `/v1/cases...` di kontrak adalah kebijakan dan kontrak contoh yang diganti pengguna boilerplate.
- **Belum ada pelaporan error ke layanan eksternal.** Error baru masuk `console.error`; titik pasang SDK sudah disediakan (`setErrorReporter`).
- **CSP masih Report-Only**, dan login memakai sesi mock sampai backend tersedia.
- **Arsitektur micro frontend masih usulan** ([ADR-0009](docs/adr/0009-micro-frontends.md)). Persiapan production dicatat di [docs/production-readiness.md](docs/production-readiness.md).

## Docker

```bash
docker build -t crm-console .
docker run -p 8080:8080 crm-console        # http://localhost:8080
```

Image berisi hasil build statis shell yang dilayani nginx di port 8080, dengan header keamanan di
`security-headers.inc`. Aplikasi diasumsikan same-origin di belakang BFF.

**Tanpa BFF, halaman menampilkan "Terjadi kesalahan".** Image produksi tidak memuat mock, dan tanpa BFF permintaan `/v1/session` mendapat `index.html` dari nginx, sehingga shell tidak bisa membaca sesi. Itu perilaku yang diharapkan. Pakai `docker run` ini untuk memeriksa build, header, dan konfigurasi nginx; untuk melihat layar, pakai `pnpm dev:examples`.

- Build arg `VITE_API_BASE_URL` (default `/`), `VITE_TELEMETRY_URL`, dan `VITE_REMOTE_MODULES` (default kosong: daftar remote yang dimuat shell, pasangan `nama=url`) tertanam di bundle; semuanya publik, jangan isi secret.
- MSW hanya jalan di dev server. File `*.map` dan `mockServiceWorker.js` dihapus dari image.

## Kontribusi

- **Branch:** `feature/`, `bugfix/`, `hotfix/`, `release/`. Alur: `development` -> `staging` -> `master`.
- **Commit:** Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, ...).
- **PR:** buka dari feature branch ke `development`, ikuti template di `.github/`, dan lolos CI: `pnpm check` (termasuk cek format dan drift klien OpenAPI), e2e, dan build image Docker.
- **Pre-commit:** Husky menjalankan `lint-staged` (ESLint + Prettier pada file yang berubah). Aktif otomatis setelah `pnpm install`.
- **Bahasa:** kode, komentar, nama tes, dan commit dalam bahasa Inggris; README, panduan onboarding, dan teks produk (`id-ID`) dalam bahasa Indonesia. Kebijakan lengkap di [AGENTS.md](AGENTS.md).

## Dokumentasi

| Dokumen                                                      | Isinya                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [docs/onboarding.md](docs/onboarding.md)                     | Panduan untuk developer baru: peta folder, alur data, dependensi, latihan        |
| [docs/agents/recipes.md](docs/agents/recipes.md)             | Langkah per jenis tugas (endpoint, modul, halaman, form, komponen UI, izin, tes) |
| [docs/system-design.md](docs/system-design.md)               | Desain sistem dan batas arsitektur                                               |
| [docs/ui-standards.md](docs/ui-standards.md)                 | Aturan UI dan komponen                                                           |
| [docs/contract-status.md](docs/contract-status.md)           | Endpoint mana yang stabil, sementara, atau masih usulan                          |
| [docs/adr/](docs/adr/README.md)                              | Keputusan arsitektur beserta alasannya                                           |
| [docs/production-readiness.md](docs/production-readiness.md) | Catatan persiapan production (daftar yang dilengkapi tim)                        |
| [examples/README.md](examples/README.md)                     | Contoh remote: apa yang ditunjukkan dan cara menjalankannya                      |
| [AGENTS.md](AGENTS.md)                                       | Aturan, perintah verifikasi, dan perangkap yang sering terjadi                   |

## Untuk AI agent

Aturan, perintah verifikasi, dan perangkap yang sering terjadi ada di [AGENTS.md](AGENTS.md); langkah
per jenis tugas (endpoint, modul, route, teks, izin, tes) ada di [docs/agents/recipes.md](docs/agents/recipes.md).
`CLAUDE.md` hanya mengimpor `AGENTS.md`. Sebuah tes menjaga agar path yang disebut di dokumen itu
tetap ada, dan agar tabel `docs/contract-status.md` memuat semua endpoint di `openapi.yaml`.
