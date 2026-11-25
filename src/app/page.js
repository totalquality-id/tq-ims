import Image from 'next/image';
import HubGrid from '@/components/HubGrid';
import { COMPANY, CONSULTANT } from '@/lib/data/core';

export default function Hub() {
  return (
    <div className="hub">
      <header className="hub-top">
        <div className="hub-brand">
          <Image src="/brand/tq-logo.png" alt="Logo Total Quality" width={60} height={34} priority />
          <div>
            <strong>{CONSULTANT.name}</strong>
            <span>{COMPANY.name}</span>
          </div>
        </div>
      </header>

      <main className="hub-main">
        <h1 className="hub-title">D-ISO</h1>
        <HubGrid />
      </main>

      <footer className="hub-foot">© 2026 {CONSULTANT.name}</footer>
    </div>
  );
}
