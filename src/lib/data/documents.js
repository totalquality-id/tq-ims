// Data dummy: Informasi terdokumentasi (Klausul 7.5): akses, proteksi, retensi, dan disposisi.
import { rng, PEOPLE, TODAY, addDays, pad, daysBetween, monthOf } from './core';

export const DOC_CATEGORIES = [
  { key: 'Manual', code: 'MAN', color: '#3b5bdb' },
  { key: 'Prosedur (SOP)', code: 'SOP', color: '#d4a73a' },
  { key: 'Instruksi Kerja', code: 'IK', color: '#8fa2e6' },
  { key: 'Formulir', code: 'FRM', color: '#5f6f86' },
  { key: 'Rekaman', code: 'REK', color: '#b9c3d6' },
  { key: 'Dokumen Eksternal', code: 'EXT', color: '#2c4aa8' },
];

export const DEPT_CODE = {
  Cutting: 'CUT', Sewing: 'SEW', Finishing: 'FNS', 'Quality Control': 'QC', Warehouse: 'WH', PPIC: 'PPC',
  Maintenance: 'MTC', Merchandising: 'MD', Purchasing: 'PUR', 'HR & GA': 'HRG', IT: 'IT', Finance: 'FA', QMR: 'QMR',
};

// Proses per departemen yang menjadi SOP, IK, formulir, dan rekaman.
const PROCESSES = {
  Cutting: ['Spreading kain', 'Pembuatan marker', 'Pemotongan panel', 'Numbering & bundling', 'Relaxing kain'],
  Sewing: ['Setting line produksi', 'Operasi jahit kritis', 'Inline inspection', 'Line balancing', 'Penanganan jarum patah'],
  Finishing: ['Trimming & thread cutting', 'Pressing & ironing', 'Folding & packing', 'Metal detecting', 'Washing garmen'],
  'Quality Control': ['Inspeksi kain masuk (4-point)', 'Inspeksi AQL final', 'Pengukuran garmen', 'Kalibrasi alat ukur', 'Pengendalian produk tidak sesuai'],
  Warehouse: ['Penerimaan bahan baku', 'Penyimpanan & FIFO', 'Pengeluaran bahan ke produksi', 'Stock opname', 'Pengiriman barang jadi'],
  PPIC: ['Perencanaan produksi', 'Material requirement planning', 'Monitoring output harian', 'Pengendalian kapasitas'],
  Maintenance: ['Preventive maintenance mesin jahit', 'Perbaikan breakdown', 'Pengelolaan spare part', 'Pemeliharaan utilitas'],
  Merchandising: ['Review order & kontrak buyer', 'Pengembangan sampel', 'Approval sampel buyer', 'Komunikasi pelanggan'],
  Purchasing: ['Seleksi & evaluasi pemasok', 'Pembelian bahan baku', 'Pembelian aksesoris'],
  'HR & GA': ['Rekrutmen & seleksi', 'Pelatihan & kompetensi', 'Penilaian kinerja', 'Tanggap darurat', 'Pengelolaan pengaduan karyawan'],
  IT: ['Backup & restore data', 'Pengelolaan hak akses', 'Penanganan insiden TI'],
  Finance: ['Pengelolaan piutang', 'Perhitungan HPP'],
  QMR: ['Pengendalian informasi terdokumentasi', 'Audit internal', 'Tinjauan manajemen', 'Tindakan korektif (CAPA)', 'Pengelolaan risiko & peluang', 'Penanganan keluhan pelanggan'],
};

const MANUALS = [
  ['Manual Sistem Manajemen Mutu ISO 9001:2026', 'QMR'],
  ['Manual Mutu Produk & Standar Inspeksi', 'Quality Control'],
  ['Manual Social Compliance', 'HR & GA'],
  ['Manual K3 & Tanggap Darurat', 'HR & GA'],
];
const EXTERNALS = [
  ['ISO 9001:2026 Quality Management Systems', 'QMR'],
  ['Buyer Quality Manual Nordline Apparel', 'Merchandising'],
  ['Buyer Packing & Labeling Guide Kazuo Retail', 'Merchandising'],
  ['Restricted Substances List (RSL) Buyer', 'Finishing'],
  ['UU No. 13/2003 & PP Turunan Ketenagakerjaan', 'HR & GA'],
  ['ANSI/ASQ Z1.4 Sampling Procedures (AQL)', 'Quality Control'],
  ['Manual Mesin Jahit Lockstitch', 'Maintenance'],
  ['Peraturan Kawasan Berikat Bea Cukai', 'Finance'],
];

