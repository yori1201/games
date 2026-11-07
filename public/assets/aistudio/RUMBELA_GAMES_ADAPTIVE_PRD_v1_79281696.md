# PRD — RUMBELA GAMES
## Migrasi ke Adaptive Learning Game Platform

**Dokumen:** Product Requirements Document (PRD)  
**Versi:** 1.0  
**Tanggal:** 6 November 2026  
**Status:** Draft siap diturunkan menjadi technical specification dan task coding  
**Produk:** Rumbela Games — Rumah Belajar Anak  
**Repository:** https://github.com/yori1201/RUMBELA-GAMES  
**Deployment saat ini:** https://rumbela.vercel.app/

---

# 1. Ringkasan Produk

Rumbela Games akan dimigrasikan dari kumpulan mini-game edukasi menjadi **adaptive learning game platform**. Siswa masuk menggunakan mekanisme akses yang tersedia, mengisi profil jenjang/kelas, kemudian masuk ke dashboard dan memilih permainan:

1. **Matematika**
2. **English**, termasuk mode **Spelling**
3. **Coding / Logic Game**

Setiap permainan mempunyai peta kompetensi dan level. Sistem mengukur jawaban siswa, memperkirakan penguasaan kompetensi, lalu memilih latihan berikutnya dengan tingkat kesulitan yang sesuai. Siswa dapat berkembang dengan kecepatan berbeda. Kenaikan level tidak hanya berdasarkan total skor atau kecepatan menjawab.

Prinsip produk:

- **Personalized:** jalur dan tingkat tantangan mengikuti performa siswa.
- **Mastery-based:** level berikutnya dibuka setelah kompetensi prasyarat dikuasai.
- **Encouraging:** kesalahan menjadi umpan balik dan kesempatan belajar, bukan hukuman.
- **Cross-device:** progres tersimpan di server dan dapat dilanjutkan setelah login dari perangkat lain.
- **Teacher-aware:** data permainan dapat membantu tutor memahami kemampuan siswa.
- **Content-safe:** soal dan aturan level dikelola sebagai konten terstruktur, bukan tersebar di komponen UI.

## 1.1 Keputusan produk utama

| Area | Keputusan |
|---|---|
| Model pembelajaran | Adaptive individual dengan urutan kompetensi yang terstruktur |
| Jenjang saat onboarding | Siswa memilih jenjang dan kelas saat pertama kali masuk |
| Dashboard | Pilihan Matematika, English, Coding / Logic |
| English | Vocabulary, Grammar, Daily Conversation dan Spelling |
| Progres | Disimpan per siswa, mata pelajaran, kompetensi, dan level |
| Kenaikan level | Berdasarkan mastery, bukan skor total saja |
| Soal | Dipilih dari bank soal berdasarkan kompetensi dan tingkat kesulitan |
| Identitas siswa | Melanjutkan mekanisme kode akses yang ada untuk MVP; profil siswa dibuat setelah akses tervalidasi |
| Target rilis awal | Fondasi adaptive engine + Matematika dan English; Coding/Logic dibangun sebagai modul terpisah dengan engine progres yang sama |

---

# 2. Audit Repository Existing

Audit ini berdasarkan file pada branch `main` yang dibaca pada 6 November 2026. Ini adalah audit struktur source, bukan hasil menjalankan aplikasi atau pengujian runtime.

## 2.1 Teknologi yang teridentifikasi

| Area | Kondisi repository |
|---|---|
| Framework | Next.js 16 App Router |
| Bahasa | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Animasi | Framer Motion |
| State | Zustand |
| ORM | Prisma 6 |
| Database schema saat ini | SQLite |
| Persistence lama | Zustand + localStorage |
| Auth/access | Access code/device gate, bukan akun siswa penuh |
| Hosting | Vercel tercantum sebagai target deployment di README |
| Asset | Logo Rumbela dan maskot Bela di folder public |

## 2.2 Fitur existing yang dapat dipertahankan

Repository sudah memiliki aset dan modul yang bernilai. Migrasi tidak boleh menghapus fitur ini tanpa alasan teknis dan persetujuan.

- Maskot Bela dan branding Rumbela.
- Animated background, confetti, sound effect, dan reaksi maskot.
- English Quiz, Word Match, Fill Blank, dan Spell Mode.
- Kategori English: Vocabulary, Grammar, Daily Conversation.
- Math Mode dan bank soal matematika.
- Skor, nyawa, streak, achievement, misi, dan leaderboard.
- Result screen serta komponen level intro/result yang sudah ada.
- Access code management dan Admin Panel.
- Konten soal pada `src/lib/game-data.ts`, `math-data.ts`, dan `questions-extra.ts`.

## 2.3 Temuan teknis yang harus ditangani

1. `src/app/page.tsx` masih menjadi orchestrator utama dengan state layar lokal: access, home, playing, playing-math, result, dan admin.
2. Access gate mengidentifikasi perangkat/nama melalui access code. Belum terlihat alur akun siswa yang lengkap.
3. `game-store.ts` menggunakan Zustand dan persistensi browser. Ini tidak cukup untuk progres lintas perangkat atau laporan tutor yang konsisten.
4. `prisma/schema.prisma` saat ini hanya memiliki model generik `User` dan `Post`, dengan datasource SQLite. Belum ada model siswa, attempt, mastery, level, atau progress.
5. Pada handler Math, hasil permainan dipetakan ke kategori English `vocabulary/beginner` agar dapat menggunakan fungsi penyimpanan lama. Ini adalah technical debt yang harus dihilangkan.
6. README mendeskripsikan pengalaman English Quest lama dan menyebut localStorage sebagai penyimpanan progres. Source yang dibaca sudah menunjukkan tambahan Math dan komponen level; dokumentasi perlu diperbarui.
7. README menyebut leaderboard lokal. Leaderboard dan progres personal harus dipisahkan dari data mastery yang authoritative.
8. Ada default admin password di komponen admin. Kredensial admin tidak boleh ditanam di client bundle; autentikasi admin wajib divalidasi server-side dan secret hanya disimpan di environment.
9. Prisma SQLite perlu dievaluasi terhadap target Vercel/production. SQLite lokal/file-based tidak otomatis menjadi pilihan aman untuk deployment serverless multi-instance. Gunakan database server-managed yang mendukung koneksi production (rekomendasi PostgreSQL) setelah memeriksa provider deployment yang benar-benar dipakai.
10. `db:push` memakai `--accept-data-loss`; jangan gunakan perintah tersebut sebagai strategi migrasi production tanpa backup dan review migration.

## 2.4 Prinsip migrasi

- Pertahankan fitur game dan aset visual yang masih relevan.
- Jangan melakukan rewrite total sebelum audit dependency dan alur data.
- Pisahkan domain game dari UI.
- Pisahkan content bank, adaptive engine, progress service, dan presentation layer.
- Migrasikan penyimpanan progres secara bertahap.
- Jangan menganggap data localStorage lama sudah menjadi data server. Buat strategi import/mapping dan fallback yang jelas.
- Jangan merusak access code yang sedang digunakan siswa.

---

# 3. Visi, Tujuan, dan Non-Goals

## 3.1 Visi

Menjadikan Rumbela Games sebagai pendamping belajar interaktif yang membuat siswa belajar sesuai kemampuan, berlatih secara konsisten, dan membantu tutor melihat kompetensi yang sudah dikuasai maupun yang masih membutuhkan pendampingan.

## 3.2 Tujuan bisnis

