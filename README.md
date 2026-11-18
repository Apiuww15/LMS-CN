# EduCN LMS — SMK Citra Negara

LMS Next.js dengan MongoDB untuk lima role: Admin, Guru, Siswa, Kurikulum, dan Kepala Sekolah.

## Perbaikan penting pada versi ini

- Setiap akun guru dan siswa memiliki identitas unik berdasarkan `users.id` yang disimpan sebagai `userId` pada profil.
- Guru hanya dapat membaca materi, tugas, nilai, kehadiran, dan jadwal yang dimiliki/ditugaskan kepada akun tersebut. Tidak ada lagi fallback berdasarkan nama guru untuk konten privat.
- Guru hanya dapat melihat daftar siswa pada kelas yang ditugaskan kepadanya.
- Siswa hanya dapat membaca profil dan nilai/kehadiran miliknya. Materi, tugas, jadwal, dan data kelas tetap dibagikan sesuai kelas siswa.
- Menyimpan akun di `users` otomatis membuat atau memperbarui profil di `guru` atau `siswa` sesuai role.
- Menyimpan profil di `guru` atau `siswa` otomatis membuat/memperbarui baris akun di `users` dan menghubungkan `userId`.
- Email, role, status, dan data akademik dasar disinkronkan. Perubahan email profil juga memperbarui email akun login yang sudah ada.
- Menghapus profil guru/siswa menghapus akun login terkait agar tidak tersisa akun aktif tanpa profil.
- Sinkronisasi identitas berjalan dalam transaksi MongoDB agar perubahan tidak setengah tersimpan.
- Tidak ada data demo/seed yang dipakai sebagai data operasional.

## Setup

1. Buka folder `educn-full` (folder yang berisi `package.json`).
2. Salin `.env.local.example` menjadi `.env.local`, lalu isi URI MongoDB Atlas dan `AUTH_SECRET`.
3. Jalankan `npm install`.
4. Jika admin belum tersedia, jalankan `npm run db:create-admin`.
5. Jalankan `npm run dev`.
6. Periksa koneksi melalui `http://localhost:3000/api/health`.

Jangan menjalankan `npm run db:reset` pada database yang berisi data penting karena perintah itu menghapus seluruh collection EduCN.

## Relasi akun dan profil

- Akun Guru: `users.role = "Guru"` dan profil pada collection `guru` dengan `userId = users.id`.
- Akun Siswa: `users.role = "Siswa"` dan profil pada collection `siswa` dengan `userId = users.id`.
- Email dinormalisasi menjadi huruf kecil.
- Jika data guru/siswa dibuat lebih dahulu, baris akun akan muncul pada menu Pengguna. Akun tersebut belum bisa login sampai admin mengatur password melalui menu Pengguna.
- Jika akun dibuat lebih dahulu, profil guru/siswa akan dibuat otomatis. Lengkapi detail akademik profilnya dari menu Data Guru/Data Siswa.

## Isolasi data

Role Guru dan Siswa menggunakan komponen halaman yang sama secara teknis, tetapi API mengambil identitas dari session login dan memfilter data berdasarkan `userId`. Jadi Bu Uci dan Ajis tidak berbagi data privat meskipun menggunakan rute menu yang sama. Rute menu bukan identitas pemilik data; session akunlah yang menentukan data yang boleh dibaca.

Data lama yang hanya memiliki nama guru tanpa `userId`, `guruId`, atau email pemilik tidak bisa dipetakan dengan aman jika nama tidak unik. Data semacam itu tidak ditampilkan ke semua guru; admin perlu menautkan pemiliknya terlebih dahulu.

## Keamanan

- `.env.local` tidak disertakan dalam ZIP karena berisi kredensial MongoDB.
- Jangan membagikan `MONGODB_URI`, password database, atau `AUTH_SECRET`.
- Transaksi MongoDB memerlukan deployment MongoDB yang mendukung transactions (MongoDB Atlas mendukungnya).
