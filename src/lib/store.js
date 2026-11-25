'use client';

// Penyimpanan pratinjau: data awal (dummy) digabung dengan perubahan pengguna
// yang disimpan di localStorage browser ini. Tidak ada yang dikirim ke server.
// Per dataset disimpan { added: [], edits: { id: patch }, deleted: [id] }.
import { useSyncExternalStore } from 'react';
import { DATASETS } from './datasets';

const STORAGE_KEY = 'tq-ims:data:v1';
const EMPTY = {};
const blank = { added: [], edits: {}, deleted: [] };

let state = EMPTY;
let loaded = false;
const listeners = new Set();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw) ?? EMPTY;
  } catch { /* data rusak atau mode privat: mulai dari kosong */ }
  // Tab lain di browser yang sama ikut sinkron.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try { state = e.newValue ? JSON.parse(e.newValue) : EMPTY; } catch { state = EMPTY; }
    listeners.forEach((l) => l());
  });
}

function commit(next, requirePersistence = false) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {
    if (requirePersistence) throw Error('Penyimpanan browser tidak tersedia atau penuh. Unduh arsip yang diperlukan dan coba dengan lampiran lebih kecil.');
  }
  state = next;
  listeners.forEach((l) => l());
}

const slice = (key) => state[key] ?? blank;
const subscribe = (listener) => {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => { load(); return state; };
// Saat render server & hidrasi dipakai data awal saja, lalu perubahan lokal menyusul.
const getServerSnapshot = () => EMPTY;

export const useStore = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

// ─── Penggabungan data awal + perubahan lokal (di-cache per referensi) ─────
const cache = new Map();

export function combine(key, st) {
  const ds = DATASETS[key];
  if (ds.derive) {
    const dep = combine(ds.derive.from, st);
    const hit = cache.get(key);
    if (hit && hit.dep === dep) return hit.rows;
    const rows = ds.derive.build(dep);
    cache.set(key, { dep, rows });
    return rows;
  }
  const s = st[key];
  const hit = cache.get(key);
  if (hit && hit.s === s && hit.base === ds.rows) return hit.rows;
  let rows = ds.rows;
  if (s) {
    const deleted = new Set(s.deleted);
    rows = rows
      .filter((r) => !deleted.has(r.id))
      .map((r) => (s.edits[r.id] ? { ...r, ...s.edits[r.id], _local: 'edited' } : r));
    rows = [...s.added.map((r) => ({ ...r, _local: 'new' })), ...rows];
  }
  if (key === 'risks' && s) {
    rows = rows.map(r=>{
      const saved = r._local === 'new' ? r : s.edits[r.id];
      return saved && !saved.metode && 'skor' in saved ? {...r, metode:'Skala lama 5×5'} : r;
    });
  }
  cache.set(key, { s, base: ds.rows, rows });
  return rows;
}

export function useRows(key) {
  return combine(key, useStore());
}

// Akses semua dataset gabungan sekaligus (untuk ringkasan lintas modul).
export function useGet() {
  const st = useStore();
  return (key) => combine(key, st);
}

export const localCount = (st, key) => {
  const s = st[key];
  return s ? s.added.length + Object.keys(s.edits).length + s.deleted.length : 0;
};
export const totalLocalCount = (st) => Object.keys(st).reduce((n, k) => n + localCount(st, k), 0);

const clean = (row) => {
  const { _local, ...rest } = row;
  return rest;
};

export const dataActions = {
  add(key, row) {
    const s = slice(key);
    commit({ ...state, [key]: { ...s, added: [clean(row), ...s.added] } });
  },
  update(key, id, patch, requirePersistence = false) {
    const s = slice(key);
    const p = clean(patch);
    if (s.added.some((r) => r.id === id)) {
      commit({ ...state, [key]: { ...s, added: s.added.map((r) => (r.id === id ? { ...r, ...p } : r)) } }, requirePersistence);
    } else {
      commit({ ...state, [key]: { ...s, edits: { ...s.edits, [id]: { ...(s.edits[id] ?? {}), ...p } } } }, requirePersistence);
    }
  },
  remove(key, id) {
    const s = slice(key);
    if (s.added.some((r) => r.id === id)) {
      commit({ ...state, [key]: { ...s, added: s.added.filter((r) => r.id !== id) } });
    } else {
      const { [id]: _, ...edits } = s.edits;
      commit({ ...state, [key]: { ...s, edits, deleted: [...s.deleted, id] } });
    }
  },
  reset(key) {
    if (!key) return commit(EMPTY);
    const { [key]: _, ...rest } = state;
    commit(rest);
  },
};
