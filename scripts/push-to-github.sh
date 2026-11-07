#!/usr/bin/env bash
# ============================================================
# RUMBELA GAMES — Push to GitHub Script
# ============================================================
# Script ini akan:
#   1. Memastikan ada repo lokal git (kalau belum, bikin)
#   2. Meminta Personal Access Token (PAT) dari Anda
#   3. Push kode ke github.com/yori1201/games
#
# CARA PAKAI (di Terminal/PowerShell):
#   chmod +x scripts/push-to-github.sh   # sekali saja, di Mac/Linux
#   ./scripts/push-to-github.sh
#
# ATAU jalankan dengan bash:
#   bash scripts/push-to-github.sh
#
# Script ini aman — PAT hanya disimpan di memori sementara,
# tidak ditulis ke file manapun.
# ============================================================
set -e

REPO_OWNER="yori1201"
REPO_NAME="games"
REPO_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "============================================================"
echo "🌱 RUMBELA GAMES — Push ke GitHub"
echo "============================================================"
echo ""
echo "Repo target: $REPO_URL"
echo "Folder: $PROJECT_ROOT"
echo ""

# === Step 1: Pastikan git sudah terinisialisasi ===
if [ ! -d ".git" ]; then
  echo "📁 Inisialisasi git repository lokal..."
  git init -q
  git config user.email "deploy@rumbela.id"
  git config user.name "Rumbela Deploy"
  git add -A
  git commit -q -m "production-ready v1.0: Firebase + Vercel + adaptive engine + grid nav"
  echo "✅ Git repository siap."
else
  echo "✅ Git repository sudah ada."
  # Cek apakah ada perubahan yang belum di-commit
  if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Commit perubahan terbaru..."
    git add -A
    git commit -q -m "update: perbaikan terbaru" || true
  fi
fi

echo ""
echo "📊 Status repo lokal:"
git log --oneline | head -3
echo ""

# === Step 2: Cek apakah remote sudah ada ===
REMOTE_EXISTS=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_EXISTS" ]; then
  echo "🔗 Menambahkan remote origin..."
  git remote add origin "$REPO_URL"
else
  echo "🔗 Remote origin sudah ada: $REMOTE_EXISTS"
  # Update kalau beda
  if [ "$REMOTE_EXISTS" != "$REPO_URL" ]; then
    git remote set-url origin "$REPO_URL"
    echo "   (diupdate ke $REPO_URL)"
  fi
fi

echo ""
echo "============================================================"
echo "🔐 DIBUTUHKAN: Personal Access Token (PAT) GitHub"
echo "============================================================"
echo ""
echo "Karena repo '$REPO_NAME' bersifat PRIVATE, Anda perlu PAT"
echo "untuk otentikasi. PAT = pengganti password untuk akses via Terminal."
echo ""
echo "📋 CARA BUAT PAT (5 menit):"
echo "   1. Buka: https://github.com/settings/tokens?type=beta"
echo "   2. Klik 'Generate new token (fine-grained)'"
echo "   3. Isi:"
echo "      - Token name: rumbela-push"
echo "      - Expiration: 7 days"
echo "      - Repository access: Only select repositories"
echo "        → Pilih: yori1201/games"
echo "      - Permissions → Repository permissions:"
echo "        → Contents: Read and write"
echo "        → Metadata: Read-only (otomatis)"
echo "   4. Klik 'Generate token'"
echo "   5. COPY string token (mulai dengan github_pat_...)"
echo "      PAT HANYA MUNCUL SEKALI! Kalau hilang, generate ulang."
echo ""
echo "⚠️  CATATAN KEAMANAN:"
echo "   - Token ini akan disimpan di keychain git Anda (credential helper)"
echo "   - Setelah selesai push, Anda bisa revoke token dari halaman yang sama"
echo "   - JANGAN pernah share token ini ke siapapun"
echo ""
read -s -p "Paste PAT Anda di sini (tidak akan tampil): " PAT
echo ""
echo ""

if [ -z "$PAT" ]; then
  echo "❌ PAT kosong. Push dibatalkan."
  exit 1
fi

# === Step 3: Set remote URL dengan PAT ===
AUTH_URL="https://x-access-token:${PAT}@github.com/${REPO_OWNER}/${REPO_NAME}.git"
git remote set-url origin "$AUTH_URL"

echo "🚀 Push ke GitHub..."
echo ""

# === Step 4: Pull dulu (kalau repo sudah ada isinya, agar tidak konflik) ===
echo "📥 Cek isi repo remote..."
if git pull origin main --allow-unrelated-histories --no-edit 2>/dev/null; then
  echo "✅ Pull berhasil (merge perubahan remote)."
else
  echo "ℹ️  Tidak ada yang di-pull (kemungkinan repo masih kosong atau baru)."
fi
echo ""

# === Step 5: Push ===
if git push -u origin main 2>&1; then
  echo ""
  echo "============================================================"
  echo "✅ PUSH BERHASIL!"
  echo "============================================================"
  echo ""
  echo "🎉 Kode sudah ada di: $REPO_URL"
  echo ""
  echo "Langkah selanjutnya:"
  echo "   1. Buka Vercel: https://vercel.com/dashboard"
  echo "   2. New Project → Import repo 'yori1201/games'"
  echo "   3. Set Environment Variables (lihat DEPLOYMENT.md)"
  echo "   4. Klik Deploy!"
  echo ""
  echo "🔐 Untuk keamanan, sekarang HAPUS PAT dari URL remote:"
  echo "   (script ini akan otomatis mereset URL ke versi tanpa PAT)"
  git remote set-url origin "$REPO_URL"
  echo "✅ Remote URL direset ke versi aman (tanpa PAT)."
  echo ""
  echo "💡 Setelah deploy sukses di Vercel, ada baiknya Anda REVOKE PAT"
  echo "   dari https://github.com/settings/tokens?type=beta (cari 'rumbela-push', klik Delete)."
else
  echo ""
  echo "❌ PUSH GAGAL. Kemungkinan penyebab:"
  echo "   • PAT salah atau sudah expired"
  echo "   • PAT tidak punya permission 'Contents: Read and write'"
  echo "   • Repository access tidak include 'yori1201/games'"
  echo "   • Branch 'main' sudah ada isinya dengan konflik"
  echo ""
  echo "Solusi:"
  echo "   1. Generate PAT baru dengan permission yang benar"
  echo "   2. Jalankan script ini lagi"
  echo "   3. Kalau masih gagal, kirim screenshot error ke AI assistant"
  git remote set-url origin "$REPO_URL"
  exit 1
fi
