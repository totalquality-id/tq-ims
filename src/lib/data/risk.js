// Data dummy: Tindakan menangani risiko & peluang (Klausul 6.1) dan sasaran mutu (6.2).
import { rng, PEOPLE, MONTHS, TODAY, addDays, pad } from './core';
import { pestelIssues } from './pestel';

import { IPR, iprLevel } from '../ipr';

// [deskripsi, kategori, departemen, L, I, pengendalian]
const RISKS = [
  ['Keterlambatan kedatangan kain dari pemasok', 'Rantai Pasok', 'Purchasing', 3, 3, 'Safety stock 2 minggu untuk kain fast moving & dual sourcing'],
  ['Fluktuasi harga kain cotton', 'Keuangan', 'Purchasing', 3, 2, 'Kontrak harga 6 bulan & natural hedging USD'],
  ['Shading / beda warna antar roll kain', 'Kualitas', 'Cutting', 2, 3, 'Shade band & pengelompokan roll sebelum cutting'],
  ['Kesalahan ukuran (measurement) di luar toleransi', 'Kualitas', 'Sewing', 2, 3, 'Inline measurement tiap 2 jam & pola master terverifikasi'],
  ['Kontaminasi jarum patah pada produk', 'Kualitas', 'Finishing', 1, 3, 'Prosedur kontrol jarum & metal detector 100%'],
  ['Turnover operator sewing tinggi', 'SDM', 'HR & GA', 3, 2, 'Skill bonus, program buddy, & jalur karier operator'],
  ['Kerusakan mesin jahit saat peak season', 'Operasional', 'Maintenance', 2, 2, 'Preventive maintenance terjadwal & stok spare part kritis'],
  ['Kegagalan memenuhi on-time delivery', 'Pelanggan', 'PPIC', 3, 3, 'Capacity planning mingguan & line balancing'],
  ['Serangan ransomware pada server ERP', 'IT', 'IT', 1, 3, 'Backup offline harian, MFA, & patch rutin'],
  ['Kebakaran di gudang bahan baku', 'K3', 'Warehouse', 1, 3, 'Sprinkler, APAR, & simulasi tanggap darurat'],
  ['Kecelakaan kerja di area cutting', 'K3', 'Cutting', 1, 3, 'Sarung tangan anti potong & guard pisau'],
  ['Temuan major audit social compliance buyer', 'Kepatuhan', 'HR & GA', 1, 3, 'Audit internal social compliance tiap triwulan'],
  ['Ketidaksesuaian label komposisi & care label', 'Kepatuhan', 'Quality Control', 2, 2, 'Checklist verifikasi label per style'],
  ['Keterlambatan approval sampel dari buyer', 'Pelanggan', 'Merchandising', 1, 1, 'Pre-production meeting & digital sample approval'],
  ['Kenaikan UMK melebihi proyeksi anggaran', 'Keuangan', 'Finance', 2, 2, 'Simulasi biaya & target efisiensi line'],
  ['Limbah cair finishing melebihi baku mutu', 'Lingkungan', 'Finishing', 1, 3, 'Uji effluent bulanan & pemeliharaan IPAL'],
  ['Kehilangan data akibat human error', 'IT', 'IT', 1, 1, 'Hak akses berbasis peran & versioning dokumen'],
  ['Akurasi stok bahan baku rendah', 'Operasional', 'Warehouse', 2, 2, 'Stock opname siklus & barcode bin location'],
  ['Pemasok aksesoris tidak memenuhi spesifikasi', 'Rantai Pasok', 'Purchasing', 2, 2, 'Incoming inspection & evaluasi pemasok triwulanan'],
  ['Lead time produksi melebihi rencana', 'Operasional', 'PPIC', 2, 2, 'Monitoring output per jam & eskalasi otomatis'],
  ['Keterlambatan kalibrasi alat ukur QC', 'Kualitas', 'Quality Control', 1, 2, 'Jadwal kalibrasi digital & reminder'],
  ['Ketergantungan pada 1 buyer utama (>40% omzet)', 'Pasar', 'Merchandising', 2, 3, 'Diversifikasi buyer Jepang & Australia'],
  ['Mogok kerja / perselisihan hubungan industrial', 'SDM', 'HR & GA', 1, 3, 'Bipartit triwulanan & mekanisme grievance'],
  ['Pemadaman listrik PLN', 'Operasional', 'Maintenance', 1, 1, 'Genset 1.000 kVA & SOP switching'],
  ['Banjir musiman di akses jalan pabrik', 'Lingkungan', 'PPIC', 1, 1, 'Rencana kontinjensi pengiriman & gudang transit'],
  ['Desain/pola buyer bocor ke pihak lain', 'Kepatuhan', 'Merchandising', 1, 3, 'NDA, kontrol akses CAD, & watermark'],
  ['Regulasi jejak karbon buyer Uni Eropa', 'Kepatuhan', 'QMR', 2, 3, 'Inventarisasi emisi scope 1 & 2'],
  ['Kualitas jahitan operator baru rendah', 'Kualitas', 'Sewing', 3, 2, 'Training center 2 minggu sebelum masuk line'],
  ['Fabric utilization di bawah target', 'Keuangan', 'Cutting', 1, 1, 'Marker digital & review efisiensi marker'],
  ['Barang reject menumpuk tanpa disposisi', 'Kualitas', 'Quality Control', 1, 1, 'Rapat disposisi mingguan barang reject'],
];

