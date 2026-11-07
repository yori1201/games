# 🚀 Panduan Deploy RUMBELA GAMES ke Produksi (Vercel)

Panduan ini ditujukan untuk **pemilik produk non-teknis**. Ikuti urutan langkah berikut. Total waktu: ~30–45 menit.

> 💡 **Tip:** Setiap kali ada instruksi "klik", klik tombol/link yang diberi nama tersebut. Jangan klik tombol lain di halaman yang sama.

---

## 📋 Prasyarat (yang Anda butuhkan)

Sebelum mulai, pastikan Anda punya:
- ✅ **Akun GitHub** (Anda sudah punya — `github.com/yori1201`)
- ✅ **Akun Google/Gmail** (untuk Firebase)
- ✅ **Akun Vercel** (daftar gratis di `vercel.com` — bisa pakai tombol "Sign in with GitHub")
- ✅ **Akses ke email** untuk konfirmasi

---

## 🗂️ Langkah 0 — Dapatkan kode siap deploy

Anda akan menerima file ZIP bernama `rumbela-games-production.zip` dari AI assistant ini.

1. **Ekstrak ZIP** tersebut di komputer Anda → folder `rumbela-games/`
2. Pastikan di dalamnya ada file: `package.json`, `vercel.json`, `firestore.rules`, `DEPLOYMENT.md`, dll.

---

## 🔥 Langkah 1 — Setup Firebase (10 menit)

Firebase adalah tempat data siswa disimpan. Kita pakai project yang sama dengan AI Studio: `inbound-charter-10z9n`.

### 1.1 Buka Firebase Console
1. Buka browser → ketik **`https://console.firebase.google.com`**
2. Sign in dengan **akun Google yang sama** dengan yang Anda pakai di AI Studio
3. Anda akan melihat project **`inbound-charter-10z9n`** di daftar → klik project itu

### 1.2 Aktifkan Anonymous Authentication
1. Di menu kiri Firebase Console, klik **"Authentication"** (icon orang)
2. Klik tab **"Sign-in method"** di atas
3. Cari **"Anonymous"** di daftar → klik → toggle **"Enable"** jadi biru → klik **"Save"**

### 1.3 Buat Firestore Database (kalau belum ada)
1. Di menu kiri, klik **"Firestore Database"** (icon awan)
2. Kalau muncul tombol **"Create database"** → klik
3. Pilih **"Production mode"** → klik **"Next"**
4. Location: biarkan default → klik **"Done"**
5. Tunggu 1–2 menit sampai muncul tab "Data" dengan koleksi kosong

> ⚠️ **PENTING:** Kalau Anda sudah pernah membuat Firestore database sebelumnya (lewat AI Studio), langkah ini mungkin tidak muncul. Itu normal — lanjut ke langkah berikutnya.

### 1.4 Buat Database Tambahan (kalau database ID spesifik dipakai)
Cek file `.env.local` di folder `rumbela-games/`. Lihat baris `VITE_FIREBASE_FIRESTORE_DATABASE_ID=...`.
- Kalau valuenya kosong (`""`), **lewati langkah ini**.
- Kalau valuenya `ai-studio-rumbelagamesadap-...`, Anda perlu membuat database dengan ID itu:
  1. Di Firestore Database, klik dropdown di sebelah judul "Firestore Database" (pojok kiri atas)
  2. Klik **"Add database"**
  3. Database ID: isi sama persis dengan nilai `VITE_FIREBASE_FIRESTORE_DATABASE_ID` di `.env.local`
  4. Pilih **"Production mode"** → location default → **"Create"**

### 1.5 Pasang Security Rules
1. Di Firestore Database, klik tab **"Rules"** di atas
2. Buka file **`firestore.rules`** dari folder `rumbela-games/` dengan Notepad/TextEdit
3. **Copy semua isi file** itu
4. **Paste** ke kotak editor Rules di Firebase Console (overwrite yang lama)
5. Klik tombol **"Publish"** (tombol biru di kanan atas)

---

## 🌱 Langkah 2 — Seed data awal (3 menit)

Langkah ini mendaftarkan access codes (RUMBELA-SISWA, RUMBELA-TUTOR, RUMBELA-ADMIN, dll) dan 3 siswa demo ke Firestore.

### 2.1 Pastikan Node.js terinstall
1. Buka **Terminal** (Mac: `Cmd+Space` → ketik "Terminal" → Enter. Windows: buka "PowerShell")
2. Ketik: `node --version` → Enter
3. Harus muncul `v18` atau lebih tinggi. Kalau tidak, download dari `https://nodejs.org` dan install dulu.

### 2.2 Install dependency & jalankan seed
Di Terminal, jalankan perintah berikut (ganti `~/Downloads/rumbela-games` dengan lokasi folder Anda sebenarnya):

```bash
cd ~/Downloads/rumbela-games
npm install
cp .env.example .env.local
npm run seed
```

