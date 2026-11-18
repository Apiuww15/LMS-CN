# EduCN — Materi, Tugas, Pengumpulan, dan Nilai

## Perubahan
- Guru/Admin dapat mengunggah materi dan lampiran tugas sebagai file asli.
- File disimpan di MongoDB GridFS (`educn_files.files` dan `educn_files.chunks`), bukan hanya nama file di dokumen.
- Batas unggah per file: 50 MB.
- Sebagian besar format dokumen, gambar, audio, video, arsip, dan file pembelajaran dapat diunggah; file executable/script diblokir demi keamanan.
- Siswa hanya menerima materi dan tugas untuk kelas pada profil siswa.
- Siswa dapat membuka pratinjau PDF/gambar/video materi, mengunduh file materi/tugas, dan mengumpulkan jawaban.
- Guru dapat melihat dan mengunduh file jawaban siswa untuk tugas yang dibuatnya.
- Data pengumpulan disimpan pada koleksi `submissions`.
- Menu Nilai Saya tidak lagi membuat nilai contoh; hanya menampilkan nilai yang benar-benar tersimpan pada MongoDB dan menjelaskan kolomnya.

## Menjalankan
1. Pertahankan `.env.local` project lama.
2. Pastikan `MONGODB_URI` dan `MONGODB_DB_NAME` tetap benar.
3. Jalankan `npm install` lalu `npm run dev`.
4. Tidak perlu menjalankan reset database. Koleksi GridFS dan `submissions` dibuat otomatis saat pertama kali digunakan.

## Catatan operasional
- MongoDB Atlas maupun MongoDB replica set mendukung penyimpanan GridFS.
- Jangan menghapus koleksi `educn_files.files`, `educn_files.chunks`, atau `submissions` jika ingin mempertahankan file dan jawaban siswa.
- File Office (Word/Excel/PowerPoint) dapat diunduh; pratinjau langsung di browser disediakan untuk PDF, gambar, dan video yang didukung browser.
- Pengumpulan tugas ditolak jika sudah melewati tanggal deadline.
