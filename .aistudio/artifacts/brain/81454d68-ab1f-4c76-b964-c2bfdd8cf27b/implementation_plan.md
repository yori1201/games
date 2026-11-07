# Rumbela Games — Adaptive Level-Based Learning Game Platform

Platform pembelajaran adaptif interaktif berbasis level untuk Rumah Belajar Anak (Rumbela) yang menyesuaikan tingkat kesulitan secara real-time berdasarkan performa siswa, dilengkapi visual 3D interaktif Three.js (maskot Bela & landmark pulau), dual-theme (siang dan malam), serta dashboard analitik performa komprehensif untuk siswa, tutor, dan admin.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pada tahap klarifikasi interaktif:
> - **Tema Visual & Peta Level**: Mengimplementasikan **Dual Theme** dengan transisi mulus antara **Peta Siang Hari** (Petualangan Pulau Ceria sesuai referensi Map 1) dan **Peta Malam Hari** (Jalur Bintang Bercahaya dengan node heksagonal sesuai referensi Map malam).
> - **Integrasi 3D Three.js**: Fokus utama pada **Maskot 3D Interaktif Bela** (karakter 3D prosedural responsif yang bereaksi terhadap jawaban siswa) dan **Landmark Pulau 3D** (batu gerbang, mercusuar, rumah jamur, dan peti harta karun pada simpul peta).
> - **Cakupan Mata Pelajaran**: Menyediakan **3 Mata Pelajaran Penuh** (Matematika, English termasuk Spelling, dan Coding/Logic) yang diawali dengan **Placement Test Diagnostik Singkat** (5 soal cepat) untuk menentukan level awal yang paling tepat.
> - **Penyimpanan & Backend**: Full-stack Node.js Express server (`server.ts`) terintegrasi dengan Firebase Firestore sebagai authoritative storage dan state tracking, mengakhiri technical debt penyimpanan lokal (`localStorage`).

---

### 1. Overview & Core Concept

- **What It Does**: Rumbela Games mentransformasi mini-game kuis statis menjadi sistem pembelajaran adaptif level-based. Siswa memilih jenjang (TK, SD 1–6, SMP 7–9), mengerjakan tes penempatan singkat, lalu menjelajahi peta petualangan kompetensi. Mesin adaptif mengevaluasi akurasi, waktu respons, dan pola kesalahan secara real-time untuk mengatur kesulitan soal, membuka level berikutnya (mastery $\ge 80\%$), atau memberikan rute latihan remedial visual.
- **Target Audience / Persona**:
  - **Siswa**: Anak-anak usia dini hingga remaja yang membutuhkan latihan mandiri yang memotivasi, ceria, dan bebas intimidasi.
  - **Tutor / Guru Rumbela**: Pengajar yang membutuhkan visibilitas mendalam atas kekuatan, kelemahan, dan miskonsepsi siswa tanpa beban koreksi manual.
  - **Admin Bimbel**: Pengelola yang mengatur kurikulum, bank soal terstruktur, dan kode akses siswa.
- **Key Value**: Pengalaman belajar personal (*mastery-based progression*) di mana anak tidak terjebak pada soal yang terlalu mudah atau frustrasi dengan soal yang terlalu sulit, didukung feedback positif maskot 3D Bela.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Onboarding & Access Gate**: Masuk via kode akses siswa yang tervalidasi di backend. Jika siswa baru, tampilkan pemilihan nama panggilan, jenjang (PAUD/TK, SD, SMP), dan kelas beserta pemilihan avatar.
2. **Diagnostic Placement Test (Opsional/Awal)**: 5 soal interaktif lintas domain untuk memposisikan siswa pada level kompetensi yang pas (*Safe Start*).
3. **Adventure Level Map (Dual-Theme)**:
   - Navigasi jalur pulau petualangan interaktif dengan toggle Siang/Malam.
   - Siang: Lanskap hijau cerah, sungai mengalir, telur misteri, jembatan kayu, dan pohon apel.
   - Malam: Lanskap ungu mistis dengan taburan bintang bercahaya, batu gerbang kuno, dan node level heksagonal bernomor dengan 1–3 bintang emas.
   - Maskot 3D Bela melangkah menyusuri simpul level yang terbuka.