- Meningkatkan engagement siswa terhadap aktivitas belajar Rumbela.
- Menambah nilai layanan bimbel melalui media belajar digital.
- Menyediakan data perkembangan yang dapat digunakan tutor.
- Mendorong latihan mandiri di luar jam tatap muka.
- Memiliki fondasi untuk menambah mata pelajaran, jenjang, dan tipe permainan tanpa membangun sistem progres baru setiap kali.

## 3.3 Tujuan produk

- Siswa dapat menyelesaikan onboarding jenjang dan kelas.
- Siswa dapat memilih game dari dashboard.
- Sistem dapat memilih soal sesuai jenjang, kompetensi, dan kemampuan.
- Progres tersimpan secara persisten.
- Sistem dapat membuka level berikutnya secara otomatis ketika syarat mastery terpenuhi.
- Sistem dapat memberi remedial atau latihan penguatan ketika siswa belum siap naik.
- Tutor dapat melihat ringkasan progres siswa.

## 3.4 Non-goals MVP

- Tidak membangun LMS penuh dengan kelas virtual, absensi, pembayaran, atau jadwal les.
- Tidak membangun social network/chat antar siswa.
- Tidak membuat kompetisi global publik sebagai mekanisme utama.
- Tidak menggunakan generative AI untuk membuat soal secara live saat siswa bermain.
- Tidak membuat penilaian psikometrik atau diagnosis kemampuan akademik formal.
- Tidak mengunci siswa pada timer ketat sebagai ukuran kemampuan.
- Tidak mengubah game menjadi sistem hukuman/nyawa yang membuat siswa kehilangan progres.

---

# 4. Pengguna dan Hak Akses

## 4.1 Persona

### A. Siswa
- Pengguna utama permainan.
- Mengisi nama panggilan, jenjang, kelas, dan profil dasar.
- Memilih mata pelajaran/game.
- Melihat level, progres, bintang, XP, dan rekomendasi latihan.
- Dapat keluar dan melanjutkan progres di sesi berikutnya.

### B. Tutor
- Memantau progres siswa yang menjadi tanggung jawabnya.
- Melihat mastery per mata pelajaran/kompetensi.
- Melihat soal yang sering salah dan rekomendasi tindak lanjut.
- Tidak dapat mengubah jawaban attempt yang sudah tercatat.

### C. Admin / Pengelola Rumbela
- Mengelola siswa dan akses.
- Mengelola jenjang, kelas, mata pelajaran, kompetensi, level, soal, dan aturan kelulusan.
- Mengaktifkan/nonaktifkan konten.
- Melihat laporan agregat.
- Mengelola akun tutor dan hak akses.

## 4.2 Hak akses

| Kapabilitas | Siswa | Tutor | Admin |
|---|---:|---:|---:|
| Bermain game | Ya | Preview opsional | Preview opsional |
| Melihat progres sendiri | Ya | Ya | Ya |
| Melihat progres siswa lain | Tidak | Hanya siswa yang ditugaskan | Ya |
| Mengubah profil sendiri | Terbatas | Tidak | Ya |
| Mengelola bank soal | Tidak | Tidak pada MVP | Ya |
| Mengelola level dan mastery threshold | Tidak | Tidak | Ya |
| Melihat laporan | Ringkasan sendiri | Siswa yang ditugaskan | Semua |
| Mengelola access code | Tidak | Tidak | Ya |

---

# 5. Information Architecture dan User Journey

## 5.1 Alur utama

```text
Landing / Access Gate
        |
        v
Validasi kode akses / identitas
        |
        v
Profil siswa sudah lengkap?
   |              |
  Tidak           Ya
   |              |
   v              |
Onboarding        |
Nama panggilan    |
Jenjang           |
Kelas             |
   |              |
   +--------------+
        |
        v
Dashboard Siswa
        |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
   Matematika           English          Coding / Logic
        |                  |                  |
        v                  v                  v
  Peta kompetensi     Peta kompetensi    Peta kompetensi
        |                  |                  |
        v                  v                  v
  Pilih/lanjut level  Pilih/lanjut level Pilih/lanjut level
        |                  |                  |
        +------------------+------------------+
                           |
                           v
                      Game Session
                           |
                           v
                   Evaluasi jawaban
                           |
                           v
                    Adaptive Engine
                     /           \
                    v             v
             Mastery cukup    Belum cukup
                    |             |
                    v             v
             Unlock next     Practice / hint /
                level         remedial route
                    \             /
                     v           v
                     Result & Progress
                           |
                           v
                    Kembali Dashboard
```

## 5.2 Onboarding siswa

Onboarding muncul setelah akses berhasil divalidasi, hanya jika profil belum lengkap.

Field wajib:
- Nama panggilan.
- Jenjang pendidikan.
- Kelas.

Jenjang dan kelas:
- TK: TK A, TK B.
- PAUD: kelompok usia/kelas yang ditentukan admin (hindari asumsi kelas formal).
- SD: kelas 1–6.
- SMP: kelas 7–9.
- SMA: kelas 10–12 sebagai opsi future-ready, dapat dinonaktifkan pada MVP jika belum ada konten.
- Jenjang lain tidak ditampilkan kecuali diaktifkan admin.

Aturan:
- Siswa memilih jenjang dan kelas saat pertama kali masuk.
- Pilihan disimpan di server sebagai profil aktif.
- Siswa tidak diminta mengisi ulang setiap login.
- Perubahan jenjang/kelas memerlukan konfirmasi dan dicatat sebagai perubahan profil.
- Mengubah kelas tidak menghapus histori permainan.
- Sistem tidak boleh otomatis menganggap siswa menguasai semua materi kelas sebelumnya.
- Jika siswa mengubah kelas/jenjang, sistem menjalankan penyesuaian kurikulum dan baseline; mastery historis tetap disimpan.

Field opsional:
- Avatar pilihan dari preset.
- Tahun ajaran.
- Kode/kelompok kelas Rumbela jika diperlukan.

Tidak meminta tanggal lahir, alamat, nomor telepon, atau data sensitif anak jika tidak diperlukan untuk fungsi produk.

## 5.3 Dashboard siswa

Dashboard menampilkan:
- Sapaan nama panggilan dan maskot Bela.
- Jenjang dan kelas aktif.
- Ringkasan XP, streak, dan total waktu belajar (jika diukur).
- Kartu tiga kategori game: Matematika, English, Coding / Logic.
- Tombol **Lanjutkan Belajar** yang mengarahkan ke aktivitas prioritas.
- Ringkasan progres per kategori.
- Achievement/reward terbaru.
- Rekomendasi latihan singkat.

Kartu game:
1. **Matematika** — berhitung, operasi, pola, pengukuran, geometri, dan pemecahan masalah sesuai jenjang.
2. **English** — Vocabulary, Grammar, Daily Conversation, Word Match, Quiz, Fill in the Blank, dan Spelling.
3. **Coding / Logic** — urutan instruksi, pola, sequencing, debugging sederhana, logika kondisi, dan problem solving sesuai usia.

Dashboard tidak menampilkan level yang belum relevan atau terlalu banyak angka kompleks kepada anak. Detail analitik lebih lengkap berada di dashboard tutor/admin.

---

# 6. Ruang Lingkup Game

## 6.1 Matematika

Kompetensi disusun per jenjang dan kelas. Konten awal harus ditinjau tutor Rumbela sebelum dipublikasikan.

Contoh domain kompetensi:

