'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Download, ArrowUpRight } from 'lucide-react';
import { currentFile, fileHref, sampleRevisions } from '@/lib/edoc';
import { drillHref } from '@/lib/datasets';

export function DocumentShelf({docs}) {
  const available=docs.filter(d=>currentFile(d));
  const [all,expand]=useState(false);
  if(!available.length)return null;
  return <section className="card edoc-shelf"><div className="card-header"><div><h2 className="card-title">Pustaka dokumen</h2><p className="card-subtitle">{available.length} dokumen dengan berkas PDF</p></div>
    {available.length>4 && <button className="btn-ghost" onClick={()=>expand(!all)}>{all?'Ringkas':'Lihat semua'}</button>}</div>
    <div className="edoc-grid">{(all?available:available.slice(0,4)).map(d=><Link className="edoc-tile" key={d.id} href={drillHref('documents',{}, {open:d.id})}>
      {sampleRevisions[d.id]===d.revisi && !d.file?<span className="edoc-thumb" style={{backgroundImage:'url(/edoc/'+d.id+'.png)'}}/>:<span className="edoc-thumb edoc-icon"><FileText/></span>}
      <span><small>{d.id} · {d.revisi}</small><strong>{d.nama}</strong><span>{d.departemen}</span></span></Link>)}</div>
  </section>;
}
export function PdfViewer({file,label='Pratinjau PDF'}) {
  const href=fileHref(file);
  return <div className="edoc-reader"><div className="edoc-tools"><strong><FileText size={16}/>{label}</strong><div>
    <a href={href} target="_blank" rel="noreferrer" className="btn-ghost"><ArrowUpRight size={15}/>Buka PDF</a>
    <a href={fileHref(file,true)} download={file.name} className="btn-ghost"><Download size={15}/>Unduh</a></div></div>
    <iframe title={label+' · '+file.name} src={href+'#view=FitH'} /><small>{file.name}</small></div>;
}
export function DocumentReader({doc}) {
  const active=currentFile(doc), versions=doc.versions || [],files=[];
  const add=(file,label)=>{if(file && !files.some(r=>r.file.key===file.key))files.push({file,label});};
  add(active,doc.revisi+' · '+doc.status);
  for(const v of versions){add(v.file,v.version+' · '+v.status);add(v.baseFile,v.base+' · Arsip');}
  const [selection,setSelection]=useState('');const item=files.find(r=>r.file.key===selection)||files[0];
  return <section className="edoc-panel">{files.length>1 && <label className="form-label">Versi berkas<select className="form-select" value={item.file.key} onChange={e=>setSelection(e.target.value)}>{files.map(r=><option key={r.file.key} value={r.file.key}>{r.label} · {r.file.name}</option>)}</select></label>}
    {item?<PdfViewer file={item.file} label={item.label}/>:<p className="ipr-preview">Berkas PDF belum dilampirkan. Pilih Ubah untuk menambahkan berkas pertama.</p>}
    <Link className="btn btn-soft btn-sm" href={'/fitur/revisi?dokumen='+encodeURIComponent(doc.id)}>Kelola revisi dan persetujuan</Link></section>;
}
