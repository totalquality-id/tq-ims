export const workspaces = {
  revisi: ['Basic', 'edoc', 'Persetujuan dokumen', 'Ajukan perubahan, periksa isi revisi, dan terbitkan versi yang telah disetujui.'],
  bukti: ['Basic', 'capa', 'Berkas audit', 'Telusuri temuan, tindakan, bukti operasional, dan hasil verifikasi dalam satu berkas.'],
  tugas: ['Basic', 'skill', 'Agenda PIC', 'Tinjau tenggat lintas modul dan siapkan pengingat bagi penanggung jawab.'],
  analisis: ['Advanced', 'd-iso', 'Analisis mutu', 'Bandingkan tren temuan, CAPA, dan keluhan untuk memilih prioritas perbaikan.'],
  pemasok: ['Advanced', 'audit', 'Evaluasi pemasok', 'Ukur mutu penerimaan dan ketepatan pengiriman per pemasok.'],
  rapat: ['Advanced', 'executive', 'Tinjauan manajemen', 'Bekukan indikator rapat, catat keputusan, dan tindak lanjuti bersama konsultan.'],
  lokasi: ['Custom', 'edoc', 'Lokasi & persetujuan', 'Tetapkan rantai persetujuan, indikator, dan sasaran untuk setiap lokasi.'],
  integrasi: ['Custom', 'd-iso', 'Integrasi & layanan', 'Uji pertukaran data dan siapkan profil integrasi, infrastruktur, serta layanan.'],
};
export const moduleWork = {
  edoc: ['revisi','lokasi'], capa: ['bukti','tugas'], audit: ['bukti','pemasok'], skill: ['tugas'],
  executive: ['rapat','analisis'], 'd-iso': ['analisis','rapat','integrasi'], risk: ['tugas','analisis'], pestel: ['tugas'],
};
export const planEntry = { Basic: 'revisi', Advanced: 'analisis', Custom: 'lokasi' };
