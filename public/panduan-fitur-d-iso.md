# Panduan peninjauan fitur paket D-ISO

Gunakan panduan ini untuk demonstrasi klien atau uji penerimaan internal. Contoh menggunakan organisasi dan data fiktif. Mulailah dari **Paket & Harga → Coba fitur Basic, Advanced, atau Custom**. Tautan terkait juga tersedia pada navigasi modul. Tiap ruang kerja memiliki tombol **Panduan uji**.

## Sebelum mencoba

- Untuk menjalankan proyek lokal yang dependensinya sudah tersedia, jalankan `npm run dev` pada direktori proyek dan buka alamat yang ditampilkan terminal, lalu pilih **Paket & Harga**. Untuk build lokal gunakan `npm run build` lalu `npm run start`.
- Gunakan satu profil browser khusus pengujian. Perubahan tersimpan pada origin browser tersebut melalui penyimpanan lokal D-ISO. Gunakan profil yang sama saat berpindah modul. Muat ulang halaman untuk menguji persistensi. Profil browser baru dapat dipakai untuk mengulang dari data awal tanpa menghapus pekerjaan lain.
- Kalender contoh merujuk **22 Oktober 2026**. Pilih Oktober 2026 saat mengikuti contoh. Waktu pencatatan jejak keputusan menggunakan jam aktual perangkat.
- Seluruh ruang kerja dapat dijelajahi dalam pratinjau. Basic mencakup pekerjaan harian, Advanced melengkapinya dengan analisis dan keputusan, dan Custom menambah konfigurasi organisasi. Nama paket pada halaman menunjukkan penawaran komersial. Penerapan lisensi per organisasi memerlukan autentikasi dan otorisasi di server.
- Untuk demo sepuluh menit, coba uji 1, 3, 7 dan 8. Untuk meninjau seluruh fitur, lanjutkan hingga uji 13.

## Peta fitur

| Paket | Tempat membuka | Hasil yang bisa diperiksa |
|---|---|---|
| Basic | E-Document → Persetujuan dokumen | Usulan, isi versi, pemeriksa, keputusan, dan revisi berlaku di master |
| Basic | E-Audit atau CAPA → Berkas audit | Rantai temuan, tindakan, bukti, verifikasi, dan workbook audit |
| Basic | Berkas audit → Register operasi | Bukti klausul 8 yang dapat berdiri sendiri atau terkait temuan |
| Basic | Skill Matrix, Risk & OKR, atau CAPA → Agenda PIC | Tenggat lintas modul, penyaringan pemilik dan draf email |
| Advanced | D-ISO 360° → Analisis mutu | Tren, Pareto, CAPA lewat target, keluhan, biaya mutu buruk, dan perbandingan risiko unit |
| Advanced | E-Audit → Evaluasi pemasok | Riwayat lot dan tingkat kesesuaian barang serta ketepatan pengiriman |
| Advanced | Executive → Tinjauan manajemen | Salinan angka untuk rapat, keputusan, PIC, tenggat dan ekspor |
| Advanced | Executive & Policy → KPI, kebijakan, distribusi | Scorecard, register kebijakan, status baca dan tanda tangan contoh |
| Custom | E-Document → Lokasi & persetujuan | Alur bertingkat per lokasi, KPI, sasaran, perbandingan serta laporan terfilter |
| Custom | D-ISO 360° → Integrasi & layanan | Impor lokal ERP/HRIS, contoh API, validasi konfigurasi OIDC dan profil pengelolaan server |
| Layanan | Agenda PIC → Onboarding & dukungan | Permintaan pelatihan, bantuan impor, dukungan aplikasi, dan penyesuaian |

## Pustaka PDF dan pengendalian berkas

Buka **E-Document → Master Dokumen**. Di Pustaka dokumen, pilih SOP-QC-001 dan periksa kode, revisi, serta tanggal pada halaman PDF. Buka FRM-QC-001 untuk melihat contoh hasil inspeksi lot kain. Tombol **Buka PDF** membuka lembar ukuran penuh, sedangkan **Unduh** mengambil file yang sama.

