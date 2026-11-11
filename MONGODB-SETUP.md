# EduCN — MongoDB Atlas Setup

## 1. `.env.local`

Buat file `.env.local` di folder yang sama dengan `package.json`.

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.exhfclr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=educn_lms
```

Ambil URI langsung dari MongoDB Atlas → **Connect → Drivers → Node.js**. Jangan mengetik hostname cluster sendiri.

> Jangan commit `.env.local` ke GitHub. Password database hanya disimpan di file tersebut.

## 2. Install dependency

```powershell
npm install
```

## 3. Jalankan project

```powershell
npm run dev
```

## 4. Cek koneksi database

Buka:

`http://localhost:3000/api/health`

Jika berhasil:

```json
{
  "ok": true,
  "database": "educn_lms"
}
```

## 5. Network Access Atlas

Di MongoDB Atlas → **Security → Network Access**, tambahkan IP publik komputer yang menjalankan Next.js. Atlas hanya mengizinkan koneksi dari IP/CIDR yang ada di access list.

Untuk pengujian sementara, Atlas juga menyediakan opsi `0.0.0.0/0`, tetapi sebaiknya jangan dipakai permanen.

## 6. Jika muncul `querySrv ECONNREFUSED`

Project ini memiliki fallback otomatis untuk Windows/ISP yang menolak DNS SRV:

1. mencoba resolver DNS publik (1.1.1.1 dan 8.8.8.8);
2. jika masih gagal, mengambil SRV/TXT lewat DNS-over-HTTPS Cloudflare;
3. membuat seed-list `mongodb://host1,host2,host3` dengan TLS dan opsi replica set yang ditemukan;
4. baru melakukan koneksi MongoDB.

Jadi Anda tetap boleh menggunakan URI `mongodb+srv://` dari Atlas.

Jika fallback juga tidak bisa mendapatkan DNS, periksa VPN/firewall/DNS atau tes dengan hotspot. Jika DNS sudah berhasil tetapi koneksi database masih gagal, periksa TCP port 27017 dan IP Access List Atlas.

## 7. Password dengan karakter khusus

Jika password berisi karakter reserved seperti `@`, `:`, `/`, `?`, `#`, `[`, `]`, atau `%`, gunakan URL-encoding pada bagian password URI. Contoh `@` menjadi `%40`.

## 8. Koleksi EduCN

Database `educn_lms` akan digunakan untuk collection aplikasi:

- `users`
- `guru`
- `siswa`
- `kelas`
- `mapel`
- `material`
- `tasks`
- `announcements`
- `grades`
- `actions`
- `auth_accounts`
