# Perbaikan Relasi Mata Pelajaran, Guru, dan Wali Kelas

## Perubahan
- Form Mata Pelajaran tidak lagi menampilkan field Kelompok.
- Guru Pengampu pada Mata Pelajaran berupa pilihan multi-select dari data akun Guru.
- Form Guru dapat memilih beberapa Mata Pelajaran sekaligus.
- Form Guru memiliki pilihan Wali Kelas (opsional) dari data Kelas yang sudah dibuat.
- Form Kelas memiliki pilihan Wali Kelas dari data Guru yang sudah dibuat.
- Relasi menggunakan ID (`guruIds`, `mapelIds`, `waliGuruId`, `waliUserId`, `waliKelasId`) dan nama hanya untuk tampilan.
- Sinkronisasi relasi dua arah: perubahan penugasan mapel pada Guru atau Mata Pelajaran akan memperbarui data terkait.
- Validasi menolak mapel/guru/wali kelas yang tidak berasal dari data yang tersedia.

## Alur penggunaan
1. Buat Kelas terlebih dahulu.
2. Buat Mata Pelajaran (misalnya MTK).
3. Buat akun Guru dan pilih satu atau beberapa mapel.
4. Pilih Wali Kelas pada form Guru, atau pilih guru wali pada form Kelas.
5. Untuk satu mapel dengan beberapa guru, edit Mata Pelajaran lalu pilih beberapa Guru Pengampu.

## Catatan
Projek memakai MongoDB dan mempertahankan konfigurasi environment lokal. Jangan menjalankan reset database untuk menerapkan perubahan ini. Build penuh belum diverifikasi karena instalasi dependensi npm timeout pada environment pengerjaan.
