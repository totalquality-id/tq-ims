'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import AppShell from './AppShell';
import { ChartCard } from './ChartPanel';
import { Badge, Breadcrumb, Card, Seg } from './ui';
import { MODULES, moduleById } from '@/lib/modules';
import { chartOf } from '@/lib/submodules';
import { drillHref } from '@/lib/datasets';
import { ACTIVITIES } from '@/lib/activity';
import { combine, useStore } from '@/lib/store';
import { TODAY, daysBetween, fmtDate, pct } from '@/lib/data/core';

const count = (rows, f) => rows.filter(f).length;

// Satu angka kunci + status per sistem.
function health(get) {
  const kpi = get('kpi');
  const risks = get('risks').filter((r) => r.jenis === 'Risiko' && r.status !== 'Closed');
  const emp = get('employees');
  const docs = get('documents');
  const fnd = get('findings');
  const capa = get('capa');
  const isu = get('pestel');
  const okKpi = count(kpi, (k) => k.status === 'Tercapai');
  const kompeten = pct(count(emp, (e) => e.status === 'Kompeten'), emp.length, 0);
  const high = count(risks, r => r.metode==='IPR 3×3' && r.level==='High');
  const expired = count(docs, (d) => d.status === 'Kadaluarsa');
  const late = count(fnd, (f) => f.terlambat === 'Ya' && f.status !== 'Tertutup');
  const overdue = count(capa, (c) => c.status === 'Overdue');
  const prioritas = count(isu, (i) => i.status === 'Prioritas');
  return {
    pestel: { metric: `${prioritas} isu prioritas`, ok: prioritas <= 10 },
    executive: { metric: `${okKpi}/${kpi.length} KPI tercapai`, ok: okKpi / kpi.length >= 0.55 },
    risk: { metric: `${high} risiko High IPR`, ok: high <= 2 },
    skill: { metric: `${kompeten}% karyawan kompeten`, ok: kompeten >= 75 },
    edoc: { metric: `${expired} dokumen kadaluarsa`, ok: expired <= 3 },
    audit: { metric: `${late} temuan lewat deadline`, ok: late <= 5 },
    capa: { metric: `${overdue} CAPA overdue`, ok: overdue <= 3 },
  };
}

// Daftar pekerjaan yang perlu ditindaklanjuti, diurutkan dari yang paling mendesak.
function tasks(get) {
  const list = [];
  const due = (d) => (d ? daysBetween(TODAY, d) : 999);
  for (const c of get('capa').filter((x) => x.status === 'Overdue')) {
    list.push({ group: 'CAPA', module: 'capa', title: `${c.id} melewati target`, detail: c.masalah, when: c.target, score: due(c.target), href: drillHref('capa', { id: c.id }, { open: c.id }) });
  }
  for (const f of get('findings').filter((x) => x.status !== 'Tertutup' && x.terlambat === 'Ya')) {
    list.push({ group: 'Audit', module: 'audit', title: `Temuan ${f.kategori.toLowerCase()} belum ditutup`, detail: `${f.deskripsi}, ${f.area}`, when: f.deadline, score: due(f.deadline), href: drillHref('findings', { id: f.id }, { open: f.id }) });
  }
  for (const fb of get('feedback').filter((x) => x.tipe === 'Komplain' && x.status !== 'Selesai')) {
    list.push({ group: 'Audit', module: 'audit', title: `Komplain dari ${fb.pelanggan}`, detail: fb.komentar, when: fb.tanggal, score: 5, href: drillHref('feedback', { id: fb.id }, { open: fb.id }) });
  }
  for (const d of get('documents').filter((x) => x.status === 'Kadaluarsa')) {
    list.push({ group: 'Dokumen', module: 'edoc', title: `${d.id} lewat jadwal review`, detail: d.nama, when: d.tglReview, score: due(d.tglReview), href: drillHref('documents', { id: d.id }, { open: d.id }) });
  }
  for (const c of get('certifications').filter((x) => x.status === 'Akan Kadaluarsa')) {
    list.push({ group: 'SDM', module: 'skill', title: `Sertifikat ${c.karyawan} akan kadaluarsa`, detail: c.sertifikasi, when: c.kadaluarsa, score: c.sisaHari, href: drillHref('certifications', { id: c.id }, { open: c.id }) });
  }
  for (const r of get('risks').filter((x) => x.jenis==='Risiko' && x.metode==='IPR 3×3' && x.level==='High' && x.status!=='Closed')) {
    list.push({ group: 'Risiko', module: 'risk', title: 'Risiko High perlu mitigasi', detail: r.deskripsi, when: r.target, score: due(r.target), href: drillHref('risks', { id: r.id }, { open: r.id }) });
  }
  for (const k of get('okr').filter((x) => ['At Risk', 'Belum Tercapai'].includes(x.status))) {
    list.push({ group: 'Risiko', module: 'risk', title: `Key result ${k.status.toLowerCase()}`, detail: k.keyResult, when: k.updateTerakhir, score: 30, href: drillHref('okr', { id: k.id }, { open: k.id }) });
  }
  return list.sort((a, b) => a.score - b.score);
}

