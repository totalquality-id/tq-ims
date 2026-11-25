'use client';

import { useState } from 'react';
import { ActionLinks, ScorePreview, assessmentFields } from './RiskAssessment';
import { IPR, statusByType } from '@/lib/ipr';
import { currentFile, uploadPdf } from '@/lib/edoc';
import { FORMS, initialValues } from '@/lib/forms';

// Form tambah / ubah data. Nilai disimpan sebagai teks lalu dibangun menjadi
// baris lengkap oleh FORMS[key].build.
export default function RecordForm({ datasetKey, row, initialType, get, onSubmit, onCancel, submitLabel = 'Simpan' }) {
  const form = FORMS[datasetKey];
  const ipr = datasetKey === 'risks';
  const [values, setValues] = useState(() => {
    const v=initialValues(datasetKey,row);
    return ipr && !row && initialType ? {...v,jenis:initialType,status:statusByType[initialType][0]} : v;
  });
  const fields=ipr ? assessmentFields(form.fields,values) : form.fields;
  const [pdf,setPdf]=useState(null), [saving,setSaving]=useState(false);
  const controlled=datasetKey==='documents' && row && currentFile(row);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v, ...(ipr && k==='jenis' && statusByType[v] ? {status:statusByType[v][0]} : {}) }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.required && (v == null || String(v).trim() === '')) next[f.key] = 'Wajib diisi';
      if (f.type === 'number' && v !== '' && v != null) {
        const n = Number(v);
        if (Number.isNaN(n)) next[f.key] = 'Harus angka';
        else if (f.min != null && n < f.min) next[f.key] = `Minimal ${f.min}`;
        else if (f.max != null && n > f.max) next[f.key] = `Maksimal ${f.max}`;
      }
    }
    if(ipr && !statusByType[values.jenis]) next.jenis='Pilih jenis penilaian.';
    if(ipr && values.jenis==='Risiko' && !!values.residualKemungkinan!==!!values.residualDampak) next.residualDampak='Lengkapi kedua nilai residual atau kosongkan keduanya.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      setSaving(true);
      const record=form.build(values,{get,existing:row});
      if(pdf){record.file=await uploadPdf(pdf);record.format='PDF';}
      await onSubmit(record);
    } catch(error){setErrors({save:error.message});}finally{setSaving(false);}
  };

  return (
    <form className="record-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        {datasetKey==='documents' && !controlled && <label className="edoc-upload span-full"><strong>Berkas dokumen</strong><span>PDF hingga 10 MB · Supabase Storage</span>
          <input type="file" accept="application/pdf,.pdf" aria-label="Berkas dokumen PDF" onChange={e=>setPdf(e.target.files[0] || null)}/></label>}
        {controlled && <p className="ipr-preview span-full">Untuk mengganti PDF, ajukan versi baru melalui Kelola revisi dan persetujuan.</p>}
        {ipr && row && row.metode!==IPR && <p className="ipr-preview span-full">Skor lama {row.skor} ({row.level}) menggunakan skala 5×5. Pilih nilai baru untuk menyimpan penilaian IPR 3×3.</p>}
        {fields.map((f) => {
          const id = `f-${datasetKey}-${f.key}`;
          const opts = typeof f.options === 'function' ? f.options(get) : f.options;
          const common = { id, disabled:!!controlled && f.key==='revisi', value: values[f.key] ?? '', onChange: (e) => set(f.key, e.target.value), 'aria-invalid': !!errors[f.key] };
          return (
            <div key={f.key} className={`form-group ${f.span === 'full' ? 'span-full' : ''}`}>
              <label className={`form-label ${f.required ? 'required' : ''}`} htmlFor={id}>{f.label}</label>
              {f.type === 'select' ? (
                <select className="form-select" {...common}>
                  <option value="" disabled={ipr && f.required}>Pilih</option>
                  {opts.map((o) => {
                    const [v, l] = Array.isArray(o) ? o : [o, o];
                    return <option key={v} value={v}>{l}</option>;
                  })}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className="form-input" rows={3} {...common} />
              ) : (
                <input className="form-input" type={f.type ?? 'text'} min={f.min} max={f.max} step={f.step} {...common} />
              )}
              {ipr && f.key==='dampak' && <ScorePreview values={values}/>}
              {errors[f.key] && <div className="form-error">{errors[f.key]}</div>}
            </div>
          );
        })}
        {ipr && <ActionLinks refs={values.actionRefs || []} get={get} onChange={v=>set('actionRefs',v)}/>}
      </div>
      {errors.save && <p role="alert" className="form-error">{errors.save}</p>}
      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Batal</button>
        <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving?'Menyimpan…':submitLabel}</button>
      </div>
    </form>
  );
}