| Jenjang | Contoh domain |
|---|---|
| TK/PAUD | Mengenal angka, mencocokkan jumlah, bentuk, pola sederhana, membandingkan banyak/sedikit |
| SD 1–2 | Bilangan, nilai tempat, penjumlahan, pengurangan, pola, pengukuran dasar |
| SD 3–4 | Perkalian, pembagian, operasi campuran, pecahan dasar, waktu, panjang/berat |
| SD 5–6 | Pecahan, desimal, persen, perbandingan, bangun datar/ruang, soal cerita |
| SMP 7–9 | Bilangan bulat/rasional, aljabar, rasio, persamaan, geometri, statistika, peluang |

Mode permainan yang dapat digunakan:
- Multiple choice.
- Drag-and-drop / matching.
- Input jawaban angka.
- Susun langkah.
- Soal cerita interaktif.
- Visual counting/manipulasi objek untuk usia dini.

Aturan:
- Satu level mengukur satu kompetensi utama atau satu kelompok kompetensi yang erat.
- Jangan mencampur materi lintas kelas tanpa label dan tujuan yang jelas.
- Gunakan visual konkret untuk TK/PAUD dan kelas awal SD.
- Waktu menjawab tidak menjadi faktor utama mastery.

## 6.2 English

Kategori:
- Vocabulary.
- Grammar.
- Daily Conversation.
- Spelling.

Mode permainan:
- Quiz Challenge.
- Word Match.
- Fill in the Blank.
- Spell Master.
- Listening / listen-and-select (future-ready; audio perlu ditinjau).
- Sentence Builder (future-ready).

### Spelling — persyaratan khusus

- Siswa mendengar atau melihat petunjuk kata.
- Siswa menyusun huruf atau mengetik ejaan.
- Untuk kelas awal, gunakan pilihan huruf/drag-and-drop sebelum free typing.
- Sistem memeriksa ejaan secara akurat.
- Normalisasi huruf besar/kecil dan spasi dilakukan sesuai aturan konten.
- Jangan menganggap variasi ejaan yang tidak valid sebagai benar.
- Kata yang mempunyai variasi ejaan sah harus menyimpan acceptedAnswers.
- Berikan feedback fonem/suku kata atau petunjuk sederhana bila sesuai jenjang.
- Audio tidak boleh menjadi satu-satunya sumber soal jika fitur audio gagal dimuat.

Contoh progres:
- Level awal: huruf dan kata pendek yang dekat dengan kehidupan anak.
- Berikutnya: CVC/simple words, benda sekitar, warna, hewan, makanan.
- Berikutnya: kata lebih panjang, spelling patterns, silent letters (sesuai jenjang).
- Tingkat lanjut: ejaan dalam konteks kalimat.

## 6.3 Coding / Logic Game

Coding / Logic untuk MVP tidak harus mengajarkan syntax bahasa pemrograman. Fokus awal adalah computational thinking.

Kompetensi:
1. Pattern recognition — mengenali dan melanjutkan pola.
2. Sequencing — menyusun langkah yang benar.
3. Direction & navigation — memberi instruksi arah.
4. Decomposition — memecah masalah menjadi langkah kecil.
5. Conditional logic — jika/maka dengan contoh visual.
6. Loop / repetition — memahami pengulangan.
7. Debugging — menemukan dan memperbaiki urutan/instruksi yang salah.
8. Algorithm design — menyusun solusi dari awal sampai akhir.

Jenis mini-game:
- Susun blok instruksi.
- Arahkan karakter ke tujuan.
- Lanjutkan pola.
- Cari instruksi yang salah.
- Pilih kondisi yang tepat.
- Susun algoritma sederhana.

Aturan usia:
- TK/PAUD: visual, satu instruksi per langkah, tanpa teks panjang.
- SD awal: arah, urutan, pola, dan pengulangan sederhana.
- SD atas: kondisi, loop, debugging, dan algoritma.
- SMP: logika majemuk dan algoritma lebih kompleks; syntax coding dapat menjadi modul lanjutan.

---

# 7. Adaptive Learning Engine

## 7.1 Definisi

Adaptive Learning Engine adalah service domain yang menentukan:
- Kompetensi yang sedang dipelajari.
- Level/tingkat kesulitan yang sesuai.
- Soal berikutnya.
- Kapan memberikan hint.
- Kapan memberikan remedial.
- Kapan siswa dianggap menguasai kompetensi.
- Kapan level berikutnya dibuka.

Engine harus deterministic, dapat diuji, dan dapat dijelaskan. Jangan menggunakan AI generatif untuk menentukan kelulusan secara tidak konsisten.

## 7.2 Struktur hierarki

```text
Subject
  └── Curriculum / Grade Band
       └── Domain
            └── Competency
                 └── Level
                      └── Question Set
                           └── Question
```

Contoh:
- Subject: Mathematics
- Grade: SD 2
- Domain: Addition
- Competency: Penjumlahan dua bilangan tanpa menyimpan
- Level 1: Visual object counting
- Level 2: Number line
- Level 3: Symbolic addition
- Level 4: Short word problems
- Level 5: Mixed application

## 7.3 Level design

Setiap kompetensi memiliki level internal, misalnya:

| Level | Label | Karakteristik |
|---|---|---|
| 1 | Kenalan | Konsep konkret, contoh visual, bantuan tinggi |
| 2 | Latihan | Soal langsung, bantuan ringan |
| 3 | Tantangan | Variasi soal, bantuan minimal |
| 4 | Penerapan | Soal konteks/cerita, transfer konsep |
| 5 | Mastery Challenge | Soal campuran dan penerapan lebih kompleks |

Level tersebut adalah urutan penguasaan kompetensi, bukan label kelas sekolah. Level 5 satu kompetensi tidak otomatis berarti siswa berada di kelas lebih tinggi.

## 7.4 Baseline / placement

Setelah profil dibuat, siswa dapat memulai dari:
- **Default safe start:** Level 1 untuk kompetensi pertama.
- **Optional placement check:** beberapa soal diagnostik singkat untuk memperkirakan titik mulai.

Rekomendasi MVP: mulai dari safe start untuk pengalaman awal yang sederhana, lalu adaptasi setelah ada data attempt. Placement test dapat ditambahkan setelah bank soal cukup dan tutor menyetujui blueprint-nya.

Placement tidak boleh menjadi ujian panjang atau memberi label permanen pada siswa.

## 7.5 Aturan evaluasi satu sesi

Default MVP yang dapat dikonfigurasi per level:

- 8–10 soal per sesi.
- Soal mencakup satu kompetensi utama.
- Tingkat kesulitan soal dapat berubah di tengah sesi.
- Satu sesi tidak harus selalu memiliki jumlah soal sama jika engine memerlukan bukti tambahan.
- Hindari timer pada kompetensi dasar; timer hanya mode opsional untuk tantangan tertentu.
- Hint yang digunakan dicatat dan dapat memengaruhi interpretasi mastery, bukan mengurangi XP secara menghukum.

### Ambang mastery awal

| Hasil sesi | Keputusan |
|---|---|
| Akurasi ≥ 80%, minimal 8 soal valid, dan tidak ada pola kesalahan kritis | Lulus level; pertimbangkan unlock berikutnya |
| Akurasi 60–79% | Belum lulus; berikan latihan penguatan pada tipe soal yang salah |
| Akurasi < 60% | Remedial dengan representasi/tingkat kesulitan lebih mudah |
| Data belum cukup | Tambah 2–4 soal untuk mengumpulkan bukti |