// [deskripsi, kategori, departemen, L, I, rencana]
const OPPORTUNITIES = [
  ['Tarif preferensi IEU-CEPA untuk buyer Eropa', 'Pasar', 'Merchandising', 3, 3, 'Petakan 5 buyer Eropa potensial'],
  ['Lini produk workwear & seragam', 'Pasar', 'Merchandising', 2, 3, 'Sampling 3 style workwear Q4'],
  ['Auto cutter untuk efisiensi kain', 'Teknologi', 'Cutting', 2, 3, 'Pilot 1 unit auto cutter'],
  ['Barcode bundle tracking real-time', 'Teknologi', 'PPIC', 3, 2, 'Implementasi di 4 line sewing'],
  ['PLTS atap untuk efisiensi energi', 'Lingkungan', 'Maintenance', 2, 2, 'Studi kelayakan & penawaran EPC'],
  ['Daur ulang perca kain bersama UMKM', 'Lingkungan', 'Warehouse', 3, 1, 'MoU dengan 2 UMKM lokal'],
  ['Fasilitas KITE bahan baku impor', 'Keuangan', 'Finance', 2, 2, 'Pengajuan ke Bea Cukai'],
  ['Transisi ISO 9001:2026 sebagai nilai jual', 'Kepatuhan', 'QMR', 3, 2, 'Sertifikasi transisi sebelum Q2 2027'],
  ['Program multi-skill operator', 'SDM', 'Sewing', 3, 2, 'Matriks skill & rotasi terencana'],
  ['Portal buyer untuk tracking order', 'Teknologi', 'IT', 2, 2, 'Prototype portal di modul IMS 360'],
];

function buildRisks() {
  const r = rng('risks');
  const pestelRisk = pestelIssues.filter((p) => p.jenis === 'Risiko');
  const pestelOpp = pestelIssues.filter((p) => p.jenis === 'Peluang');
  const make = (list, jenis, prefix, statuses) => list.map(([deskripsi, kategori, departemen, L, I, kendali], i) => {
    const skor = L * I;
    const level = iprLevel(skor);
    const rL = Math.max(1, L - r.weighted([[0, 1], [1, 3], [2, 2]]));
    const rI = Math.max(1, I - r.weighted([[0, 4], [1, 1]]));
    const sumber = r.weighted([['PESTEL', 3], ['Proses', 4], ['Audit', 2], ['Stakeholder', 2]]);
    const ref = sumber === 'PESTEL' ? r.pick(jenis === 'Risiko' ? pestelRisk : pestelOpp).id : null;
    const status = r.weighted(statuses(level));
    const bulan = r.pick(MONTHS);
    return {
      id: `${prefix}-${pad(i + 1)}`,
      jenis, metode: IPR,
      deskripsi,
      kategori,
      departemen,
      sumber,
      ref,
      kemungkinan: L,
      dampak: I,
      skor,
      level,
      residualKemungkinan: jenis === 'Risiko' ? rL : null,
      residualDampak: jenis === 'Risiko' ? rI : null,
      residualSkor: jenis === 'Risiko' ? rL * rI : null,
      residualLevel: jenis === 'Risiko' ? iprLevel(rL * rI) : null,
      pengendalian: kendali,
      status,
      pic: r.pick(PEOPLE.slice(0, 28)),
      bulan,
      tanggal: r.dateIn(bulan),
      target: status === 'Closed' || status === 'Terealisasi' ? null : addDays(TODAY, r.int(-20, 120)),
    };
  });
  const risks = make(RISKS, 'Risiko', 'RSK', (lv) => (lv === 'High'
    ? [['Mitigasi', 6], ['Open', 3], ['Monitoring', 2]]
    : [['Monitoring', 4], ['Mitigasi', 3], ['Closed', 3], ['Open', 1]]));
  const opps = make(OPPORTUNITIES, 'Peluang', 'OPP', () => [['On Progress', 5], ['Rencana', 3], ['Terealisasi', 2]]);
  const examples = make([
    ['Pemeriksaan kain bersama pemasok sebelum pengiriman', 'Rantai Pasok', 'Purchasing', 2, 3, 'Uji inspeksi bersama pada tiga lot dan ukur ketepatan pasokan.'],
    ['Checklist digital untuk pelepasan produk', 'Kualitas', 'Quality Control', 3, 2, 'Uji checklist pada satu lini dan evaluasi tingkat lolos inspeksi.'],
    ['Pelatihan silang operator pada operasi kritis', 'SDM', 'Sewing', 3, 3, 'Latih satu kelompok operator dan ukur perubahan kompetensinya.'],
  ], 'Peluang', 'IPR-OPP', () => [['Rencana', 1]]);
  const benefits = ['Gangguan pasokan berkurang di seluruh perusahaan.', 'QC dan produksi dapat menelusuri hasil inspeksi yang sama.', 'Kompetensi lintas lini meningkatkan fleksibilitas kapasitas perusahaan.'];
  examples.forEach((r,i)=>{
    r.akibat=benefits[i];
    r.actionRefs=[['okr/KR-12'],['okr/KR-07'],['okr/KR-13']][i];
  });
  risks[0].akibat='Kekurangan kain mengganggu rencana produksi dan pengiriman pesanan.';
  risks[0].actionRefs=['okr/KR-12'];
  return [...examples, ...risks.flatMap((r,i)=>opps[i]?[r,opps[i]]:[r])];
}

