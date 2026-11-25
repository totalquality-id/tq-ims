export const sampleRevisions = {
  'SOP-QMR-001':'Rev. 01', 'SOP-QC-001':'Rev. 04', 'FRM-QC-001':'Rev. 02', 'SOP-PUR-001':'Rev. 03',
};
export function currentFile(doc) {
  if(doc.file) return doc.file;
  if(sampleRevisions[doc.id]===doc.revisi) return {key:doc.id,name:doc.id+'.pdf'};
  return null;
}
export function fileHref(file,download=false) {
  if(Object.hasOwn(sampleRevisions,file.key))return '/edoc/'+file.key+'.pdf';
  return '/api/edoc/files?'+new URLSearchParams({key:file.key,...(download?{download:file.name}:{})});
}
