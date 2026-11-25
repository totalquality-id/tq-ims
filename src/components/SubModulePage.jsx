'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, ExternalLink, FileSpreadsheet, FilterX, Pencil, Plus, RotateCcw,
  Search, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import AppShell from './AppShell';
import ModuleTabs from './ModuleTabs';
import RecordForm from './RecordForm';
import FilterPanel from './FilterPanel';
import { ChartCard, ownFields } from './ChartPanel';
import { Breadcrumb, Card, CellValue, isNumericCol } from './ui';
import { DATASETS, applyFilters, applyRanges, drillHref, fieldLabel, nounOf, parseFilters } from '@/lib/datasets';
import { IPR, guidance, linkTargets } from '@/lib/ipr';
import { SUBMODULES } from '@/lib/submodules';
import { moduleById } from '@/lib/modules';
import { combine, dataActions, localCount, useStore } from '@/lib/store';
import { fmtDate, fmtNum, monthLabel } from '@/lib/data/core';

const PAGE_SIZES = [10, 25, 50, 100];
const omit = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

// Kolom yang tampil disimpan per dataset di browser ini.
function useColumns(key, columns) {
  const storageKey = `tq-ims:cols:${key}`;
  const defaults = columns.filter((c) => !c.secondary).map((c) => c.key);
  const [chosen, setChosen] = useState(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChosen(JSON.parse(raw)); // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* abaikan */ }
  }, [storageKey]);
  const visible = chosen ?? defaults;
  const toggle = (k) => {
    const next = visible.includes(k) ? visible.filter((x) => x !== k) : [...visible, k];
    setChosen(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* abaikan */ }
  };
  const reset = () => {
    setChosen(null);
    try { localStorage.removeItem(storageKey); } catch { /* abaikan */ }
  };
  return [columns.filter((c) => visible.includes(c.key)), visible, toggle, reset];
}