const QUICK = [
  ['capa', 'CAPA baru'],
  ['findings', 'Catat temuan'],
  ['feedback', 'Input feedback'],
  ['risks', 'Tambah risiko atau peluang'],
  ['documents', 'Tambah dokumen'],
  ['kpi-monthly', 'Input realisasi KPI'],
];

export default function DisoOverview() {
  const router = useRouter();
  const st = useStore();
  const get = (k) => combine(k, st);
  const h = health(get);
  const all = tasks(get);
  const [group, setGroup] = useState('Semua');
  const [expanded, setExpanded] = useState(false);
  const groups = ['Semua', ...new Set(all.map((t) => t.group))];
  const shown = (group === 'Semua' ? all : all.filter((t) => t.group === group));

  return (
    <AppShell moduleId="d-iso" title="D-ISO 360°">
      <Breadcrumb items={[{ label: 'Semua Sistem', href: '/' }, { label: 'D-ISO 360°' }]} />
      <div className="page-title-row">
        <div>
          <div className="page-eyebrow">Klausul 4-10</div>
          <h1>D-ISO 360°</h1>
        </div>
      </div>

      <div className="stack">
        <div className="health-grid">
          {MODULES.filter((m) => m.id !== 'd-iso').map((m) => (
            <Link key={m.id} href={`/${m.id}`} className="health-card">
              <span className="health-top">
                <span className="health-icon"><m.icon aria-hidden /></span>
                {h[m.id].ok ? <Badge value="Baik" /> : <Badge value="Perlu Perhatian">Perhatian</Badge>}
              </span>
              <strong>{m.short}</strong>
              <span className="health-metric">{h[m.id].metric}</span>
            </Link>
          ))}
        </div>

        <div className="grid-main-side">
          <Card title={`Perlu tindakan (${all.length})`} flush actions={<Seg value={group} onChange={(g) => { setGroup(g); setExpanded(false); }} options={groups.map((g) => [g, g, g === 'Semua' ? all.length : all.filter((t) => t.group === g).length])} />}>
            <div className="task-list">
              {(expanded ? shown : shown.slice(0, 8)).map((t, i) => {
                const Icon = moduleById(t.module).icon;
                return (
                  <Link key={`${t.href}-${i}`} href={t.href} className="task-item">
                    <span className="feed-icon tone-blue"><Icon aria-hidden /></span>
                    <span className="feed-body"><strong>{t.title}</strong><br />{t.detail}</span>
                    <span className="task-when">{t.when ? fmtDate(t.when) : ''}</span>
                    <ChevronRight className="sub-go" aria-hidden />
                  </Link>
                );
              })}
              {shown.length === 0 && <div className="cell-empty">Tidak ada yang perlu ditindaklanjuti.</div>}
            </div>
            {shown.length > 8 && (
              <div className="card-footer">
                <button type="button" className="btn-ghost" onClick={() => setExpanded((v) => !v)}>{expanded ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${shown.length})`}</button>
              </div>
            )}
          </Card>
          <div className="stack">
            <Card title="Input cepat">
              <div className="quick-grid">
                <Link href="/fitur/analisis" className="btn btn-soft btn-sm">Analisis mutu</Link>
                <Link href="/fitur/rapat" className="btn btn-soft btn-sm">Tinjauan manajemen</Link>
                <Link href="/fitur/integrasi" className="btn btn-soft btn-sm">Integrasi & layanan</Link>
                {QUICK.map(([k, label]) => (
                  <Link key={k} href={`${drillHref(k)}?new=1`} className="btn btn-outline btn-sm"><Plus />{label}</Link>
                ))}
              </div>
            </Card>
            <Card title="Aktivitas terbaru" flush className="grow">
              <div className="feed fill-scroll" style={{ minHeight: 200 }}>
                {ACTIVITIES.slice(0, 12).map((a, i) => (
                  <Link key={i} href={a.href} className="feed-item">
                    <span className="feed-body"><strong>{a.who}</strong> {a.what}<br />{a.detail}</span>
                    <span className="feed-time">{a.when}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid-2">
          <ChartCard cfg={chartOf('kpi-monthly', 'tren')} rows={get('kpi-monthly')} href={drillHref('kpi-monthly')} onPick={(p) => router.push(drillHref('kpi-monthly', p))} />
          <ChartCard cfg={{ ...chartOf('okr', 'status'), title: 'Status OKR' }} rows={get('okr')} href={drillHref('okr')} onPick={(p) => router.push(drillHref('okr', p))} />
        </div>
      </div>
    </AppShell>
  );
}
