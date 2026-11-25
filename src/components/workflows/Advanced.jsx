'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Kpi, Progress, Badge } from '@/components/ui';
import { useGet } from '@/lib/store';
import { TODAY, fmtDate, monthLabel } from '@/lib/data/core';
import { Field, Form, RecordLink, Table, dateNow, rupiah, useLedger, workbook } from './shared';

const money=n=>Number(n).toLocaleString('id-ID');
const percent=(part,total)=>total?Math.round(1000*part/total)/10:null;
function ranked(rows,key) {
  const counts=new Map();
  for(const r of rows) counts.set(r[key],(counts.get(r[key]) || 0)+1);
  let cumulative=0;
  return [...counts].sort((a,b)=>b[1]-a[1] || String(a[0]).localeCompare(String(b[0]))).map(([label,n])=>({label,n,cumulative:percent(cumulative+=n,rows.length)}));
}
function supplierStats(rows) {
  const totals=new Map();
  for(const r of rows) {
    const s=totals.get(r.supplier)||{supplier:r.supplier,received:0,accepted:0,lots:0,onTime:0};
    s.received+=Number(r.received); s.accepted+=Number(r.accepted); s.lots++; s.onTime+=Number(r.actual<=r.promised); totals.set(r.supplier,s);
  }
  return [...totals.values()].map(s=>({...s,acceptance:percent(s.accepted,s.received),punctuality:percent(s.onTime,s.lots)}));
}
function quality(get,month,deliveries,costs) {
  const inMonth=rows=>rows.filter(r=>r.tanggal?.startsWith(month));
  const findings=get('findings'), capas=get('capa'), complaints=get('feedback').filter(r=>r.tipe==='Komplain');
  const countTrend=[];
  const [year,m]=month.split('-').map(Number);
  for(let i=5;i>=0;i--){
    const key=new Date(Date.UTC(year,m-1-i,1)).toISOString().slice(0,7);
    const count=rows=>rows.filter(r=>r.tanggal?.startsWith(key)).length;
    countTrend.push({bulan:key,temuan:count(findings),capa:count(capas),keluhan:count(complaints)});
  }
  const end=new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);
  const cutoff=end<TODAY?end:TODAY;
  const late=capas.filter(r=>r.tanggal<=cutoff && r.target && r.target<cutoff && (r.tglSelesai?r.tglSelesai>cutoff:r.status!=='Closed'));
  const selected=inMonth(findings);
  const riskUnit=ranked(get('risks').filter(r=>r.jenis==='Risiko' && r.metode==='IPR 3×3' && r.level==='High'),'departemen');
  const monthlyCosts=costs.filter(r=>r.date.startsWith(month));
  return {month,cutoff,pareto:ranked(selected,'deskripsi'),trend:countTrend,late:late.map(r=>({id:r.id,pic:r.pic,target:r.target,masalah:r.masalah})),
    riskUnit,complaints:inMonth(complaints).map(r=>({id:r.id,pelanggan:r.pelanggan,kategori:r.kategori,status:r.status})),
    suppliers:supplierStats(deliveries.filter(r=>r.actual.startsWith(month))),costs:monthlyCosts,cost:monthlyCosts.reduce((a,r)=>a+Number(r.amount),0),
    kpis:get('kpi-monthly').filter(r=>r.bulan===month).map(r=>({kpi:r.kpi,departemen:r.departemen,target:r.target,realisasi:r.realisasi,status:r.status}))};
}
function Period({month,setMonth}) {
  return <Field label="Bulan laporan" type="month" required value={month} onChange={e=>{if(e.target.value) setMonth(e.target.value);}}/>;
}
function Suppliers() {
  const deliveries=useLedger('deliveries'), [month,setMonth]=useState(TODAY.slice(0,7));
  const selected=deliveries.rows.filter(r=>r.actual.startsWith(month));
  return <><Card title="Penerimaan barang"><Form action="Simpan penerimaan" onSave={v=>{
    if(+v.accepted>+v.received) throw Error('Jumlah lolos inspeksi melebihi jumlah diterima.');
    if(deliveries.rows.some(r=>r.supplier===v.supplier && r.lot===v.lot)) throw Error('Nomor lot sudah tercatat untuk pemasok ini.');
    deliveries.add(v);setMonth(v.actual.slice(0,7));
  }}><Field label="Pemasok" name="supplier" required/><Field label="Nomor lot" name="lot" required/>
    <Field label="Tanggal dijanjikan" name="promised" type="date" defaultValue={TODAY} required/><Field label="Tanggal diterima" name="actual" type="date" defaultValue={TODAY} required/>
    <Field label="Unit diterima" name="received" type="number" min="1" required/><Field label="Unit lolos inspeksi" name="accepted" type="number" min="0" required/></Form></Card>
    <Card title="Kartu kinerja pemasok"><Period month={month} setMonth={setMonth}/><Table columns={['Pemasok','Lot','Lolos inspeksi','Tepat waktu']} rows={supplierStats(selected).map(s=>[s.supplier,s.lots,money(s.acceptance)+'%',money(s.punctuality)+'%'])} empty="Catat penerimaan untuk menghitung kinerja pemasok bulan ini."/></Card>
    <Card title="Rincian penerimaan"><Table columns={['Pemasok','Lot','Dijanjikan','Diterima','Lolos / diterima']} rows={selected.map(r=>[r.supplier,r.lot,r.promised,r.actual,r.accepted+' / '+r.received])}/></Card></>;
}
function Report({review}) {
  const get=useGet(), deliveries=useLedger('deliveries'), costs=useLedger('costs'), meetings=useLedger('meetings');
  const [month,setMonth]=useState(TODAY.slice(0,7));
  const q=quality(get,month,deliveries.rows,costs.rows), t=q.trend.at(-1);
  return <><Card title={review?'Periode tinjauan':'Periode analisis'}><Period month={month} setMonth={setMonth}/></Card>
    <div className="grid-3"><Kpi label="Temuan periode ini" value={t.temuan}/><Kpi label="CAPA melewati target" value={q.late.length} hint={'Posisi '+fmtDate(q.cutoff)}/><Kpi label="Biaya mutu buruk" value={rupiah(q.cost)} hint={q.costs.length+' transaksi tercatat'}/></div>
    {review?<><Card title="Simpan bahan rapat" subtitle="Angka, rincian KPI, dan prioritas disalin saat rapat dibuat.">
      <Form action="Simpan bahan rapat" onSave={v=>meetings.add({...v,report:q,decisions:[],at:dateNow()})}><Field label="Judul rapat" name="title" required/><Field label="Jenis rapat" name="kind" choices={['Tinjauan manajemen','Review bulanan bersama konsultan']}/><Field label="Pimpinan / konsultan" name="person" required/><Field label="Tanggal rapat" name="date" type="date" defaultValue={TODAY} required/></Form>
    </Card>{!meetings.rows.length && <Card title="Arsip rapat">Bahan rapat yang disimpan akan muncul di sini.</Card>}{meetings.rows.map(r=><Meeting key={r.id} meeting={r} edit={meetings.edit}/>)}<Card title="Kebijakan & scorecard"><div className="work-actions"><Link href="/executive/kpi">Balanced scorecard</Link><Link href="/executive/policies">Kebijakan digital</Link><Link href="/executive/read-receipts">Distribusi & konfirmasi baca</Link></div></Card></>:
    <><div className="grid-2"><Card title="Tren enam bulan"><Table columns={['Bulan','Temuan','CAPA baru','Keluhan']} rows={q.trend.map(r=>[monthLabel(r.bulan),r.temuan,r.capa,r.keluhan])}/></Card><Card title="Pareto temuan" subtitle="Urut menurut frekuensi uraian temuan yang sama pada bulan laporan."><Table columns={['Uraian','Jumlah','Kumulatif']} rows={q.pareto.map(r=>[r.label,r.n,<Progress key="p" value={r.cumulative}/>])}/></Card></div>
    <Card title="CAPA melewati target"><Table columns={['CAPA','Masalah','PIC','Target']} rows={q.late.map(r=>[<RecordLink key="c" dataset="capa" id={r.id}/>,r.masalah,r.pic,r.target])}/></Card>
    <div className="grid-2"><Card title="Keluhan pelanggan"><Table columns={['Keluhan','Pelanggan','Kategori','Status']} rows={q.complaints.map(r=>[<RecordLink key="f" dataset="feedback" id={r.id}/>,r.pelanggan,r.kategori,r.status])}/></Card>
    <Card title="Risiko tinggi per unit" subtitle="Risiko kategori High pada penilaian IPR 3×3 saat ini."><Table columns={['Unit','Risiko']} rows={q.riskUnit.map(r=>[r.label,r.n])}/></Card></div>
    <Card title="Biaya mutu buruk"><Form action="Catat biaya" onSave={v=>{costs.add(v);setMonth(v.date.slice(0,7));}}><Field label="Tanggal biaya" name="date" type="date" required defaultValue={TODAY}/><Field label="Jenis biaya" name="kind" choices={['Pengerjaan ulang','Scrap','Retur','Klaim pelanggan']}/><Field label="Nominal (Rp)" name="amount" type="number" required min="1"/><Field label="Nomor bukti biaya" name="ref" required/></Form>
    <Table columns={['Tanggal','Jenis','Bukti','Rupiah']} rows={q.costs.map(r=>[r.date,r.kind,r.ref,money(r.amount)])}/></Card></>}</>;
}
function Meeting({meeting:r,edit}) {
  const q=r.report;
  function exportMeeting(){
    return workbook('Tinjauan-'+q.month,{Rapat:[{judul:r.title,jenis:r.kind,pimpinan:r.person,tanggal:r.date,periode:q.month,posisi_CAPA:q.cutoff,biaya_Rp:q.cost}],KPI:q.kpis,Tren:q.trend,Pareto:q.pareto,CAPA:q.late,Pemasok:q.suppliers,Keluhan:q.complaints,Biaya:q.costs,Risiko:q.riskUnit,Keputusan:r.decisions});
  }
  return <Card title={r.title} subtitle={r.kind+' · '+fmtDate(r.date)+' · '+r.person} actions={<button className="btn btn-soft btn-sm" onClick={exportMeeting}>Unduh bahan rapat</button>}>
    <p>{monthLabel(q.month)} · {q.kpis.length} KPI · {q.late.length} CAPA lewat target · {q.complaints.length} keluhan · {rupiah(q.cost)}</p>
    <Form action="Tambah keputusan" onSave={v=>edit(r.id,{decisions:[...r.decisions,{...v,id:crypto.randomUUID(),status:'Terbuka'}]})}><Field label="Keputusan rapat" name="action" required/><Field label="PIC keputusan" name="pic" required/><Field label="Tenggat" type="date" name="due" min={r.date} required/></Form>
    <Table columns={['Keputusan','PIC','Tenggat','Status']} rows={r.decisions.map(d=>[d.action,d.pic,d.due,d.status==='Selesai'?<Badge key="s" value="Selesai"/>:<button key="b" className="btn btn-outline btn-sm" onClick={()=>edit(r.id,{decisions:r.decisions.map(x=>x.id===d.id?{...x,status:'Selesai',completed:dateNow()}:x)})}>Tandai selesai</button>])}/>
  </Card>;
}
export default function Advanced({fitur}) { return fitur==='pemasok'?<Suppliers/>:<Report review={fitur==='rapat'}/>; }
