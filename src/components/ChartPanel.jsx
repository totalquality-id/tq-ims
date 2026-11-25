'use client';

// Satu grafik dari konfigurasi sub-modul. onPick(patch) menerima filter yang
// dipilih ({ field: nilai }) atau { open: id } untuk membuka detail baris.
import Link from 'next/link';
import { BarList, Columns, Donut, PowerInterest, SERIES, StackedBars, TrendLines } from './charts';
import { Card, Gauge, Badge } from './ui';
import { toneOf } from '@/lib/tones';
import { LAST6, MONTHS, avgBy, countBy, monthShort } from '@/lib/data/core';
import { PERSPECTIVES, scoreLabel } from '@/lib/data/executive';
import { IPR, iprLevel } from '@/lib/ipr';

const TONE_HEX = { success: '#2f8a5f', warning: '#d4a73a', danger: '#c2453d', info: '#3b5bdb' };
export const colorFor = (value, i) => TONE_HEX[toneOf(value)] ?? SERIES[i % SERIES.length];

const TREND_KPIS = [
  { kode: 'FIN-01', label: 'Pendapatan' },
  { kode: 'CUS-01', label: 'Kepuasan pelanggan' },
  { kode: 'CUS-02', label: 'On-time delivery' },
  { kode: 'PRC-01', label: 'RFT sewing' },
];
const heatClass = (s) => ({ Low:'heat-low', Moderate:'heat-med', High:'heat-ext' })[iprLevel(s)];


// Kolom URL yang "dimiliki" grafik: dikecualikan saat menghitung grafik itu
// sendiri, supaya pilihan lain tetap terlihat (cross-filter).
export function ownFields(cfg) {
  switch (cfg.type) {
    case 'monthly': return [cfg.field, cfg.stack].filter(Boolean);
    case 'heatmap': return ['kemungkinan', 'dampak'];
    case 'gauges': return ['perspektif'];
    case 'kpiTrend': return ['bulan'];
    case 'powerInterest': return [];
    default: return [cfg.field];
  }
}

