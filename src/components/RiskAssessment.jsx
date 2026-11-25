'use client';

import { useState } from 'react';
import { DATASETS } from '@/lib/datasets';
import { assessment, guidance, linkTargets, ratingOptions, statusByType } from '@/lib/ipr';

export function assessmentFields(fields, values) {
  const type=values.jenis==='Peluang'?'Peluang':'Risiko';
  const risk=type==='Risiko';
  return fields.filter(f=>(risk || !f.key.startsWith('residual')) && (f.key!=='ref' || values.sumber==='PESTEL')).map(f=>{
    if(f.key==='kemungkinan') return {...f,label:risk?'Kemungkinan kejadian':'Kemudahan merealisasikan peluang',options:ratingOptions(type)};
    if(f.key==='dampak') return {...f,label:risk?'Keparahan dampak':'Dampak positif',options:ratingOptions('dampak')};
    if(f.key==='akibat') return {...f,label:risk?'Akibat terhadap proses atau pelanggan':'Manfaat yang diharapkan'};
    if(f.key==='pengendalian') return {...f,label:risk?'Tindakan pengendalian atau mitigasi':'Tindakan untuk merealisasikan peluang'};
    if(f.key==='status') return {...f,options:statusByType[type]};
    return f;
  });
}

export function ScorePreview({values}) {
  const result=assessment(values.kemungkinan,values.dampak);
  return <section className="ipr-preview span-full" aria-live="polite">
    <strong>Penilaian IPR{result?' · '+values.kemungkinan+' × '+values.dampak+' = '+result.score+' · '+result.level:''}</strong>
    <p>{result?guidance(values.jenis,result.level):'Pilih kedua nilai untuk melihat skor dan tindakan yang diperlukan.'}</p>
    <small>Low 1–2 · Moderate 3–5 · High 6–9</small>
  </section>;
}

export function ActionLinks({refs,onChange,get}) {
  const [dataset,choose]=useState('okr'),[id,select]=useState('');
  const catalog=DATASETS[dataset], key=dataset+'/'+id;
  return <fieldset className="ipr-links span-full"><legend className="form-label">Rekaman IMS untuk tindak lanjut</legend>
    <div className="form-grid"><label className="form-group"><span className="form-label">Register tujuan</span><select aria-label="Register tujuan" className="form-select" value={dataset} onChange={e=>{choose(e.target.value);select('');}}>{linkTargets.map(k=><option value={k} key={k}>{DATASETS[k].title}</option>)}</select></label>
    <label className="form-group"><span className="form-label">Rekaman tujuan</span><select className="form-select" aria-label="Rekaman tujuan" value={id} onChange={e=>select(e.target.value)}><option value="">Pilih rekaman</option>{get(dataset).map(r=><option key={r.id} value={r.id}>{r.id} · {r[catalog.titleKey]}</option>)}</select></label></div>
    <button className="btn btn-soft btn-sm" type="button" disabled={!id || refs.includes(key)} onClick={()=>{onChange([...refs,key]);select('');}}>Tautkan rekaman</button>
    {refs.length>0 && <ul>{refs.map(ref=><li key={ref}>{ref} <button className="btn-ghost" type="button" onClick={()=>onChange(refs.filter(r=>r!==ref))}>Lepas</button></li>)}</ul>}
  </fieldset>;
}