Ambang ini adalah konfigurasi awal produk, bukan standar pedagogis universal. Tutor/admin harus dapat mengubahnya per kompetensi/level. Akurasi saja tidak cukup: engine harus melihat jumlah sampel, variasi soal, hint, dan pola kesalahan.

## 7.6 Mastery score

Simpan beberapa metrik terpisah:
- `accuracy`: jawaban benar / soal yang dinilai.
- `masteryScore`: estimasi penguasaan kompetensi.
- `attemptCount`: jumlah attempt.
- `independentCorrectRate`: tingkat benar tanpa hint.
- `recentPerformance`: performa terbaru.
- `misconceptionTags`: pola kesalahan yang teridentifikasi.
- `lastPracticedAt`: waktu latihan terakhir.

Rumus awal yang transparan (dapat disesuaikan):

```text
baseScore = correctAnswers / scoredQuestions * 100

masteryScore =
  0.60 * baseScore
  + 0.20 * recentPerformance
  + 0.20 * independentCorrectRate
```

Catatan:
- Komponen `recentPerformance` dan `independentCorrectRate` harus dinormalisasi ke skala 0–100.
- Untuk sesi tanpa hint, `independentCorrectRate` mengikuti akurasi sesi.
- Bobot adalah konfigurasi MVP, bukan klaim ilmiah. Validasi menggunakan data nyata dan review tutor.
- Jangan mengurangi mastery drastis hanya karena satu sesi buruk.
- Gunakan moving average / decay ringan agar data terbaru relevan tanpa menghapus histori.

## 7.7 Keputusan adaptive

Pseudo logic:

```text
onSessionCompleted(session):
    validate session and answers
    calculate accuracy, hint usage, and error patterns
    update competency mastery

    if evidence is insufficient:
        recommend 2-4 additional questions
    else if masteryScore >= configuredThreshold
         and minimumAttemptsMet
         and prerequisiteCompetenciesPassed:
        mark current level mastered
        unlock next level
        recommend next level
    else if accuracy >= reinforcementFloor:
        recommend targeted practice
    else:
        recommend easier representation or remedial

    persist decision and reason
```

Simpan `decisionReason` agar tutor/admin dapat mengetahui mengapa engine merekomendasikan aktivitas tertentu.

## 7.8 Anti-gaming dan kualitas penilaian

- Jangan memilih soal yang sama berulang kali dalam satu sesi.
- Simpan question exposure history.
- Randomisasi urutan opsi, bukan isi jawaban.
- Jangan menghitung soal yang dibatalkan akibat error teknis.
- Jawaban kosong dan timeout diperlakukan sesuai jenis game; jangan otomatis dianggap bukti tidak mampu.
- Jika anak keluar di tengah sesi, simpan status `in_progress` dan tawarkan lanjutkan.
- Satu jawaban tidak boleh terkirim dua kali akibat retry jaringan.
- Jangan memberikan XP berulang untuk attempt yang sama.
- Level unlock harus diputuskan server-side.
- Simpan versi soal dan versi aturan adaptive saat attempt dilakukan.

## 7.9 Remedial yang adaptif

Remedial bukan mengulang soal identik. Pilih strategi:
1. Ganti representasi (mis. simbol menjadi objek visual).
2. Kurangi kompleksitas.
3. Berikan contoh kerja.
4. Berikan hint bertahap.
5. Berikan soal paralel dengan angka/konteks berbeda.
6. Setelah berhasil, kembali ke soal target.

Remedial tidak menghapus skor terbaik atau level yang sudah dikuasai.

## 7.10 Unlock policy

- Kompetensi prasyarat harus lulus sebelum kompetensi lanjutan terbuka.
- Level berikutnya terbuka untuk siswa yang memenuhi threshold.
- Siswa boleh mengulang level yang sudah lulus untuk latihan.
- Mengulang level tidak menurunkan mastery.
- Siswa tidak boleh mengakses level terkunci melalui manipulasi URL/client state.
- Admin dapat membuka level secara manual dengan alasan dan audit log.
- Manual override tidak boleh menghapus hasil evaluasi otomatis.

---

# 8. Sistem Gamifikasi

Gamifikasi mendukung motivasi, bukan menggantikan tujuan belajar.

## 8.1 XP

XP diberikan untuk:
- Menyelesaikan sesi.
- Menjawab benar.
- Menyelesaikan level.
- Menyelesaikan tantangan penguatan.
- Konsistensi latihan.

Aturan:
- XP tidak menjadi dasar utama kenaikan level akademik.
- XP tidak boleh membuat siswa yang bermain banyak tetapi belum menguasai materi tampak sudah mastery.
- Batasi XP dari pengulangan sesi yang sama agar tidak bisa dieksploitasi.

## 8.2 Bintang dan reward

- 1–3 bintang berdasarkan kualitas sesi.
- Badge untuk pencapaian seperti sesi pertama, konsistensi, dan mastery kompetensi.
- Reward bersifat positif dan non-kompetitif.
- Hindari kehilangan badge atau XP yang sudah didapat.

## 8.3 Streak

- Streak mendorong kebiasaan, bukan tekanan.
- Hari tanpa bermain tidak boleh menghapus progres akademik.
- Pertimbangkan grace day agar anak tidak merasa dihukum.
- Jangan menampilkan leaderboard publik sebagai default untuk anak.

## 8.4 Feedback

Gunakan bahasa yang suportif:
- Benar: “Hebat! Kamu sudah memahami bagian ini.”
- Salah: “Belum tepat. Yuk, coba cara lain.”
- Remedial: “Kita latihan sedikit lagi supaya makin paham.”
- Naik level: “Kamu siap untuk tantangan berikutnya!”

Jangan gunakan kata-kata yang mempermalukan seperti “bodoh”, “gagal”, atau “paling lemah”.

---

# 9. Dashboard Tutor dan Admin

## 9.1 Dashboard tutor

MVP minimal:
- Daftar siswa yang ditugaskan.
- Filter jenjang/kelas.
- Ringkasan aktivitas siswa.
- Progres per mata pelajaran.
- Kompetensi mastered / in progress / needs practice.
- Akurasi dan jumlah attempt.
- Topik yang sering salah.
- Aktivitas terakhir.
- Rekomendasi tindak lanjut.

Contoh ringkasan siswa:

| Mata pelajaran | Status | Ringkasan |
|---|---|---|
| Matematika | Perlu latihan | Penjumlahan sudah baik; soal cerita perlu penguatan |
| English | Berkembang | Vocabulary kuat; spelling kata panjang perlu latihan |
| Coding / Logic | Belum cukup data | Selesaikan latihan sequencing |

Tutor tidak boleh menyimpulkan diagnosis atau kemampuan umum anak hanya dari satu sesi.

## 9.2 Admin content management

Admin dapat:
- Membuat/mengedit subject.
- Mengatur jenjang dan kelas yang aktif.
- Membuat domain dan kompetensi.
- Membuat level dan prerequisite.
- Membuat/mengimpor soal.
- Mengatur accepted answers.
- Mengatur hint dan explanation.
- Menetapkan difficulty.
- Menetapkan mastery threshold.
- Preview soal sebelum publish.
- Draft/publish/archive konten.
- Melihat histori perubahan.

## 9.3 Validasi konten

Setiap konten memiliki status:
- Draft.
- In Review.
- Approved.
- Published.
- Archived.

Soal yang belum disetujui tidak boleh muncul pada siswa. Soal harus memiliki jenjang, kompetensi, tipe jawaban, jawaban benar, penjelasan, dan metadata yang wajib.