Pada **Tambah dokumen**, lampirkan PDF hingga 10 MB, lengkapi identitasnya, dan simpan. Dari detail dokumen, pilih **Kelola revisi dan persetujuan**. Ajukan PDF baru beserta catatan perubahan. Pemeriksa dapat membuka PDF usulan sebelum mengambil keputusan. Setelah disetujui, versi baru menjadi PDF master. Gunakan **Versi berkas** di detail untuk membuka arsip atau berkas yang dikembalikan.

Keempat contoh PDF dapat dibuka langsung oleh setiap pengunjung. PDF yang Anda masukkan atau ajukan sebagai revisi disimpan di browser perangkat tersebut bersama register dan riwayat keputusan. Berkas tetap tersedia setelah halaman dimuat ulang. Menghapus data situs atau mengakhiri sesi privat dapat menghapus salinan lokal. Gunakan **Unduh** untuk menyimpan salinan terpisah.

## Uji 1 · Terbitkan revisi dokumen

1. Buka **Persetujuan dokumen** (`/fitur/revisi`). Pilih dokumen aktif dan catat kode serta versi awal.
2. Isi pengusul “Rani QA”, lokasi “Pusat”, ringkasan “Tambah pemeriksaan gramasi”, dan isi dokumen “Ukur gramasi pada tiga titik setiap lot.” Klik **Ajukan revisi**.
3. Masukkan pemeriksa “Budi QMR”, keputusan **Setujui**, catatan “Metode sudah diuji”, dan tanggal review berikutnya. Klik **Catat keputusan**.
4. **Hasil** — Versi bertambah satu, riwayat mencatat nama dan keputusan. **Buka master** memperlihatkan versi dan jadwal review yang sama. **Unduh isi versi berlaku** menghasilkan TXT berisi naskah yang diajukan.
5. Ulangi dengan keputusan **Kembalikan**. Versi berlaku tetap. Riwayat mempertahankan usulan berikut catatan penolakan. Empat dokumen pustaka memiliki file sejak awal. Untuk dokumen dengan PDF, sertakan file baru pada usulan dan unduh versi yang terbit dari pratinjau PDF.

## Uji 2 · Buat rekaman operasi rutin

Buka **Berkas audit → Register operasi** (`/fitur/bukti`). Pilih pelepasan produk, isi lot “LOT-101”, PIC “Rani QA”, dan hasil “98 dari 100 unit lolos”. Simpan. Baris baru muncul dalam register dan ekspor **Unduh register operasi**. Ulangi dengan memilih sebuah temuan, lalu catat kode temuannya untuk uji berikutnya.

## Uji 3 · Telusuri bukti dari temuan ke verifikasi

1. Pada **Berkas audit**, pilih temuan yang dicatat di uji 2. Jika belum punya CAPA, isi akar penyebab dan tindakan lalu klik **Buat CAPA dari temuan**. Bila sudah memiliki beberapa CAPA, pilih yang hendak diperiksa.
2. Pilih jenis bukti, isi referensi “INS-101”, nama pemeriksa, hasil pemeriksaan, dan dokumen acuan dari uji 1. Klik **Tambahkan bukti**. Versi dokumen disalin pada saat pencatatan agar tetap dapat ditelusuri jika master berubah.
3. Isi verifikator, hasil **Efektif**, dan dasar keputusan “Tiga lot berturut-turut sesuai spesifikasi”. Klik **Simpan verifikasi**. Dari tautan CAPA periksa status **Closed** dan hasil efektivitas. Pilihan **Perlu Tindak Lanjut** mengembalikan CAPA ke **On Progress**.
4. **Unduh berkas audit (.xlsx)** menghasilkan lembar Temuan, CAPA, Bukti, Verifikasi, Operasi dan Dokumen. Cocokkan kode, referensi dan versi dengan layar. Isi dokumen disertakan jika versi berasal dari alur revisi. Saat mengisi bukti, Anda juga dapat melampirkan PDF, TXT, PNG, atau JPEG sampai 256 KB. Klik **Unduh paket lengkap (.zip)**. Arsip memuat workbook dan salinan asli tiap lampiran di folder Lampiran. Nama di dalam arsip diberi nomor untuk membedakan file bernama sama. Uji dengan file kecil berisi teks contoh dan cocokkan isinya setelah diekstrak.

