import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Breadcrumb } from '@/components/ui';
import { workspaces, planEntry } from '@/lib/workspace';
import { moduleById } from '@/lib/modules';
import Basic from '@/components/workflows/Basic';
import Advanced from '@/components/workflows/Advanced';
import Custom from '@/components/workflows/Custom';
import './workspace.css';

export const generateStaticParams = () => Object.keys(workspaces).map(fitur => ({ fitur }));
export async function generateMetadata({ params }) {
  return { title: workspaces[(await params).fitur]?.[2] || 'Ruang kerja' };
}
export default async function FeaturePage({ params }) {
  const { fitur } = await params;
  if (!Object.hasOwn(workspaces, fitur)) notFound();
  const [plan, moduleId, title, intro] = workspaces[fitur];
  const Body = { Basic, Advanced, Custom }[plan];
  return <AppShell moduleId={moduleId} title={title}>
    <Breadcrumb items={[{label:'Semua Sistem',href:'/'},{label:moduleById(moduleId).short,href:'/'+moduleId},{label:title}]} />
    <header className="page-header page-title-row"><div><div className="page-eyebrow">Ruang kerja {plan}</div><h1>{title}</h1><p>{intro}</p></div>
      <a className="btn btn-outline btn-sm" href="/panduan-fitur-d-iso.md" download><BookOpen size={16}/>Panduan uji</a></header>
    <nav className="subnav" aria-label="Ruang kerja paket">{Object.entries(workspaces).filter(([,w])=>w[0]===plan).map(([slug,w])=><Link key={slug} href={'/fitur/'+slug} className={fitur===slug?'active':''} aria-current={fitur===slug?'page':undefined}>{w[2]}</Link>)}</nav>
    <div className="stack workbench"><Body key={fitur} fitur={fitur} /></div>
    <footer className="work-related"><span>Ruang kerja paket</span>{Object.entries(planEntry).map(([name,slug])=><Link key={name} href={'/fitur/'+slug}>{name}</Link>)}<Link href="/pricing">Paket & harga</Link></footer>
  </AppShell>;
}
