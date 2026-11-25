import { NextResponse } from 'next/server';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { sampleRevisions, MAX_PDF_BYTES } from '@/lib/edoc';

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
export async function POST(req){
  const cfg=config();
  if(!cfg || !process.env.TQ_EDOC_COOKIE_SECRET)return json('Konfigurasi Supabase Storage belum tersedia.',503);
  // Hosted uploads require a Supabase user explicitly enrolled for D-ISO.
  const url=new URL(req.url),host=req.headers.get('host');
  if(!host || !['http://'+host,'https://'+host].includes(req.headers.get('origin')))return json('Asal unggahan tidak valid.',403);
  const local=process.env.TQ_EDOC_LOCAL_PREVIEW==='true' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname) && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const owner=local?null:await account(req,cfg);
  if(!local && !owner)return json('Masuk melalui Akses unggah untuk hosting bersama pada Master Dokumen.',401);
  if(req.headers.get('content-type')!=='application/pdf')return json('Format unggahan harus PDF.',415);
  if(Number(req.headers.get('content-length'))>MAX_PDF_BYTES)return json('Ukuran PDF melebihi 10 MB.',413);
  try{
    const reader=req.body?.getReader();if(!reader)return json('Pilih berkas PDF.',400);
    const chunks=[];let size=0;
    while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_PDF_BYTES){await reader.cancel();return json('Ukuran PDF melebihi 10 MB.',413);}chunks.push(Buffer.from(value));}
    const bytes=Buffer.concat(chunks);
    if(bytes.subarray(0,5).toString()!=='%PDF-' || !bytes.subarray(-2048).includes(Buffer.from('%%EOF')))return json('Berkas tidak memiliki struktur PDF yang valid.',422);
    const old=workspace(req),id=owner || old || randomBytes(20).toString('hex'),key=randomUUID();
    const res=await objectRequest(cfg,'workspaces/'+id+'/'+key+'.pdf',{method:'POST',headers:{'Content-Type':'application/pdf','x-upsert':'false'},body:bytes});
    if(!res.ok)return json('Supabase belum menyimpan PDF. Coba lagi setelah penyimpanan siap.',502);
    const response=NextResponse.json({key},{status:201,headers:{'Cache-Control':'no-store'}});
    if(local)response.cookies.set(cookie,id+'.'+mac(id),{httpOnly:true,sameSite:'strict',secure:url.protocol==='https:',path:'/api/edoc',maxAge:365*86400});
    return response;
  }catch{return json('Penyimpanan dokumen belum dapat dihubungi.',503);}
}