4. **Adaptive Game Session**:
   - Tipe soal: Pilihan Ganda Interaktif, Word Match, Spelling Master (huruf tersusun/mengetik), Math Visual Manipulative, dan Block Logic Sequencing.
   - Penilaian server-side instan dengan evaluasi poin adaptif. Jika siswa kesulitan berturut-turut, sistem menurunkan difficulty tier dan memunculkan petunjuk visual (hint bertahap).
5. **Celebration & Results (Screenshot 3 Reference)**:
   - Layar kemenangan "Good job! Here are your results" dengan 3 bintang animasi ceria, perolehan XP, skor akurasi (misal 10/10), status Mastery Unlock, dan tombol kembali ke peta petualangan.
6. **Multi-Role Dashboards**:
   - **Student Dashboard**: Ringkasan streak harian, total XP, bintang terkumpul, dan kartu pintas 3 map subject.
   - **Tutor & Admin Dashboard**: Pemantauan real-time status mastery per kompetensi (Mastered, In Progress, Needs Practice), daftar siswa bimbingan, filter kelas, dan log miskonsepsi.

#### Visual Identity & Theme
- **Color System (Tailwind tokens)**:
  - Canvas Siang: Hijau padang rumput cerah (`#4ADE80` ke `#22C55E`), biru sungai langit (`#38BDF8`), pasir lembut (`#FEF08A`).
  - Canvas Malam: Biru dongker dan ungu nebula (`#0F172A`, `#1E1B4B`, `#312E81`), aksen cyan bioluminescent (`#06B6D4`).
  - Aksen Gamifikasi: Emas bintang penghargaan (`#FBBF24`), oranye energi (`#F97316`), merah hati stamina (`#EF4444`).
- **Typography**: Display font `Plus Jakarta Sans` / `Outfit` yang ramah anak, dipadukan dengan font angka tabular `IBM Plex Mono` untuk timer, skor, dan koordinat matematika.
- **3D Asset Integration (Three.js)**:
  - Maskot 3D Bela berstruktur procedural multi-part (badan bulat menggemaskan, mata responsif, telinga lentur, dan kaki melangkah) yang dapat melompat gembira saat benar dan tersenyum menyemangati saat salah.
  - Landmark 3D pada peta pulau: Gerbang batu purba berlumut, rumah jamur bercahaya, dan peti harta karun animasi buka-tutup.

---

### 3. Key Product Decisions & Trade-Offs

- **Server-Authoritative Evaluation & State**:
  - *Keputusan*: Seluruh koreksi jawaban, perhitungan mastery score, penambahan XP ledger, dan status unlock level dihitung di backend Node.js (`server.ts` + Firebase Admin/Firestore SDK), bukan di browser client.
  - *Alasan*: Mencegah manipulasi state client (anti-cheating), menjamin persistensi lintas perangkat (HP, tablet, laptop), dan menyediakan data valid untuk laporan tutor.
- **Adaptive Scoring Engine (Deterministic Multi-Factor)**:
  - *Keputusan*: Menggunakan formula deterministik transparan:
    $$\text{Mastery Score} = 0.60 \times \text{Akurasi Sesi} + 0.20 \times \text{Performa Terkini} + 0.20 \times \text{Tingkat Mandiri (Tanpa Hint)}$$
    - Ambang $\ge 80\%$: Lulus level & unlock tantangan berikutnya.
    - Ambang $60\% - 79\%$: Penguatan tipe soal yang salah (*targeted practice*).
    - Ambang $< 60\%$: Penurunan tingkat kesulitan (*remedial visual route*).
  - *Alasan*: Menghindari ketergantungan model generatif yang tidak menentu (non-deterministic) untuk penentuan nilai raport/kelulusan kompetensi anak.
