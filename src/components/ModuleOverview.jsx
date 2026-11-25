'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus } from 'lucide-react';
import AppShell from './AppShell';
import ModuleTabs from './ModuleTabs';
import { DocumentShelf } from './DocumentFiles';
import { ChartCard } from './ChartPanel';
import { Breadcrumb, Kpi } from './ui';
import { moduleById } from '@/lib/modules';
import { OVERVIEWS } from '@/lib/overviews';
import { SUBMODULES, chartOf } from '@/lib/submodules';
import { DATASETS, drillHref, nounOf } from '@/lib/datasets';
import { combine, localCount, useStore } from '@/lib/store';
import { fmtNum } from '@/lib/data/core';

export default function ModuleOverview({ moduleId }) {
  const mod = moduleById(moduleId);
  const ov = OVERVIEWS[moduleId];
  const router = useRouter();
  const st = useStore();
  const get = (k) => combine(k, st);

  return (
    <AppShell moduleId={mod.id} title={mod.short}>
      <Breadcrumb items={[{ label: 'Semua Sistem', href: '/' }, { label: mod.short }]} />
      <div className="page-title-row">
        <div>
          <div className="page-eyebrow">{mod.clause}</div>
          <h1>{mod.name}</h1>
        </div>
      </div>
      <ModuleTabs moduleId={mod.id} />

      <div className="stack">
        {mod.id==='edoc' && <DocumentShelf docs={get('documents')}/>} 
        <div className="kpi-grid">
          {ov.kpis(get).map((k) => <Kpi key={k.label} {...k} />)}
        </div>

        <div className="grid-2">
          {ov.charts.map(([ds, id]) => (
            <ChartCard
              key={`${ds}-${id}`}
              cfg={chartOf(ds, id)}
              rows={get(ds)}
              href={drillHref(ds)}
              onPick={(patch) => router.push(patch.open ? drillHref(ds, { id: patch.open }, { open: patch.open }) : drillHref(ds, patch))}
            />
          ))}
        </div>

        <div>
          <h2 className="section-heading">Sub-modul</h2>
          <div className="sub-grid">
            {mod.datasets.map((k) => {
              const sub = SUBMODULES[k];
              const Icon = sub.icon;
              const n = localCount(st, k);
              return (
                <div key={k} className="sub-card">
                  <Link href={drillHref(k)} className="sub-card-main">
                    <span className="sub-icon"><Icon aria-hidden /></span>
                    <span className="sub-text">
                      <strong>{sub.short}</strong>
                      <span>{fmtNum(get(k).length)} {nounOf(DATASETS[k])}{n ? `, ${n} perubahan lokal` : ''}</span>
                    </span>
                    <ChevronRight className="sub-go" aria-hidden />
                  </Link>
                  {!sub.readOnly && (
                    <Link href={`${drillHref(k)}?new=1`} className="sub-add" title={`Tambah ${nounOf(DATASETS[k])}`} aria-label={`Tambah ${nounOf(DATASETS[k])}`}>
                      <Plus aria-hidden />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
