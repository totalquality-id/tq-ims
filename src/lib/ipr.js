export const IPR = 'IPR 3×3';
export const LEGACY = 'Skala lama 5×5';
export const ratings = ['Rendah', 'Sedang', 'Tinggi'];
export const criteria = {
  Risiko: ['Setiap lebih dari 3 bulan', 'Setiap 1–3 bulan', 'Setiap hari sampai setiap minggu'],
  Peluang: ['Investasi besar, waktu lama, kesulitan tinggi', 'Investasi kecil sampai menengah, waktu dan kesulitan sedang', 'Tanpa investasi, waktu singkat, kesulitan rendah'],
  dampak: ['Individu atau internal departemen', 'Antar departemen', 'Perusahaan atau organisasi'],
};
export const statusByType = {Risiko:['Open','Mitigasi','Monitoring','Closed'], Peluang:['Rencana','On Progress','Terealisasi']};
export const linkTargets = ['okr','capa','findings','audits','documents','trainings','kpi','pestel','stakeholders','feedback'];
export function iprLevel(score) {
  if (!Number.isInteger(score) || score<1 || score>9) return null;
  return score<=2 ? 'Low' : score<=5 ? 'Moderate' : 'High';
}
export function assessment(first, second) {
  const a=Number(first), b=Number(second);
  if (![a,b].every(n=>Number.isInteger(n) && n>=1 && n<=3)) return null;
  return {score:a*b,level:iprLevel(a*b)};
}
export function guidance(type,level) {
  if (level==='Low') return 'Pantau agar pengendalian yang ada tetap terpelihara. Tidak diperlukan tindakan tambahan.';
  if (level==='Moderate') return type==='Risiko' ? 'Lakukan tindakan penurunan risiko dengan periode pelaksanaan 6–12 bulan.' : 'Peluang dapat diambil atau dilaksanakan.';
  if (level==='High') return type==='Risiko' ? 'Segera tindak lanjuti untuk menurunkan tingkat risiko secara keseluruhan.' : 'Segera ambil peluang dan laksanakan secepat mungkin.';
  return '';
}
export const ratingOptions=key=>criteria[key].map((text,i)=>[i+1,(i+1)+' · '+ratings[i]+' — '+text]);
