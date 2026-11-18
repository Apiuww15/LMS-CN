# EduCN LMS — UI/UX finishing pass

Perubahan pada paket ini dibatasi pada presentasi antarmuka:
- Logo huruf pada sidebar dan layar loading diganti dengan `public/images/logo-sekolah.png`.
- Penyempurnaan visual sidebar, topbar, dashboard cards, hero, tombol, modal, dan transisi.
- Responsif desktop/tablet/Android, drawer mobile, area sentuh, tabel horizontal, safe-area, serta modal mobile.
- Drawer mobile mengunci scroll latar dan dapat ditutup dengan tombol Escape.
- Interval polling notifikasi disesuaikan dari 3 detik menjadi 30 detik untuk mengurangi request berulang.

Tidak ada perubahan pada API, route backend, skema MongoDB, collection, data, autentikasi, atau operasi CRUD.

## Menjalankan
1. `npm install`
2. Salin `.env.local.example` menjadi `.env.local` dan isi konfigurasi milik sendiri.
3. `npm run dev`

Catatan verifikasi: source TypeScript memiliki satu error tipe yang sudah ada pada `Workspace.tsx` (baris sekitar 377, inferensi tipe template import pengguna). File tersebut tidak diubah karena permintaan pengerjaan dibatasi pada UI. Build Next.js di lingkungan pemeriksaan juga tidak dapat menyelesaikan unduhan SWC karena jaringan registry tidak tersedia.