## Uji 4 · Periksa agenda dan pengingat

Buka **Agenda PIC** (`/fitur/tugas`). Gunakan tanggal acuan 22 Oktober 2026, pilih PIC dari daftar, lalu buka satu tautan sumber. Periksa apakah ID, tenggat dan penanggung jawab sesuai. Agenda mencakup CAPA, temuan, review dokumen, sertifikat dan risiko. Batasnya tujuh hari ke depan untuk pekerjaan dan 90 hari untuk sertifikat, termasuk pekerjaan lewat tenggat. CAPA tertutup keluar dari agenda. **Unduh draf email PIC** menghasilkan berkas EML. Buka di aplikasi email, tentukan alamat tujuan, lalu kirim jika diperlukan. Pratinjau tidak mengirim email ke klien.

### Mencoba register IPR 3×3

Buka **Risk & OKR → Register Risiko & Peluang**. Pilih **Tambah peluang**. Contoh peluang adalah pemeriksaan kain di pemasok sebelum barang dikirim. Pilih kemudahan 2 (investasi kecil sampai menengah, waktu dan kesulitan sedang) serta dampak positif 3 (lingkup perusahaan). Hasilnya **2 × 3 = 6, High**. Isi manfaat, tindakan, PIC, dan target pelaksanaan. Pada **Register tujuan**, pilih OKR dan rekaman yang ingin dipantau, klik **Tautkan rekaman**, lalu simpan. Buka tautan tindakan di detail peluang dan ikuti tautan balik pada detail OKR.

Untuk risiko, pilih **Tambah risiko**. Frekuensi 2 (setiap 1–3 bulan) dan keparahan 2 (antar departemen) menghasilkan **4, Moderate**. Isi akibat dan mitigasi. Arahan IPR untuk contoh ini adalah melakukan pengurangan risiko dalam periode 6–12 bulan. Kedua nilai residual dapat diisi setelah pengendalian dinilai. Skor Low 1–2 membutuhkan pemantauan. Untuk High 6–9, risiko memerlukan tindakan segera dan peluang memerlukan pelaksanaan sesegera mungkin.

Rekaman pengguna yang pernah dinilai dengan skala lama 5×5 membawa label metode lama. Rekaman itu dapat dinilai ulang secara eksplisit lewat **Ubah**. Matriks IPR dan hitungan prioritas IPR menggunakan penilaian 3×3. Matriks menampilkan skor di setiap sel dan jumlah rekaman terkait di bawahnya.

## Uji 5 · Evaluasi pemasok dan keluhan

1. Buka **Evaluasi pemasok** (`/fitur/pemasok`). Catat lot “P-01” dari “Pemasok Uji”, tanggal dijanjikan 20 Oktober, diterima 22 Oktober, diterima 100 unit, lolos 98. Untuk bulan Oktober hasilnya **98% lolos** dan **0% tepat waktu**.
2. Tambahkan lot “P-02” dari pemasok yang sama, tanggal janji dan terima keduanya 22 Oktober, 50 dari 50 unit lolos. Hasil gabungan **98,7% lolos** (148/150) dan **50% tepat waktu** (1/2 lot). Uji pula jumlah lolos melebihi jumlah diterima dan nomor lot duplikat. Keduanya harus ditolak.
3. Untuk keluhan, buka **Analisis mutu → Keluhan pelanggan**. Klik kode untuk memeriksa pelanggan, kategori, dan status pada E-Audit & Feedback.

## Uji 6 · Analisis tren, prioritas, dan biaya

Buka **Analisis mutu** (`/fitur/analisis`) lalu pilih bulan laporan. Tren menghitung temuan, CAPA baru, dan keluhan berdasarkan tanggal pembuatan selama enam bulan. Pareto mengelompokkan **uraian temuan yang sama** dan mengurutkan jumlah tertinggi. Baris terakhir berjumlah kumulatif 100% bila ada temuan. Uraian dengan kata-kata berbeda dihitung sebagai kelompok berbeda.

