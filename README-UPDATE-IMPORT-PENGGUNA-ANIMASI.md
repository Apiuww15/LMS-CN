# Update EduCN: Import Excel Pengguna + Motion UI

## Perubahan
- Menu Admin > Pengguna sekarang memiliki tombol **Import Excel**.
- Template Pengguna menerima beberapa peran: Admin, Guru, Siswa, Kurikulum, dan Kepsek.
- Baris Guru wajib memiliki NIP, Mata Pelajaran, dan Kelas.
- Baris Siswa wajib memiliki NIS, Kelas, dan Jurusan.
- Semua baris divalidasi di server: email/NIP/NIS duplikat, format email, password minimal 8 karakter, status, dan kelengkapan profil.
- Import Pengguna dibuat dalam satu transaksi MongoDB: dokumen `users`, `auth_accounts`, dan profil `guru`/`siswa` dibuat bersama. Jika gagal, transaksi dibatalkan.
- Import parsial tidak menjalankan sinkronisasi koleksi penuh, sehingga profil lama tidak terhapus.
- Animasi global ditambahkan secara halus: page enter, hover lift, transisi tombol/kartu, modal, dan interaksi navigasi. Pengaturan `prefers-reduced-motion` dihormati.

## Cara menggunakan
1. Buka Admin > Pengguna.
2. Klik **Import Excel**.
3. Unduh **Template Excel**.
4. Isi satu akun per baris. Gunakan label peran `Admin`, `Guru`, `Siswa`, `Kurikulum`, atau `Kepsek`.
5. Untuk Guru isi NIP, Mata Pelajaran, dan Kelas. Untuk Siswa isi NIS, Kelas, dan Jurusan.
6. Unggah file, periksa pratinjau, lalu klik **Impor**.

## Catatan
- Maksimal 1.000 baris per impor.
- Password minimal 8 karakter dan hanya disimpan sebagai hash di `auth_accounts`.
- Impor bersifat menambahkan, bukan mengganti/menghapus data yang sudah ada.
- Backup database sebelum impor data produksi.
- Tidak perlu dan jangan menjalankan `db:reset`.
