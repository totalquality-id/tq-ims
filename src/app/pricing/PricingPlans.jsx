'use client';

import Link from 'next/link';
import { planEntry } from '@/lib/workspace';
import { useEffect, useState } from 'react';
import { ArrowRight, ClipboardList, ChartNoAxesCombined, Network, Check } from 'lucide-react';

const plans = [
  {
    name: 'Basic', icon: ClipboardList, purpose: 'Untuk tim yang menyiapkan bukti audit.',
    monthly: 'Rp1,5 juta', annual: 'Rp15 juta/tahun', setup: 'Rp5 juta',
    features: [
      ['Kelola enam modul inti', 'Dokumen, audit, CAPA, risiko, kompetensi, dan konteks organisasi.'],
      ['Telusuri setiap perubahan', 'Lihat riwayat revisi, persetujuan dokumen, dan verifikasi tindakan korektif.'],
      ['Siapkan bukti audit', 'Ekspor laporan dan pelajari alur kerja bersama tim TQ.'],
    ],
  },
  {
    name: 'Advanced', icon: ChartNoAxesCombined, purpose: 'Untuk manajemen yang menetapkan prioritas mutu.',
    monthly: 'Rp35 juta', annual: 'Rp35 juta/tahun', setup: 'Rp5 juta',
    features: [
      ['Siapkan tinjauan manajemen', 'Seluruh fitur Basic ditambah rangkuman data lintas modul untuk rapat.'],
      ['Temukan masalah berulang', 'Gunakan tren CAPA dan analisis Pareto untuk memilih fokus perbaikan.'],
      ['Pantau pemasok dan keluhan', 'Tinjau kinerja pemasok serta pola keluhan pelanggan.'],
    ],
  },
  {
    name: 'Custom', icon: Network, purpose: 'Untuk organisasi dengan beberapa lokasi atau sistem khusus.',
    monthly: 'Rp5 juta', from: true, setup: 'Rp25 juta',
    features: [
      ['Atur proses tiap lokasi', 'Sesuaikan alur persetujuan dan laporan dengan kebutuhan cabang.'],
      ['Hubungkan sistem yang ada', 'Pilih integrasi ERP, HRIS, SSO, atau API sesuai kebutuhan.'],
      ['Tentukan lokasi data', 'Gunakan server klien atau server khusus sesuai kontrak.'],
    ],
  },
];

export default function PricingPlans() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (!request) return;
    const timer = setTimeout(() => setRequest(null), 6000);
    return () => clearTimeout(timer);
  }, [request]);

  return (
    <>
      <section className="grid-3 pricing-plans" aria-label="Pilihan paket">
        {plans.map(({ name, icon: Icon, purpose, monthly, annual, from, setup, features }) => (
          <article key={name} className={`pricing-card ${name.toLowerCase()}`} aria-labelledby={`plan-${name}`}>
            <header className="pricing-cover">
              <div className="pricing-name">
                <span className="pricing-plan-icon"><Icon size={21} aria-hidden /></span>
                <h2 id={`plan-${name}`}>{name}</h2>
              </div>
              <p className="pricing-purpose">{purpose}</p>
              <p className="pricing-rate">{from && <span>Mulai </span>}<strong>{monthly}</strong><span>/bulan</span></p>
              <p className="pricing-term">{annual ? `atau ${annual}` : 'Sesuai ruang lingkup'}</p>
            </header>
            <ul className="pricing-features" aria-label={`Manfaat paket ${name}`}>
              {features.map(([label, detail]) => (
                <li key={label}>
                  <span className="pricing-check"><Check size={14} strokeWidth={2.5} aria-hidden /></span>
                  <div><strong>{label}</strong><p>{detail}</p></div>
                </li>
              ))}
            </ul>
            <footer className="pricing-actions">
              <button type="button" className="btn pricing-discuss" onClick={() => setRequest({ plan: name })}>
                Diskusikan {name}<ArrowRight size={16} aria-hidden />
              </button>
              <Link href={'/fitur/'+planEntry[name]} className="btn-ghost">Coba fitur {name}<ArrowRight size={14} /></Link>
              <p className="pricing-setup">* Setup satu kali <strong>{setup}</strong></p>
            </footer>
          </article>
        ))}
      </section>
      <div role="status" aria-live="polite" aria-atomic="true">
        {request && <div className="toast pricing-toast">Permintaan diskusi paket {request.plan} sudah kami terima. Tim TQ akan menghubungi Anda.</div>}
      </div>
    </>
  );
}