---

# 10. UX / UI Requirements

## 10.1 Prinsip visual

- Pertahankan identitas Rumbela dan maskot Bela.
- Ceria, ramah anak, jelas, dan tidak terlalu ramai.
- Hindari tampilan dashboard seperti admin panel untuk siswa.
- Gunakan visual sesuai jenjang: TK/PAUD lebih konkret dan ilustratif; SD/SMP lebih informatif tetapi tetap menyenangkan.
- Mobile-first, karena game kemungkinan banyak dimainkan melalui HP.
- Target tap area minimal 44×44 px.
- Kontras teks dan kontrol harus memadai.
- Jangan mengandalkan warna saja untuk membedakan status.

## 10.2 Halaman wajib

1. Access Gate / Login.
2. Student Onboarding.
3. Student Dashboard.
4. Subject Landing.
5. Competency Map / Level Map.
6. Level Introduction.
7. Gameplay.
8. Hint / Help.
9. Session Result.
10. Progress Detail.
11. Tutor Dashboard.
12. Student Detail (tutor).
13. Admin Content Management.
14. Admin Level / Adaptive Configuration.

## 10.3 Level map

Tampilkan:
- Level selesai.
- Level aktif/recommended.
- Level terkunci.
- Progress bar kompetensi.
- Label sederhana.
- Tombol lanjut.

Jangan menampilkan level terkunci sebagai tombol aktif. Sertakan alasan singkat: “Selesaikan Tantangan 2 terlebih dahulu.”

## 10.4 Gameplay

- Satu tugas utama per layar.
- Petunjuk singkat.
- Feedback langsung setelah jawaban.
- Tombol audio bila relevan.
- Hint tidak menghalangi konten.
- Status sesi dan progres soal terlihat.
- Tombol keluar dengan konfirmasi dan kemampuan resume.
- Tidak ada iklan atau tautan keluar yang mengganggu.

## 10.5 Accessibility

- Dapat digunakan di layar kecil.
- Teks mudah dibaca.
- Kontrol dapat dioperasikan dengan keyboard untuk perangkat desktop.
- Audio memiliki alternatif visual.
- Animasi dapat dikurangi melalui prefers-reduced-motion.
- Hindari timer singkat untuk anak usia dini.
- Instruksi menggunakan Bahasa Indonesia sederhana; materi English dapat tetap menggunakan Bahasa Inggris sesuai tujuan latihan.

---

# 11. Data Model dan Database Requirements

**Rekomendasi:** gunakan PostgreSQL managed untuk deployment production jika aplikasi dijalankan pada Vercel/serverless. Finalisasi provider dan koneksi setelah memeriksa environment deployment. Prisma tetap dapat dipakai.

Model konseptual minimum:

## 11.1 Identity & profile

### `Student`
- `id`
- `accessIdentityId`
- `displayName`
- `avatarKey`
- `educationStage` (PAUD/TK/SD/SMP/SMA)
- `gradeCode` (TK_A, TK_B, SD_1...SMP_9, dll.)
- `isActive`
- `createdAt`
- `updatedAt`

### `AccessIdentity`
- `id`
- `accessCodeHash`
- `status`
- `deviceBinding` (jika kebijakan device tetap dipakai)
- `lastUsedAt`
- `createdAt`
- `revokedAt`

Jangan menyimpan access code plaintext jika tidak diperlukan. Jika kode harus ditampilkan admin saat dibuat, tampilkan sekali lalu simpan hash.

### `Tutor`
- `id`
- `name`
- `email`
- `authProviderId`
- `status`

### `TutorStudent`
- `id`
- `tutorId`
- `studentId`
- `assignedAt`

### `AdminUser`
- `id`
- `email`
- `authProviderId`
- `role`
- `status`

## 11.2 Curriculum & content

### `Subject`
- `id`
- `code` (MATH, ENGLISH, LOGIC)
- `name`
- `description`
- `iconKey`
- `isActive`
- `sortOrder`

### `GradeBand`
- `id`
- `stage`
- `gradeCode`
- `displayName`
- `sortOrder`
- `isActive`

### `Domain`
- `id`
- `subjectId`
- `gradeBandId`
- `name`
- `description`
- `sortOrder`

### `Competency`
- `id`
- `domainId`
- `code`
- `name`
- `description`
- `learningObjective`
- `sortOrder`
- `isActive`

### `CompetencyPrerequisite`
- `id`
- `competencyId`
- `prerequisiteCompetencyId`

### `GameLevel`
- `id`
- `competencyId`
- `levelNumber`
- `title`
- `description`
- `difficulty`
- `masteryThreshold`
- `minimumScoredQuestions`
- `isPublished`
- `version`

### `Question`
- `id`
- `subjectId`
- `gradeBandId`
- `competencyId`
- `levelId`
- `questionType`
- `prompt`
- `promptTranslation`
- `media`
- `options` (JSON)
- `acceptedAnswers` (JSON)
- `correctAnswer` (JSON)
- `explanation`
- `hintData` (JSON)
- `difficulty`
- `misconceptionTags` (JSON)
- `status`
- `version`
- `createdAt`
- `updatedAt`

### `QuestionExposure`
- `id`
- `studentId`
- `questionId`
- `shownAt`
- `sessionId`

## 11.3 Learning progress

### `LearningPath`
- `id`
- `studentId`
- `subjectId`
- `gradeBandId`
- `status`
- `createdAt`
- `updatedAt`

### `StudentCompetencyProgress`
- `id`
- `studentId`
- `competencyId`
- `masteryScore`
- `status` (NOT_STARTED / IN_PROGRESS / NEEDS_PRACTICE / MASTERED)
- `attemptCount`
- `lastPracticedAt`
- `masteredAt`
- `updatedAt`

Unique constraint: `(studentId, competencyId)`.

### `StudentLevelProgress`
- `id`
- `studentId`
- `levelId`
- `status` (LOCKED / AVAILABLE / IN_PROGRESS / MASTERED)
- `bestAccuracy`
- `bestMasteryScore`
- `completedAt`
- `unlockedAt`
- `updatedAt`

Unique constraint: `(studentId, levelId)`.

### `GameSession`
- `id`
- `studentId`
- `subjectId`
- `competencyId`
- `levelId`
- `gameMode`
- `status` (IN_PROGRESS / COMPLETED / ABANDONED / INVALIDATED)
- `startedAt`
- `completedAt`
- `questionCount`
- `correctCount`
- `score`
- `xpEarned`
- `adaptiveDecision`
- `adaptiveReason`
- `engineVersion`
- `contentVersion`

### `AnswerAttempt`
- `id`
- `sessionId`
- `questionId`
- `answerPayload` (JSON)
- `isCorrect`
- `responseTimeMs`
- `hintUsed`
- `attemptNumber`
- `submittedAt`
- `scoringMetadata` (JSON)

### `MasteryEvent`
- `id`
- `studentId`
- `competencyId`
- `sessionId`
- `previousScore`
- `newScore`
- `eventType`
- `reason`
- `createdAt`

## 11.4 Gamification

### `StudentReward`
- `id`
- `studentId`
- `rewardCode`
- `earnedAt`
- `metadata`

### `StudentXPEvent`
- `id`
- `studentId`
- `sourceType`
- `sourceId`
- `xpAmount`
- `createdAt`

XP harus ledger-based agar tidak diberikan dua kali untuk sumber event yang sama.

## 11.5 Audit

