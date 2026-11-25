// Form input per sub-modul. `fields` menentukan isian; `build` menghitung baris
// lengkap (kode, bulan, skor, status, dsb.) dari isian, sama seperti data awal.
// Opsi bisa berupa array atau fungsi (get) => array, get(key) = baris gabungan.
import {
  DEPARTMENTS, PEOPLE, MONTHS, TODAY, addDays, daysBetween, monthOf, monthLabel, pad,
} from './data/core';
import { PESTEL_FACTORS, quadrantOf } from './data/pestel';
import { PERSPECTIVES, achievementOf, kpiStatus } from './data/executive';
import { IPR, assessment, ratingOptions, statusByType } from './ipr';
import { okrStatus, OBJECTIVES } from './data/risk';
import { SKILLS, TARGETS, PROGRAMS, CERTS } from './data/skill';
import { DOC_CATEGORIES, DEPT_CODE } from './data/documents';
import { AUDIT_TYPES, AUDITORS, CUSTOMERS } from './data/audit';
import { CAPA_CATEGORIES, CAPA_STATUSES, CAPA_STEPS, ROOT_CAUSES } from './data/capa';

const num = (v, d = 0) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v));
const uniq = (rows, key) => [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'id'));

// Kode berikutnya: PREFIX + nomor terbesar + 1 (mengikuti pola data awal).
export function nextId(rows, prefix, width = 3) {
  const max = rows.reduce((m, r) => {
    if (!String(r.id).startsWith(prefix)) return m;
    const n = Number(String(r.id).slice(prefix.length).replace(/\D.*$/, ''));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `${prefix}${pad(max + 1, width)}`;
}

const STATUS_ISU = ['Prioritas', 'On Progress', 'Monitoring', 'Closed'];
const IMPACT_NUM = { Tinggi: 5, Sedang: 3, Rendah: 2 };
const GOLONGAN = { Operator: 'op', Leader: 'lead', Staff: 'staff', Supervisor: 'spv', Manager: 'mgr' };
const employeeOptions = (get) => get('employees').map((e) => [e.id, `${e.nama} (${e.departemen})`]);
const employeeOf = (get, id) => get('employees').find((e) => e.id === id) ?? {};

export const FORMS = {
  pestel: {
    fields: [
      { key: 'isu', label: 'Isu', required: true, span: 'full' },
      { key: 'faktor', label: 'Faktor', type: 'select', options: PESTEL_FACTORS.map((f) => f.key), required: true },
      { key: 'jenis', label: 'Jenis', type: 'select', options: ['Risiko', 'Peluang'], default: 'Risiko' },
      { key: 'dampak', label: 'Dampak', type: 'select', options: ['Tinggi', 'Sedang', 'Rendah'], default: 'Sedang' },
      { key: 'kemungkinan', label: 'Kemungkinan (1-5)', type: 'number', min: 1, max: 5, default: 3 },
      { key: 'status', label: 'Status', type: 'select', options: STATUS_ISU, default: 'Prioritas' },
      { key: 'departemen', label: 'Departemen', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'tanggal', label: 'Tanggal identifikasi', type: 'date', default: TODAY },
      { key: 'target', label: 'Target tindak lanjut', type: 'date' },
      { key: 'tindakan', label: 'Rencana tindakan', type: 'textarea', span: 'full' },
    ],
    build: (v, { get, existing }) => ({
      ...existing,
      id: existing?.id ?? nextId(get('pestel'), 'PST-'),
      isu: v.isu, faktor: v.faktor, jenis: v.jenis, dampak: v.dampak, kemungkinan: num(v.kemungkinan, 3),
      skor: num(v.kemungkinan, 3) * IMPACT_NUM[v.dampak], status: v.status, departemen: v.departemen, pic: v.pic,
      tanggal: v.tanggal, bulan: monthOf(v.tanggal), target: v.status === 'Closed' ? null : v.target || null, tindakan: v.tindakan,
    }),
  },
  stakeholders: {
    fields: [
      { key: 'nama', label: 'Nama stakeholder', required: true, span: 'full' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: (get) => uniq(get('stakeholders'), 'kategori'), required: true },
      { key: 'tipe', label: 'Tipe', type: 'select', options: ['Internal', 'Eksternal'], default: 'Eksternal' },
      { key: 'pengaruh', label: 'Pengaruh (1-10)', type: 'number', min: 1, max: 10, default: 5 },
      { key: 'kepentingan', label: 'Kepentingan (1-10)', type: 'number', min: 1, max: 10, default: 5 },
      { key: 'status', label: 'Status komunikasi', type: 'select', options: ['Aktif', 'Monitoring', 'Perlu Tindak Lanjut'], default: 'Aktif' },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'kepuasan', label: 'Kepuasan (1-5)', type: 'number', min: 1, max: 5, step: 0.1, default: 4 },
      { key: 'kebutuhan', label: 'Kebutuhan & harapan', type: 'textarea', span: 'full' },
    ],
    build: (v, { get, existing }) => {
      const p = num(v.pengaruh, 5);
      const k = num(v.kepentingan, 5);
      return {
        ...existing,
        id: existing?.id ?? nextId(get('stakeholders'), 'STK-'),
        nama: v.nama, kategori: v.kategori, tipe: v.tipe, pengaruh: p, kepentingan: k, kuadran: quadrantOf(p, k),
        prioritas: p + k >= 15 ? 'Tinggi' : p + k >= 10 ? 'Sedang' : 'Rendah', status: v.status,
        frekuensi: p + k >= 15 ? 'Mingguan' : p + k >= 11 ? 'Bulanan' : 'Triwulan', pic: v.pic,
        kepuasan: num(v.kepuasan, 4), kontakTerakhir: existing?.kontakTerakhir ?? TODAY, kebutuhan: v.kebutuhan,
      };
    },
  },
  'stakeholder-comms': {
    fields: [
      { key: 'stakeholder', label: 'Stakeholder', type: 'select', options: (get) => uniq(get('stakeholders'), 'nama'), required: true, span: 'full' },
      { key: 'topik', label: 'Topik', required: true, span: 'full' },
      { key: 'tanggal', label: 'Tanggal', type: 'date', default: TODAY },
      { key: 'media', label: 'Media', type: 'select', options: ['Meeting', 'Email', 'Telepon', 'Kunjungan', 'Survey'], default: 'Meeting' },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'hasil', label: 'Hasil', type: 'select', options: ['Selesai', 'Perlu Tindak Lanjut', 'Terjadwal'], default: 'Selesai' },
    ],
    build: (v, { get, existing }) => {
      const s = get('stakeholders').find((x) => x.nama === v.stakeholder) ?? {};
      return {
        ...existing,
        id: existing?.id ?? nextId(get('stakeholder-comms'), 'KOM-'),
        stakeholder: v.stakeholder, kategori: s.kategori ?? '-', tipe: s.tipe ?? '-', topik: v.topik,
        tanggal: v.tanggal, bulan: monthOf(v.tanggal), media: v.media, pic: v.pic, hasil: v.hasil,
      };
    },
  },
  kpi: {
    fields: [
      { key: 'kpi', label: 'Nama KPI', required: true, span: 'full' },
      { key: 'kode', label: 'Kode', required: true },
      { key: 'perspektif', label: 'Perspektif', type: 'select', options: PERSPECTIVES.map((p) => p.key), required: true },
      { key: 'satuan', label: 'Satuan', default: '%' },
      { key: 'arah', label: 'Polaritas', type: 'select', options: ['Lebih tinggi lebih baik', 'Lebih rendah lebih baik'], default: 'Lebih tinggi lebih baik' },
      { key: 'target', label: 'Target', type: 'number', step: 0.01, required: true },
      { key: 'realisasi', label: 'Realisasi bulan ini', type: 'number', step: 0.01, required: true },
      { key: 'departemen', label: 'Departemen', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
    ],
    build: (v, { existing }) => {
      const target = num(v.target);
      const real = num(v.realisasi);
      const cap = achievementOf(real, target, v.arah.startsWith('Lebih rendah') ? 'down' : 'up');
      const values = existing?.values ? [...existing.values.slice(0, -1), real] : Array(10).fill(real);
      return {
        ...existing,
        id: existing?.id ?? v.kode, kode: v.kode, kpi: v.kpi, perspektif: v.perspektif, satuan: v.satuan, arah: v.arah, target, realisasi: real,
        capaian: cap, status: kpiStatus(cap), tren: existing?.tren ?? 'Stabil', departemen: v.departemen, pic: v.pic,
        frekuensi: 'Bulanan', values, decimals: String(v.realisasi).includes('.') ? 2 : 0,
      };
    },
  },
  'kpi-monthly': {
    fields: [
      { key: 'kode', label: 'KPI', type: 'select', options: (get) => get('kpi').map((k) => [k.kode, `${k.kode} ${k.kpi}`]), required: true, span: 'full' },
      { key: 'bulan', label: 'Bulan', type: 'select', options: MONTHS.map((m) => [m, monthLabel(m)]), default: MONTHS.at(-1) },
      { key: 'realisasi', label: 'Realisasi', type: 'number', step: 0.01, required: true },
    ],
    build: (v, { get, existing }) => {
      const k = get('kpi').find((x) => x.kode === v.kode) ?? {};
      const real = num(v.realisasi);
      const cap = achievementOf(real, k.target, k.arah?.startsWith('Lebih rendah') ? 'down' : 'up');
      return {
        ...existing,
        id: existing?.id ?? `${v.kode}-${v.bulan}-${Date.now().toString(36)}`,
        kode: v.kode, kpi: k.kpi, perspektif: k.perspektif, satuan: k.satuan, bulan: v.bulan,
        target: k.target, realisasi: real, capaian: cap, status: kpiStatus(cap), departemen: k.departemen,
      };
    },
  },
  policies: {
    fields: [
      { key: 'nama', label: 'Nama kebijakan', required: true, span: 'full' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: (get) => uniq(get('policies'), 'kategori'), required: true },
      { key: 'versi', label: 'Versi', default: 'v1.0' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Revisi', 'Aktif', 'Kadaluarsa'], default: 'Draft' },
      { key: 'tglBerlaku', label: 'Tanggal berlaku', type: 'date', default: TODAY },
      { key: 'pemilik', label: 'Pemilik proses', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'ringkasan', label: 'Ringkasan', type: 'textarea', span: 'full' },
    ],
    build: (v, { get, existing }) => ({
      ...existing,
      id: existing?.id ?? nextId(get('policies'), 'KBJ-'),
      nama: v.nama, kategori: v.kategori, versi: v.versi, status: v.status, tglBerlaku: v.tglBerlaku,
      tglReview: addDays(v.tglBerlaku, 365), pemilik: v.pemilik, penyetuju: 'Direktur Utama',
      penerima: existing?.penerima ?? 0, dibaca: existing?.dibaca ?? 0, persenBaca: existing?.persenBaca ?? 0,
      eSign: v.status === 'Aktif' ? 'Ditandatangani' : v.status === 'Revisi' ? 'Menunggu Persetujuan' : v.status === 'Draft' ? 'Belum Diajukan' : 'Kadaluarsa',
      ringkasan: v.ringkasan,
    }),
  },
  'read-receipts': {
    fields: [
      { key: 'kebijakanId', label: 'Kebijakan', type: 'select', options: (get) => get('policies').map((p) => [p.id, p.nama]), required: true, span: 'full' },
      { key: 'empId', label: 'Penerima', type: 'select', options: employeeOptions, required: true, span: 'full' },
      { key: 'metode', label: 'Metode', type: 'select', options: ['Email', 'In-App Notification', 'WhatsApp', 'Cetak (Manual)'], default: 'Email' },
      { key: 'status', label: 'Status', type: 'select', options: ['Sudah Dibaca', 'Belum Dibaca', 'Gagal Terkirim'], default: 'Belum Dibaca' },
      { key: 'tglKirim', label: 'Tanggal kirim', type: 'date', default: TODAY },
    ],
    build: (v, { get, existing }) => {
      const e = employeeOf(get, v.empId);
      const pol = get('policies').find((p) => p.id === v.kebijakanId) ?? {};
      return {
        ...existing,
        id: existing?.id ?? nextId(get('read-receipts'), 'RR-', 5),
        kebijakanId: v.kebijakanId, kebijakan: pol.nama, empId: v.empId, penerima: e.nama, departemen: e.departemen, jabatan: e.jabatan,
        metode: v.metode, status: v.status, tglKirim: v.tglKirim, tglBaca: v.status === 'Sudah Dibaca' ? TODAY : null,
        tandaTangan: v.status === 'Sudah Dibaca' ? 'Ya' : 'Belum',
      };
    },
  },
  risks: {
    fields: [
      { key:'jenis', label:'Jenis penilaian', type:'select', options:['Risiko','Peluang'], default:'Risiko', required:true },
      { key:'deskripsi', label:'Peristiwa atau kesempatan', required:true, span:'full' },
      { key:'kategori', label:'Kategori', type:'select', options:get=>uniq(get('risks'),'kategori'), required:true },
      { key:'departemen', label:'Departemen', type:'select', options:DEPARTMENTS, required:true },
      { key:'sumber', label:'Sumber identifikasi', type:'select', options:['PESTEL','Proses','Audit','Stakeholder'], default:'Proses' },
      { key:'ref', label:'Isu PESTEL asal', type:'select', options:get=>get('pestel').map(r=>[r.id,r.id+' · '+r.isu]) },
      { key:'kemungkinan', type:'select', required:true, span:'full' },
      { key:'dampak', type:'select', required:true, span:'full' },
      { key:'akibat', type:'textarea', required:true, span:'full' },
      { key:'pengendalian', type:'textarea', required:true, span:'full' },
      { key:'pic', label:'PIC tindakan', type:'select', options:PEOPLE, required:true },
      { key:'target', label:'Target pelaksanaan', type:'date' },
      { key:'status', label:'Status tindakan', type:'select', default:'Open', required:true },
      { key:'residualKemungkinan', label:'Kemungkinan setelah pengendalian (opsional)', type:'select', options:ratingOptions('Risiko'), span:'full' },
      { key:'residualDampak', label:'Keparahan setelah pengendalian (opsional)', type:'select', options:ratingOptions('dampak'), span:'full' },
    ],
    initial: row=>({
      actionRefs:row.actionRefs || [],
      ...(row.metode!==IPR ? {kemungkinan:'',dampak:'',residualKemungkinan:'',residualDampak:''}:{}),
      status:statusByType[row.jenis]?.includes(row.status)? row.status : statusByType[row.jenis]?.[0],
    }),
    build:(v,{get,existing})=>{
      const risk=v.jenis==='Risiko';
      const initial=assessment(v.kemungkinan,v.dampak);
      const residual=risk?assessment(v.residualKemungkinan,v.residualDampak):null;
      const tanggal=existing?.tanggal || TODAY;
      return {
        ...existing,id:existing?.id ?? nextId(get('risks'),risk?'RSK-':'OPP-'),jenis:v.jenis,metode:IPR,
        deskripsi:v.deskripsi.trim(),kategori:v.kategori,departemen:v.departemen,sumber:v.sumber,ref:v.sumber==='PESTEL'?v.ref || null:null,
        kemungkinan:+v.kemungkinan,dampak:+v.dampak,skor:initial.score,level:initial.level,akibat:v.akibat.trim(),
        residualKemungkinan:residual?+v.residualKemungkinan:null,residualDampak:residual?+v.residualDampak:null,
        residualSkor:residual?.score ?? null,residualLevel:residual?.level ?? null,
        pengendalian:v.pengendalian.trim(),actionRefs:v.actionRefs || [],status:v.status,pic:v.pic,target:v.target || null,tanggal,bulan:monthOf(tanggal),
      };
    },
  },
  okr: {
    fields: [
      { key: 'keyResult', label: 'Key result', required: true, span: 'full' },
      { key: 'objective', label: 'Objective', type: 'select', options: OBJECTIVES, required: true, span: 'full' },
      { key: 'target', label: 'Target', type: 'number', step: 0.1, required: true },
      { key: 'realisasi', label: 'Realisasi', type: 'number', step: 0.1, default: 0 },
      { key: 'satuan', label: 'Satuan', default: '%' },
      { key: 'progress', label: 'Progres (%)', type: 'number', min: 0, max: 100, default: 0 },
      { key: 'pemilik', label: 'Pemilik', type: 'select', options: PEOPLE, required: true },
    ],
    build: (v, { get, existing }) => ({
      ...existing,
      id: existing?.id ?? nextId(get('okr'), 'KR-', 2),
      objective: v.objective, keyResult: v.keyResult, target: num(v.target), realisasi: num(v.realisasi), satuan: v.satuan,
      progress: num(v.progress), status: okrStatus(num(v.progress)), pemilik: v.pemilik, periode: 'FY 2026', updateTerakhir: TODAY,
    }),
  },
  employees: {
    fields: [
      { key: 'nama', label: 'Nama karyawan', required: true, span: 'full' },
      { key: 'jabatan', label: 'Jabatan', required: true },
      { key: 'golongan', label: 'Golongan', type: 'select', options: Object.keys(GOLONGAN), default: 'Operator' },
      { key: 'departemen', label: 'Departemen', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'tglMasuk', label: 'Tanggal masuk', type: 'date', default: TODAY },
      ...SKILLS.map((s, i) => ({ key: `skill${i}`, label: `${s} (1-5)`, type: 'number', min: 1, max: 5, default: 3 })),
    ],
    initial: (row) => Object.fromEntries(SKILLS.map((_, i) => [`skill${i}`, row.skills?.[i]])),
    build: (v, { get, existing }) => {
      const skills = SKILLS.map((_, i) => Math.min(5, Math.max(1, num(v[`skill${i}`], 3))));
      const targets = TARGETS[GOLONGAN[v.golongan]];
      const gaps = skills.map((lv, i) => lv < targets[i]);
      const gapCount = gaps.filter(Boolean).length;
      const ratio = skills.reduce((s, lv, i) => s + lv / targets[i], 0) / skills.length;
      const avg = skills.reduce((a, b) => a + b, 0) / skills.length;
      const id = existing?.id ?? nextId(get('employees'), 'EMP-', 4);
      return {
        ...existing,
        id, nik: existing?.nik ?? `SBN${9000 + Number(id.slice(4))}`, nama: v.nama, jabatan: v.jabatan, golongan: v.golongan,
        departemen: v.departemen, tglMasuk: v.tglMasuk, masaKerja: Math.round((daysBetween(v.tglMasuk, TODAY) / 365) * 10) / 10,
        skills, targets, rataRata: Math.round(avg * 10) / 10,
        levelKeseluruhan: gapCount === 0 ? (ratio >= 1.3 ? 5 : ratio >= 1.12 ? 4 : 3) : gapCount === 1 ? (ratio >= 1.1 ? 3 : 2) : ratio >= 1 ? 2 : 1,
        jumlahGap: gapCount, skillGap: SKILLS.filter((_, i) => gaps[i]).join(', ') || '-',
        status: gapCount ? 'Perlu Pengembangan' : 'Kompeten',
      };
    },
  },
  trainings: {
    fields: [
      { key: 'empId', label: 'Peserta', type: 'select', options: employeeOptions, required: true, span: 'full' },
      { key: 'program', label: 'Program', type: 'select', options: PROGRAMS.map((p) => p[0]), required: true, span: 'full' },
      { key: 'tanggal', label: 'Jadwal', type: 'date', default: TODAY },
      { key: 'status', label: 'Status', type: 'select', options: ['Terjadwal', 'Berjalan', 'Selesai'], default: 'Terjadwal' },
      { key: 'progress', label: 'Progres (%)', type: 'number', min: 0, max: 100, default: 0 },
      { key: 'nilai', label: 'Nilai post-test', type: 'number', min: 0, max: 100 },
    ],
    build: (v, { get, existing }) => {
      const e = employeeOf(get, v.empId);
      const [program, skill, metode, jam] = PROGRAMS.find((p) => p[0] === v.program) ?? [v.program, '-', '-', 0];
      return {
        ...existing,
        id: existing?.id ?? nextId(get('trainings'), 'TRN-', 4),
        karyawan: e.nama, empId: v.empId, departemen: e.departemen, program, skill, metode, jam,
        tanggal: v.tanggal, bulan: monthOf(v.tanggal), status: v.status,
        progress: v.status === 'Selesai' ? 100 : v.status === 'Terjadwal' ? 0 : num(v.progress),
        nilai: v.status === 'Selesai' && v.nilai !== '' ? num(v.nilai) : null,
      };
    },
  },
  certifications: {
    fields: [
      { key: 'empId', label: 'Karyawan', type: 'select', options: employeeOptions, required: true, span: 'full' },
      { key: 'sertifikasi', label: 'Sertifikasi', type: 'select', options: CERTS.map((c) => c[0]), required: true, span: 'full' },
      { key: 'terbit', label: 'Tanggal terbit', type: 'date', default: TODAY },
      { key: 'kadaluarsa', label: 'Berlaku sampai', type: 'date', default: addDays(TODAY, 365 * 3) },
    ],
    build: (v, { get, existing }) => {
      const e = employeeOf(get, v.empId);
      const sisa = daysBetween(TODAY, v.kadaluarsa);
      return {
        ...existing,
        id: existing?.id ?? nextId(get('certifications'), 'CRT-', 4),
        karyawan: e.nama, empId: v.empId, departemen: e.departemen, jabatan: e.jabatan, sertifikasi: v.sertifikasi,
        penerbit: CERTS.find((c) => c[0] === v.sertifikasi)?.[1] ?? '-', terbit: v.terbit, kadaluarsa: v.kadaluarsa,
        sisaHari: sisa, status: sisa < 0 ? 'Kadaluarsa' : sisa <= 90 ? 'Akan Kadaluarsa' : 'Aktif',
      };
    },
  },
  documents: {
    fields: [
      { key: 'nama', label: 'Nama dokumen', required: true, span: 'full' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: DOC_CATEGORIES.map((c) => c.key), required: true },
      { key: 'departemen', label: 'Departemen', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'revisi', label: 'Revisi', default: 'Rev. 00' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Review', 'Approval', 'Aktif', 'Kadaluarsa', 'Obsolete'], default: 'Draft' },
      { key: 'tglTerbit', label: 'Tanggal terbit', type: 'date', default: TODAY },
      { key: 'akses', label: 'Akses', type: 'select', options: ['Internal', 'Terbatas', 'Rahasia'], default: 'Internal' },
      { key: 'pemilik', label: 'Pemilik dokumen', type: 'select', options: PEOPLE, required: true },
      { key: 'klausul', label: 'Klausul ISO', default: '7.5' },
      { key: 'retensi', label: 'Masa retensi', type: 'select', options: ['-', '1 tahun', '3 tahun', '5 tahun'], default: '-' },
    ],
    build: (v, { get, existing }) => {
      const cat = DOC_CATEGORIES.find((c) => c.key === v.kategori);
      const review = addDays(v.tglTerbit, 730);
      return {
        ...existing,
        id: existing?.id ?? nextId(get('documents'), `${cat.code}-${DEPT_CODE[v.departemen]}-`),
        nama: v.nama, kategori: v.kategori, departemen: v.departemen, revisi: v.revisi, tglTerbit: v.tglTerbit,
        bulanTerbit: monthOf(v.tglTerbit), tglReview: review, sisaHariReview: daysBetween(TODAY, review), status: v.status,
        pemilik: v.pemilik, akses: v.akses, klausul: v.klausul, dilihat: existing?.dilihat ?? 0, retensi: v.retensi,
        disposisi: v.status === 'Obsolete' ? 'Diarsipkan (watermark OBSOLETE)' : v.kategori === 'Rekaman' ? 'Musnahkan setelah retensi' : 'Tinjau ulang 2 tahunan',
        format: existing?.format ?? (v.kategori === 'Formulir' || v.kategori === 'Rekaman' ? 'Form Digital' : 'PDF'),
      };
    },
  },
  audits: {
    fields: [
      { key: 'jenis', label: 'Jenis audit', type: 'select', options: AUDIT_TYPES, required: true },
      { key: 'area', label: 'Area', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'auditor', label: 'Auditor', type: 'select', options: AUDITORS, required: true },
      { key: 'tanggal', label: 'Tanggal', type: 'date', default: TODAY },
      { key: 'status', label: 'Status', type: 'select', options: ['Terjadwal', 'Dalam Proses', 'Selesai'], default: 'Terjadwal' },
      { key: 'skor', label: 'Skor (%)', type: 'number', min: 0, max: 100 },
      { key: 'metode', label: 'Metode pengisian', type: 'select', options: ['Tablet (offline)', 'Mobile App', 'Web'], default: 'Tablet (offline)' },
    ],
    build: (v, { get, existing }) => ({
      ...existing,
      id: existing?.id ?? nextId(get('audits'), 'AUD-2026-'),
      jenis: v.jenis, area: v.area, auditor: v.auditor, auditee: `Supervisor ${v.area}`, tanggal: v.tanggal, bulan: monthOf(v.tanggal),
      status: v.status, skor: v.status === 'Selesai' && v.skor !== '' ? num(v.skor) : null,
      jumlahTemuan: get('findings').filter((f) => f.auditId === existing?.id).length,
      checklist: v.status === 'Selesai' ? 100 : v.status === 'Dalam Proses' ? 50 : 0, metode: v.metode,
    }),
  },
  findings: {
    fields: [
      { key: 'deskripsi', label: 'Temuan', required: true, span: 'full' },
      { key: 'auditId', label: 'Audit', type: 'select', options: (get) => get('audits').filter((a) => a.status !== 'Terjadwal').map((a) => [a.id, `${a.id} ${a.jenis}, ${a.area}`]), required: true, span: 'full' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: ['Major', 'Minor', 'Observasi', 'OFI'], default: 'Minor' },
      { key: 'prioritas', label: 'Prioritas', type: 'select', options: ['High', 'Medium', 'Low'], default: 'Medium' },
      { key: 'klausul', label: 'Klausul', default: '8.5.1' },
      { key: 'status', label: 'Status', type: 'select', options: ['Terbuka', 'Dalam Proses', 'Tertutup'], default: 'Terbuka' },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'deadline', label: 'Deadline', type: 'date', default: addDays(TODAY, 30) },
    ],
    build: (v, { get, existing }) => {
      const a = get('audits').find((x) => x.id === v.auditId) ?? {};
      return {
        ...existing,
        id: existing?.id ?? nextId(get('findings'), 'FND-'),
        auditId: v.auditId, area: a.area, jenisAudit: a.jenis, auditor: a.auditor, tanggal: a.tanggal, bulan: a.bulan,
        deskripsi: v.deskripsi, klausul: v.klausul, kategori: v.kategori, prioritas: v.prioritas, status: v.status, pic: v.pic,
        deadline: v.deadline, terlambat: v.status !== 'Tertutup' && v.deadline < TODAY ? 'Ya' : 'Tidak',
      };
    },
  },
  feedback: {
    fields: [
      { key: 'pelanggan', label: 'Pelanggan', type: 'select', options: (get) => uniq([...get('feedback'), ...CUSTOMERS.map((c) => ({ pelanggan: c }))], 'pelanggan'), required: true, span: 'full' },
      { key: 'rating', label: 'Rating', type: 'select', options: [['5', '5 bintang'], ['4', '4 bintang'], ['3', '3 bintang'], ['2', '2 bintang'], ['1', '1 bintang']], default: '5' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: ['Kualitas Produk', 'Pengiriman', 'Komunikasi', 'Dokumen & Label'], default: 'Kualitas Produk' },
      { key: 'kanal', label: 'Kanal', type: 'select', options: ['Mobile App', 'Portal Buyer', 'Email', 'WhatsApp', 'Survey'], default: 'Portal Buyer' },
      { key: 'tanggal', label: 'Tanggal', type: 'date', default: TODAY },
      { key: 'style', label: 'Style', default: 'ST-' },
      { key: 'status', label: 'Status', type: 'select', options: ['Baru', 'Ditindaklanjuti', 'Selesai'], default: 'Baru' },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'komentar', label: 'Komentar', type: 'textarea', required: true, span: 'full' },
    ],
    build: (v, { get, existing }) => {
      const rating = num(v.rating, 5);
      return {
        ...existing,
        id: existing?.id ?? nextId(get('feedback'), 'FB-', 4),
        tanggal: v.tanggal, bulan: monthOf(v.tanggal), pelanggan: v.pelanggan, rating,
        sentimen: rating >= 4 ? 'Positif' : rating === 3 ? 'Netral' : 'Negatif',
        tipe: rating >= 4 ? 'Pujian' : rating === 3 ? 'Saran' : 'Komplain',
        kategori: v.kategori, kanal: v.kanal, komentar: v.komentar, style: v.style, status: v.status, pic: v.pic,
      };
    },
  },
  capa: {
    fields: [
      { key: 'masalah', label: 'Masalah / temuan', required: true, span: 'full' },
      { key: 'kategori', label: 'Kategori', type: 'select', options: CAPA_CATEGORIES, required: true },
      { key: 'sumber', label: 'Sumber', type: 'select', options: ['Audit Internal', 'Komplain Pelanggan', 'Inspeksi Produk', 'Evaluasi Pemasok', 'Insiden K3', 'Risiko'], default: 'Inspeksi Produk' },
      { key: 'departemen', label: 'Departemen', type: 'select', options: DEPARTMENTS, required: true },
      { key: 'akarPenyebab', label: 'Akar penyebab (6M)', type: 'select', options: ROOT_CAUSES, required: true },
      { key: 'detailAkar', label: 'Detail akar penyebab', span: 'full' },
      { key: 'tindakan', label: 'Tindakan', type: 'textarea', span: 'full' },
      { key: 'pic', label: 'PIC', type: 'select', options: PEOPLE, required: true },
      { key: 'tanggal', label: 'Tanggal', type: 'date', default: TODAY },
      { key: 'target', label: 'Target selesai', type: 'date', default: addDays(TODAY, 30) },
      { key: 'status', label: 'Status', type: 'select', options: CAPA_STATUSES, default: 'Open' },
      { key: 'progress', label: 'Progres (%)', type: 'number', min: 0, max: 100, default: 0 },
      { key: 'jenisTindakan', label: 'Jenis tindakan', type: 'select', options: ['Korektif', 'Preventif'], default: 'Korektif' },
      { key: 'efektivitas', label: 'Verifikasi efektivitas', type: 'select', options: ['Belum Diverifikasi', 'Efektif', 'Perlu Tindak Lanjut'], default: 'Belum Diverifikasi' },
    ],
    build: (v, { get, existing }) => {
      const closed = v.status === 'Closed';
      const progress = closed ? 100 : num(v.progress);
      const step = closed ? 7 : Math.max(1, Math.min(6, 1 + Math.floor(progress / 20)));
      return {
        ...existing,
        id: existing?.id ?? nextId(get('capa'), 'CAPA-2026-'),
        tanggal: v.tanggal, bulan: monthOf(v.tanggal), sumber: v.sumber, ref: existing?.ref ?? null, kategori: v.kategori,
        masalah: v.masalah, akarPenyebab: v.akarPenyebab, detailAkar: v.detailAkar || '-', tindakan: v.tindakan || '-',
        departemen: v.departemen, pic: v.pic, target: v.target, tglSelesai: closed ? existing?.tglSelesai ?? TODAY : null,
        status: v.status, progress, tahap: CAPA_STEPS[step - 1], tahapKe: step,
        efektivitas: closed ? v.efektivitas : 'Belum Diverifikasi', jenisTindakan: v.jenisTindakan,
      };
    },
  },
};

// Nilai awal form: dari baris yang diedit atau dari default field.
export function initialValues(key, row) {
  const form = FORMS[key];
  const base = Object.fromEntries(form.fields.map((f) => [f.key, row ? row[f.key] ?? '' : f.default ?? '']));
  return row && form.initial ? { ...base, ...form.initial(row) } : base;
}