function groups(cfg, rows) {
  const src = cfg.where ? rows.filter(cfg.where) : rows;
  let keys = cfg.order ?? Object.entries(countBy(src, cfg.field)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  keys = keys.filter((k) => k !== 'undefined' && k !== 'null');
  const value = (k) => {
    const list = src.filter((r) => String(r[cfg.field]) === String(k));
    return cfg.agg ? Math.round(avgBy(list, cfg.agg.field)) : list.length;
  };
  const out = keys.map((k) => ({ key: String(k), label: cfg.label ? cfg.label(k) : String(k), value: value(k) }));
  return cfg.top ? out.slice(0, cfg.top) : out;
}

export function ChartBody({ cfg, rows, selected = {}, onPick, height = 210 }) {
  const sel = (field) => selected[field] ?? [];
  const pick = (patch) => onPick?.(patch);

  if (cfg.type === 'donut') {
    const s = sel(cfg.field);
    const data = groups(cfg, rows).map((g, i) => ({
      name: g.label, value: g.value, color: colorFor(g.key, i),
      active: s.includes(g.key), dim: s.length > 0 && !s.includes(g.key),
      onClick: () => pick({ [cfg.field]: g.key }),
    }));
    return <Donut data={data} height={height * 0.72} legend="side" />;
  }

  if (cfg.type === 'bar') {
    const s = sel(cfg.field);
    const items = groups(cfg, rows).map((g) => ({
      label: g.label, value: g.value, color: cfg.agg ? undefined : TONE_HEX[toneOf(g.key)],
      active: s.includes(g.key), dim: s.length > 0 && !s.includes(g.key),
      onClick: () => pick({ [cfg.field]: g.key, ...(cfg.whereFilter ?? {}) }),
    }));
    return <BarList items={items} max={cfg.max} unit={cfg.unit ?? ''} />;
  }

  if (cfg.type === 'monthly') {
    const months = cfg.months === 'last6' ? LAST6 : MONTHS;
    if (!cfg.stack) {
      const data = months.map((m) => ({ label: monthShort(m), bulan: m, value: rows.filter((r) => r[cfg.field] === m).length }));
      return <Columns data={data} height={height} name="Jumlah" onPick={(d) => pick({ [cfg.field]: d.bulan })} />;
    }
    const keys = Object.entries(countBy(rows.filter((r) => months.includes(r[cfg.field])), cfg.stack)).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const data = months.map((m) => ({
      label: monthShort(m), bulan: m,
      ...Object.fromEntries(keys.map((k) => [k, rows.filter((r) => r[cfg.field] === m && String(r[cfg.stack]) === k).length])),
    }));
    return (
      <>
        <StackedBars data={data} height={height} series={keys.map((k, i) => ({ key: k, color: colorFor(k, i) }))} onPick={(row, k) => pick({ [cfg.field]: row.bulan, ...(k ? { [cfg.stack]: k } : {}) })} />
        <div className="legend-inline">{keys.map((k, i) => <span key={k}><i style={{ background: colorFor(k, i) }} />{k}</span>)}</div>
      </>
    );
  }

  if (cfg.type === 'heatmap') {
    const kind=cfg.kind;
    const active=rows.filter(r=>r.metode===IPR && r.jenis===kind);
    const axis=kind==='Risiko'?'Frekuensi kejadian':'Kemudahan pelaksanaan';
    const impact=kind==='Risiko'?'Keparahan':'Dampak positif';
    return <div className="heatmap">
      <span/>{[1,2,3].map(i=><span className="axis" key={i}>{impact} {i}</span>)}
      {[1,2,3].map(l=><div key={l} style={{display:'contents'}}>
        <span className="axis" title={axis}>{l}</span>
        {[1,2,3].map(i=>{
          const count=active.filter(r=>r.kemungkinan===l && r.dampak===i).length;
          const label=axis+' '+l+', '+impact+' '+i+' · '+iprLevel(l*i)+' · '+count+' rekaman';
          const selected=sel('jenis').includes(kind) && sel('kemungkinan').includes(String(l)) && sel('dampak').includes(String(i));
          return <button type="button" key={i} aria-label={label} title={label} disabled={!count} className={'heat-cell '+heatClass(l*i)+(selected?' on':'')} onClick={()=>pick({jenis:kind,metode:IPR,kemungkinan:String(l),dampak:String(i)})}>
            <strong>{l*i}</strong><small>{count} rekaman</small></button>;
        })}
      </div>)}
      <span/><span className="heat-caption">Baris menunjukkan {axis.toLowerCase()} · skor 1–9</span>
    </div>;
  }

  if (cfg.type === 'powerInterest') {
    return (
      <>
        <PowerInterest data={rows} height={height + 40} onPick={(d) => pick({ open: d.id })} />
        <div className="legend-inline" style={{ justifyContent: 'center' }}>
          <span><i style={{ background: '#3b5bdb', borderRadius: '50%' }} />Internal</span>
          <span><i style={{ background: '#d4a73a', borderRadius: '50%' }} />Eksternal</span>
        </div>
      </>
    );
  }

  if (cfg.type === 'gauges') {
    const s = sel('perspektif');
    return (
      <div className="gauge-grid">
        {PERSPECTIVES.map((p) => {
          const list = rows.filter((r) => r.perspektif === p.key);
          const v = list.length ? Math.round(avgBy(list, (r) => Math.min(100, r.capaian))) : 0;
          return (
            <button key={p.key} type="button" className={`gauge ${s.includes(p.key) ? 'on' : ''}`} onClick={() => pick({ perspektif: p.key })}>
              <span className="gauge-name">{p.label}</span>
              <Gauge value={v} size={76} stroke={8} />
              <Badge value={scoreLabel(v)} />
            </button>
          );
        })}
      </div>
    );
  }

  if (cfg.type === 'kpiTrend') {
    const data = MONTHS.map((m) => ({
      label: monthShort(m), bulan: m,
      ...Object.fromEntries(TREND_KPIS.map((t) => {
        const r = rows.filter((x) => x.kode === t.kode && x.bulan === m).at(-1);
        return [t.label, r ? r.capaian : null];
      })),
    }));
    return (
      <>
        <TrendLines data={data} height={height} unit="%" target={100} yDomain={[80, 110]} yTicks={[80, 90, 100, 110]}
          series={TREND_KPIS.map((t, i) => ({ key: t.label, color: SERIES[i] }))} onPick={(row) => pick({ bulan: row.bulan })} />
        <div className="legend-inline">{TREND_KPIS.map((t, i) => <span key={t.kode}><i className="line" style={{ background: SERIES[i] }} />{t.label}</span>)}</div>
      </>
    );
  }
  return null;
}

export function ChartCard({ cfg, rows, selected, onPick, href, height }) {
  return (
    <Card title={cfg.title} actions={href ? <Link href={href} className="btn-ghost">Buka</Link> : null}>
      <ChartBody cfg={cfg} rows={rows} selected={selected} onPick={onPick} height={height} />
    </Card>
  );
}