Anda akan melihat output seperti:
```
🌱 Rumbela Games — Seeding initial data...

1. Seeding access codes...
   ✓ RUMBELA-SISWA → role: student
   ✓ RUMBELA-SITI → role: student
   ✓ RUMBELA-ALIF → role: student
   ✓ RUMBELA-TUTOR → role: tutor
   ✓ RUMBELA-ADMIN → role: admin

2. Seeding demo students...

✅ SEED COMPLETE
```

> Kalau ada error "Missing VITE_FIREBASE_* env vars", pastikan file `.env.local` sudah dibuat (langkah `cp .env.example .env.local` di atas).

---

## 🐙 Langkah 3 — Upload kode ke GitHub (5–10 menit)

Ada **2 cara** — pilih salah satu. **Cara A (otomatis, pakai script) lebih direkomendasikan** untuk non-teknis.

---

### 🤖 Cara A: Pakai script otomatis (DIREKOMENDASIKAN)

Script `push-to-github.sh` (untuk Mac/Linux) atau `push-to-github.ps1` (untuk Windows) akan otomatis:
- Inisialisasi git lokal
- Minta PAT (Personal Access Token) dari Anda
- Push semua kode ke `github.com/yori1201/games`

#### Langkah 3A.1 — Generate Personal Access Token (PAT)

Karena repo `games` bersifat **PRIVATE**, Anda butuh PAT untuk otentikasi via Terminal.

1. Buka **`https://github.com/settings/tokens?type=beta`** (login ke GitHub dulu)
2. Klik tombol biru **"Generate new token"** → pilih **"Fine-grained"**
3. Isi form:
   - **Token name:** `rumbela-push`
   - **Expiration:** `7 days`
   - **Repository access:** pilih **"Only select repositories"** → cari & pilih `yori1201/games`
   - Scroll ke **"Repository permissions"** → cari **"Contents"** → ubah dari "No access" jadi **"Read and write"**
   - **Metadata** otomatis "Read-only" — biarkan
4. Klik tombol hijau **"Generate token"** di paling bawah
5. **COPY string token** yang muncul (dimulai dengan `github_pat_...`)
   - ⚠️ **PAT hanya muncul SEKALI!** Kalau hilang, generate ulang.

#### Langkah 3A.2 — Jalankan script

**Mac/Linux:**
```bash
cd ~/Downloads/rumbela-games
bash scripts/push-to-github.sh
```

**Windows (PowerShell):**
```powershell
cd $env:USERPROFILE\Downloads\rumbela-games
.\scripts\push-to-github.ps1
```

Kalau Windows muncul error "execution of scripts is disabled", jalankan dulu:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
lalu coba lagi.

#### Langkah 3A.3 — Paste PAT saat diminta

Script akan menampilkan instruksi (yang sama dengan langkah 3A.1 di atas), lalu meminta:
```
Paste PAT Anda di sini (tidak akan tampil): _
```
**Paste PAT Anda** (tidak akan terlihat saat diketik) → tekan Enter.

#### Langkah 3A.4 — Tunggu sampai sukses

Script akan:
1. Init git (kalau belum)
2. Pull dari remote (kalau ada isinya)
3. Push kode ke GitHub

Kalau sukses, muncul:
```
✅ PUSH BERHASIL!
🎉 Kode sudah ada di: https://github.com/yori1201/games
```

**Kalau gagal**, cek error message. Penyebab umum:
- PAT salah / expired → generate ulang
- PAT tidak punya permission "Contents: Read and write" → edit PAT, centang itu
- Repository access tidak include `yori1201/games` → edit PAT, tambahkan repo itu

#### Langkah 3A.5 — Revoke PAT (opsional tapi disarankan)

Setelah push sukses dan Anda tidak akan push lagi dalam dekat ini:
1. Buka `https://github.com/settings/tokens?type=beta`
2. Cari `rumbela-push` di daftar
3. Klik → **"Delete"**
4. PAT tidak bisa dipakai lagi — aman!

---

### 📤 Cara B: Upload manual via GitHub web (alternatif, lebih lambat)

Cocok kalau Anda tidak ingin pakai Terminal/PAT.

1. Buka **`https://github.com/yori1201/games`** (login ke GitHub)
2. Klik tombol **"Add file"** → **"Upload files"**
3. **Drag semua ISI folder `rumbela-games/`** (kecuali `node_modules/` dan `.env.local`) ke area browser
   - ⚠️ **JANGAN** upload folder `node_modules/` (terlalu besar, GitHub akan reject)
   - ⚠️ **JANGAN** upload file `.env.local` (berisi kredensial)
4. Tunggu sampai semua file ke-upload
5. Di kolom "Commit changes", ketik pesan: `production-ready v1.0`
6. Klik tombol hijau **"Commit changes"**

**Kelemahan cara B:**
- Upload 80+ file manual sangat lambat
- Folder dalam folder harus di-upload satu per satu
- Tidak ada history git yang rapi

**Saran:** Pakai Cara A kalau bisa.

---

### ✅ Verifikasi langkah 3 selesai

Buka `https://github.com/yori1201/games` di browser. Anda harus melihat:
- File `package.json`, `vercel.json`, `firestore.rules`, `DEPLOYMENT.md`, dll di root
- Folder `src/`, `public/`, `scripts/`
- Commit terakhir: "production-ready v1.0" (atau pesan serupa)

