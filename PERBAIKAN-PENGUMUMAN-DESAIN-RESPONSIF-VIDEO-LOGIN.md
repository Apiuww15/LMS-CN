# EduCN: Pengumuman, tampilan responsif, dan video login

## Pengumuman
- Form tidak lagi memiliki kategori.
- Pengumuman wajib memiliki judul dan deskripsi.
- Target tersedia: Semua, Guru saja, Siswa saja.
- Admin, Kurikulum, dan Kepsek dapat membaca seluruh pengumuman.
- Guru/Siswa hanya menerima target role masing-masing atau Semua; penyaringan dilakukan server-side.
- Lampiran dapat berupa poster/gambar, PDF, Word, Excel, PowerPoint, dan dokumen umum; maksimum 12 lampiran, masing-masing maksimal 50 MB.
- Lampiran disimpan di MongoDB GridFS (`educn_files`) dan unduhannya dilindungi sesi serta target pengumuman.
- Buat/hapus pengumuman menggunakan endpoint khusus supaya tidak mengganti seluruh koleksi ketika satu pengumuman dibuat atau dihapus.

## Menambahkan video di halaman login
1. Siapkan video MP4, sebaiknya H.264, 1920×1080, 15–30 detik, dikompresi agar cepat dimuat.
2. Letakkan file di `public/videos/login-background.mp4`.
3. Nama file harus tepat `login-background.mp4`.
4. Jalankan ulang `npm run dev` atau deploy ulang.
5. Video otomatis `autoplay`, `muted`, `loop`, dan `playsInline`. Jika file belum ada atau gagal dimuat, background gambar sekolah tetap tampil.
6. Untuk mengganti video, cukup timpa file dengan nama yang sama.

## Responsif dan motion
- Pengumuman dan Kelas Saya memiliki layout fluid untuk desktop, tablet, dan mobile.
- Jadwal dan form tambah jadwal memiliki spacing responsif.
- Animasi hover, masuk halaman, dan dekorasi memakai CSS; preferensi `prefers-reduced-motion` dihormati.
