const DATABASE='d-iso-edoc';
const STORE='pdfs';

async function pdfTransaction(mode, operation) {
  const db=await new Promise((resolve,reject)=>{
    const open=indexedDB.open(DATABASE,1);
    open.onupgradeneeded=()=>open.result.createObjectStore(STORE);
    open.onsuccess=()=>resolve(open.result);
    open.onerror=()=>reject(open.error);
  });
  try{
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode);
      const request=operation(tx.objectStore(STORE));
      tx.oncomplete=()=>resolve(request.result);
      tx.onabort=()=>reject(tx.error || new Error('Transaksi penyimpanan dibatalkan.'));
    });
  }finally{db.close();}
}

export async function saveLocalPdf(file) {
  if(!file?.size || file.size>10*1024*1024)throw Error('Pilih PDF berukuran hingga 10 MB.');
  const header=await file.slice(0,5).text(),tail=await file.slice(-2048).text();
  if(header!=='%PDF-' || !tail.includes('%%EOF'))throw Error('Berkas yang dipilih bukan PDF yang valid.');
  const key=crypto.randomUUID();
  try{await pdfTransaction('readwrite',store=>store.add(file.slice(0,file.size,'application/pdf'),key));}
  catch{throw Error('PDF gagal disimpan. Periksa ruang kosong dan izin penyimpanan browser.');}
  return {key,storage:'browser',name:file.name,size:file.size};
}

export async function readLocalPdf(key) {
  const blob=await pdfTransaction('readonly',store=>store.get(key));
  if(!blob)throw Error('PDF tidak ditemukan di penyimpanan browser ini.');
  return blob;
}

export function removeLocalPdf(file) {
  if(file?.storage==='browser')return pdfTransaction('readwrite',store=>store.delete(file.key));
}
