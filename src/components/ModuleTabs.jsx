'use client';

import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { workspaces, moduleWork } from '@/lib/workspace';
import { moduleById } from '@/lib/modules';
import { SUBMODULES } from '@/lib/submodules';
import { drillHref } from '@/lib/datasets';

// Navigasi antar sub-modul dalam satu sistem (tetap terlihat walau sidebar disembunyikan).
export default function ModuleTabs({ moduleId, current }) {
  const mod = moduleById(moduleId);
  if (!mod.datasets.length) return null;
  return (
    <nav className="subnav" aria-label={`Sub-modul ${mod.short}`}>
      <Link href={`/${mod.id}`} className={!current ? 'active' : ''} aria-current={!current ? 'page' : undefined}>
        <LayoutDashboard aria-hidden />Ringkasan
      </Link>
      {mod.datasets.map((k) => {
        const Icon = SUBMODULES[k].icon;
        return (
          <Link key={k} href={drillHref(k)} className={current === k ? 'active' : ''} aria-current={current === k ? 'page' : undefined}>
            <Icon aria-hidden />{SUBMODULES[k].short}
          </Link>
        );
      })}
      {(moduleWork[moduleId] || []).map(slug => <Link key={slug} href={'/fitur/'+slug}>{workspaces[slug][2]}</Link>)}
    </nav>
  );
}
