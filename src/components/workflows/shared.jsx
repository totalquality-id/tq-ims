'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { drillHref } from '@/lib/datasets';
import { useStore, dataActions } from '@/lib/store';

export function useLedger(key) {
  const rows = useStore()['work:'+key]?.added || [];
  return { rows, add: row => dataActions.add('work:'+key,{...row,id:crypto.randomUUID()}), edit:(id,patch)=>dataActions.update('work:'+key,id,patch) };
}
export function RecordLink({dataset,id,children}) {
  return <Link href={drillHref(dataset, {}, {open:id})}>{children || id}</Link>;
}
export function Table({columns, rows, empty='Belum ada rekaman.'}) {
  return rows.length ? <div className="table-wrapper work-table"><table><thead><tr>{columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v ?? '—'}</td>)}</tr>)}</tbody></table></div> : <p className="muted">{empty}</p>;
}
export function Field({label,choices,wide,...props}) {
  const labelId=useId();
  const Control = choices ? 'select' : props.type==='textarea' ? 'textarea' : 'input';
  return <label className={wide?'work-wide':''}><span id={labelId} className="form-label">{label}</span><Control aria-labelledby={labelId} className={choices?'form-select':'form-input'} {...props} type={Control==='input'?props.type:undefined}>{choices?.map(item=>{
    const [value,name] = Array.isArray(item)?item:[item,item];
    return <option key={value} value={value}>{name}</option>;
  })}</Control></label>;
}
export function Form({action,onSave,children}) {
  const [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  return <form className="work-fields" onChange={()=>setMessage('')} onSubmit={async e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const data=new FormData(form);
    const values=Object.fromEntries([...data].map(([k,v])=>[k,String(v).trim()]));
    try {
      if([...form.elements].some(el=>el.required && !el.disabled && el.name && !values[el.name])) throw Error('Lengkapi kolom wajib.');
      setBusy(true);
      const message=await onSave(values,data);
      form.reset(); setMessage(message || 'Rekaman tersimpan di browser ini.');
    } catch(err) { setMessage(err.message); } finally {setBusy(false);}
  }}>{children}<div className="work-wide work-actions"><button className="btn btn-primary" type="submit" disabled={busy}>{action}</button>{message && <span role="status" className="work-notice">{message}</span>}</div></form>;
}
export function download(name,text,type='text/plain;charset=utf-8') {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function workbook(name,sheets,attachments) {
  const x=await import('xlsx');
  const book=x.utils.book_new();
  for(const [title,rows] of Object.entries(sheets)) x.utils.book_append_sheet(book,x.utils.json_to_sheet(rows),title);
  if(!attachments) return x.writeFile(book,name+'.xlsx');
  const zip=x.CFB.utils.cfb_new();
  x.CFB.utils.cfb_add(zip,'Berkas-audit.xlsx',new Uint8Array(x.write(book,{bookType:'xlsx',type:'array'})));
  attachments.forEach((f,i)=>{
    const bytes=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));
    x.CFB.utils.cfb_add(zip,'Lampiran/'+(i+1)+'-'+f.name.replace(/[^a-zA-Z0-9._-]/g,'_'),bytes);
  });
  download(name+'.zip',new Uint8Array(x.CFB.write(zip,{fileType:'zip',type:'array'})),'application/zip');
}
export const choiceRows=(rows,key)=>rows.map(r=>[r.id,r.id+' · '+r[key]]);
export const dateNow=()=>new Date().toISOString();
export const rupiah=n=>'Rp'+Number(n).toLocaleString('id-ID');
