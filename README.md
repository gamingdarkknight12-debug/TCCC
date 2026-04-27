# TCCC Website for Vercel

## Deploy free on Vercel
1. Create a GitHub repo and upload this folder.
2. Go to Vercel > Add New Project > Import the repo.
3. Add Environment Variables:
   - `ADMIN_PASSWORD` = your private admin password
   - `ADMIN_TOKEN` = a long random string, for example `tccc-2026-super-secret-token-8943`
4. Deploy.

## Important
The public website will NOT show the Add Score page.
Only `/admin` has Add Score access. The admin page is protected by a server-side password check and an HttpOnly cookie.

## Local run
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.
