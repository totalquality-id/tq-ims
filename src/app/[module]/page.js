import { notFound } from 'next/navigation';
import ModuleOverview from '@/components/ModuleOverview';
import DisoOverview from '@/components/DisoOverview';
import { MODULES, moduleById } from '@/lib/modules';

export const dynamicParams = false;

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.id }));
}

export async function generateMetadata({ params }) {
  const { module } = await params;
  return { title: moduleById(module)?.name ?? 'Sistem' };
}

export default async function ModulePage({ params }) {
  const { module } = await params;
  if (!moduleById(module)) notFound();
  return module === 'd-iso' ? <DisoOverview /> : <ModuleOverview moduleId={module} />;
}