export const risks = buildRisks();

// ─── OKR / Sasaran mutu ────────────────────────────────────────────────────
// [objective, [key result, target, satuan, arah], ...]
const OKR_DEFS = [
  ['O1, Buyer puas dan loyal', [
    ['Customer satisfaction index ≥ 90%', 90, '%', 'up'],
    ['Komplain pelanggan ≤ 3 kasus/bulan', 3, 'kasus', 'down'],
    ['Repeat order dari buyer utama ≥ 85%', 85, '%', 'up'],
    ['Respons komplain ≤ 24 jam', 24, 'jam', 'down'],
  ]],
  ['O2, Kualitas benar sejak awal', [
    ['RFT sewing ≥ 92%', 92, '%', 'up'],
    ['DHU end-line ≤ 3,5', 3.5, 'DHU', 'down'],
    ['Lolos final inspection buyer ≥ 98%', 98, '%', 'up'],
    ['COPQ ≤ 1,5% penjualan', 1.5, '%', 'down'],
  ]],
  ['O3, Pengiriman tepat waktu', [
    ['On-time delivery ≥ 95%', 95, '%', 'up'],
    ['Lead time produksi ≤ 35 hari', 35, 'hari', 'down'],
    ['Akurasi rencana produksi mingguan ≥ 90%', 90, '%', 'up'],
    ['Pemasok kain tepat waktu ≥ 92%', 92, '%', 'up'],
  ]],
  ['O4, SDM kompeten & aman', [
    ['Karyawan kompeten sesuai matriks ≥ 75%', 75, '%', 'up'],
    ['Jam pelatihan ≥ 24 jam/karyawan/tahun', 24, 'jam', 'up'],
    ['Lost time injury = 0', 0, 'kasus', 'down'],
    ['Turnover operator ≤ 2,5%/bulan', 2.5, '%', 'down'],
  ]],
  ['O5, Operasi digital & efisien', [
    ['Proses terdigitalisasi ≥ 70%', 70, '%', 'up'],
    ['Efisiensi line sewing ≥ 65%', 65, '%', 'up'],
    ['Downtime mesin ≤ 40 jam/bulan', 40, 'jam', 'down'],
    ['Dokumen SMM 100% di e-document', 100, '%', 'up'],
  ]],
  ['O6, Tumbuh berkelanjutan', [
    ['Pendapatan ekspor tumbuh 12%', 12, '%', 'up'],
    ['Konsumsi energi per pcs turun 5%', 5, '%', 'up'],
    ['Ide kaizen terimplementasi ≥ 100/tahun', 100, 'ide', 'up'],
  ]],
];

export const okrStatus = (p) => (p >= 100 ? 'Tercapai' : p >= 70 ? 'On Track' : p >= 40 ? 'At Risk' : 'Belum Tercapai');

function buildOkr() {
  const r = rng('okr');
  const rows = [];
  let n = 0;
  for (const [objective, krs] of OKR_DEFS) {
    for (const [kr, target, satuan, arah] of krs) {
      const progress = r.weighted([[100, 9], [r.int(72, 98), 6], [r.int(45, 69), 2], [r.int(20, 38), 1]]);
      n += 1;
      let realisasi;
      if (arah === 'up') realisasi = Math.round(target * Math.min(1.05, progress / 100 + (progress === 100 ? r.next() * 0.04 : 0)) * 10) / 10;
      else realisasi = target === 0 ? (progress >= 100 ? 0 : 1) : Math.round((target * (progress >= 100 ? 0.95 : 100 / Math.max(progress, 1))) * 10) / 10;
      rows.push({
        id: `KR-${pad(n, 2)}`,
        objective,
        keyResult: kr,
        target,
        realisasi,
        satuan,
        progress,
        status: okrStatus(progress),
        pemilik: r.pick(PEOPLE.slice(0, 16)),
        periode: 'FY 2026',
        updateTerakhir: addDays(TODAY, -r.int(0, 14)),
      });
    }
  }
  return rows;
}

export const okrs = buildOkr();
export const OBJECTIVES = OKR_DEFS.map(([o]) => o);
