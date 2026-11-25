'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { FORMS, initialValues } from '@/lib/forms';
import { dataActions, useGet } from '@/lib/store';
import { examples } from '@/lib/integration-examples';
import { TODAY, DEPARTMENTS } from '@/lib/data/core';
import { Field, Form, Table, download, useLedger, workbook } from './shared';

function Locations() {
  const sites=useLedger('sites'), metrics=useLedger('metrics');
  const [filter,setFilter]=useState(''), [editing,setEditing]=useState('');
  const selected=sites.rows.find(s=>s.id===editing);
  const rows=metrics.rows.filter(r=>!filter || r.site===filter);
  const options=sites.rows.map(s=>[s.id,s.name]);
  const siteName=id=>sites.rows.find(s=>s.id===id)?.name || '—';
  const report=rows.map(r=>({lokasi:siteName(r.site),periode:r.month,indikator:r.name,satuan:r.unit,arah:r.direction,target:+r.target,realisasi:+r.actual,
    status:(r.direction==='Minimal'?+r.actual>=+r.target:+r.actual<=+r.target)?'Tercapai':'Perlu tindakan'}));
  return <><Card title="Konfigurasi lokasi"><Field label="Lokasi yang diatur" choices={ [['','Tambah lokasi'],...options] } value={editing} onChange={e=>setEditing(e.target.value)}/>
    <Form key={editing} action="Simpan lokasi" onSave={v=>{
      const steps=v.steps.split('>').map(x=>x.trim());
      if(steps.some(x=>!x) || steps.length>8) throw Error('Isi 1 sampai 8 tahap persetujuan yang dipisahkan tanda >.');
      if(sites.rows.some(s=>s.id!==editing && s.name.toLowerCase()===v.name.toLowerCase())) throw Error('Nama lokasi sudah digunakan.');
      const patch={name:v.name,steps}; if(selected) sites.edit(selected.id,patch);else sites.add(patch);
    }}><Field label="Nama lokasi" name="name" defaultValue={selected?.name} required/><Field label="Urutan persetujuan" name="steps" defaultValue={selected?.steps.join(' > ') || 'Kepala unit > Direktur mutu'} required/></Form>
    <Table columns={['Lokasi','Urutan persetujuan']} rows={sites.rows.map(s=>[s.name,s.steps.join(' → ')])}/><Link href="/fitur/revisi">Ajukan revisi dengan alur lokasi</Link>
  </Card><Card title="Indikator khusus lokasi">{sites.rows.length ? <Form action="Simpan indikator" onSave={v=>{
    const existing=metrics.rows.find(r=>r.site===v.site && r.month===v.month && r.name.toLowerCase()===v.name.toLowerCase());
    if(existing) metrics.edit(existing.id,v); else metrics.add(v);
  }}><Field label="Lokasi KPI" name="site" choices={options}/><Field label="Periode" name="month" type="month" defaultValue={TODAY.slice(0,7)} required/><Field label="Nama indikator" name="name" required/><Field label="Satuan" name="unit" required/><Field label="Arah sasaran" name="direction" choices={['Minimal','Maksimal']}/><Field label="Target KPI" name="target" type="number" step="any" required/><Field label="Realisasi KPI" name="actual" type="number" step="any" required/></Form>:<p>Tambahkan lokasi untuk mencatat indikatornya.</p>}</Card>
    <Card title="Dashboard lintas lokasi"><div className="work-fields"><Field label="Filter lokasi" choices={ [['','Seluruh lokasi'],...options] } value={filter} onChange={e=>setFilter(e.target.value)}/></div>
    <Table columns={['Lokasi','Periode','Indikator','Target','Realisasi','Status']} rows={report.map(r=>[r.lokasi,r.periode,r.indikator,r.arah+' '+r.target+' '+r.satuan,r.realisasi+' '+r.satuan,<Badge key="s" value={r.status}/>])}/>
    <div><button className="btn btn-soft" disabled={!report.length} onClick={()=>workbook('KPI-lokasi',{Indikator:report})}>Unduh laporan lokasi</button></div></Card></>;
}


