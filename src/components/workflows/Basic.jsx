'use client';

import Operations from './Operations';
import { useState } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { useGet, dataActions } from '@/lib/store';
import { FORMS, initialValues } from '@/lib/forms';
import { TODAY, addDays, daysBetween, fmtDate } from '@/lib/data/core';
import { Field, Form, RecordLink, Table, choiceRows, dateNow, download, useLedger, workbook } from './shared';

function Revisions() {
  const get=useGet(), docs=get('documents').filter(d=>d.status!=='Obsolete'), sites=useLedger('sites').rows;
  const [id,select]=useState('');
  const doc=docs.find(d=>d.id===id) || docs[0];
  if(!doc) return <Card title="Persetujuan dokumen">Tambahkan dokumen di daftar induk.</Card>;
  const history=doc.versions || [], draft=history.find(r=>r.status==='Menunggu');
  function save(versions,patch={}) { dataActions.update('documents',doc.id,{versions,...patch}); }
  function submit(v) {
    const route=sites.find(s=>s.id===v.site);
    const next=Number(String(doc.revisi).match(/\d+$/)?.[0] || 0)+1;
    save([{version:'Rev. '+String(next).padStart(2,'0'),base:doc.revisi,summary:v.summary,content:v.content,person:v.person,
      site:route?.name || 'Pusat', steps:route?.steps || ['Pemilik proses'],log:[],status:'Menunggu',at:dateNow()},...history]);
    return 'Revisi diajukan untuk ditinjau.';
  }
  function decide(v) {
    if(doc.revisi!==draft.base && v.decision==='Setujui') throw Error('Versi induk sudah berubah. Kembalikan usulan lalu ajukan ulang.');
    const log=[...draft.log,{role:draft.steps[draft.log.length],person:v.person,decision:v.decision,note:v.note,at:dateNow()}];
    const status=v.decision==='Kembalikan'?'Dikembalikan':log.length===draft.steps.length?'Terbit':'Menunggu';
    const patch=status==='Terbit'?{revisi:draft.version,status:'Aktif',tglTerbit:TODAY,bulanTerbit:TODAY.slice(0,7),tglReview:v.review,sisaHariReview:daysBetween(TODAY,v.review)}:{};
    save(history.map(r=>r===draft?{...r,status,log}:r),patch);
    return status==='Terbit'?'Versi baru terbit di Master Dokumen.':status;
  }
  return <><Card title="Dokumen terkendali" actions={<RecordLink dataset="documents" id={doc.id}>Buka master</RecordLink>}>
    <Field label="Pilih dokumen" choices={choiceRows(docs,'nama')} value={doc.id} onChange={e=>select(e.target.value)}/>
    <p>Versi berlaku <strong>{doc.revisi}</strong> · {doc.pemilik} · Review berikutnya {fmtDate(doc.tglReview)}</p>
    {history.find(r=>r.status==='Terbit' && r.version===doc.revisi) && <button className="btn btn-soft" onClick={()=>download(doc.id+'-'+doc.revisi+'.txt',history.find(r=>r.status==='Terbit' && r.version===doc.revisi).content)}>Unduh isi versi berlaku</button>}
  </Card><Card title={draft?'Tinjau revisi · '+draft.steps[draft.log.length]:'Ajukan revisi'}><div key={doc.id+(draft?.at || '')}>
    {draft?<><p><strong>{draft.version} · {draft.summary}</strong></p><p style={{whiteSpace:'pre-wrap'}}>{draft.content}</p>
      <Form action="Catat keputusan" onSave={decide}><Field label="Nama pemeriksa" name="person" required/><Field label="Keputusan" name="decision" choices={['Setujui','Kembalikan']}/><Field label="Catatan pemeriksaan" name="note" required/><Field label="Review berikutnya jika terbit" type="date" name="review" min={TODAY} defaultValue={addDays(TODAY,365)} required/></Form></>:
      <Form action="Ajukan revisi" onSave={submit}><Field label="Pengusul" name="person" required/><Field label="Lokasi & alur" name="site" choices={ [['','Pusat · Pemilik proses'],...sites.map(s=>[s.id,s.name+' · '+s.steps.join(' → ')])] }/><Field label="Ringkasan perubahan" name="summary" required wide/><Field label="Isi dokumen revisi" type="textarea" name="content" required wide/></Form>}
    </div></Card><Card title="Riwayat revisi"><Table columns={['Versi','Lokasi','Perubahan','Status','Jejak pemeriksaan']} rows={history.map(r=>[r.version,r.site,r.summary,<Badge key="status" value={r.status}/>,<details key="log"><summary>{r.log.length} keputusan</summary><p>Pengusul {r.person}</p>{r.log.map((a,i)=><p key={i}>{a.at.slice(0,10)} · {a.role} · {a.person} · {a.decision} · {a.note}</p>)}<p>{r.content}</p></details>])}/></Card></>;
}

