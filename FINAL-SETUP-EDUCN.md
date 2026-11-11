# EduCN Final Setup

## 1. Environment
Copy your existing working `.env.local` from the previous EduCN project into this project.

Target file:
`educn-full/.env.local`

Do not put the password in source code. `.env.local` is intentionally not included in this ZIP because it contains database credentials.

The project accepts both `mongodb://` and `mongodb+srv://`. For the Atlas cluster used during this project, keep the same non-SRV URI that was already working for you.

## 2. Install and run
```powershell
npm install
npm run dev
```

## 3. Test database
Open `http://localhost:3000/api/health`.
Expected:
```json
{
  "ok": true,
  "database": "educn_lms"
}
```

## 4. Admin account
If a valid admin account already exists, keep it. Otherwise run:
```powershell
npm run db:create-admin
```

## 5. Data model
Initial operational collections are empty. Dashboard values are loaded from MongoDB, not from seed/demo values or localStorage.

Jurusan:
- DKV
- MPLB
- PPLG
- PERHOTELAN
- TJKT
- PEMASARAN

## 6. Login
Login uses only email + password. The role is read from `auth_accounts` on the server. The browser does not choose the role.
