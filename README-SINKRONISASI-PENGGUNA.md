# Perbaikan Sinkronisasi Pengguna, Guru, dan Siswa

## Perubahan
- Membuat/mengubah akun pada menu Pengguna menyinkronkan profil Guru/Siswa berdasarkan `userId` dan email.
- Membuat/mengubah data pada menu Guru/Siswa menyinkronkan dokumen Pengguna dan akun autentikasi MongoDB.
- Password hanya di-hash dan disimpan pada koleksi `auth_accounts`; password tidak disimpan pada dokumen profil.
- Form tambah Guru/Siswa meminta kata sandi untuk membuat akun login. Saat mengedit, kata sandi boleh dikosongkan untuk mempertahankan kata sandi lama.
- Email divalidasi dan konflik email/peran ditolak sebelum transaksi disimpan.
- Penghapusan profil Guru/Siswa menghapus akun terkait dalam transaksi yang sama.
- Tidak mengubah pola halaman/route yang sudah dipakai.

## Menjalankan
1. Ekstrak ZIP.
2. Salin `.env.local.example` menjadi `.env.local`, lalu isi `MONGODB_URI`, `MONGODB_DB_NAME`, dan `AUTH_SECRET` milik project.
3. Jalankan `npm install`.
4. Jalankan `npm run dev`.

Jangan menjalankan `npm run db:reset` pada database yang berisi data penting.

## Catatan database
Transaksi MongoDB memerlukan replica set atau cluster yang mendukung transactions (MongoDB Atlas mendukungnya). Backup database sebelum menerapkan perubahan pada data produksi.

## Validasi tambahan
- Label role dinormalisasi (Guru/guru, Siswa/siswa, dan role lain) agar data lama dengan huruf kecil tidak salah dipetakan.
- Jika profil lama belum memiliki `userId`, proses sinkronisasi mencoba menggunakan pasangan akun berdasarkan email agar tidak membuat identitas ganda.
- Email yang sudah dipakai akun lain ditolak sebelum transaksi.
- Password dari form Guru/Siswa tidak disimpan pada dokumen profil; hanya hash yang disimpan pada `auth_accounts`.
