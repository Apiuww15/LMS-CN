# EduCN LMS — 5 Role + MongoDB

EduCN adalah LMS sekolah dengan lima role: Admin, Guru, Siswa, Kurikulum, dan Kepala Sekolah.

## Prinsip data

Versi ini **tidak membawa data contoh/seed**. Data operasional dibaca langsung dari MongoDB melalui API Next.js. Dashboard dan halaman data melakukan sinkronisasi berkala agar perubahan dari perangkat lain ikut terlihat.

## Jurusan

- DKV
- MPLB
- PPLG
- Perhotelan
- TJKT
- Pemasaran

## Setup

1. Salin `.env.local.example` menjadi `.env.local` dan isi URI MongoDB Atlas.
2. Jalankan `npm install`.
3. Jalankan `npm run db:reset` hanya bila ingin memulai database EduCN dari kondisi benar-benar kosong. Perintah ini destruktif untuk collection EduCN yang tercantum.
4. Jalankan `npm run db:create-admin` untuk membuat Admin pertama.
5. Jalankan `npm run db:status` untuk melihat jumlah data setiap collection.
6. Jalankan `npm run dev`.

## Login

Tidak ada pilihan role dan tidak ada akun demo di halaman login. Pengguna memasukkan email dan password. Role dibaca server dari `auth_accounts` di MongoDB.

## Collection utama

`users`, `guru`, `siswa`, `kelas`, `mapel`, `material`, `tasks`, `announcements`, `grades`, `attendance`, `schedules`, `reports`, `actions`, `auth_accounts`.

## Catatan keamanan

Simpan password MongoDB dan `AUTH_SECRET` hanya di `.env.local`. Jangan commit `.env.local` ke repository.
