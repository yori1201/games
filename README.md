# 🌱 RUMBELA GAMES — Adaptive Learning Platform

Platform permainan belajar adaptif level-based untuk anak Indonesia, dirancang untuk **Bimbel Rumbela - Rumah Belajar Anak**. Sistem menyesuaikan tingkat kesulitan soal berdasarkan performa siswa secara real-time, dengan peta petualangan 3D, maskot Bela animasi, dan pemantauan performa akurat untuk tutor.

![Rumbela Games](public/assets/aistudio/MASKOT_RUMBELA_BG_6356fdb1.png)

---

## 🎮 Fitur Utama

### 3 Mata Pelajaran Adaptif
- 🧮 **Matematika** — berhitung visual, operasi angka, pola deret, pecahan, bangun datar (10 level)
- 📚 **English Quest** — Vocabulary, Spelling, Daily Conversation, Grammar (10 level)
- 🧩 **Coding & Logika** — Pola, urutan, navigasi, IF-THEN, LOOP, debugging (10 level)

### Mesin Adaptif Multi-Faktor
- **Mastery score** = `0.60 × accuracy + 0.20 × recentPerformance + 0.20 × independentCorrectRate`
- **Threshold** 80% = MASTERED, 60% = NEEDS_PRACTICE, <60% = REMEDIAL
- Tier dinamis EASY/MEDIUM/HARD berdasarkan 2 jawaban terakhir
- XP ledger: `correct×10 + stars×15 + (mastered?25:0)`

### Engagement & Gamifikasi
- 🗺️ Peta petualangan 10 level dengan telur 3D warna-warni
- 🌱 Maskot Bela 3D interaktif (drag rotasi, mood reaktif)
- ❤️ Streak harian 7-hari dengan bonus XP naik
- ⭐ Sistem bintang 0–3 per level
- 🎉 Confetti & transisi sinematik level-up
- 🔊 Web Audio API prosedural (tanpa file audio eksternal)
- 🗣️ Cheerful female voice TTS untuk ejaan Inggris

### Dashboard Tutor
- Daftar siswa + filter jenjang + pencarian
- Matriks penguasaan kompetensi 10 level × 3 mapel
- Buka manual level dengan alasan audit
- Statistik rata-rata mastery per mapel

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | React 19 + Vite 8 + TypeScript 7 |
| Styling | Tailwind CSS 4 |
| 3D & Animasi | three.js, canvas-confetti, framer-motion |
| Audio | Web Audio API (procedural) + SpeechSynthesis |
| Backend | **Firebase Firestore** (client SDK langsung) |
| Auth | **Firebase Authentication** (Anonymous + role di Firestore) |
| Security | **Firestore Security Rules** berbasis `request.auth.uid` |
| Hosting | **Vercel** (static SPA + serverless-ready) |

---

## 📦 Struktur Project

```
rumbela-games/
├── public/
│   ├── assets/
│   │   ├── aistudio/              # Maskot, theme song, PRD
│   │   ├── audio/                 # BGM loop
│   │   └── maps/                  # Peta petualangan day/night
├── scripts/
│   └── seed.ts                    # Seed access codes & demo students
├── src/
│   ├── App.tsx                    # Root: state machine 8 layar
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Tailwind global styles
│   ├── types/
│   │   └── game.ts                # Type definitions
│   ├── lib/
│   │   ├── firebase.ts            # Firebase init (env vars)
│   │   ├── auth-context.tsx       # React context untuk Auth state
│   │   ├── data-service.ts        # Replaces old Express server.ts
│   │   ├── adaptive-engine.ts     # Mesin adaptif (mastery, tier, XP)
│   │   ├── curriculum-data.ts     # 80+ soal + 30 level defs + placement
│   │   ├── audio.ts               # Web Audio API sound synth
│   │   ├── cheerful-voice.ts      # TTS untuk ejaan Inggris
│   │   ├── theme-song-service.ts  # BGM controller
│   │   └── confetti.ts            # Confetti presets
│   └── components/
│       ├── auth/AccessOnboarding.tsx
│       ├── dashboard/StudentDashboard.tsx
│       ├── dashboard/TutorDashboard.tsx
│       ├── map/AdventureMap.tsx
│       ├── map/EggLevelNode3D.tsx
│       ├── gameplay/AdaptiveGameSession.tsx
│       ├── gameplay/ResultCelebration.tsx
│       ├── mascot/MascotBelaVideo.tsx
│       ├── 3d/MascotBela3D.tsx       # ⚠️ archived (unused)
│       ├── 3d/IslandLandmark3D.tsx   # ⚠️ archived (unused)
│       ├── audio/ThemeSongWidget.tsx
│       └── transitions/CinematicLevelUpTransition.tsx
├── firestore.rules                # Security rules (auth-based)
├── firebase-blueprint.json        # Schema dokumentasi
├── vercel.json                    # Vercel deploy config
├── .env.example                   # Template env vars
├── DEPLOYMENT.md                  # 📖 Panduan deploy non-teknis
└── package.json
```

