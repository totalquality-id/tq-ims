// Warna badge mengikuti makna nilai, sama di seluruh modul.
const TONES = {
  success: [
    'Closed', 'Selesai', 'Tertutup', 'Aktif', 'Tercapai', 'Kompeten', 'Sudah Dibaca', 'Positif', 'Pujian', 'Efektif',
    'Low', 'Rendah', 'Ditandatangani', 'Membaik', 'Terealisasi', 'Ya', 'Baik', 'Sangat Baik',
  ],
  warning: [
    'On Progress', 'Dalam Proses', 'Review', 'Perlu Perhatian', 'Perlu Pengembangan', 'Minor', 'At Risk', 'Medium', 'Moderate',
    'Sedang', 'Akan Kadaluarsa', 'Belum Dibaca', 'Revisi', 'Netral', 'Saran', 'Menunggu Persetujuan', 'Berjalan',
    'Mitigasi', 'Perlu Tindak Lanjut', 'Cukup', 'Approval',
  ],
  danger: [
    'Overdue', 'Terbuka', 'Kadaluarsa', 'Gagal Terkirim', 'Major', 'Komplain', 'Negatif', 'Tidak Tercapai',
    'Belum Tercapai', 'Prioritas', 'High', 'Tinggi', 'Extreme', 'Gap', 'Menurun', 'Kurang', 'Rahasia',
  ],
  info: [
    'Open', 'Terjadwal', 'Draft', 'On Track', 'Baru', 'Observasi', 'Internal', 'Rencana', 'Risiko', 'Kelola Ketat',
    'Belum Diajukan', 'Belum Diverifikasi',
  ],
  lilac: ['OFI', 'Peluang', 'Eksternal', 'Jaga Kepuasan', 'E-Learning', 'Terbatas'],
  sky: ['Monitoring', 'Jaga Informasi', 'Stabil', 'Classroom'],
  gray: ['Obsolete', 'Pantau', 'Tidak', 'OJT'],
};

const MAP = Object.fromEntries(Object.entries(TONES).flatMap(([tone, values]) => values.map((v) => [v, tone])));

export const toneOf = (value) => MAP[value] ?? 'gray';