### `AuditLog`
- `id`
- `actorId`
- `actorRole`
- `action`
- `entityType`
- `entityId`
- `beforeData` (JSON)
- `afterData` (JSON)
- `reason`
- `createdAt`

Gunakan index pada:
- `GameSession(studentId, startedAt)`
- `AnswerAttempt(sessionId)`
- `StudentCompetencyProgress(studentId, status)`
- `StudentLevelProgress(studentId, status)`
- `Question(competencyId, levelId, status)`
- `TutorStudent(tutorId, studentId)`

---

# 12. API Contract (Rancangan)

Gunakan route handler Next.js atau pola service yang konsisten. Semua endpoint harus memvalidasi input dengan Zod dan melakukan authorization server-side.

## 12.1 Student profile

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/student/me` | Ambil profil siswa aktif |
| PUT | `/api/student/profile` | Lengkapi/perbarui profil |
| GET | `/api/student/dashboard` | Ambil ringkasan dashboard |

## 12.2 Subject & learning path

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/subjects` | Daftar subject aktif |
| GET | `/api/subjects/:subjectCode/path` | Learning path siswa |
| GET | `/api/competencies/:id/progress` | Detail mastery kompetensi |
| GET | `/api/levels/:id` | Detail level yang boleh diakses |

## 12.3 Game session

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/game-sessions` | Buat sesi baru |
| GET | `/api/game-sessions/:id` | Ambil status sesi |
| POST | `/api/game-sessions/:id/next-question` | Minta soal berikutnya |
| POST | `/api/game-sessions/:id/answers` | Kirim jawaban |
| POST | `/api/game-sessions/:id/hint` | Catat hint yang digunakan |
| POST | `/api/game-sessions/:id/complete` | Selesaikan sesi dan hitung hasil |
| POST | `/api/game-sessions/:id/abandon` | Keluar/tinggalkan sesi |

## 12.4 Tutor

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/tutor/students` | Daftar siswa tutor |
| GET | `/api/tutor/students/:id/progress` | Progres detail siswa |
| GET | `/api/tutor/reports/progress` | Ringkasan laporan |

## 12.5 Admin content

| Method | Endpoint | Fungsi |
|---|---|---|
| CRUD | `/api/admin/subjects` | Kelola mata pelajaran |
| CRUD | `/api/admin/competencies` | Kelola kompetensi |
| CRUD | `/api/admin/levels` | Kelola level |
| CRUD | `/api/admin/questions` | Kelola bank soal |
| POST | `/api/admin/content/:id/publish` | Publish konten |
| POST | `/api/admin/students/:id/unlock` | Manual unlock dengan alasan |

## 12.6 Contoh payload

Create session:

```json
{
  "subjectCode": "ENGLISH",
  "competencyId": "competency-id",
  "levelId": "level-id",
  "gameMode": "SPELLING"
}
```

Submit answer:

```json
{
  "questionId": "question-id",
  "answer": {
    "text": "apple"
  },
  "responseTimeMs": 8200,
  "hintUsed": false,
  "idempotencyKey": "unique-client-generated-key"
}
```

Session result:

```json
{
  "sessionId": "session-id",
  "status": "COMPLETED",
  "accuracy": 90,
  "masteryScore": 86,
  "decision": "LEVEL_MASTERED",
  "nextAction": "UNLOCK_NEXT_LEVEL",
  "nextLevelId": "next-level-id",
  "xpEarned": 35,
  "reason": "Threshold terpenuhi dan bukti jawaban mencukupi."
}
```

Jangan menerima `studentId`, `masteryScore`, `isCorrect`, atau status unlock dari client sebagai nilai authoritative. Server menentukan identitas, koreksi jawaban, skor mastery, XP, dan unlock.

---

# 13. Security, Privacy, dan Child Safety

- Validasi semua access code di server.
- Gunakan session/token yang aman; jangan mengandalkan localStorage untuk otorisasi.
- Cookie session harus HttpOnly, Secure di production, dan SameSite yang sesuai.
- Hash secret dan access code.
- Rate-limit percobaan kode akses dan endpoint sensitif.
- Jangan expose password admin atau secret di client bundle.
- Role-based access control untuk siswa, tutor, dan admin.
- Tutor hanya dapat membaca siswa yang ditugaskan.
- Semua endpoint progress harus memastikan pemilik data.
- Sanitasi konten rich text.
- Validasi upload media dan batasi ukuran/jenis file.
- Jangan mengumpulkan data pribadi anak yang tidak diperlukan.
- Sediakan kebijakan privasi dan penjelasan penggunaan data yang mudah dipahami orang tua.
- Hindari leaderboard publik yang menampilkan identitas lengkap anak.
- Hindari iklan, tracking pihak ketiga yang tidak perlu, dan komunikasi publik antar anak.
- Sediakan prosedur penghapusan/nonaktif akun dan retensi data sesuai kebijakan Rumbela.
- Backup database terjadwal dan uji pemulihan.

---

# 14. Analytics dan Product Metrics

## 14.1 Event penting

- `student_onboarding_completed`
- `dashboard_viewed`
- `subject_selected`
- `level_started`
- `question_answered`
- `hint_used`
- `session_completed`
- `level_mastered`
- `level_unlocked`
- `remedial_recommended`
- `learning_path_resumed`

Jangan kirim nama lengkap atau data sensitif ke analytics pihak ketiga.

## 14.2 KPI produk

| KPI | Definisi |
|---|---|
| Onboarding completion | Persentase siswa yang menyelesaikan profil |
| Activation rate | Siswa yang memulai sesi pertama setelah onboarding |
| Session completion rate | Sesi selesai / sesi dimulai |
| Weekly active learners | Siswa unik yang bermain dalam 7 hari |
| Mastery progression | Kompetensi yang berhasil dikuasai per siswa |
| Remedial recovery rate | Siswa yang mencapai mastery setelah remedial |
| Return rate | Siswa yang kembali bermain pada periode berikutnya |
| Cross-subject adoption | Siswa yang mencoba lebih dari satu subject |

KPI tidak boleh mendorong siswa bermain terlalu lama. Evaluasi kualitas belajar dan keseimbangan waktu bermain.

---

# 15. Content Operations

## 15.1 Format data soal

Setiap soal minimal memiliki:
- ID unik.
- Subject.
- Jenjang/kelas.
- Domain.
- Kompetensi.
- Level.
- Difficulty.
- Question type.
- Prompt.
- Options atau input schema.
- Correct answer / accepted answers.
- Explanation.
- Hint.
- Media (opsional).
- Misconception tags.
- Status review.
- Version.

## 15.2 Standar kualitas soal

- Satu soal menguji tujuan yang jelas.
- Bahasa sesuai usia.
- Tidak ambigu.
- Jawaban benar dapat diverifikasi.
- Distraktor masuk akal dan tidak menyesatkan.
- Penjelasan membantu anak memahami konsep.
- Soal tidak bergantung pada pengetahuan budaya yang tidak relevan.
- Konten visual/audio mempunyai fallback.
- Tutor melakukan review sebelum publish.
- Duplikasi soal dikurangi melalui ID dan content review.

## 15.3 Import konten existing

- Audit semua data pada `game-data.ts`, `math-data.ts`, dan `questions-extra.ts`.
- Buat mapping ke struktur `Question`.
- Jangan langsung mengimpor semua konten sebagai published.
- Tandai konten yang belum memiliki grade/competency sebagai `needs_mapping`.
- Lakukan sampling review kualitas.
- Simpan source file dan legacy ID untuk traceability.
- Pastikan jawaban dan scoring logic tidak berubah diam-diam saat migrasi.