---

## 🚀 Quick Start (Development Lokal)

```bash
# 1. Install dependencies
npm install

# 2. Setup env vars
cp .env.example .env.local
# Edit .env.local, isi dengan nilai Firebase project Anda

# 3. Jalankan dev server
npm run dev
# Buka http://localhost:5173

# 4. (Pertama kali) Seed data awal
npm run seed
```

---

## 🌐 Deploy ke Produksi (Vercel)

**Lihat [`DEPLOYMENT.md`](./DEPLOYMENT.md)** untuk panduan lengkap klik-demi-klik (non-teknis).

Ringkasan:
1. Aktifkan Anonymous Auth di Firebase Console
2. Buat Firestore Database + pasang `firestore.rules`
3. Jalankan `npm run seed` untuk daftar access codes
4. Push kode ke GitHub repo `yori1201/games`
5. Import repo ke Vercel, set 7 env vars, klik Deploy

URL produksi akan berbentuk `https://games-xxx.vercel.app`.

---

## 🔐 Security Model

| Aspek | Implementasi |
|---|---|
| Auth | Firebase Anonymous Auth (UID per browser) |
| Role | Disimpan di `students/{uid}.role` (student/tutor/admin) |
| Access Code | Lookup di `access_codes/{code}` → menentukan role saat sign-in |
| Data access | Firestore Security Rules: user hanya bisa baca/tulis data mereka sendiri; tutor/admin bisa baca semua |
| API key Firebase | **Publik by design** (Firebase Web SDK). Keamanan datanya dari rules + auth, BUKAN dari kerahasiaan API key. |
| Admin escalation | Dilarang oleh rules — student tidak bisa ubah role sendiri |

Lihat `firestore.rules` untuk detail implementasi.

---

## 🎓 Access Codes Default

| Code | Role | Display Name |
|---|---|---|
| `RUMBELA-SISWA` | student | Budi Petualang (demo) |
| `RUMBELA-SITI` | student | Siti Cerdas (demo) |
| `RUMBELA-ALIF` | student | Alif Kreatif (demo) |
| `RUMBELA-TUTOR` | tutor | Kakak Tutor Rumbela |
| `RUMBELA-ADMIN` | admin | Admin Rumbela |

> ⚠️ **Penting untuk produksi:** Setelah deploy, generate access codes baru yang lebih panjang & random (mis. `RUMBELA-SISWA-7X3K9P`) via Firebase Console → Firestore → `access_codes` collection. Hapus kode default di atas.

---

## 📋 Scripts yang Tersedia

```bash
npm run dev      # Development server (Vite, port 5173)
npm run build    # Production build → dist/
npm run preview  # Preview build lokal
npm run seed     # Seed access codes & demo students ke Firestore
npm run lint     # TypeScript check
npm run clean    # Hapus dist/
```

---

## 📄 Lisensi

MIT License — bebas dipakai, dimodifikasi, dan didistribusikan.

## 🙏 Credits

- **Bimbel Rumbela - Rumah Belajar Anak** — Konsep & branding
- **Maskot Bela** — Karakter kecambah hijau Rumbela
- Dibangun dengan React + Vite + Tailwind CSS + Firebase + three.js

---

**Selamat belajar bareng Bela! 🌱✨**