function Evidence() {
  const get=useGet(), findings=get('findings'), capas=get('capa'), docs=get('documents');
  const operations=useLedger('operations').rows;
  const [id,select]=useState(''), [capaId,selectCapa]=useState('');
  const finding=findings.find(f=>f.id===id) || findings.find(f=>capas.some(c=>c.ref===f.id)) || findings[0];
  if(!finding) return <Card title="Berkas audit">Tambahkan temuan dari modul E-Audit.</Card>;
  const linked=capas.filter(c=>c.ref===finding.id), capa=linked.find(c=>c.id===capaId)||linked[0];
  const evidence=capa?.evidence || [], checks=capa?.checks || [];
  function create(v) {
    const record=FORMS.capa.build({...initialValues('capa'),masalah:finding.deskripsi,departemen:finding.area, pic:finding.pic,sumber:'Audit Internal',kategori:'Process',akarPenyebab:v.cause,tindakan:v.action},{get});
    dataActions.add('capa',{...record,ref:finding.id});selectCapa(record.id);
  }
  async function exportFile(withFiles=false) {
    const {evidence:items,checks:results,...record}=capa;
    await workbook('Berkas-'+finding.id+'-'+capa.id,{Temuan:[finding],CAPA:[record],Bukti:evidence.map(({file,...e})=>({...e,lampiran:file?.name})),Verifikasi:checks,Operasi:operations.filter(r=>r.finding===finding.id),
      Dokumen:evidence.filter(e=>e.document).map(e=>({id:e.document,versi:e.version,judul:e.documentName,isi:e.documentText || 'Metadata daftar induk'}))},withFiles?evidence.map(e=>e.file).filter(Boolean):undefined);
  }
  return <><Card title="Telusuri temuan" actions={<RecordLink dataset="findings" id={finding.id}>Buka temuan</RecordLink>}>
    <Field label="Temuan audit" choices={choiceRows(findings,'deskripsi')} value={finding.id} onChange={e=>select(e.target.value)}/>
    {capa && <><Field label="CAPA terkait" choices={choiceRows(linked,'masalah')} value={capa.id} onChange={e=>selectCapa(e.target.value)}/><p><RecordLink dataset="capa" id={capa.id}/> · {capa.pic} · <Badge value={capa.status}/></p></>}
    {!capa && <Form action="Buat CAPA dari temuan" onSave={create}><Field label="Akar penyebab" name="cause" choices={FORMS.capa.fields.find(f=>f.key==='akarPenyebab').options}/><Field label="Tindakan korektif" name="action" required/></Form>}
  </Card>{capa && <div key={capa.id} className="stack"><Card title="Rekaman operasional & bukti tindakan" subtitle="Catat hasil pemeriksaan dan referensi sumber agar auditor dapat menelusuri bukti.">
    <Form action="Tambahkan bukti" onSave={async ({attachment,...v},formData)=>{
      const attachmentFile=formData.get('attachment');
      let file;
      if(attachmentFile?.name){
        if(attachmentFile.size>256*1024) throw Error('Ukuran maksimum lampiran 256 KB per bukti.');
        if(!/\.(pdf|txt|png|jpe?g)$/i.test(attachmentFile.name)) throw Error('Pilih lampiran PDF, TXT, PNG, atau JPEG.');
        const bytes=new Uint8Array(await attachmentFile.arrayBuffer());
        file={name:attachmentFile.name,data:btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''))};
      }
      const d=docs.find(d=>d.id===v.document);
      dataActions.update('capa',capa.id,{evidence:[...evidence,{...v,file,version:d?.revisi,documentName:d?.nama,documentText:d?.versions?.find(r=>r.status==='Terbit' && r.version===d.revisi)?.content,at:dateNow()}]},true);
    }}><Field label="Jenis rekaman" name="kind" choices={['Inspeksi penerimaan','Pelepasan produk','Produk tidak sesuai','Pengendalian perubahan','Bukti pelaksanaan']}/><Field label="Referensi lot / nomor bukti" name="reference" required/><Field label="Pemeriksa" name="person" required/><Field label="Dokumen acuan" name="document" choices={choiceRows(docs.filter(d=>d.status==='Aktif'),'nama')} required/><Field label="Hasil pemeriksaan" name="result" required wide/><Field label="Lampiran bukti (opsional, maks. 256 KB)" type="file" name="attachment" accept=".pdf,.txt,.png,.jpg,.jpeg" wide/></Form>
    <Table columns={['Referensi','Jenis','Hasil','Dokumen saat dicatat']} rows={evidence.map(e=>[e.reference,e.kind,e.result,<RecordLink key="doc" dataset="documents" id={e.document}>{e.document} · {e.version}</RecordLink>])}/>
  </Card><Card title="Verifikasi efektivitas">
    {evidence.length>0 && <Form action="Simpan verifikasi" onSave={v=>{
      const closed=v.result==='Efektif';
      dataActions.update('capa',capa.id,{checks:[...checks,{...v,at:dateNow(),evidenceCount:evidence.length}],efektivitas:v.result,status:closed?'Closed':'On Progress',progress:closed?100:75,tglSelesai:closed?TODAY:null,tahapKe:closed?7:5,tahap:closed?'Pencegahan Berulang':'Verifikasi Efektivitas'});
    }}><Field label="Verifikator" name="person" required/><Field label="Hasil verifikasi" name="result" choices={['Efektif','Perlu Tindak Lanjut']}/><Field label="Dasar keputusan" name="note" required/></Form>}
    <Table columns={['Verifikator','Hasil','Dasar keputusan']} rows={checks.map(c=>[c.person,c.result,c.note])} empty="Tambahkan bukti, lalu catat hasil verifikasi."/>
    <div className="work-actions"><button className="btn btn-soft" onClick={()=>exportFile()}>Unduh berkas audit (.xlsx)</button><button className="btn btn-outline" onClick={()=>exportFile(true)}>Unduh paket lengkap (.zip)</button></div>
  </Card></div>}</>;
}