Kalau ya → lanjut ke **Langkah 4**.

---

## ▲ Langkah 4 — Deploy ke Vercel (5 menit)

### 4.1 Buka Vercel & sign in
1. Buka **`https://vercel.com`**
2. Klik tombol **"Sign Up"** atau **"Log In"** di pojok kanan atas
3. Pilih **"Continue with GitHub"** → authorize Vercel untuk akses repo Anda

### 4.2 Import repo
1. Setelah login, Anda di halaman dashboard Vercel
2. Klik tombol **"Add New..."** → **"Project"**
3. Di bagian "Import Git Repository", cari **`yori1201/games`** di daftar
4. Klik **"Import"** di samping repo itu

### 4.3 Konfigurasi Environment Variables
**SEBELUM klik "Deploy"**, scroll ke bawah ke bagian **"Environment Variables"**.

Tambahkan **6 variabel** berikut (copy-paste dari file `.env.local` Anda):

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | (isi dari .env.local) |
| `VITE_FIREBASE_AUTH_DOMAIN` | (isi dari .env.local) |
| `VITE_FIREBASE_PROJECT_ID` | (isi dari .env.local) |
| `VITE_FIREBASE_STORAGE_BUCKET` | (isi dari .env.local) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | (isi dari .env.local) |
| `VITE_FIREBASE_APP_ID` | (isi dari .env.local) |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | (isi dari .env.local) |

Untuk setiap variabel:
1. Ketik nama di kolom "Name"
2. Ketik nilai di kolom "Value"
3. Klik tombol **"Add"**

### 4.4 Deploy
1. Scroll ke bawah → klik tombol besar **"Deploy"**
2. Tunggu 2–3 menit. Vercel akan build project Anda.
3. Kalau sukses, muncul halaman "Congratulations!" dengan confetti 🎉
4. Klik link **"Visit"** untuk membuka aplikasi Anda yang sudah live!

URL-nya akan berbentuk: **`https://games-xxx.vercel.app`** (atau Anda bisa pakai custom domain nanti)

---

## ✅ Langkah 5 — Verifikasi aplikasi jalan

1. Buka URL Vercel yang Anda dapat di langkah 4.4
2. Anda akan melihat halaman login RUMBELA GAMES dengan maskot Bela
3. Klik tombol **"RUMBELA-SISWA"** (tombol cepat di bawah)
4. Klik **"Masuk Petualangan"**
5. Anda akan masuk ke dashboard dengan nama "Budi Petualang", XP 140, ⭐ 8

**Selamat! 🎉 Aplikasi sudah live di produksi!**

Coba juga:
- `RUMBELA-TUTOR` → masuk sebagai tutor, bisa lihat daftar siswa
- `RUMBELA-ADMIN` → masuk sebagai admin

---

## 🆘 Troubleshooting

### Halaman blank / error "Autentikasi Belum Siap"
**Penyebab:** Anonymous Auth belum diaktifkan di Firebase.
**Fix:** Ulangi Langkah 1.2 di atas. Pastikan toggle "Anonymous" di-enable.

### Login gagal, pesan "Terjadi kesalahan saat verifikasi kode"
**Penyebab kemungkinan:**
1. Anda belum jalankan `npm run seed` (Langkah 2) — access codes belum ada di database
2. Database ID di Vercel env vars tidak cocok dengan database yang ada di Firebase

**Fix:**
1. Pastikan Langkah 2 sudah dijalankan
2. Buka Firebase Console → Firestore Database → cek apakah ada koleksi `access_codes` dengan dokumen `RUMBELA-SISWA` di dalamnya. Kalau tidak ada, ulangi Langkah 2.

### Build error di Vercel: "Module not found"
**Penyebab:** file `package.json` tidak ter-upload ke GitHub.
**Fix:** Cek repo GitHub Anda. Pastikan `package.json` ada di root repo. Kalau tidak ada, ulangi Langkah 3.

### Error: "Missing VITE_FIREBASE_* env vars"
**Penyebab:** Environment variables belum di-set di Vercel.
**Fix:** Ulangi Langkah 4.3. Pastikan SEMUA 7 variabel di-add.

### Data hilang setelah deploy ulang
**Tidak akan terjadi.** Data tersimpan di Firebase Firestore (di server Google), bukan di Vercel. Walau Vercel di-redeploy 1000x, data siswa tetap aman.

---

## 📞 Bantuan lebih lanjut

Kalau stuck di langkah manapun, screenshot error-nya dan kirim ke AI assistant yang membantu Anda. Jelaskan:
1. Di langkah berapa Anda stuck
2. Pesan error yang muncul (copy-paste teksnya)
3. Screenshot halaman yang error

AI assistant akan bantu diagnose.

---

## 📚 Referensi cepat

| Resource | URL |
|----------|-----|
| Firebase Console | `https://console.firebase.google.com` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| GitHub Repo | `https://github.com/yori1201/games` |
| Panduan ini | File `DEPLOYMENT.md` di repo |

---

**Selamat mendeploy! 🌱✨**