export default function SubModulePage({ datasetKey }) {
  const ds = DATASETS[datasetKey];
  const sub = SUBMODULES[datasetKey];
  const mod = moduleById(ds.module);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const st = useStore();
  const get = (k) => combine(k, st);
  const allRows = get(datasetKey);
  const changes = localCount(st, datasetKey);

  const { cat, range } = useMemo(() => parseFilters(params), [params]);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [adding, setAdding] = useState(params.get('new') === '1');
  const [newKind,setNewKind]=useState(params.get('jenis')==='Peluang'?'Peluang':'Risiko');
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);
  const [cols, visibleKeys, toggleCol, resetCols] = useColumns(datasetKey, ds.columns);
  const formRef = useRef(null);

  // Form tambah langsung terlihat saat dibuka.
  useEffect(() => {
    if (adding) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [adding]);

  const sortKey = params.get('sort');
  const sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const size = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 25;
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const openId = params.get('open');

  const setParams = (mut, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params.toString());
    mut(next);
    if (!keepPage) next.delete('page');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') === q) return;
      setParams((n) => (q ? n.set('q', q) : n.delete('q')));
    }, 250);
    return () => clearTimeout(t);
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const term = (params.get('q') ?? '').toLowerCase().trim();
  const searched = useMemo(() => {
    if (!term) return allRows;
    return allRows.filter((r) => ds.searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(term)));
  }, [allRows, ds, term]);
  const filtered = useMemo(() => applyRanges(applyFilters(searched, cat), range), [searched, cat, range]);
  const rowsExcept = (fields) => applyRanges(applyFilters(searched, omit(cat, fields)), range);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = a[sortKey]; const y = b[sortKey];
      if (x == null) return 1;
      if (y == null) return -1;
      if (Array.isArray(x)) return 0;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'id')) * dir;
    });
  }, [filtered, sortKey, sortDir]);
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * size, current * size);
  const openRow = openId ? allRows.find((r) => r.id === openId) : null;

  const display = (key, value) => {
    const col = [...ds.columns, ...(ds.extra ?? [])].find((c) => c.key === key);
    if (key === 'bulan' || key === 'bulanTerbit' || col?.type === 'month') return monthLabel(value);
    if (key === 'empId') return get('employees').find((e) => e.id === value)?.nama ?? value;
    if (key === 'kebijakanId') return get('policies').find((p) => p.id === value)?.nama ?? value;
    if (key === 'levelKeseluruhan' || key === 'level') return `Level ${value}`;
    if (col?.type === 'date') return fmtDate(value);
    return value;
  };

  const setCat = (key, vals) => setParams((n) => (vals.length ? n.set(key, vals.join(',')) : n.delete(key)));
  const setRange = (key, from, to) => setParams((n) => {
    if (from) n.set(`${key}.from`, from); else n.delete(`${key}.from`);
    if (to) n.set(`${key}.to`, to); else n.delete(`${key}.to`);
  });
  // Klik grafik: pilih nilai, klik lagi pada nilai yang sama untuk membatalkan.
  const pick = (patch) => {
    if (patch.open) return setParams((n) => n.set('open', patch.open), { keepPage: true });
    const same = Object.entries(patch).every(([k, v]) => (cat[k] ?? []).length === 1 && cat[k][0] === String(v));
    setParams((n) => Object.entries(patch).forEach(([k, v]) => (same ? n.delete(k) : n.set(k, String(v)))));
  };
  const clearAll = () => { setQ(''); router.replace(pathname, { scroll: false }); };
  const setSort = (key) => setParams((n) => {
    if (sortKey === key) n.set('dir', sortDir === 'asc' ? 'desc' : 'asc');
    else { n.set('sort', key); n.set('dir', 'desc'); }
  });
  const openRecord = (id) => { setEditing(false); setConfirmDelete(false); setParams((n) => n.set('open', id), { keepPage: true }); };
  const closeRecord = () => { setEditing(false); setConfirmDelete(false); setParams((n) => n.delete('open'), { keepPage: true }); };
  const closeForm = () => { setAdding(false); if (params.get('new')) setParams((n) => n.delete('new'), { keepPage: true }); };

  const save = (row) => {
    dataActions.add(datasetKey, row);
    if(datasetKey==='risks') {
      setAdding(false);
      setParams(n=>{n.delete('new');n.set('open',row.id);if(n.has('jenis')) n.set('jenis',row.jenis);});
    } else closeForm();
    setToast(`${row.id} berhasil ditambahkan`);
  };
  const saveEdit = (row) => {
    dataActions.update(datasetKey, openRow.id, row);
    setEditing(false);
    setToast(`${openRow.id} berhasil diperbarui`);
  };
  const remove = () => {
    const id = openRow.id;
    dataActions.remove(datasetKey, id);
    closeRecord();
    setToast(`${id} dihapus`);
  };
  const resetData = () => { dataActions.reset(datasetKey); setConfirmReset(false); setToast('Data dikembalikan ke kondisi awal'); };

  const exportRows = async (kind) => {
    const all = [...cols, ...(ds.extra ?? [])].filter((c) => c.type !== 'skills');
    const data = sorted.map((r) => Object.fromEntries(all.map((c) => [c.label, Array.isArray(r[c.key]) ? r[c.key].join(' ') : r[c.key] ?? ''])));
    const name = `${datasetKey}-${new Date().toISOString().slice(0, 10)}`;
    if (kind === 'csv') {
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [all.map((c) => esc(c.label)).join(','), ...data.map((d) => all.map((c) => esc(d[c.label])).join(','))].join('\n');
      const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      Object.assign(document.createElement('a'), { href: url, download: `${name}.csv` }).click();
      URL.revokeObjectURL(url);
    } else {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sub.short.slice(0, 31));
      XLSX.writeFile(wb, `${name}.xlsx`);
    }
  };

  const catChips = Object.entries(cat);
  const rangeChips = Object.entries(range);
  const filterCount = catChips.length + rangeChips.length;
  const summary = ds.summary?.(filtered) ?? [];
  const canEdit = !sub.readOnly;

  return (
    <AppShell moduleId={mod.id} datasetKey={datasetKey} title={sub.short}>
      <Breadcrumb items={[{ label: 'Semua Sistem', href: '/' }, { label: mod.short, href: `/${mod.id}` }, { label: sub.short }]} />
      <div className="page-title-row">
        <h1>{sub.short}</h1>
        <div className="page-header-actions">
          {changes > 0 && (confirmReset ? (
            <span className="inline-confirm">
              Kembalikan data awal?
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmReset(false)}>Batal</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={resetData}>Reset</button>
            </span>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmReset(true)} title="Hapus semua perubahan lokal di sub-modul ini">
              <RotateCcw />Reset ({changes})
            </button>
          ))}
          {datasetKey==='risks' && ['Risiko','Peluang'].map(kind=><button key={kind} type="button" className={'btn btn-sm '+(kind==='Risiko'?'btn-outline':'btn-primary')} disabled={adding} onClick={()=>{setNewKind(kind);setAdding(true);}}><Plus/>Tambah {kind.toLowerCase()}</button>)}
          {canEdit && datasetKey!=='risks' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)} disabled={adding}><Plus />Tambah {nounOf(ds)}</button>}
        </div>
      </div>
      <ModuleTabs moduleId={mod.id} current={datasetKey} />

      <div className="stack">
        {datasetKey==='risks' && <div className="page-header-actions" role="group" aria-label="Jenis register">{['Semua','Risiko','Peluang'].map(kind=>{
          const current=kind==='Semua'?!cat.jenis?.length:cat.jenis?.length===1 && cat.jenis[0]===kind;
          return <button key={kind} className={'btn btn-sm '+(current?'btn-soft':'btn-outline')} type="button" aria-pressed={current} onClick={()=>setCat('jenis',kind==='Semua'?[]:[kind])}>{kind}</button>;
        })}</div>}
        <div className="kpi-grid">
          {summary.map((s) => (
            <div key={s.label} className="kpi-card">
              <div className="kpi-text">
                <div className="kpi-label">{s.label}</div>
                <div className="kpi-value" style={{ color: s.tone === 'red' ? 'var(--red-600)' : undefined }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={sub.charts.length > 2 ? 'grid-3' : 'grid-2'}>
          {sub.charts.map((c) => (
            <ChartCard key={c.id} cfg={c} rows={rowsExcept(ownFields(c))} selected={cat} onPick={pick} />
          ))}
        </div>

        {adding && (
          <div ref={formRef} style={{ scrollMarginTop: 80 }}>
          <Card title={`Tambah ${datasetKey==='risks'?newKind.toLowerCase():nounOf(ds)}`} actions={<button type="button" className="icon-btn" onClick={closeForm} aria-label="Tutup form"><X size={18} /></button>}>
            <RecordForm datasetKey={datasetKey} initialType={newKind} get={get} onSubmit={save} onCancel={closeForm} submitLabel="Simpan" />
          </Card>
          </div>
        )}

        <Card flush>
          <div className="table-toolbar">
            <div className="toolbar">
              <div className="search-field">
                <Search aria-hidden />
                <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Cari ${nounOf(ds)}`} aria-label="Cari" />
              </div>
              <button type="button" className={`btn btn-sm ${showFilters || filterCount ? 'btn-soft' : 'btn-outline'}`} aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
                <SlidersHorizontal />Filter{filterCount ? ` (${filterCount})` : ''}
              </button>
              <div className="cols-menu">
                <button type="button" className="btn btn-outline btn-sm" aria-expanded={showCols} onClick={() => setShowCols((v) => !v)}><Columns3 />Kolom</button>
                {showCols && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowCols(false)} />
                    <div className="ms-menu right">
                      <div className="ms-list">
                        {ds.columns.map((c) => (
                          <label key={c.key} className="ms-option">
                            <input type="checkbox" checked={visibleKeys.includes(c.key)} onChange={() => toggleCol(c.key)} />
                            <span className="ms-name">{c.label}</span>
                          </label>
                        ))}
                      </div>
                      <button type="button" className="btn-ghost ms-clear" onClick={resetCols}>Kolom bawaan</button>
                    </div>
                  </>
                )}
              </div>
              <div className="spacer" />
              <span className="muted">{fmtNum(filtered.length)} dari {fmtNum(allRows.length)}</span>
              <div className="cols-menu">
                <button type="button" className="btn btn-outline btn-sm" aria-expanded={showExport} onClick={() => setShowExport((v) => !v)}><Download />Export</button>
                {showExport && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowExport(false)} />
                    <div className="ms-menu right" style={{ minWidth: 200 }}>
                      <button type="button" className="ms-option" onClick={() => { setShowExport(false); exportRows('xlsx'); }}><FileSpreadsheet size={16} />Excel (.xlsx)</button>
                      <button type="button" className="ms-option" onClick={() => { setShowExport(false); exportRows('csv'); }}><Download size={16} />CSV</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {showFilters && (
              <FilterPanel ds={ds} rowsFor={(key) => rowsExcept([key])} cat={cat} range={range} setCat={setCat} setRange={setRange} display={display} />
            )}

            {(filterCount > 0 || term) && (
              <div className="filter-chips">
                {catChips.map(([k, vals]) => (
                  <span key={k} className="filter-chip">
                    {fieldLabel(ds, k)}: <b>{vals.length > 3 ? `${vals.length} dipilih` : vals.map((v) => display(k, v)).join(', ')}</b>
                    <button type="button" onClick={() => setCat(k, [])} aria-label={`Hapus filter ${fieldLabel(ds, k)}`}><X /></button>
                  </span>
                ))}
                {rangeChips.map(([k, r]) => (
                  <span key={k} className="filter-chip">
                    {fieldLabel(ds, k)}: <b>{r.from ? display(k, r.from) : 'awal'} s.d. {r.to ? display(k, r.to) : 'akhir'}</b>
                    <button type="button" onClick={() => setRange(k, '', '')} aria-label={`Hapus filter ${fieldLabel(ds, k)}`}><X /></button>
                  </span>
                ))}
                <button type="button" className="btn-ghost" onClick={clearAll}><FilterX />Hapus semua filter</button>
              </div>
            )}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="num" style={{ width: 56 }}>No</th>
                  {cols.map((c) => {
                    const sortable = c.type !== 'skills';
                    const active = sortKey === c.key;
                    const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th key={c.key} className={`${isNumericCol(c) ? 'num' : ''} ${sortable ? 'sortable' : ''} ${active ? 'sorted' : ''}`}
                        onClick={sortable ? () => setSort(c.key) : undefined} aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}>
                        {c.label}{sortable && <Icon className="sort-icon" aria-hidden />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={cols.length + 1} className="cell-empty">Tidak ada data yang cocok.</td></tr>
                )}
                {visible.map((r, i) => (
                  <tr key={r.id} className="clickable" onClick={() => openRecord(r.id)}>
                    <td className="num muted">
                      {(current - 1) * size + i + 1}
                      {r._local && <span className={`local-tag ${r._local}`}>{r._local === 'new' ? 'Baru' : 'Diubah'}</span>}
                    </td>
                    {cols.map((c) => (
                      <td key={c.key} className={isNumericCol(c) ? 'num' : ''}><CellValue col={c} row={r} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span className="flex items-center gap-2">
              Baris per halaman
              <select className="form-select sm" value={size} onChange={(e) => setParams((n) => n.set('size', e.target.value))} aria-label="Baris per halaman">
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </span>
            <span className="pager-nav">
              <span>{sorted.length ? `${(current - 1) * size + 1}-${Math.min(current * size, sorted.length)} dari ${fmtNum(sorted.length)}` : '0 data'}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={current <= 1} onClick={() => setParams((n) => n.set('page', current - 1), { keepPage: true })}>Sebelumnya</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={current >= pages} onClick={() => setParams((n) => n.set('page', current + 1), { keepPage: true })}>Berikutnya</button>
            </span>
          </div>
        </Card>
      </div>

      {openRow && (
        <RecordDrawer
          ds={ds} datasetKey={datasetKey} row={openRow} get={get} canEdit={canEdit}
          editing={editing} setEditing={setEditing} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
          onSave={saveEdit} onRemove={remove} onClose={closeRecord}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </AppShell>
  );
}

function RecordDrawer({ ds, datasetKey, row, get, canEdit, editing, setEditing, confirmDelete, setConfirmDelete, onSave, onRemove, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const fields = [...ds.columns.filter((c) => c.key !== ds.titleKey), ...(ds.extra ?? [])].filter((c, i, arr) => arr.findIndex((x) => x.key === c.key) === i);
  const related = [...(ds.related?.(row) ?? [])];
  const missing=[];
  for (const ref of row.actionRefs || []) {
    const [target,id]=ref.split('/');
    const item=linkTargets.includes(target) && get(target).find(r=>r.id===id);
    if(item) related.push({label:'Tindakan · '+id+' · '+item[DATASETS[target].titleKey],dataset:target,filters:{id},open:id});
    else missing.push(ref);
  }
  if(linkTargets.includes(datasetKey)){
    for(const r of get('risks').filter(r=>r.actionRefs?.includes(datasetKey+'/'+row.id))){
      related.push({label:r.jenis+' · '+r.id+' · '+r.deskripsi,dataset:'risks',filters:{id:r.id},open:r.id});
    }
  }
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Detail ${ds.singular}`}>
        <div className="drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cell-code" style={{ marginBottom: 4 }}>{row.id}{row._local && <span className={`local-tag ${row._local}`}>{row._local === 'new' ? 'Baru' : 'Diubah'}</span>}</div>
            <h3>{row[ds.titleKey]}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div className="drawer-body">
          {editing ? (
            <RecordForm datasetKey={datasetKey} row={row} get={get} onSubmit={onSave} onCancel={() => setEditing(false)} submitLabel="Simpan perubahan" />
          ) : (
            <>
              {datasetKey==='risks' && <section className="ipr-preview"><strong>{row.metode} · {row.kemungkinan} × {row.dampak} = {row.skor} · {row.level}</strong>
                <p>{row.metode===IPR?guidance(row.jenis,row.level):'Gunakan Ubah untuk menilai ulang dengan kriteria IPR 3×3.'}</p></section>}
              <dl className="detail-grid">
                {fields.filter(c=>c.key!=='actionRefs' && !(datasetKey==='risks' && row.jenis==='Peluang' && c.key.startsWith('residual'))).map((c) => (
                  <div key={c.key} className={c.full || c.type === 'skills' ? 'full' : ''}>
                    <dt>{datasetKey==='risks'?({akibat:row.jenis==='Risiko'?'Akibat terhadap proses atau pelanggan':'Manfaat yang diharapkan',dampak:row.jenis==='Risiko'?'Keparahan dampak':'Dampak positif',pengendalian:row.jenis==='Risiko'?'Tindakan pengendalian atau mitigasi':'Tindakan untuk merealisasikan peluang'}[c.key] || c.label):c.label}</dt>
                    <dd><CellValue col={c.type === 'title' ? { ...c, type: 'text' } : c} row={row} /></dd>
                  </div>
                ))}
              </dl>
              {missing.map(ref=><p className="muted" key={ref}>Rekaman {ref} sudah tidak tersedia.</p>)}
              {related.length > 0 && (
                <>
                  <div className="section-label">Data terkait</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {related.map((rel) => {
                      const n = applyFilters(get(rel.dataset), Object.fromEntries(Object.entries(rel.filters).map(([k, v]) => [k, [String(v)]]))).length;
                      return (
                        <Link key={rel.label} href={drillHref(rel.dataset, rel.filters, { open: rel.open })} className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
                          <span>{rel.label}</span>
                          <span className="flex items-center gap-2"><span className="badge badge-info">{n}</span><ExternalLink /></span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        {canEdit && !editing && (
          <div className="drawer-foot">
            {confirmDelete ? (
              <>
                <span className="muted">Hapus data ini?</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(false)}>Batal</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}><Trash2 />Hapus</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(true)}><Trash2 />Hapus</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><Pencil />Ubah</button>
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