function Tasks() {
  const get=useGet(), [owner,setOwner]=useState(''), [cutoff,setCutoff]=useState(TODAY);
  const specs=[
    ['capa','pic','target','masalah','Closed'],['findings','pic','deadline','deskripsi','Tertutup'],['documents','pemilik','tglReview','nama','Obsolete'],
    ['certifications','karyawan','kadaluarsa','sertifikasi',''],['risks','pic','target','deskripsi','Closed'],
  ];
  const all=specs.flatMap(([key,who,when,title,closed])=>get(key).filter(r=>r[when] && r.status!==closed && !(key==='risks' && r.status==='Terealisasi') && r[when]<=addDays(cutoff || TODAY,key==='certifications'?90:7)).map(r=>({key,id:r.id,owner:r[who],due:r[when],title:r[title]}))).sort((a,b)=>a.due.localeCompare(b.due));
  const rows=all.filter(t=>!owner || t.owner===owner);
  return <Card title="Agenda & pengingat" subtitle="Tenggat hingga 7 hari ke depan, sertifikasi hingga 90 hari, serta pekerjaan yang sudah lewat tenggat.">
    <div className="work-fields"><Field label="Tanggal acuan" type="date" value={cutoff} onChange={e=>setCutoff(e.target.value || TODAY)}/><Field label="Penanggung jawab" value={owner} onChange={e=>setOwner(e.target.value)} choices={[['','Semua PIC'],...[...new Set(all.map(t=>t.owner).filter(Boolean).concat(owner || []))].sort()]}/></div>
    <div className="work-actions"><strong>{rows.length} tugas</strong><button className="btn btn-soft" disabled={!owner || !rows.length} onClick={()=>download('Pengingat.eml','X-Unsent: 1\r\nSubject: Pengingat tugas TQ IMS\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\nYth. '+owner+',\r\n'+rows.map(t=>t.due+' | '+t.id+' | '+t.title).join('\r\n'),'message/rfc822')}>Unduh draf email PIC</button></div>
    <Table columns={['Tenggat','PIC','Tugas','Sumber']} rows={rows.map(t=>[fmtDate(t.due),t.owner,t.title,<RecordLink key={t.id} dataset={t.key} id={t.id}/>])}/>
    <div className="work-actions"><Link href="/ims">Lihat prioritas di IMS 360°</Link><Link href="/fitur/integrasi#dukungan">Onboarding & dukungan</Link></div>
  </Card>;
}
export default function Basic({fitur}) { if(fitur==='revisi') return <Revisions/>; if(fitur==='bukti') return <><Evidence/><Operations/></>; return <Tasks/>; }
