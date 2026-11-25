'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, LayoutGrid, Menu, PanelLeftClose, PanelLeftOpen, Search, Tags, X } from 'lucide-react';
import { MODULES, moduleById } from '@/lib/modules';
import { DATASETS, drillHref } from '@/lib/datasets';
import { NOTIFICATIONS } from '@/lib/activity';
import { COMPANY, CONSULTANT, DEMO_USER, TODAY, MONTH_FULL } from '@/lib/data/core';
import { SIDEBAR_INTRO_KEY } from '@/lib/ui-state';
import { SUBMODULES } from '@/lib/submodules';
import { combine, useStore } from '@/lib/store';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const todayLabel = () => {
  const d = new Date(TODAY + 'T00:00:00');
  return { day: DAYS[d.getDay()], date: `${d.getDate()} ${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}` };
};
const initials = (name) => name.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export default function AppShell({ moduleId, datasetKey, title, subtitle, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (open) setOpen(false);
  }

  // Dibuka dari halaman main: sidebar terlihat sebentar, lalu bergeser keluar
  // supaya dashboard tampil penuh tetapi pengguna tahu sidebar tersedia.
  useEffect(() => {
    let intro = null;
    try { intro = sessionStorage.getItem(SIDEBAR_INTRO_KEY); } catch { /* mode privat */ }
    if (!intro || !window.matchMedia('(min-width: 1024px)').matches) return;
    const root = document.documentElement;
    root.dataset.sidebarInstant = '';
    delete root.dataset.sidebar;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => { delete root.dataset.sidebarInstant; }));
    const timer = setTimeout(() => {
      try { sessionStorage.removeItem(SIDEBAR_INTRO_KEY); } catch { /* mode privat */ }
      delete root.dataset.sidebarInstant;
      root.dataset.sidebar = 'hidden';
    }, 900);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);

  return (
    <div className="app-layout">
      <Sidebar moduleId={moduleId} datasetKey={datasetKey} open={open} onClose={() => setOpen(false)} />
      {open && <div className="sidebar-mobile-overlay" onClick={() => setOpen(false)} aria-hidden />}
      <div className="main-content">
        <Header title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
        <main id="main-content" className="page-container page-enter">{children}</main>
        <footer className="app-footer no-print">
          <span>© 2026 {CONSULTANT.name}</span>
          <span>{COMPANY.name}</span>
        </footer>
      </div>
    </div>
  );
}

