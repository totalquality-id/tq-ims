import {NextResponse} from 'next/server';
export const runtime='nodejs';
export async function POST(req) {
  const origin=req.headers.get('origin');
  if(!origin || new URL(origin).host!==req.headers.get('host'))return NextResponse.json({error:'Asal permintaan tidak valid.'},{status:403});
  if(!process.env.TQ_EDOC_SUPABASE_URL || !process.env.TQ_EDOC_STORAGE_KEY)return NextResponse.json({error:'Konfigurasi Supabase belum tersedia.'},{status:503});
  try{
    const {email,password}=await req.json();
    if(typeof email!=='string' || typeof password!=='string' || !email || !password || password.length>1024)return NextResponse.json({error:'Lengkapi email dan kata sandi.'},{status:400});
    const res=await fetch(process.env.TQ_EDOC_SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:process.env.TQ_EDOC_STORAGE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password}),cache:'no-store'});
    if(!res.ok)return NextResponse.json({error:'Masuk gagal. Periksa akun Supabase Anda.'},{status:401});
    const data=await res.json();
    if(data.user?.app_metadata?.tq_ims_edoc!==true)return NextResponse.json({error:'Akun belum diberi akses E-Document TQ IMS.'},{status:403});
    const out=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
    out.cookies.set('tq_edoc_auth',data.access_token,{httpOnly:true,secure:true,sameSite:'strict',path:'/api/edoc',maxAge:data.expires_in});return out;
  }catch{return NextResponse.json({error:'Sesi Supabase belum dapat dibuka.'},{status:503});}
}
