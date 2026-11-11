# EduCN LMS — Final Checklist

## Login & Session
- 5 role: Admin, Guru, Siswa, Kurikulum, Kepala Sekolah
- Login memakai MongoDB dan password hash
- HTTP-only session cookie
- Role pada URL diverifikasi dengan session
- Logout menghapus session cookie

## MongoDB
- Database default: `educn_lms`
- Collections: users, guru, siswa, kelas, mapel, material, tasks, announcements, grades, actions, auth_accounts
- Health check: `/api/health`
- Data CRUD disimpan kembali ke MongoDB

## Hak akses
- Admin: CRUD master data
- Guru: materi, tugas, kehadiran, penilaian sesuai workspace
- Siswa: baca kelas, materi, tugas, nilai, jadwal
- Kurikulum: baca data akademik + generate nilai/laporan
- Kepala Sekolah: monitoring/laporan, tanpa CRUD master

## Catatan Atlas
Untuk development, `0.0.0.0/0` dapat dipakai sementara. Sebelum production, batasi Network Access Atlas ke IP/CIDR yang benar-benar diperlukan.