- **Dual-Engine Map Rendering**:
  - *Keputusan*: Memadukan kanvas SVG/HTML5 path responsif dengan Three.js procedural layer untuk hero landmark dan karakter Bela.
  - *Alasan*: Performa sangat ringan dan baterai hemat di ponsel low-end, sementara tetap memberikan pengalaman visual 3D yang memukau.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RUMBELA CLIENT (React 19)                       │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌──────────────────┐  │
│  │   Adventure Map View  │ │ Adaptive Gameplay │ │ Tutor & Student  │  │
│  │ (Day/Night 3D Canvas) │ │ (Math/Eng/Logic)  │ │    Dashboards    │  │
│  └───────────┬───────────┘ └─────────┬─────────┘ └────────┬─────────┘  │
│              │                       │                    │            │
│              └───────────────────────┼────────────────────┘            │
│                                      ▼                                 │
│                            App State & Audio Synthesizer               │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ REST / API Calls
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       EXPRESS NODE.JS SERVER (server.ts)               │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Auth & Access Guard   │  │       Adaptive Mastery Engine       │  │
│  │  - Access code verifier │  │  - Point evaluator & difficulty     │  │
│  │  - Student session mgr  │  │  - Remedial & next question router  │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Question Bank Service  │  │         Tutor Analytics Service     │  │
│  │  - Math, English, Logic │  │  - Competency matrix & trends       │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FIREBASE PERSISTENCE                            │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────────┐  │
│  │ students / users  │  │   game_sessions   │  │  student_progress  │  │
│  └───────────────────┘  └───────────────────┘  └────────────────────┘  │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────────┐  │
│  │  question_bank    │  │ answer_attempts   │  │    audit_logs      │  │
│  └───────────────────┘  └───────────────────┘  └────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Collections (Firestore & State)
1. `students`: Profil siswa (`id`, `accessCode`, `displayName`, `educationStage`, `gradeCode`, `avatarKey`, `xp`, `streak`, `createdAt`).
2. `curriculum_competencies`: Peta kompetensi (`subjectId`, `gradeBand`, `domain`, `title`, `order`, `prerequisites`).
3. `game_levels`: Definisi level (`competencyId`, `levelNumber`, `title`, `difficulty`, `masteryThreshold`).
4. `question_bank`: Bank soal terstruktur terverifikasi (`subject`, `grade`, `competencyId`, `levelId`, `difficulty`, `type`, `prompt`, `options`, `acceptedAnswers`, `explanation`, `hintData`).
5. `game_sessions`: Sesi bermain aktif (`studentId`, `subject`, `levelId`, `currentDifficultyTier`, `score`, `status`, `startedAt`).
6. `student_progress`: Pencatatan mastery (`studentId`, `competencyId`, `levelId`, `masteryScore`, `status`: `LOCKED` | `AVAILABLE` | `IN_PROGRESS` | `MASTERED`, `bestAccuracy`).

#### Implementation Steps
1. **Server & Database Infrastructure**: Setup Express server (`server.ts`), integrasi Firebase setup RPC, inisialisasi schema blueprint `firebase-blueprint.json` dan `firestore.rules`.
2. **Question Bank & Curriculum Seeding**: Ekstraksi dan pengkategorian bank soal terstruktur untuk Matematika, English (Quiz, Word Match, Fill Blank, Spelling), dan Logic/Coding.
3. **Adaptive Engine Implementation**: Modul evaluator poin, penyesuaian difficulty tier dinamis, penghitung mastery score, dan rule unlock level.
4. **Three.js 3D Viewport & Mascot**: Karakter procedural Bela 3D dan landmark pulau dengan shader lighting berkualitas tinggi, support software-WebGL fallback.
5. **Interactive Frontend Views**:
   - Peta level petualangan dual-theme (Siang/Malam).
   - Mode game adaptif lengkap dengan feedback audio Web Audio API.
   - Layar hasil kemenangan animasi bintang (Screenshot 3).
   - Dashboard siswa dan panel tutor/admin lengkap dengan filter performa.
6. **Verifikasi & QA**: Validasi flow end-to-end, linting, dan build check.
