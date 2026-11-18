# Perbaikan Hapus Materi/Tugas dan Tampilan Tugas Siswa

## Yang berubah
- Guru/Admin mendapatkan tombol hapus pada kartu Materi dan Tugas.
- Penghapusan memakai endpoint DELETE khusus, bukan mengganti seluruh koleksi dari browser.
- Backend memeriksa role dan kepemilikan materi/tugas sebelum menghapus.
- Menghapus materi juga membersihkan lampiran GridFS yang terhubung.
- Menghapus tugas juga menghapus data pengumpulan tugas terkait serta file GridFS soal/jawaban.
- Tampilan Tugas Siswa diperbarui menjadi kartu responsif dengan mata pelajaran, kelas, tenggat, instruksi, lampiran, status pengumpulan, dan panel unggah jawaban.
- Halaman lain dan desain dashboard yang sudah ada tidak diubah.

## Pemasangan
1. Backup folder project lama.
2. Ekstrak ZIP.
3. Salin isi folder `educn-full` ke folder project yang digunakan (timpa file yang diminta).
4. Pertahankan `.env.local` milik project lama; jangan menggantinya.
5. Jalankan `npm install` jika belum pernah, lalu `npm run dev`.
6. Jangan menjalankan `npm run db:reset`.

## Uji setelah pemasangan
1. Login sebagai Guru, buka Materi, hapus satu materi milik guru tersebut, lalu pastikan kartu hilang setelah refresh.
2. Ulangi di Tugas. Pastikan konfirmasi menyebut bahwa lampiran dan file jawaban terkait ikut dihapus.
3. Login sebagai Siswa dan pastikan kartu tugas terlihat lebih rapi, lampiran dapat diunduh, serta unggah jawaban tetap berjalan.
4. Login sebagai Admin untuk memastikan admin dapat menghapus materi/tugas lintas guru.

Catatan: source telah diperiksa untuk sintaks TypeScript/TSX menggunakan transpiler TypeScript. Build Next.js dan pengujian database live perlu dijalankan pada komputer pengguna dengan `.env.local` dan MongoDB yang aktif.
