# EduCN — Final Setup

## Folder
Open the folder that contains `package.json`:

`educn-full`

Do not `cd` into another nested `educn-full` folder.

## Environment
This ZIP intentionally does not include `.env.local` because it contains your MongoDB credential.

Copy the `.env.local` that already works in your current EduCN project into this folder. The project accepts the working `mongodb://...` Atlas standard connection string as well as `mongodb+srv://...`.

Required variables:

```env
MONGODB_URI=connection-string-MongoDB-Atlas-kamu
MONGODB_DB_NAME=educn_lms
AUTH_SECRET=secret-random-panjang
```

## Install

```powershell
npm install
```

## Start

```powershell
npm run dev
```

## Database health

Open:

`http://localhost:3000/api/health`

Expected:

```json
{
  "ok": true,
  "database": "educn_lms"
}
```

## First admin

If an admin login already works, keep it. Otherwise:

```powershell
npm run db:create-admin
```

## Data policy

Operational collections start empty. The browser must not use seed data as its source of truth. The application reads/writes MongoDB through its API.

Jurusan:

- DKV
- MPLB
- PPLG
- PERHOTELAN
- TJKT
- PEMASARAN

## Login

Login accepts only email + password. The server reads the role from `auth_accounts` and redirects to the correct workspace.

## Important fixes in this release

- User saves no longer fail because older users lack login accounts.
- New users still require a password when creating a brand-new login account.
- Existing passwords are preserved when editing a user and leaving password empty.
- Users and auth accounts are synchronized transactionally on user save.
- Browser `localStorage` is not used as the initial database source.
- Session checks rely on the HTTP-only server session cookie.
- A failed activity/audit request does not turn a successful CRUD operation into a false failure.
- API errors are returned with useful development messages.