const CLAUSE_OF = {
  Cutting: '8.5.1', Sewing: '8.5.1', Finishing: '8.5.4', 'Quality Control': '8.6', Warehouse: '8.5.4', PPIC: '8.1',
  Maintenance: '7.1.3', Merchandising: '8.2', Purchasing: '8.4', 'HR & GA': '7.2', IT: '7.1.3', Finance: '7.1', QMR: '7.5',
};

function buildDocuments() {
  const r = rng('documents');
  const rows = [];
  const counters = {};
  const add = (nama, kategori, departemen, extra = {}) => {
    const cat = DOC_CATEGORIES.find((c) => c.key === kategori);
    const key = `${cat.code}-${DEPT_CODE[departemen]}`;
    counters[key] = (counters[key] ?? 0) + 1;
    const revisi = r.weighted([[0, 3], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0.5]]);
    const terbit = addDays(TODAY, -r.int(15, 980));
    const status = extra.status ?? r.weighted([['Aktif', 88], ['Draft', 3], ['Review', 3.5], ['Approval', 2], ['Kadaluarsa', 2.5], ['Obsolete', 1]]);
    const reviewBerikut = status === 'Kadaluarsa' ? addDays(TODAY, -r.int(5, 90)) : addDays(terbit, 730) < TODAY ? addDays(TODAY, r.int(10, 300)) : addDays(terbit, 730);
    const isRecord = kategori === 'Rekaman';
    rows.push({
      id: `${cat.code}-${DEPT_CODE[departemen]}-${pad(counters[key])}`,
      nama,
      kategori,
      departemen,
      revisi: `Rev. ${String(revisi).padStart(2, '0')}`,
      tglTerbit: terbit,
      bulanTerbit: monthOf(terbit),
      tglReview: reviewBerikut,
      sisaHariReview: daysBetween(TODAY, reviewBerikut),
      status,
      pemilik: r.pick(PEOPLE.slice(0, 40)),
      akses: r.weighted([['Internal', 6], ['Terbatas', 3], ['Rahasia', 1]]),
      klausul: extra.klausul ?? CLAUSE_OF[departemen],
      dilihat: Math.round((kategori === 'Manual' ? 180 : kategori === 'Prosedur (SOP)' ? 90 : 40) * (0.3 + r.next() * 1.4)),
      retensi: isRecord ? r.pick(['1 tahun', '3 tahun', '5 tahun']) : '-',
      disposisi: status === 'Obsolete' ? 'Diarsipkan (watermark OBSOLETE)' : isRecord ? r.pick(['Musnahkan setelah retensi', 'Arsip permanen']) : 'Tinjau ulang 2 tahunan',
      format: kategori === 'Formulir' || kategori === 'Rekaman' ? r.pick(['XLSX', 'PDF', 'Form Digital']) : 'PDF',
    });
  };
  for (const [nama, dept] of MANUALS) add(nama, 'Manual', dept, { status: 'Aktif', klausul: '4-10' });
  for (const [dept, processes] of Object.entries(PROCESSES)) {
    for (const p of processes) {
      add(`Prosedur ${p}`, 'Prosedur (SOP)', dept);
      const ik = r.int(1, 3);
      for (let i = 0; i < ik; i++) add(`IK ${p}${ik > 1 ? ` (${['Tahap Persiapan', 'Tahap Pelaksanaan', 'Tahap Pemeriksaan'][i]})` : ''}`, 'Instruksi Kerja', dept);
      const frm = r.int(1, 2);
      for (let i = 0; i < frm; i++) add(`Formulir ${p}${frm > 1 ? ` (${['Checklist', 'Laporan'][i]})` : ''}`, 'Formulir', dept);
      if (r.next() < 0.85) add(`Rekaman ${p} ${r.pick(['Harian', 'Mingguan', 'Bulanan'])}`, 'Rekaman', dept);
    }
  }
  for (const [nama, dept] of EXTERNALS) add(nama, 'Dokumen Eksternal', dept);
  for(const doc of rows) if(doc.id==='FRM-QC-001') doc.format='PDF';
  return rows;
}

export const documents = buildDocuments();
