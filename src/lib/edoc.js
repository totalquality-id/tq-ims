export const sampleRevisions = {
  'SOP-QMR-001':'Rev. 01', 'SOP-QC-001':'Rev. 04', 'FRM-QC-001':'Rev. 02', 'SOP-PUR-001':'Rev. 03',
};
export const MAX_PDF_BYTES=10*1024*1024;
export function currentFile(doc) {
  if(doc.file) return doc.file;
  if(sampleRevisions[doc.id]===doc.revisi) return {key:doc.id,name:doc.id+'.pdf'};
  return null;
}
export function fileHref(file,download=false) {
  return '/api/edoc/files?'+new URLSearchParams({key:file.key,...(download?{download:file.name}:{})});
}
export async function uploadPdf(file) {
  if(!file?.size || file.size>MAX_PDF_BYTES) throw Error('Pilih PDF berukuran hingga 10 MB.');
  const res=await fetch('/api/edoc/files',{method:'POST',headers:{'Content-Type':'application/pdf'},body:file});
  const result=await res.json();
  if(!res.ok) throw Error(result.error || 'PDF gagal disimpan.');
  return {key:result.key,name:file.name,size:file.size};
}
