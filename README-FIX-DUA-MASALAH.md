# Perbaikan Form Pengguna dan Sinkronisasi Hapus Guru/Siswa

## Perubahan

1. Form menu Pengguna sekarang mengikuti role yang dipilih.
   - Role Guru: Nama, NIP, Mata Pelajaran, Kelas (opsional), Email, Status, Password, Telepon.
   - Role Siswa: Nama, NIS, Kelas, Jurusan, Email, Status, Password, Telepon.
   - Role lain tidak menampilkan field NIP/NIS.
2. Data khusus Guru/Siswa ikut disimpan ke dokumen `users` dan profil yang sesuai di MongoDB.
3. Mengganti role membersihkan field khusus role sebelumnya agar NIP/NIS/mapel/jurusan lama tidak tertinggal.
4. Menghapus profil Guru/Siswa tidak lagi gagal hanya karena ada profil lama yang akun `auth_accounts`-nya belum memiliki password hash. Password akun yang sudah ada tetap dipertahankan.
5. Sinkronisasi edit profil juga membersihkan field role yang sudah tidak digunakan.

## Pemasangan

1. Backup folder project dan database MongoDB terlebih dahulu.
2. Ekstrak ZIP.
3. Salin `.env.local` dari project lama ke folder `educn-full` (jangan bagikan file ini).
4. Jalankan `npm install`, lalu `npm run dev`.
5. Jangan menjalankan `npm run db:reset`.

## Pengujian

- Buat Guru melalui Pengguna; pastikan NIP dan Mata Pelajaran wajib diisi serta profil muncul di Data Guru.
- Buat Siswa melalui Pengguna; pastikan NIS, Kelas, dan Jurusan wajib diisi serta profil muncul di Data Siswa.
- Hapus satu Siswa dari Data Siswa; pastikan profil dan akun terkait hilang.
- Hapus satu Siswa dari Pengguna; pastikan profil Data Siswa ikut hilang.
- Ulangi dua arah untuk Guru.

Catatan: syntax transpilation pada `Workspace.tsx` dan `server-data.ts` telah diperiksa. Build penuh Next.js dan tes integrasi ke MongoDB Atlas belum dijalankan pada lingkungan pembuat ZIP karena dependensi npm tidak berhasil dipasang di sini.
