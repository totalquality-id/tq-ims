import Link from 'next/link';
import { ArrowUpRight, ClipboardCheck, FileCheck2, Orbit, Wrench } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PricingPlans from './PricingPlans';
import { Breadcrumb } from '@/components/ui';

export const metadata = { title: 'Paket & Harga D-ISO' };

const workflow = [
  { title: 'Catat temuan audit', module: 'E-Audit', href: '/audit', icon: ClipboardCheck },
  { title: 'Tindak lanjuti perbaikan', module: 'CAPA Digital', href: '/capa', icon: Wrench },
  { title: 'Telusuri revisi dokumen', module: 'E-Document', href: '/edoc', icon: FileCheck2 },
];

export default function PricingPage() {
  return (
    <AppShell moduleId="pricing" title="Paket & Harga">
      <Breadcrumb items={[{ label: 'Semua Sistem', href: '/' }, { label: 'Paket & Harga' }]} />
      <header className="page-header pricing-hero">
        <div className="pricing-hero-copy">
          <h1>Paket langganan D-ISO</h1>
          <p>Pantau siapa yang menangani temuan audit, kapan perbaikannya selesai, dan dokumen mana yang berubah.</p>
          <Link className="pricing-demo" href="/d-iso"><Orbit size={17} aria-hidden /> Jelajahi D-ISO 360&deg; <ArrowUpRight size={16} aria-hidden /></Link>
        </div>
        <section className="pricing-workflow" aria-labelledby="workflow-title">
          <h2 id="workflow-title">Contoh alur audit internal</h2>
          <ol>
            {workflow.map(({ title, module, href, icon: Icon }) => (
              <li key={href}><Link href={href}>
                <span className="workflow-icon"><Icon size={16} aria-hidden /></span>
                <span>{title}<small>{module}</small></span>
                <ArrowUpRight size={14} aria-hidden />
              </Link></li>
            ))}
          </ol>
        </section>
      </header>
      <PricingPlans />
      <p className="muted pricing-tax">Harga belum termasuk pajak.</p>
    </AppShell>
  );
}
