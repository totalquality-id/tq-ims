// Notifikasi & aktivitas lintas modul, diturunkan dari data yang sama dengan dashboard.
import { capas } from './data/capa';
import { documents } from './data/documents';
import { certifications } from './data/skill';
import { findings, feedback, audits } from './data/audit';
import { risks, okrs } from './data/risk';
import { stakeholderComms } from './data/pestel';
import { drillHref } from './datasets';
import { TODAY, fmtDate, daysBetween } from './data/core';

const ago = (iso) => {
  const d = daysBetween(iso, TODAY);
  return d <= 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : d < 30 ? `${d} hari lalu` : fmtDate(iso);
};

const overdue = capas.filter((c) => c.status === 'Overdue').sort((a, b) => a.target.localeCompare(b.target));
const expiredDocs = documents.filter((d) => d.status === 'Kadaluarsa');
const certSoon = certifications.filter((c) => c.status === 'Akan Kadaluarsa').sort((a, b) => a.sisaHari - b.sisaHari);
const openMajor = findings.filter((f) => f.status !== 'Tertutup' && (f.kategori === 'Major' || f.prioritas === 'High'));
const complaints = feedback.filter((f) => f.tipe === 'Komplain');
const nextAudit = audits.filter((a) => a.status === 'Terjadwal').sort((a, b) => a.tanggal.localeCompare(b.tanggal))[0];
const extremeRisk = risks.filter((r) => r.jenis==='Risiko' && r.level==='High' && r.status !== 'Closed');
const krAtRisk = okrs.filter((k) => k.status === 'At Risk' || k.status === 'Belum Tercapai');

export const NOTIFICATIONS = [
  overdue[0] && { id: 'n1', module: 'capa', tone: 'red', title: `${overdue[0].id} melewati target`, body: overdue[0].masalah, time: `Target ${fmtDate(overdue[0].target)}`, href: drillHref('capa', { id: overdue[0].id }, { open: overdue[0].id }) },
  openMajor[0] && { id: 'n2', module: 'audit', tone: 'peach', title: `Temuan ${openMajor[0].kategori.toLowerCase()} belum ditutup`, body: `${openMajor[0].deskripsi}, ${openMajor[0].area}`, time: ago(openMajor[0].tanggal), href: drillHref('findings', { id: openMajor[0].id }, { open: openMajor[0].id }) },
  complaints[0] && { id: 'n3', module: 'audit', tone: 'rose', title: `Komplain dari ${complaints[0].pelanggan}`, body: complaints[0].komentar, time: ago(complaints[0].tanggal), href: drillHref('feedback', { id: complaints[0].id }, { open: complaints[0].id }) },
  extremeRisk[0] && { id: 'n4', module: 'risk', tone: 'red', title: 'Risiko High perlu mitigasi', body: extremeRisk[0].deskripsi, time: `Skor ${extremeRisk[0].skor}`, href: drillHref('risks', { jenis:'Risiko',metode:'IPR 3×3',level:'High' }) },
  expiredDocs.length && { id: 'n5', module: 'edoc', tone: 'sun', title: `${expiredDocs.length} dokumen melewati masa review`, body: expiredDocs.slice(0, 2).map((d) => d.id).join(', ') + (expiredDocs.length > 2 ? ', ' : ''), time: 'Perlu ditinjau', href: drillHref('documents', { status: 'Kadaluarsa' }) },
  certSoon.length && { id: 'n6', module: 'skill', tone: 'lilac', title: `${certSoon.length} sertifikat akan kadaluarsa`, body: `${certSoon[0].sertifikasi}, ${certSoon[0].karyawan}`, time: `${certSoon[0].sisaHari} hari lagi`, href: drillHref('certifications', { status: 'Akan Kadaluarsa' }) },
  krAtRisk.length && { id: 'n7', module: 'risk', tone: 'sun', title: `${krAtRisk.length} key result belum on track`, body: krAtRisk[0].keyResult, time: 'Review bulanan', href: drillHref('okr', { status: ['At Risk', 'Belum Tercapai'] }) },
  nextAudit && { id: 'n8', module: 'audit', tone: 'blue', title: `Audit terjadwal: ${nextAudit.area}`, body: `${nextAudit.jenis} oleh ${nextAudit.auditor}`, time: fmtDate(nextAudit.tanggal), href: drillHref('audits', { id: nextAudit.id }, { open: nextAudit.id }) },
].filter(Boolean);

const latest = (rows, key, n = 6) => [...rows].filter((r) => r[key]).sort((a, b) => b[key].localeCompare(a[key])).slice(0, n);

export const ACTIVITIES = [
  ...latest(capas.filter((c) => c.status === 'Closed'), 'tglSelesai').map((c) => ({ date: c.tglSelesai, who: c.pic, what: `menutup ${c.id}`, detail: c.masalah, href: drillHref('capa', { id: c.id }, { open: c.id }) })),
  ...latest(documents.filter((d) => d.status === 'Aktif'), 'tglTerbit').map((d) => ({ date: d.tglTerbit, who: d.pemilik, what: `menerbitkan ${d.id}`, detail: d.nama, href: drillHref('documents', { id: d.id }, { open: d.id }) })),
  ...latest(audits.filter((x) => x.status === 'Selesai'), 'tanggal').map((x) => ({ date: x.tanggal, who: x.auditor, what: `menyelesaikan ${x.id}`, detail: `${x.jenis}, skor ${x.skor}%`, href: drillHref('audits', { id: x.id }, { open: x.id }) })),
  ...latest(feedback.filter((f) => f.rating === 5), 'tanggal', 4).map((f) => ({ date: f.tanggal, who: f.pelanggan, what: 'memberi feedback bintang 5', detail: f.komentar, href: drillHref('feedback', { id: f.id }, { open: f.id }) })),
  ...latest(stakeholderComms, 'tanggal').map((k) => ({ date: k.tanggal, who: k.pic, what: `mencatat ${k.media.toLowerCase()}`, detail: `${k.topik}, ${k.stakeholder}`, href: drillHref('stakeholder-comms', { id: k.id }, { open: k.id }) })),
].sort((a, b) => b.date.localeCompare(a.date)).map((x) => ({ ...x, when: ago(x.date) }));
