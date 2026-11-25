// Sub-modul = satu dataset dengan halaman sendiri: nama pendek, ikon, dan
// maksimal tiga grafik ringkas. Grafik yang diklik memfilter tabel di bawahnya.
import {
  Radar, Users, MessagesSquare, Target, TrendingUp, ScrollText, MailCheck, ShieldAlert, Crosshair,
  UserRound, Grid3x3, GraduationCap, Award, FileText, ClipboardList, SearchCheck, MessageSquareHeart, Wrench,
} from 'lucide-react';

export const SUBMODULES = {
  pestel: {
    short: 'Isu PESTEL', icon: Radar,
    charts: [
      { id: 'faktor', title: 'Isu per faktor', type: 'bar', field: 'faktor' },
      { id: 'bulan', title: 'Isu per bulan', type: 'monthly', field: 'bulan', stack: 'status', months: 'last6' },
    ],
  },
  stakeholders: {
    short: 'Stakeholder', icon: Users,
    charts: [
      { id: 'peta', title: 'Peta pengaruh & kepentingan', type: 'powerInterest' },
      { id: 'kategori', title: 'Kategori stakeholder', type: 'donut', field: 'kategori' },
    ],
  },
  'stakeholder-comms': {
    short: 'Komunikasi', icon: MessagesSquare,
    charts: [
      { id: 'bulan', title: 'Interaksi per bulan', type: 'monthly', field: 'bulan', months: 'last6' },
      { id: 'media', title: 'Media komunikasi', type: 'donut', field: 'media' },
    ],
  },
  kpi: {
    short: 'KPI', icon: Target,
    charts: [
      { id: 'perspektif', title: 'Capaian per perspektif', type: 'gauges' },
      { id: 'status', title: 'Status KPI', type: 'donut', field: 'status' },
    ],
  },
  'kpi-monthly': {
    short: 'Realisasi Bulanan', icon: TrendingUp,
    charts: [
      { id: 'tren', title: 'Capaian KPI utama (%)', type: 'kpiTrend' },
      { id: 'status', title: 'Status realisasi', type: 'donut', field: 'status' },
    ],
  },
  policies: {
    short: 'Kebijakan', icon: ScrollText,
    charts: [
      { id: 'status', title: 'Status kebijakan', type: 'donut', field: 'status' },
      { id: 'kategori', title: 'Kebijakan per kategori', type: 'bar', field: 'kategori' },
    ],
  },
  'read-receipts': {
    short: 'Read Receipt', icon: MailCheck,
    charts: [
      { id: 'status', title: 'Status baca', type: 'donut', field: 'status' },
      { id: 'metode', title: 'Metode distribusi', type: 'bar', field: 'metode' },
    ],
  },
  risks: {
    short: 'Register Risiko & Peluang', icon: ShieldAlert,
    charts: [
      { id:'heatmap', title:'Matriks IPR risiko', type:'heatmap', kind:'Risiko' },
      { id:'peluang', title:'Matriks IPR peluang', type:'heatmap', kind:'Peluang' },
    ],
  },
  okr: {
    short: 'OKR', icon: Crosshair,
    charts: [
      { id: 'objective', title: 'Progres per objective (%)', type: 'bar', field: 'objective', agg: { field: 'progress', fn: 'avg' }, max: 100, unit: '%' },
      { id: 'status', title: 'Status key result', type: 'donut', field: 'status' },
    ],
  },
  employees: {
    short: 'Matriks Karyawan', icon: UserRound,
    charts: [
      { id: 'level', title: 'Level kompetensi', type: 'donut', field: 'levelKeseluruhan', order: [5, 4, 3, 2, 1], label: (v) => `Level ${v}` },
      { id: 'departemen', title: 'Karyawan per departemen', type: 'bar', field: 'departemen' },
    ],
  },
  'skill-scores': {
    short: 'Nilai Kompetensi', icon: Grid3x3, readOnly: true,
    charts: [
      { id: 'gap', title: 'Gap per kompetensi', type: 'bar', field: 'skill', where: (r) => r.status === 'Gap', whereFilter: { status: 'Gap' } },
      { id: 'level', title: 'Sebaran level', type: 'donut', field: 'level', order: [5, 4, 3, 2, 1], label: (v) => `Level ${v}` },
    ],
  },
  trainings: {
    short: 'Pelatihan', icon: GraduationCap,
    charts: [
      { id: 'bulan', title: 'Pelatihan per bulan', type: 'monthly', field: 'bulan', stack: 'status' },
      { id: 'skill', title: 'Pelatihan per kompetensi', type: 'bar', field: 'skill' },
    ],
  },
  certifications: {
    short: 'Sertifikasi', icon: Award,
    charts: [
      { id: 'status', title: 'Status sertifikat', type: 'donut', field: 'status' },
      { id: 'jenis', title: 'Sertifikat per jenis', type: 'bar', field: 'sertifikasi' },
    ],
  },
  documents: {
    short: 'Master Dokumen', icon: FileText,
    charts: [
      { id: 'kategori', title: 'Kategori dokumen', type: 'donut', field: 'kategori' },
      { id: 'status', title: 'Status dokumen', type: 'bar', field: 'status' },
      { id: 'departemen', title: 'Dokumen per departemen', type: 'bar', field: 'departemen', top: 8 },
    ],
  },
  audits: {
    short: 'Daftar Audit', icon: ClipboardList,
    charts: [
      { id: 'bulan', title: 'Audit per bulan', type: 'monthly', field: 'bulan', stack: 'status' },
      { id: 'area', title: 'Audit per area', type: 'bar', field: 'area' },
    ],
  },
  findings: {
    short: 'Temuan', icon: SearchCheck,
    charts: [
      { id: 'status', title: 'Status temuan', type: 'donut', field: 'status' },
      { id: 'area', title: 'Temuan per area', type: 'bar', field: 'area' },
    ],
  },
  feedback: {
    short: 'Feedback', icon: MessageSquareHeart,
    charts: [
      { id: 'rating', title: 'Distribusi rating', type: 'bar', field: 'rating', order: [5, 4, 3, 2, 1], label: (v) => `${v} bintang` },
      { id: 'bulan', title: 'Sentimen per bulan', type: 'monthly', field: 'bulan', stack: 'sentimen' },
    ],
  },
  capa: {
    short: 'Daftar CAPA', icon: Wrench,
    charts: [
      { id: 'bulan', title: 'CAPA per bulan', type: 'monthly', field: 'bulan', stack: 'status', months: 'last6' },
      { id: 'kategori', title: 'Kategori CAPA', type: 'donut', field: 'kategori' },
      { id: 'akar', title: 'Akar penyebab (6M)', type: 'bar', field: 'akarPenyebab' },
    ],
  },
};

export const chartOf = (dataset, id) => SUBMODULES[dataset].charts.find((c) => c.id === id);
