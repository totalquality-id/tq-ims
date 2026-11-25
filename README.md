# D-ISO

Dashboard referensi Total Quality Indonesia untuk pengembangan sistem digital ISO 9001:2026.
Studi kasus fiktif **PT Sinar Busana Nusantara** (pabrik garmen ekspor). Semua data adalah dummy.

## Isi

| Ikon (lucide) | Sistem | Klausul | Rute |
|---|---|---|---|
| Globe | Digital PESTEL & Stakeholder Portal | 4 | `/pestel` |
| Gauge | Executive Quality Dashboard & Digital Policy | 5 · 9.3 | `/executive` |
| ShieldAlert | Risk Register & OKR | 6 | `/risk` |
| GraduationCap | Digital Skill Matrix & E-Learning | 7.2 · 7.3 | `/skill` |
| FolderOpen | E-Document Management System | 7.5 | `/edoc` |
| ClipboardCheck | E-Audit & Real-Time Feedback | 9.1.2 · 9.2 | `/audit` |
| Wrench | CAPA Digital | 10.2 | `/capa` |
| Orbit | D-ISO 360° (integrasi semua sistem) | 4–10 | `/d-iso` |

Halaman `/` adalah hub "D-ISO" (wireframe PDF main): satu kotak per sistem.

Panduan fitur dan skenario uji Basic, Advanced, serta Custom tersedia di [Panduan peninjauan D-ISO](public/panduan-fitur-d-iso.md). Mulai dari **Paket & Harga → Coba fitur**.

## Struktur halaman

- `/` : hub, satu kotak per sistem.
- `/<sistem>` : Ringkasan sistem (4 KPI, 2 grafik utama, kartu sub-modul).
- `/<sistem>/<sub-modul>` : satu sub-modul, misalnya `/capa/capa`, `/risk/okr`, `/skill/trainings`.
  Berisi KPI, 2-3 grafik, form tambah data, dan tabel. Alamat lama `/data/<dataset>` dialihkan otomatis.
- `/d-iso` : D-ISO 360°, status tiap sistem, daftar "Perlu tindakan", input cepat, tren KPI.

## Interaksi

- **Input data (mode pratinjau)**: tombol "Tambah" di setiap sub-modul membuka form di atas tabel.
  Data juga bisa diubah dan dihapus dari panel detail. Semua perubahan disimpan di localStorage browser
  (`tq-ims:data:v1`), tidak ke server, dan langsung memengaruhi KPI, grafik, dan D-ISO 360°.
  Tombol "Reset" mengembalikan sub-modul ke data awal.
- **Grafik sebagai filter**: klik batang, irisan donut, sel heatmap, atau titik tren untuk memfilter tabel
  di halaman yang sama. Klik lagi untuk membatalkan. Di halaman Ringkasan, klik membuka sub-modulnya.
- **Filter lanjutan**: pencarian, pilihan ganda per kolom (dengan jumlah data), rentang tanggal/angka,
  chip filter aktif, pilihan kolom, baris per halaman, sortir, dan export Excel/CSV. Filter tersimpan di URL.
- **Pencarian global**: `Ctrl+K` mencari kode/judul di seluruh data, termasuk data yang baru diinput.

## Struktur kode

```
src/lib/data/*.js       Generator data dummy ber-seed
src/lib/datasets.js     Registry dataset: kolom, facet, ringkasan, relasi, filter
src/lib/submodules.js   Nama, ikon, dan grafik tiap sub-modul
src/lib/forms.js        Field form input dan perhitungan kolom turunan
src/lib/store.js        Penyimpanan cache browser (tambah/ubah/hapus/reset)
src/lib/overviews.js    KPI & grafik halaman Ringkasan tiap sistem
src/components/         AppShell, SubModulePage, ModuleOverview, DisoOverview, ChartPanel, FilterPanel, RecordForm
```

Untuk menyambungkan ke database, ganti `src/lib/store.js` dengan pemanggilan API dengan bentuk baris yang sama.

## Menjalankan

```bash
npm install
npm run dev
```

## Deploy ke Vercel

Proyek ini Next.js murni tanpa database dan tanpa env var; semua halaman dirender statis.
Impor folder/repo di Vercel (framework: Next.js, Node 22) atau jalankan `npx vercel`.
Situs memakai `noindex`, jadi tidak muncul di mesin pencari. File PDF referensi diabaikan lewat `.vercelignore`.