function dateValid(s) {
  return typeof s==='string' && /^\d{4}-\d\d-\d\d$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s;
}
function Integration() {
  const get=useGet(), deliveries=useLedger('deliveries'), profiles=useLedger('profile'), tickets=useLedger('tickets');
  const [source,setSource]=useState('ERP'), [payload,setPayload]=useState(JSON.stringify(examples.ERP,null,2));
  const profile=profiles.rows[0], employees=get('employees');
  function changeSource(source){setSource(source);setPayload(JSON.stringify(examples[source],null,2));}
  function importData() {
    let v;try{v=JSON.parse(payload);}catch{throw Error('Periksa format JSON.');}
    if(!v || Array.isArray(v) || typeof v!=='object') throw Error('Gunakan satu objek JSON untuk setiap impor.');
    for(const [key,sample] of Object.entries(examples[source])) if(typeof v[key]!==typeof sample || (typeof sample==='string' && !v[key].trim())) throw Error('Kolom tidak valid: '+key);
    const row=Object.fromEntries(Object.keys(examples[source]).map(k=>[k,typeof v[k]==='string'?v[k].trim():v[k]]));
    if(source==='ERP') {
      if(!dateValid(row.actual)||!dateValid(row.promised)||!Number.isSafeInteger(row.received)||!Number.isSafeInteger(row.accepted)||row.received<1||row.accepted<0||row.accepted>row.received) throw Error('Tanggal atau jumlah unit penerimaan tidak valid.');
      if(deliveries.rows.some(r=>r.supplier===row.supplier && r.lot===row.lot)) throw Error('Nomor lot sudah tercatat untuk pemasok ini.');
      deliveries.add({...row,source});return 'Lot berhasil masuk ke Evaluasi pemasok.';
    }
    if(!DEPARTMENTS.includes(row.departemen)||!['Operator','Leader','Staff','Supervisor','Manager'].includes(row.golongan)||!dateValid(row.tglMasuk) ||row.tglMasuk>TODAY) throw Error('Periksa departemen, golongan, dan tanggal masuk sesuai kalender demo.');
    if(employees.some(e=>e.nik===row.nik)) throw Error('NIK sudah terdaftar.');
    const employee=FORMS.employees.build({...initialValues('employees'),...row},{get});
    dataActions.add('employees',{...employee,nik:row.nik,source});return 'Karyawan berhasil masuk ke Skill Matrix.';
  }
  return <><Card title="Pertukaran ERP & HRIS" subtitle="Uji pemetaan satu rekaman JSON ke register operasional.">
    <Field label="Sumber data" choices={['ERP','HRIS']} value={source} onChange={e=>changeSource(e.target.value)}/>
    <Form key={source} action="Validasi & impor" onSave={importData}><Field label="Rekaman JSON" type="textarea" wide value={payload} onChange={e=>setPayload(e.target.value)} required/></Form>
    <div className="work-actions"><Link href={source==='ERP'?'/fitur/pemasok':'/skill/employees'}>Buka register tujuan</Link><button className="btn btn-soft btn-sm" onClick={()=>download('hasil-'+source+'.json',JSON.stringify(source==='ERP'?deliveries.rows.filter(r=>r.source==='ERP'):employees.filter(r=>r.source==='HRIS'),null,2),'application/json')}>Ekspor hasil impor</button><a href="/api/contoh-integrasi" target="_blank" rel="noreferrer">Buka API contoh</a></div></Card>
    <Card title="Profil infrastruktur & layanan">
      <Form key={profile?.id || 'new'} action="Simpan profil layanan" onSave={v=>{
        if(v.issuer){let u;try{u=new URL(v.issuer);}catch{throw Error('Issuer harus berupa URL HTTPS.');}if(u.protocol!=='https:' || u.username || u.password || u.search || u.hash) throw Error('Gunakan URL issuer HTTPS tanpa kredensial, query, atau fragmen.');}
        if(!!v.issuer!==!!v.client) throw Error('Isi issuer dan client ID bersama-sama untuk profil SSO.');
        if(profile) profiles.edit(profile.id,v);else profiles.add(v);
      }}><Field label="Penempatan aplikasi" name="host" choices={['Cloud TQ','Server klien','VPS khusus atas nama klien']} defaultValue={profile?.host}/>
      <Field label="Pemilik backup" name="backup" required defaultValue={profile?.backup}/><Field label="PIC layanan" name="person" required defaultValue={profile?.person}/>
      <Field label="Target respons (jam kerja)" name="sla" type="number" min="1" required defaultValue={profile?.sla || 4}/>
      <Field label="OIDC issuer (opsional)" name="issuer" type="url" defaultValue={profile?.issuer}/><Field label="Client ID publik (opsional)" name="client" defaultValue={profile?.client}/></Form>
      {profile && <p>{profile.host} · Backup oleh {profile.backup} · PIC {profile.person} · Respons {profile.sla} jam kerja{profile.issuer?' · Profil OIDC tersimpan':''}</p>}
      <p className="muted">Profil ini menyimpan rencana penempatan dan pengaturan publik SSO. Aktivasi login dan pemasangan server dilakukan saat implementasi klien.</p>
      {profile?.issuer && <Form action="Uji metadata OIDC" onSave={v=>{
        let meta; try{meta=JSON.parse(v.metadata);}catch{throw Error('Metadata harus berupa JSON.');}
        if(meta?.issuer!==profile.issuer) throw Error('Issuer metadata berbeda dari profil.');
        for(const k of ['authorization_endpoint','token_endpoint','jwks_uri']) {
          let u;try{u=new URL(meta[k]);}catch{throw Error('Metadata tidak memuat URL '+k);}
          if(u.protocol!=='https:' || u.username || u.password) throw Error('Periksa URL HTTPS untuk '+k);
        }
        return 'Issuer dan tiga endpoint sesuai format OIDC. Login pengguna memerlukan aktivasi IdP.';
      }}><Field type="textarea" name="metadata" label="Metadata discovery dari IdP (JSON)" required wide/></Form>}
    </Card><div id="dukungan"><Card title="Permintaan dukungan & onboarding">
    <Form action="Catat permintaan" onSave={v=>tickets.add({...v,status:'Terbuka',pic:profile?.person || 'Koordinator TQ',sla:profile?.sla || '',at:new Date().toISOString()})}>
      <Field label="Jenis layanan" name="kind" choices={['Pelatihan pengguna','Impor awal','Dukungan aplikasi','Penyesuaian modul']}/><Field label="Pemohon" name="person" required/><Field label="Kebutuhan" name="need" required/></Form>
    <Table columns={['Jenis','Pemohon','Kebutuhan','PIC / target','Status']} rows={tickets.rows.map(t=>[t.kind,t.person,t.need,t.pic+(t.sla?' · '+t.sla+' jam kerja':''),t.status==='Selesai'?'Selesai':<button key="done" className="btn btn-outline btn-sm" onClick={()=>tickets.edit(t.id,{status:'Selesai'})}>Selesaikan</button>])}/>
    </Card></div></>;
}
export default function Custom({fitur}) {return fitur==='lokasi'?<Locations/>:<Integration/>;}
