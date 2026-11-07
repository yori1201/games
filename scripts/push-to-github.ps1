# ============================================================
# RUMBELA GAMES — Push to GitHub (Windows PowerShell Version)
# ============================================================
# Script ini akan push kode ke github.com/yori1201/games
#
# CARA PAKAI di Windows:
#   1. Buka PowerShell (Win+X → Windows PowerShell)
#   2. cd ke folder proyek, contoh:
#      cd "$env:USERPROFILE\Downloads\rumbela-games"
#   3. Jalankan:
#      .\scripts\push-to-github.ps1
#
# Kalau muncul error "execution of scripts is disabled", jalankan dulu:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# ============================================================

$RepoOwner = "yori1201"
$RepoName = "games"
$RepoUrl = "https://github.com/$RepoOwner/$RepoName.git"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $ProjectRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Push ke GitHub" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repo target: $RepoUrl"
Write-Host "Folder: $ProjectRoot"
Write-Host ""

# === Step 1: Pastikan git sudah terinisialisasi ===
if (-not (Test-Path ".git")) {
    Write-Host "Inisialisasi git repository lokal..." -ForegroundColor Yellow
    git init -q
    git config user.email "deploy@rumbela.id"
    git config user.name "Rumbela Deploy"
    git add -A
    git commit -q -m "production-ready v1.0: Firebase + Vercel + adaptive engine + grid nav"
    Write-Host "Git repository siap." -ForegroundColor Green
} else {
    Write-Host "Git repository sudah ada." -ForegroundColor Green
    if (git status --porcelain) {
        Write-Host "Commit perubahan terbaru..." -ForegroundColor Yellow
        git add -A
        git commit -q -m "update: perbaikan terbaru" 2>$null
    }
}

Write-Host ""
Write-Host "Status repo lokal:" -ForegroundColor Cyan
git log --oneline | Select-Object -First 3
Write-Host ""

# === Step 2: Cek remote ===
$remoteExists = git remote get-url origin 2>$null
if (-not $remoteExists) {
    Write-Host "Menambahkan remote origin..." -ForegroundColor Yellow
    git remote add origin $RepoUrl
} else {
    Write-Host "Remote origin sudah ada: $remoteExists" -ForegroundColor Green
    if ($remoteExists -ne $RepoUrl) {
        git remote set-url origin $RepoUrl
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DIBUTUHKAN: Personal Access Token (PAT) GitHub" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Karena repo '$RepoName' PRIVATE, Anda perlu PAT untuk otentikasi."
Write-Host ""
Write-Host "CARA BUAT PAT (5 menit):" -ForegroundColor Yellow
Write-Host "   1. Buka: https://github.com/settings/tokens?type=beta"
Write-Host "   2. Klik 'Generate new token (fine-grained)'"
Write-Host "   3. Isi:"
Write-Host "      - Token name: rumbela-push"
Write-Host "      - Expiration: 7 days"
Write-Host "      - Repository access: Only select repositories"
Write-Host "        -> Pilih: yori1201/games"
Write-Host "      - Permissions -> Repository permissions:"
Write-Host "        -> Contents: Read and write"
Write-Host "        -> Metadata: Read-only (otomatis)"
Write-Host "   4. Klik 'Generate token'"
Write-Host "   5. COPY string token (mulai dengan github_pat_...)"
Write-Host ""
Write-Host "CATATAN KEAMANAN:" -ForegroundColor Yellow
Write-Host "   - Setelah selesai push, REVOKE PAT dari halaman yang sama"
Write-Host "   - JANGAN share token ke siapapun"
Write-Host ""

$pat = Read-Host "Paste PAT Anda di sini" -AsSecureString
$patPlain = [System.Net.NetworkCredential]::new("", $pat).Password

if (-not $patPlain) {
    Write-Host "PAT kosong. Push dibatalkan." -ForegroundColor Red
    exit 1
}

# === Step 3: Set remote URL dengan PAT ===
$authUrl = "https://x-access-token:$patPlain@github.com/$RepoOwner/$RepoName.git"
git remote set-url origin $authUrl

Write-Host ""
Write-Host "Push ke GitHub..." -ForegroundColor Cyan
Write-Host ""

# === Step 4: Pull dulu ===
Write-Host "Cek isi repo remote..." -ForegroundColor Yellow
git pull origin main --allow-unrelated-histories --no-edit 2>$null
Write-Host ""

# === Step 5: Push ===
$pushResult = git push -u origin main 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "PUSH BERHASIL!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Kode sudah ada di: $RepoUrl" -ForegroundColor Green
    Write-Host ""
    Write-Host "Langkah selanjutnya:" -ForegroundColor Cyan
    Write-Host "   1. Buka Vercel: https://vercel.com/dashboard"
    Write-Host "   2. New Project -> Import repo 'yori1201/games'"
    Write-Host "   3. Set Environment Variables (lihat DEPLOYMENT.md)"
    Write-Host "   4. Klik Deploy!"
    Write-Host ""
    Write-Host "Reset remote URL ke versi aman (tanpa PAT)..." -ForegroundColor Yellow
    git remote set-url origin $RepoUrl
    Write-Host "Remote URL direset." -ForegroundColor Green
    Write-Host ""
    Write-Host "Setelah deploy sukses di Vercel, REVOKE PAT dari:" -ForegroundColor Yellow
    Write-Host "   https://github.com/settings/tokens?type=beta"
} else {
    Write-Host ""
    Write-Host "PUSH GAGAL. Kemungkinan penyebab:" -ForegroundColor Red
    Write-Host "   - PAT salah atau sudah expired"
    Write-Host "   - PAT tidak punya permission 'Contents: Read and write'"
    Write-Host "   - Repository access tidak include 'yori1201/games'"
    Write-Host ""
    Write-Host "Solusi: Generate PAT baru dengan permission yang benar, lalu jalankan lagi."
    git remote set-url origin $RepoUrl
    exit 1
}
