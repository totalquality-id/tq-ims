// Ringkasan tiap sistem: 4 KPI + 2 grafik pilihan dari sub-modulnya.
// get(key) mengembalikan baris gabungan (data awal + perubahan lokal).
import {
  Radar, Flag, Users, MessagesSquare, Target, Percent, ScrollText, MailCheck, ShieldAlert, Flame, Lightbulb, Crosshair,
  UserCheck, GraduationCap, BadgeAlert, FileText, FileCheck2, FileClock, FileX2, ClipboardCheck, SearchCheck, Star,
  MessageSquareWarning, Hourglass, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { drillHref } from './datasets';
import { LAST6, avgBy, fmtNum, pct } from './data/core';

const count = (rows, f) => rows.filter(f).length;

export const OVERVIEWS = {
  pestel: {
    kpis: (get) => {
      const isu = get('pestel');
      const stk = get('stakeholders');
      return [
        { label: 'Isu PESTEL', value: isu.length, icon: Radar, href: drillHref('pestel') },
        { label: 'Isu prioritas', value: count(isu, (r) => r.status === 'Prioritas'), icon: Flag, tone: 'red', href: drillHref('pestel', { status: 'Prioritas' }) },
        { label: 'Stakeholder', value: stk.length, icon: Users, href: drillHref('stakeholders') },
        { label: 'Interaksi bulan ini', value: count(get('stakeholder-comms'), (r) => r.bulan === LAST6.at(-1)), icon: MessagesSquare, href: drillHref('stakeholder-comms', { bulan: LAST6.at(-1) }) },
      ];
    },
    charts: [['pestel', 'faktor'], ['stakeholders', 'peta']],
  },
  executive: {
    kpis: (get) => {
      const kpi = get('kpi');
      const pol = get('policies');
      const rr = get('read-receipts');
      return [
        { label: 'KPI tercapai', value: `${count(kpi, (r) => r.status === 'Tercapai')}/${kpi.length}`, icon: Target, href: drillHref('kpi', { status: 'Tercapai' }) },
        { label: 'Rata-rata capaian', value: `${fmtNum(avgBy(kpi, (r) => Math.min(100, r.capaian)), 1)}%`, icon: Percent, href: drillHref('kpi') },
        { label: 'Kebijakan aktif', value: count(pol, (r) => r.status === 'Aktif'), icon: ScrollText, href: drillHref('policies', { status: 'Aktif' }) },
        { label: 'Tingkat baca kebijakan', value: `${pct(count(rr, (r) => r.status === 'Sudah Dibaca'), rr.length)}%`, icon: MailCheck, href: drillHref('read-receipts') },
      ];
    },
    charts: [['kpi', 'perspektif'], ['kpi-monthly', 'tren']],
  },
  risk: {
    kpis: (get) => {
      const r = get('risks');
      const active = r.filter((x) => x.jenis === 'Risiko' && x.status !== 'Closed');
      const okr = get('okr');
      return [
        { label: 'Risiko aktif', value: active.length, icon: ShieldAlert, href: drillHref('risks', { jenis: 'Risiko', status: ['Open', 'Mitigasi', 'Monitoring'] }) },
        { label: 'Risiko High IPR', value: count(active, (x) => x.metode==='IPR 3×3' && x.level==='High'), icon: Flame, tone: 'red', href: drillHref('risks', { jenis:'Risiko', metode:'IPR 3×3',level:'High',status:['Open','Mitigasi','Monitoring'] }) },
        { label: 'Peluang', value: count(r, (x) => x.jenis === 'Peluang'), icon: Lightbulb, href: drillHref('risks', { jenis: 'Peluang' }) },
        { label: 'Progres OKR', value: `${Math.round(avgBy(okr, (x) => Math.min(100, x.progress)))}%`, icon: Crosshair, href: drillHref('okr') },
      ];
    },
    charts: [['risks', 'heatmap'], ['okr', 'objective']],
  },
  skill: {
    kpis: (get) => {
      const emp = get('employees');
      const tr = get('trainings');
      const cert = get('certifications');
      return [
        { label: 'Karyawan', value: emp.length, icon: Users, href: drillHref('employees') },
        { label: 'Kompeten', value: `${pct(count(emp, (e) => e.status === 'Kompeten'), emp.length, 0)}%`, icon: UserCheck, href: drillHref('employees', { status: 'Kompeten' }) },
        { label: 'Pelatihan selesai', value: count(tr, (t) => t.status === 'Selesai'), icon: GraduationCap, href: drillHref('trainings', { status: 'Selesai' }) },
        { label: 'Sertifikat akan kadaluarsa', value: count(cert, (c) => c.status === 'Akan Kadaluarsa'), icon: BadgeAlert, tone: 'red', href: drillHref('certifications', { status: 'Akan Kadaluarsa' }) },
      ];
    },
    charts: [['employees', 'level'], ['skill-scores', 'gap']],
  },
  edoc: {
    kpis: (get) => {
      const d = get('documents');
      return [
        { label: 'Total dokumen', value: fmtNum(d.length), icon: FileText, href: drillHref('documents') },
        { label: 'Aktif', value: fmtNum(count(d, (x) => x.status === 'Aktif')), icon: FileCheck2, href: drillHref('documents', { status: 'Aktif' }) },
        { label: 'Dalam workflow', value: count(d, (x) => ['Draft', 'Review', 'Approval'].includes(x.status)), icon: FileClock, href: drillHref('documents', { status: ['Draft', 'Review', 'Approval'] }) },
        { label: 'Kadaluarsa', value: count(d, (x) => x.status === 'Kadaluarsa'), icon: FileX2, tone: 'red', href: drillHref('documents', { status: 'Kadaluarsa' }) },
      ];
    },
    charts: [['documents', 'kategori'], ['documents', 'status']],
  },
  audit: {
    kpis: (get) => {
      const a = get('audits');
      const f = get('findings');
      const fb = get('feedback');
      return [
        { label: 'Audit selesai', value: count(a, (x) => x.status === 'Selesai'), icon: ClipboardCheck, href: drillHref('audits', { status: 'Selesai' }) },
        { label: 'Temuan belum ditutup', value: count(f, (x) => x.status !== 'Tertutup'), icon: SearchCheck, tone: 'red', href: drillHref('findings', { status: ['Terbuka', 'Dalam Proses'] }) },
        { label: 'Rating pelanggan', value: `${fmtNum(avgBy(fb, 'rating'), 1)}/5`, icon: Star, href: drillHref('feedback') },
        { label: 'Komplain', value: count(fb, (x) => x.tipe === 'Komplain'), icon: MessageSquareWarning, href: drillHref('feedback', { tipe: 'Komplain' }) },
      ];
    },
    charts: [['audits', 'bulan'], ['feedback', 'rating']],
  },
  capa: {
    kpis: (get) => {
      const c = get('capa');
      return [
        { label: 'Total CAPA', value: c.length, icon: FileText, href: drillHref('capa') },
        { label: 'Open & on progress', value: count(c, (x) => ['Open', 'On Progress'].includes(x.status)), icon: Hourglass, href: drillHref('capa', { status: ['Open', 'On Progress'] }) },
        { label: 'Overdue', value: count(c, (x) => x.status === 'Overdue'), icon: AlertTriangle, tone: 'red', href: drillHref('capa', { status: 'Overdue' }) },
        { label: 'Closed', value: count(c, (x) => x.status === 'Closed'), icon: CheckCircle2, href: drillHref('capa', { status: 'Closed' }) },
      ];
    },
    charts: [['capa', 'bulan'], ['capa', 'akar']],
  },
};