---

# 16. Migration Plan dan Tahapan Implementasi

## Phase 0 — Discovery & Baseline

**Tujuan:** memahami kondisi runtime dan mencegah regresi.

Task:
- Catat branch, commit, deployment, environment variables, dan provider database.
- Jalankan build, lint, dan test yang tersedia.
- Inventarisasi seluruh route API.
- Audit AccessGate, access-store, game-store, AdminPanel, MathMode, English modes.
- Audit data soal dan tipe konten.
- Buat screenshot baseline halaman existing.
- Backup database dan data penting.
- Buat daftar fitur yang wajib tetap berjalan.

Deliverable:
- Audit teknis final.
- Data migration map.
- Regression checklist.
- Risk register.

## Phase 1 — Foundation & Student Profile

Task:
- Rancang session/auth yang kompatibel dengan access code existing.
- Buat Student profile dan onboarding.
- Implementasi jenjang/kelas.
- Buat dashboard baru dengan tiga kartu subject.
- Pindahkan identitas siswa dari state browser ke server session.
- Buat fallback untuk siswa lama yang belum memiliki jenjang/kelas.
- Jangan menghapus fitur lama sebelum alur baru lulus uji.

Acceptance:
- Siswa baru dapat masuk dan menyelesaikan onboarding.
- Siswa lama dapat melengkapi profil tanpa kehilangan akses.
- Profil muncul kembali pada login berikutnya.
- Siswa tidak dapat membaca profil siswa lain.

## Phase 2 — Curriculum & Content Model

Task:
- Buat Subject, GradeBand, Domain, Competency, GameLevel, Question.
- Mapping konten English dan Math existing.
- Tambahkan status draft/review/published.
- Buat admin content management minimal.
- Buat preview konten.

Acceptance:
- Soal terhubung ke jenjang, kompetensi, dan level.
- Soal draft tidak muncul dalam sesi siswa.
- Konten dapat ditambah tanpa mengubah komponen game.

## Phase 3 — Adaptive Engine Core

Task:
- Implementasi GameSession dan AnswerAttempt.
- Implementasi scoring server-side.
- Implementasi mastery calculation.
- Implementasi remedial routing.
- Implementasi level unlock dan prerequisite.
- Implementasi idempotency.
- Simpan engineVersion dan decisionReason.

Acceptance:
- Jawaban dinilai server-side.
- Sesi selesai menghasilkan keputusan yang konsisten.
- Level unlock tidak bisa dimanipulasi dari client.
- Siswa yang belum memenuhi threshold mendapatkan latihan sesuai kebutuhan.
- Semua keputusan adaptive dapat ditelusuri.

## Phase 4 — Migrate Mathematics & English

Task:
- Integrasikan MathMode ke session engine.
- Integrasikan Quiz, Word Match, Fill Blank, dan Spell Mode ke session engine.
- Hilangkan mapping Math ke kategori vocabulary.
- Buat peta kompetensi per jenjang.
- Uji acceptedAnswers untuk spelling.
- Implementasi resume session.
- Pastikan skor/achievement lama yang masih relevan tetap tampil.

Acceptance:
- Semua mode existing yang dipertahankan bekerja melalui API/session baru.
- Progres per subject tidak tercampur.
- Siswa dapat naik level berdasarkan mastery.
- English spelling memeriksa variasi jawaban sesuai definisi konten.

## Phase 5 — Coding / Logic Game

Task:
- Buat model blok instruksi dan rule evaluator.
- Buat mini-game pattern, sequencing, navigation, debugging.
- Petakan level per jenjang.
- Hubungkan hasil game ke adaptive engine yang sama.

Acceptance:
- Jawaban logic dievaluasi deterministic.
- Level adaptif berfungsi sama dengan Math/English.
- Konten dapat diperluas tanpa mengubah progress service.

## Phase 6 — Tutor Dashboard & Reports

Task:
- Buat assignment tutor-siswa.
- Buat ringkasan mastery.
- Buat detail kompetensi dan riwayat sesi.
- Buat rekomendasi tindak lanjut berbasis data.
- Tambahkan export sederhana bila dibutuhkan.

Acceptance:
- Tutor hanya melihat siswa yang ditugaskan.
- Data laporan sesuai hasil sesi.
- Rekomendasi menjelaskan dasar datanya.
- Tidak ada klaim diagnosis dari data terbatas.

## Phase 7 — Hardening, QA & Release

Task:
- Security review.
- Performance testing.
- Accessibility testing.
- Cross-device testing.
- Backup/restore test.
- Data migration rehearsal.
- Staging UAT dengan tutor dan siswa terbatas.
- Feature flag/canary release.
- Monitor error dan rollback plan.

Acceptance:
- Tidak ada blocker/high severity bug.
- Build dan lint lulus.
- Data progres tidak hilang pada reload/perangkat berbeda.
- Rollback dapat dilakukan tanpa merusak data.
- Tutor menyetujui kualitas konten dan aturan mastery.

---

# 17. Testing Strategy

## 17.1 Unit tests

- Correct answer evaluator.
- Spelling normalization.
- Mastery score calculation.
- Threshold decisions.
- Remedial selection.
- Prerequisite validation.
- Level unlock.
- XP idempotency.
- Grade/subject content filtering.

## 17.2 Integration tests

- Access code → student profile.
- Onboarding → dashboard.
- Dashboard → subject path.
- Start session → next question → submit answer.
- Complete session → mastery update.
- Mastery update → level unlock.
- Remedial → retry session.
- Resume session setelah refresh.
- Tutor access → hanya siswa yang assigned.

## 17.3 E2E scenarios

1. Siswa baru memilih SD kelas 2, membuka Matematika, menyelesaikan level, dan membuka level berikutnya.
2. Siswa dengan akurasi rendah menerima remedial.
3. Siswa English memainkan Spelling dan jawaban dinilai dengan accepted answers.
4. Siswa Coding menyusun instruksi yang benar.
5. Siswa keluar di tengah sesi lalu melanjutkan sesi yang sama.
6. Siswa login dari perangkat lain dan progres tetap tersedia.
7. Siswa mengubah kelas tanpa kehilangan histori.
8. Tutor melihat ringkasan progres siswa.
9. Siswa mencoba membuka level terkunci melalui URL/API dan ditolak.
10. Request jawaban terkirim dua kali tidak menggandakan XP atau attempt.

## 17.4 Acceptance criteria global

- Semua data mastery dan unlock authoritative berada di server.
- Tidak ada progres utama yang hanya tersimpan di localStorage.
- Semua soal published memiliki mapping kurikulum.
- Siswa dapat memilih tiga kategori game dari dashboard.
- Onboarding jenjang/kelas hanya diminta saat belum lengkap.
- Adaptive decision mempunyai alasan yang dapat dibaca.
- Level unlock tidak bergantung pada manipulasi client.
- Tampilan responsif dan dapat digunakan di HP.
- Existing access code flow tetap berfungsi selama masa transisi.

---

