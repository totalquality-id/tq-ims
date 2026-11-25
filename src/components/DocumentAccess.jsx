'use client';

import {useState} from 'react';
export default function DocumentAccess(){
  const [note,setNote]=useState(''),[busy,setBusy]=useState(false);
  return <details className="edoc-access"><summary>Akses unggah untuk hosting bersama</summary>
    <form className="edoc-access-form" onSubmit={async e=>{
      e.preventDefault();const form=e.currentTarget;const values=new FormData(form);setBusy(true);
      try{const r=await fetch('/api/edoc/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:values.get('email'),password:values.get('password')})});
        const data=await r.json();setNote(r.ok?'Akses unggah aktif untuk sesi ini.':data.error);form.reset();}
      catch{setNote('Gagal menghubungi Supabase.');}finally{setBusy(false);}
    }}>
    <label>Email Supabase<input className="form-input" type="email" name="email" autoComplete="username" required/></label>
    <label>Kata sandi<input className="form-input" type="password" name="password" autoComplete="current-password" required/></label>
    <button className="btn btn-outline btn-sm" disabled={busy}>Masuk</button><span role="status">{note}</span></form></details>;
}
