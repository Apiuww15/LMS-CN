# EduCN LMS — Import Excel & UI/UX Refresh

## Fitur baru

- Admin dapat mengimpor banyak data siswa dari menu **Data Siswa → Import Excel**.
- Admin dapat mengimpor banyak data guru dari menu **Data Guru → Import Excel**.
- File yang didukung: `.xlsx` dan `.xls`.
- Tombol **Template Excel** membuat template resmi beserta sheet Petunjuk.
- Data dipratinjau sebelum dikirim ke server.
- Impor maksimal 1.000 baris per proses.
- Server memvalidasi kolom wajib, format email, panjang password, status, serta duplikasi NIS/NIP/email.
- Setiap siswa/guru yang diimpor otomatis dibuatkan profil dan akun login yang terhubung di koleksi `users` dan `auth_accounts`.
- Password di-hash di server dan tidak disimpan pada dokumen profil.
- Seluruh proses impor profil + akun menggunakan transaksi MongoDB; jika satu baris gagal, seluruh batch dibatalkan agar tidak setengah tersimpan.
- Impor bersifat **tambahan (append)**, tidak menghapus atau mengganti data lama.
- Menu **Mata Pelajaran** di sidebar Admin dihilangkan. Modul Mata Pelajaran tetap tersedia untuk role Kurikulum.
- Penyegaran tampilan global: hierarki halaman, tabel, toolbar, tombol, form, modal, dan responsivitas.

## Template siswa

Sheet pertama bernama `Data Siswa` dengan kolom:

`NIS | Nama | Email | Password | Kelas | Jurusan | Status`

Semua kolom wajib kecuali `Status`. Status kosong otomatis `Aktif`. Jurusan mengikuti daftar sekolah: DKV, MPLB, PPLG, Perhotelan, TJKT, Pemasaran.

## Template guru

Sheet pertama bernama `Data Guru` dengan kolom:

`NIP | Nama | Email | Password | Mata Pelajaran | Kelas | Status`

Semua kolom wajib kecuali `Status`. Status kosong otomatis `Aktif`.

## Cara menjalankan

1. Backup folder project dan database seperti biasa.
2. Pertahankan `.env.local` lama yang sudah tersambung ke MongoDB Atlas.
3. Jalankan `npm install` agar dependency `xlsx` ikut terpasang.
4. Jalankan `npm run dev`.
5. Buka menu Data Siswa atau Data Guru sebagai Admin, pilih Import Excel, unduh template, isi data, lalu unggah.

**Jangan menjalankan `npm run db:reset`.** Impor Excel tidak memerlukan reset database.