# 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data lama hanya di localStorage | Progres hilang saat pindah perangkat | Migrasi/import terkontrol dan komunikasi bahwa data lama perlu sinkronisasi |
| Bank soal belum dipetakan ke kelas/kompetensi | Adaptive engine memilih soal yang tidak relevan | Content mapping dan review tutor sebelum publish |
| SQLite tidak sesuai pola deployment | Data tidak konsisten / persistence bermasalah | Verifikasi hosting; gunakan PostgreSQL managed untuk production |
| Anak menebak jawaban | Mastery salah terukur | Variasi soal, minimum evidence, error pattern |
| Threshold terlalu ketat | Anak frustrasi | Kalibrasi threshold dengan tutor dan data pilot |
| Threshold terlalu longgar | Level naik tanpa mastery | Minimum attempts dan review kualitas soal |
| Fitur lama rusak saat migrasi | Pengalaman siswa terganggu | Feature flag, regression test, rollback |
| Kredensial admin di client | Akses tidak sah | Pindahkan validasi dan secret ke server |
| Konten lintas jenjang tercampur | Pengalaman tidak sesuai usia | GradeBand filtering dan QA konten |
| Data anak berlebihan | Risiko privasi | Data minimization dan access control |

---

# 19. Prioritas MVP

## P0 — Harus ada untuk rilis adaptive pertama

- Access flow existing tetap berfungsi.
- Student onboarding jenjang dan kelas.
- Dashboard tiga pilihan game.
- Student profile tersimpan server-side.
- Curriculum/competency/level model.
- Question bank terstruktur.
- Game session dan answer attempts server-side.
- Adaptive mastery engine.
- Remedial routing.
- Level unlock.
- Matematika dan English termasuk Spelling.
- Progres lintas perangkat.
- Admin minimal untuk konten dan level.
- QA security dan regression.

## P1 — Setelah fondasi stabil

- Coding / Logic Game.
- Tutor dashboard.
- Progress report per kompetensi.
- XP ledger dan achievement server-side.
- Resume sesi lintas perangkat yang lebih lengkap.
- Import/export konten.

## P2 — Pengembangan berikutnya

- Placement check.
- Listening game dengan audio.
- Sentence builder.
- Parent view / laporan orang tua.
- Rekomendasi latihan mingguan.
- Analitik agregat.
- Kurikulum dan konten SMP lebih luas.

Catatan: Coding / Logic tetap menjadi kategori pada dashboard target produk. Jika perlu rilis bertahap, tampilkan sebagai “Segera hadir” sampai modul dan kontennya lolos QA; jangan tampilkan seolah-olah sudah dapat dimainkan.

---

# 20. Definition of Done

Satu fitur dinyatakan selesai jika:
1. Requirement dan acceptance criteria terpenuhi.
2. UI responsif dan sesuai jenjang.
3. Validasi input berjalan di server.
4. Authorization diuji.
5. Data tersimpan dan dapat dibaca ulang.
6. Error state dan loading state tersedia.
7. Unit/integration/E2E test relevan lulus.
8. Tidak merusak fitur existing.
9. Dokumentasi diperbarui.
10. Perubahan dapat di-rollback.

---

# 21. Instruksi untuk Coding Agent

**Tujuan:** migrasikan repository `yori1201/RUMBELA-GAMES` menjadi adaptive learning game platform sesuai PRD ini.

Aturan kerja wajib:

1. Mulai dari branch baru, jangan langsung mengubah `main`.
2. Audit source aktual dan commit yang menjadi baseline sebelum coding.
3. Jangan mengasumsikan README selalu sesuai implementasi; source code adalah referensi kondisi teknis.
4. Buat implementation plan dan daftar file yang akan disentuh sebelum perubahan besar.
5. Pertahankan logo, maskot Bela, sound, animasi, dan mode game yang masih relevan.
6. Jangan melakukan rewrite total atau refactor luas tanpa kebutuhan yang terukur.
7. Jangan menghapus access code flow sebelum mekanisme pengganti terbukti kompatibel.
8. Semua progres akademik, koreksi jawaban, mastery, XP, dan unlock harus authoritative di server.
9. Jangan menanam secret, admin password, atau aturan keamanan di client.
10. Jangan menggunakan AI generatif untuk koreksi jawaban atau keputusan mastery pada MVP.
11. Gunakan migration yang aman, backup sebelum perubahan schema, dan jangan menjalankan `db:push --accept-data-loss` pada production.
12. Implementasikan per phase dengan test dan checkpoint.
13. Buat feature flag untuk transisi alur lama ke alur baru.
14. Setiap phase harus menghasilkan ringkasan file berubah, keputusan teknis, test yang dijalankan, hasil, dan risiko tersisa.
15. Jangan deploy production atau mengubah data production tanpa persetujuan eksplisit pemilik produk.

## Deliverables coding agent

- Audit teknis final.
- Architecture decision record.
- Database migration.
- API implementation.
- Student onboarding dan dashboard.
- Adaptive engine.
- Integrasi Math dan English/Spelling.
- Coding/Logic module.
- Tutor/admin screens sesuai prioritas.
- Unit, integration, dan E2E tests.
- Migration guide.
- Deployment guide.
- Rollback guide.
- Updated README.

---

# 22. Asumsi dan Hal yang Perlu Divalidasi

Bagian ini sengaja dipisahkan agar asumsi tidak dianggap sebagai fakta.

| Item | Status | Catatan |
|---|---|---|
| Next.js 16 + TypeScript + Tailwind + Prisma | Terverifikasi dari repository | Lihat `package.json` |
| Prisma schema saat ini memakai SQLite | Terverifikasi dari repository | Lihat `prisma/schema.prisma` |
| Progress store menggunakan Zustand/localStorage | Terverifikasi dari README dan `game-store.ts` | Detail runtime perlu diuji |
| Access code/device gate tersedia | Terverifikasi dari source | Perlu review security lebih lanjut |
| Math dan English game tersedia | Terverifikasi dari source | Perlu regression test |
| Coding/Logic belum tampak sebagai modul game di inventaris source yang dibaca | Temuan audit awal | Perlu full tree/code audit sebelum implementasi |
| PostgreSQL adalah target database production | Rekomendasi | Konfirmasi provider deployment dan environment |
| Threshold mastery awal 80% | Usulan konfigurasi | Perlu kalibrasi tutor |
| Jenjang SMA | Future-ready | Aktifkan hanya jika konten siap |
| Tutor dashboard | Scope produk yang direkomendasikan | Role dan penugasan perlu disepakati |
| Login tetap memakai access code | Keputusan MVP sementara | Evaluasi kebutuhan akun permanen dan lintas perangkat |

---

# 23. Sumber Audit

Repository dan file yang ditinjau:
- Repository: https://github.com/yori1201/RUMBELA-GAMES
- `README.md`
- `package.json`
- `src/app/page.tsx`
- `src/components/game/AccessGate.tsx`
- `src/components/game/HomeScreen.tsx`
- `src/components/game/AdminPanel.tsx`
- `src/components/game/MathMode.tsx`
- `src/components/game/SpellMode.tsx`
- `src/lib/access-store.ts`
- `src/lib/game-store.ts`
- `src/lib/game-data.ts`
- `src/lib/math-data.ts`
- `prisma/schema.prisma`

**Catatan audit:** PRD ini dirancang berdasarkan source yang berhasil ditinjau. Sebelum implementasi, coding agent tetap wajib memeriksa seluruh API route, environment, deployment provider, test suite, dan perilaku aplikasi yang berjalan.

---

**Arah akhir produk:** Rumbela Games bukan lagi sekadar kumpulan kuis dengan skor, melainkan platform permainan belajar yang menyimpan perjalanan belajar tiap anak, memahami kompetensi yang sudah dikuasai, dan memilih tantangan berikutnya secara bertanggung jawab.
