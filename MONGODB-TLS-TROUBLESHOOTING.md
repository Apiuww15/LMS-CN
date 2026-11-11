# MongoDB Atlas Connection Troubleshooting

## Error `querySrv ECONNREFUSED`

Error ini berarti client gagal mendapatkan record DNS SRV yang dipakai oleh `mongodb+srv://`. MongoDB merekomendasikan mengecek SRV dengan `nslookup` di Windows, memeriksa IP Access List Atlas, serta memastikan jaringan dapat mencapai port 27017.

Contoh tes SRV:

```powershell
nslookup -debug -q=SRV _mongodb._tcp.cluster0.exhfclr.mongodb.net
```

Contoh tes port ke node Atlas yang sudah diketahui:

```powershell
Test-NetConnection HOST-NODE-ATLAS -Port 27017
```

Project EduCN juga memiliki fallback DNS otomatis di `src/lib/mongodb.ts`. Jika resolver Windows/ISP menolak SRV, aplikasi mencoba DNS publik dan DNS-over-HTTPS lalu membangun seed-list standar secara otomatis.

## Error authentication

Jika DNS dan TCP sudah berhasil tetapi muncul error autentikasi, periksa username/password database user dan `authSource`. Untuk password dengan karakter khusus, lakukan URL-encoding di connection string.

## Error IP Access List

Atlas hanya menerima koneksi dari IP/CIDR yang ada di **Security → Network Access**.

## Error cluster paused/deleted

Jika menggunakan `mongodb+srv://` dan hostname tidak dapat ditemukan, pastikan deployment Atlas benar-benar aktif dan tidak terhapus/terjeda.
