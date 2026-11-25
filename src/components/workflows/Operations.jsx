'use client';

import { Card } from '@/components/ui';
import { TODAY } from '@/lib/data/core';
import { useGet } from '@/lib/store';
import { Field, Form, RecordLink, Table, choiceRows, useLedger, workbook } from './shared';

export default function Operations() {
  const get=useGet(), ledger=useLedger('operations'), findings=get('findings');
  return <Card title="Register operasi · Klausul 8" subtitle="Rekam inspeksi rutin atau pelepasan produk. Kaitkan dengan temuan audit bila relevan.">
    <Form action="Simpan rekaman operasi" onSave={v=>ledger.add(v)}>
      <Field label="Proses operasi" name="process" choices={['Tinjauan pesanan','Pengendalian pemasok','Inspeksi proses','Pelepasan produk','Produk tidak sesuai','Perubahan proses']}/>
      <Field label="Nomor lot / pesanan" name="lot" required/><Field label="Tanggal operasi" name="date" type="date" defaultValue={TODAY} required/>
      <Field label="PIC operasi" name="pic" required/><Field label="Kesimpulan inspeksi" name="result" required/>
      <Field label="Temuan terkait (opsional)" name="finding" choices={ [['','Tanpa temuan'],...choiceRows(findings,'deskripsi')] }/>
    </Form><Table columns={['Tanggal','Proses','Lot / pesanan','PIC','Hasil','Temuan']} rows={ledger.rows.map(r=>[r.date,r.process,r.lot,r.pic,r.result,r.finding?<RecordLink key="f" dataset="findings" id={r.finding}/>:null])}/>
    <div><button type="button" className="btn btn-soft" disabled={!ledger.rows.length} onClick={()=>workbook('Register-operasi',{Operasi:ledger.rows})}>Unduh register operasi</button></div>
  </Card>;
}