Cek satu CAPA lewat target dengan membuka ID-nya. Posisi dihitung pada akhir bulan laporan atau tanggal acuan demo, mana yang lebih awal, menggunakan target dan tanggal penyelesaian yang tersimpan. Risiko tinggi per unit menampilkan register terkini. Tambahkan transaksi biaya **Pengerjaan ulang**, bukti “BK-001”, nominal **250000**, tanggal 22 Oktober. Total bulan itu naik Rp250.000 dan transaksinya muncul di tabel. Total berasal dari biaya yang dicatat pengguna.

## Uji 7 · Siapkan bahan rapat dan tindak lanjuti keputusan

1. Buka **Tinjauan manajemen** (`/fitur/rapat`), pilih Oktober 2026, isi judul “Evaluasi mutu Oktober”, pimpinan, dan tanggal. Pilih **Tinjauan manajemen** atau **Review bulanan bersama konsultan**, kemudian simpan bahan rapat.
2. Catat keputusan “Periksa ulang gramasi lot masuk”, PIC, serta tenggat. Unduh workbook dan periksa KPI, tren, Pareto, CAPA, pemasok, keluhan, biaya, risiko, dan keputusan. Risiko menggunakan tanggal pengambilan register.
3. Kembali ke analisis, tambahkan biaya lagi, lalu unduh rapat lama. Nilai biaya pada rapat lama tetap seperti saat disimpan. Buat rapat baru untuk mengambil angka terbaru.
4. Klik **Tandai selesai** pada keputusan dan ekspor lagi. Keputusan yang selesai tercantum pada lembar Keputusan. Buka juga tautan **Kebijakan digital** atau **Distribusi & konfirmasi baca** untuk meninjau register yang telah ada.

## Uji 8 · Jalankan dua tingkat persetujuan

Pada **Lokasi & persetujuan** (`/fitur/lokasi`), buat lokasi “Bandung” dan urutan “Manajer QA > Direktur”. Buka **Ajukan revisi dengan alur lokasi**, pilih dokumen dan lokasi Bandung, lalu ajukan revisi. Catat keputusan tingkat pertama dan periksa bahwa versi lama masih berlaku. Catat persetujuan kedua lalu periksa versi baru pada master. Kedua tahap tercantum berurutan pada riwayat. Jika alur lokasi diubah di tengah pengujian, usulan yang sedang berjalan tetap memakai urutan saat diajukan. Identitas pemeriksa dalam demo diisikan secara manual.

## Uji 9 · Bandingkan KPI cabang

Buat lokasi kedua “Semarang”. Masukkan indikator “Cacat akhir”, satuan “%”, arah **Maksimal**, target 2, realisasi 3 di Bandung dan 1 di Semarang, untuk bulan yang sama. Dashboard menampilkan **Perlu tindakan** untuk Bandung dan **Tercapai** untuk Semarang. Pilih filter Bandung lalu **Unduh laporan lokasi**. Workbook hanya memuat baris untuk Bandung. Menyimpan nama indikator, lokasi dan periode yang sama memperbarui pengukurannya.

## Uji 10 · Hubungkan contoh ERP dan HRIS

Buka **Integrasi & layanan** (`/fitur/integrasi`). Pilih **ERP** dan klik **Validasi & impor** pada contoh JSON. Buka register tujuan. Lot “LOT-DEMO-01” muncul pada Evaluasi pemasok. Mengimpor ulang lot yang sama ditolak. Ubah nomor lot jika ingin mengulang. Untuk **HRIS**, impor contoh “Rani Contoh”, buka Skill Matrix, dan cari NIK “DEMO-001” atau nama tersebut. NIK duplikat ditolak. Penilaian kompetensi awal memakai nilai bawaan formulir karyawan dan perlu diisi ulang dengan hasil asesmen.

