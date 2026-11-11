# EduCN — Mode Data Nyata

Versi ini tidak mempunyai seed data operasional. Collection `users`, `guru`, `siswa`, `kelas`, `mapel`, `material`, `tasks`, `announcements`, `grades`, `attendance`, `schedules`, dan `reports` dimulai kosong.

## 1. Reset database ke kondisi kosong

Jalankan hanya jika memang ingin menghapus data EduCN yang ada:

```powershell
npm run db:reset
```

Perintah ini menghapus data operasional dan `auth_accounts` pada database `MONGODB_DB_NAME`.

## 2. Buat Admin pertama

```powershell
npm run db:create-admin
```

Masukkan nama, email, dan password Admin saat diminta.

## 3. Cek jumlah data

```powershell
npm run db:status
```

Sesudah reset, domain data harus 0. `users` menjadi 1 hanya setelah Admin pertama dibuat. Itu diperlukan agar sistem mempunyai satu akun yang dapat membuat akun role lain.

## 4. Real-time

Dashboard dan halaman data melakukan sinkronisasi ulang ke API MongoDB setiap 3 detik. Browser tidak menggunakan data seed sebagai fallback.

## Jurusan

Jurusan yang tersedia di form:

- DKV
- MPLB
- PPLG
- Perhotelan
- TJKT
- Pemasaran
