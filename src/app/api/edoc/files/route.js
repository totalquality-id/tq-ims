import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { sampleRevisions } from '@/lib/edoc';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const bucket='tq-ims-edoc';
const cookie='tq_edoc_workspace';
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
function config(){
  const url=process.env.TQ_EDOC_SUPABASE_URL, key=process.env.TQ_EDOC_STORAGE_KEY;
  return url && key ? {url,key}:null;
}
function json(error,status){return NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});}
function mac(id){return createHmac('sha256',process.env.TQ_EDOC_COOKIE_SECRET).update('edoc:'+id).digest('hex');}
function workspace(req){
  const [id='',sig='']=(req.cookies.get(cookie)?.value || '').split('.');
  if(!/^[0-9a-f]{40}$/.test(id) || !/^[0-9a-f]{64}$/.test(sig))return null;
  return timingSafeEqual(Buffer.from(sig),Buffer.from(mac(id)))?id:null;
}
async function account(req,cfg){
  const token=req.cookies.get('tq_edoc_auth')?.value;
  if(!token)return null;
  const r=await fetch(cfg.url+'/auth/v1/user',{headers:{apikey:cfg.key,Authorization:'Bearer '+token},cache:'no-store'});
  if(!r.ok)return null;
  const user=await r.json();
  return user.app_metadata?.tq_ims_edoc===true && uuid.test(user.id)?'account-'+user.id:null;
}
function objectRequest(cfg,path,options={}) {
  return fetch(cfg.url+'/storage/v1/object/'+bucket+'/'+path,{...options,cache:'no-store',headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key,...options.headers}});
}
export async function GET(req){
  const key=req.nextUrl.searchParams.get('key') || '',sample=Object.hasOwn(sampleRevisions,key),cfg=config();
  if(!sample && !uuid.test(key))return json('Berkas tidak ditemukan.',404);
  if(!cfg){
    if(sample) return NextResponse.redirect(new URL('/edoc/'+key+'.pdf',req.url));
    return json('Penyimpanan dokumen belum dikonfigurasi.',503);
  }
  const id=sample?null:workspace(req) || await account(req,cfg);
  if(!sample && !id) return json('Buka berkas dari ruang kerja pemiliknya.',403);
  const location=sample?'samples/'+key+'.pdf':'workspaces/'+id+'/'+key+'.pdf';
  const range=req.headers.get('range');
  try{
    const res=await objectRequest(cfg,location,{headers:range?{Range:range}:{}});
    if(!res.ok)return json('PDF tidak tersedia di penyimpanan.',res.status===400?404:res.status);
    const name=(req.nextUrl.searchParams.get('download') || key+'.pdf').replace(/[^a-zA-Z0-9._ -]/g,'_').slice(-140);
    const headers={'Content-Type':'application/pdf','Cache-Control':sample?'public, max-age=300':'private, no-store','X-Content-Type-Options':'nosniff',
      'Content-Disposition':(req.nextUrl.searchParams.has('download')?'attachment':'inline')+'; filename="'+name+'"'};
    for(const k of ['content-length','content-range','accept-ranges']) if(res.headers.has(k)) headers[k]=res.headers.get(k);
    return new Response(res.body,{status:res.status,headers});
  }catch{return json('Supabase Storage belum dapat dihubungi.',503);}
}
