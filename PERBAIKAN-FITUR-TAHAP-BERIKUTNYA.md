# EduCN LMS — Perbaikan fitur tahap berikutnya

## Perubahan UI
- Menu Nilai Saya dihapus dari navigasi siswa.
- Halaman Kelas Saya untuk siswa dibuat read-only dan menampilkan kelas, jurusan, wali kelas, serta jumlah siswa dari data kelas.
- Jadwal Pelajaran ditambahkan ke navigasi Admin dan Guru. Siswa tetap dapat melihat jadwal kelasnya.
- Profil menampilkan kelas/jurusan dan info kelas untuk siswa, menghapus kartu Keamanan Akun, dan mendukung unggah foto profil JPG/PNG/WEBP (maksimal 5 MB).
- Form Guru menggunakan penugasan mata pelajaran multi-pilih dan Wali Kelas; tidak lagi menampilkan Kelas Mengajar.

## Jadwal
- Admin memilih kelas, mapel, dan guru dari data yang sudah dibuat.
- Guru tidak memilih kelas manual; kelas otomatis memakai kelas wali yang terhubung ke akun.
- Jadwal menyimpan `kelasId`, `mapelId`, `guruId`, jam mulai/selesai, dan label tampilan.
- Validasi server memastikan guru ditugaskan pada mapel, jadwal guru hanya untuk kelas wali, dan jadwal duplikat kelas/hari/jam ditolak.
- Admin/Guru dapat menghapus jadwal; Guru hanya dapat menghapus jadwal di kelas walinya.

## Kehadiran
- Input jam manual dihapus.
- Waktu dicatat otomatis saat status siswa diubah lalu kehadiran disimpan, menggunakan zona waktu WIB.
- Catatan kehadiran menyimpan `kelasId` dan `siswaId`; catatan lama yang hanya memiliki nama kelas tetap dibaca sebagai fallback.
- Riwayat bulanan memiliki filter Semua Kelas dan ekspor Excel Semua Kelas secara default.
- Waktu catatan yang tidak diubah dipertahankan ketika daftar kelas disimpan ulang.

## MongoDB dan API
- Endpoint profil mengambil kelas/jurusan/wali/jumlah siswa dari relasi MongoDB.
- Foto profil disimpan melalui GridFS dengan pemeriksaan pemilik file.
- Endpoint jadwal baru melakukan validasi relasi kelas/mapel/guru sebelum menyimpan.
- Validasi mapel menangani ID mapel guru lama yang stale jika nama mapel lama masih tersedia, sehingga tidak menghalangi penambahan mapel dengan nama yang sama.
- Template impor Guru menggunakan beberapa mapel dipisahkan koma dan Wali Kelas opsional.

## Pengujian
- Semua file TS/TSX berhasil diparse oleh TypeScript transpiler (syntax check).
- Build Next.js dan pengujian langsung ke MongoDB belum dijalankan karena `npm ci` timeout di environment ini. Gunakan `.env.local` milik projek sendiri dan jangan reset database.