**Buka API contoh** membuka `GET /api/contoh-integrasi`, yang memberi skema contoh dan data sintetis ERP/HRIS. Tombol **Ekspor hasil impor** mengunduh JSON berisi rekaman dari adaptor yang dipilih. Impor bekerja pada browser penguji. Endpoint contoh tidak mengambil data browser atau memperbarui sistem eksternal.

## Uji 11 · Periksa profil SSO

Isi profil dengan issuer contoh `https://idp.example.org` dan client ID publik `d-iso-demo`, lalu simpan. Uji metadata berikut.

```json
{
  "issuer": "https://idp.example.org",
  "authorization_endpoint": "https://idp.example.org/authorize",
  "token_endpoint": "https://idp.example.org/token",
  "jwks_uri": "https://idp.example.org/keys"
}
```

Klik **Uji metadata OIDC**. Ubah issuer pada JSON dan ulangi. Hasil pertama harus sesuai format dan hasil kedua harus menampilkan ketidakcocokan. Pengecekan dilakukan lokal terhadap issuer dan bentuk URL. Jangan memasukkan client secret, token atau kata sandi klien.

## Uji 12 · Pilih skema server dan layanan

| Pilihan profil | Hal yang ditinjau bersama klien |
|---|---|
| Cloud TQ | TQ mengelola aplikasi, infrastruktur bersama, pemantauan dan pemulihan. Klien menunjuk PIC data dan pengguna. |
| Server klien | Klien menyediakan server, jaringan dan media cadangan. TQ memasang serta memelihara aplikasi sesuai akses dan jadwal yang disetujui. |
| VPS khusus atas nama klien | Klien memegang akun dan tagihan infrastruktur. TQ mengelola aplikasi serta operasi sesuai kontrak. |

Pilih salah satu pada **Profil infrastruktur & layanan**. Masukkan pemilik backup, PIC dan target respons, simpan lalu muat ulang. Periksa pilihan yang tersimpan. Profil ini mendokumentasikan keputusan implementasi. Pengadaan, migrasi database dan backup aktual dikerjakan pada lingkungan klien.

## Uji 13 · Catat onboarding atau kebutuhan pendampingan

Buka **Agenda PIC → Onboarding & dukungan**, catat jenis “Pelatihan pengguna”, nama pemohon dan topik pelatihan. Periksa PIC dan target respons dari profil bila sudah dikonfigurasi. Klik **Selesaikan** dan muat ulang. Tiket tetap selesai. Tiket pratinjau tersimpan lokal. Pengiriman ke staf TQ dan pengukuran SLA kalender kerja memerlukan kanal layanan yang terhubung.

## Kriteria penerimaan sebelum dipakai klien produksi

| Area | Bukti yang perlu diperiksa di lingkungan produksi |
|---|---|
| Akun dan paket | Identitas pengguna terautentikasi, otorisasi per peran/lokasi, isolasi tenant serta batas langganan diuji di server. |
| Data dan dokumen | PostgreSQL, penyimpanan lampiran, cadangan luar server, uji restore, dan jejak persetujuan tahan perubahan. |
| Pengingat dan dukungan | Alamat PIC terverifikasi, persetujuan pengiriman, antrean email, penjadwalan, retry, dan tiket yang benar-benar diterima PIC. |
| Integrasi | Kontrak data klien, sandbox ERP/HRIS, otorisasi API, pencegahan duplikat, rekonsiliasi dan penanganan kegagalan. |
| SSO | IdP tenant, redirect URI, sesi server, verifikasi token, pemetaan peran dan pengujian logout. |
| Persetujuan | Verifikasi identitas, kewenangan pemeriksa, bukti waktu dan persyaratan tanda tangan yang disepakati klien. |
| Hosting | Uji koneksi dan pemulihan pada skema server yang dipilih, jadwal patch serta PIC insiden. |

Untuk mencatat temuan saat meninjau, tulis nomor uji, kode rekaman, langkah terakhir, hasil yang diharapkan, dan hasil aktual. Simpan workbook atau tangkapan layar sebelum menutup profil uji.