function Sidebar({ moduleId, datasetKey, open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Navigasi utama">
      <div className="sidebar-logo">
        <Link href="/">
          <Image src="/brand/tq-logo.png" alt="Logo Total Quality" width={58} height={34} priority />
          <span className="sidebar-logo-text">
            <span className="sidebar-logo-name">D-ISO</span>
            <span className="sidebar-logo-sub">ISO 9001:2026</span>
          </span>
        </Link>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Tutup navigasi"><X size={20} /></button>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          <Link href="/" className={`nav-item ${!moduleId ? 'active' : ''}`}>
            <LayoutGrid className="nav-icon" aria-hidden />
            <span className="nav-label">Semua Sistem</span>
          </Link>
        </div>
        <div className="nav-section">
          <div className="nav-section-label">Sistem</div>
          {MODULES.map((m) => {
            const active = m.id === moduleId;
            return (
              <div key={m.id}>
                <Link href={`/${m.id}`} className={`nav-item ${active && !datasetKey ? 'active' : ''}`} aria-current={active && !datasetKey ? 'page' : undefined}>
                  <span className="nav-letter"><m.icon aria-hidden /></span>
                  <span className="nav-label">{m.short}</span>
                </Link>
                {active && m.datasets.length > 0 && (
                  <div className="nav-sub">
                    {m.datasets.map((k) => (
                      <Link key={k} href={drillHref(k)} className={`nav-subitem ${datasetKey === k ? 'active' : ''}`} aria-current={datasetKey === k ? 'page' : undefined}>
                        {SUBMODULES[k].short}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
      <div className="sidebar-footer">
        <Link href="/pricing" className={`nav-item ${moduleId === 'pricing' ? 'active' : ''}`} aria-current={moduleId === 'pricing' ? 'page' : undefined}>
          <Tags className="nav-icon" aria-hidden />
          <span className="nav-label">Paket & Harga</span>
        </Link>
      </div>
    </aside>
  );
}

// Indeks pencarian global: kode & judul setiap baris di semua dataset.
// Termasuk data yang ditambahkan atau diubah pengguna di browser ini.
function useSearchIndex() {
  const st = useStore();
  return useMemo(() => Object.entries(DATASETS).flatMap(([key, ds]) => combine(key, st).map((r) => ({
    key,
    id: r.id,
    code: r.kode ?? r.id,
    title: String(r[ds.titleKey] ?? ''),
    dataset: SUBMODULES[key].short,
    module: moduleById(ds.module),
    hay: `${r.id} ${r.kode ?? ''} ${r[ds.titleKey] ?? ''}`.toLowerCase(),
  }))), [st]);
}

function GlobalSearch() {
  const index = useSearchIndex();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (term.length < 2) return [];
    const words = term.split(/\s+/);
    return index.filter((x) => words.every((w) => x.hay.includes(w))).slice(0, 8);
  }, [index, term]);
  const modules = term.length >= 2 ? MODULES.filter((m) => `${m.name} ${m.short} ${m.clause}`.toLowerCase().includes(term)).slice(0, 3) : [];

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (href) => { setQ(''); setFocus(false); ref.current?.blur(); router.push(href); };
  const all = [
    ...modules.map((m) => ({ href: `/${m.id}`, label: m.name, sub: m.clause, Icon: m.icon })),
    ...results.map((r) => ({ href: drillHref(r.key, { id: r.id }, { open: r.id }), label: r.title, sub: `${r.code}, ${r.dataset}`, Icon: r.module?.icon })),
  ];
  return (
    <div className="header-search">
      <Search size={17} aria-hidden />
      <input
        ref={ref}
        value={q}
        placeholder="Cari CAPA, dokumen, karyawan (Ctrl+K)"
        aria-label="Pencarian global"
        onChange={(e) => { setQ(e.target.value); setSel(0); }}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, all.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
          if (e.key === 'Enter' && all[sel]) go(all[sel].href);
          if (e.key === 'Escape') { setQ(''); ref.current?.blur(); }
        }}
      />
      {focus && term.length >= 2 && (
        <div className="search-results" role="listbox">
          {all.length === 0 && <div className="muted" style={{ padding: 10 }}>{`Tidak ada hasil untuk "${q}".`}</div>}
          {all.map((r, i) => (
            <button key={r.href} type="button" className={`search-result ${i === sel ? 'active' : ''}`} onMouseDown={() => go(r.href)} onMouseEnter={() => setSel(i)}>
              <span className="nav-letter">{r.Icon && <r.Icon aria-hidden />}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                <small>{r.sub}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Status sidebar tersimpan di <html data-sidebar>, dipasang sebelum render oleh skrip di layout.
const subscribeSidebar = (cb) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sidebar'] });
  return () => obs.disconnect();
};

function useSidebarHidden() {
  const hidden = useSyncExternalStore(subscribeSidebar, () => document.documentElement.dataset.sidebar === 'hidden', () => false);
  const toggle = () => {
    const next = !hidden;
    if (next) document.documentElement.dataset.sidebar = 'hidden';
    else delete document.documentElement.dataset.sidebar;
    try { localStorage.setItem('sidebar', next ? 'hidden' : 'shown'); } catch { /* mode privat */ }
  };
  return [hidden, toggle];
}

function Header({ title, subtitle, onMenu }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarHidden, toggleSidebar] = useSidebarHidden();
  const t = todayLabel();
  return (
    <header className="header">
      <button type="button" className="icon-btn mobile-menu-btn" onClick={onMenu} aria-label="Buka navigasi"><Menu size={22} /></button>
      <button type="button" className="icon-btn sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'} title={sidebarHidden ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'}>
        {sidebarHidden ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>
      <div className="header-breadcrumb">
        <div className="header-title">{title}</div>
        {subtitle && <div className="header-subtitle">{subtitle}</div>}
      </div>
      <div className="header-actions">
        <GlobalSearch />
        <div style={{ position: 'relative' }}>
          <button type="button" className="header-btn" aria-label={`Notifikasi, ${NOTIFICATIONS.length} baru`} aria-expanded={notifOpen} onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={20} />
            <span className="notif-count">{NOTIFICATIONS.length}</span>
          </button>
          {notifOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setNotifOpen(false)} />
              <div className="popover" role="menu">
                <div className="popover-head">Notifikasi & To-do <span className="badge badge-danger plain">{NOTIFICATIONS.length} baru</span></div>
                <div className="feed" style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {NOTIFICATIONS.map((n) => {
                    const Icon = moduleById(n.module).icon;
                    return (
                    <Link key={n.id} href={n.href} className="feed-item" onClick={() => setNotifOpen(false)}>
                      <span className={`feed-icon ${n.tone === 'red' ? 'tone-red' : 'tone-blue'}`}><Icon aria-hidden /></span>
                      <span className="feed-body"><strong>{n.title}</strong><br />{n.body}</span>
                      <span className="feed-time">{n.time}</span>
                    </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="header-date" suppressHydrationWarning>
          <strong>{t.day}</strong>{t.date}
        </div>
        <div className="user-chip">
          <span className="user-avatar" aria-hidden>{initials(DEMO_USER.name)}</span>
          <span className="user-text">
            <span className="user-name">{DEMO_USER.name}</span>
            <span className="user-role">{DEMO_USER.role}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

// Dipakai halaman detail untuk mengetahui modul asal dari query ?from=.
export function useFromModule(fallback) {
  const params = useSearchParams();
  return params.get('from') ?? fallback;
}
