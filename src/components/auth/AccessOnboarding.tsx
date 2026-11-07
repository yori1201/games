import React, { useState } from 'react';
import { EducationStage, StudentProfile } from '../../types/game';
import { sound } from '../../lib/audio';
import { MascotBelaVideo } from '../mascot/MascotBelaVideo';
import { verifyAccessAndSignIn } from '../../lib/data-service';
import { auth } from '../../lib/firebase';
import { KeyRound, Sparkles, User, GraduationCap, Check, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface AccessOnboardingProps {
  onSuccess: (student: StudentProfile) => void;
}

const AVATARS = ['🦊', '🐱', '🐻', '🐼', '🐨', '🐰', '🦁', '🐯'];

const STAGE_GRADES: Record<EducationStage, { code: string; label: string }[]> = {
  PAUD: [{ code: 'PAUD_A', label: 'PAUD' }],
  TK: [
    { code: 'TK_A', label: 'TK A (Usia 4-5)' },
    { code: 'TK_B', label: 'TK B (Usia 5-6)' },
  ],
  SD: [
    { code: 'SD_1', label: 'SD Kelas 1' },
    { code: 'SD_2', label: 'SD Kelas 2' },
    { code: 'SD_3', label: 'SD Kelas 3' },
    { code: 'SD_4', label: 'SD Kelas 4' },
    { code: 'SD_5', label: 'SD Kelas 5' },
    { code: 'SD_6', label: 'SD Kelas 6' },
  ],
  SMP: [
    { code: 'SMP_7', label: 'SMP Kelas 7' },
    { code: 'SMP_8', label: 'SMP Kelas 8' },
    { code: 'SMP_9', label: 'SMP Kelas 9' },
  ],
  SMA: [{ code: 'SMA_10', label: 'SMA Kelas 10' }],
};

export const AccessOnboarding: React.FC<AccessOnboardingProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'ACCESS' | 'PROFILE'>('ACCESS');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [stage, setStage] = useState<EducationStage>('SD');
  const [gradeCode, setGradeCode] = useState('SD_2');
  const [avatarKey, setAvatarKey] = useState('🦊');

  const handleQuickCode = (code: string) => {
    sound.playClick();
    setAccessCode(code);
    setErrorMsg('');
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMsg('Masukkan kode akses bimbel Rumbela');
      return;
    }

    sound.playClick();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Make sure we have an anonymous auth user first
      if (!auth.currentUser) {
        // The auth-context should have signed in anonymously by now,
        // but if not, the verifyAccessAndSignIn will throw.
        throw new Error('Autentikasi belum siap. Tunggu sebentar lalu coba lagi.');
      }

      const { student, isNewUser } = await verifyAccessAndSignIn({
        accessCode,
      });

      if (isNewUser && !student.displayName) {
        // New student without pre-filled profile → ask for profile
        setStep('PROFILE');
        return;
      }

      // Existing student or pre-registered → go straight in
      sound.playCorrect();
      onSuccess(student);
    } catch (err) {
      console.error('[AccessOnboarding] submit failed:', err);
      setErrorMsg(
        err instanceof Error && err.message.includes('Not authenticated')
          ? 'Sedang menyiapkan sesi... coba lagi dalam 2 detik.'
          : 'Terjadi kesalahan saat verifikasi kode. Coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Harap masukkan nama panggilanmu');
      return;
    }

    sound.playCorrect();
    setIsSubmitting(true);

    try {
      const { student } = await verifyAccessAndSignIn({
        accessCode,
        displayName,
        educationStage: stage,
        gradeCode,
        avatarKey,
      });
      onSuccess(student);
    } catch (err) {
      console.error('[AccessOnboarding] profile submit failed:', err);
      setErrorMsg('Gagal menyimpan profil. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto min-h-screen px-4 py-8 flex flex-col justify-center items-center text-white select-none">
      {/* Official 3D Animated Mascot Bela Header */}
      <div className="mb-4 relative flex flex-col items-center">
        <MascotBelaVideo size={180} interactive={true} showAudioControl={true} />
      </div>

      {step === 'ACCESS' ? (
        /* STEP 1: ACCESS CODE GATE */
        <div className="w-full bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl flex flex-col items-center animate-fadeIn">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>RUMAH BELAJAR ANAK (RUMBELA)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
            RUMBELA GAMES
          </h1>
          <p className="text-xs text-white/70 text-center mt-1 mb-6">
            Adaptive Level-Based Learning Game · Rumah Belajar Anak
          </p>

          <form onSubmit={handleAccessSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Kode Akses Rumbela:</span>
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Contoh: RUMBELA-SISWA"
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm font-mono font-bold text-white placeholder-white/40 focus:outline-none focus:border-amber-400 uppercase tracking-widest text-center"
                disabled={isSubmitting}
              />
              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk Petualangan</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo QA Pills */}
          <div className="mt-6 pt-5 border-t border-white/10 w-full flex flex-col items-center">
            <span className="text-[11px] text-white/50 mb-2">Pilih Cepat untuk QA & Review:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickCode('RUMBELA-SISWA')}
                className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-mono font-semibold hover:bg-cyan-500/30 border border-cyan-400/30 transition-colors"
              >
                RUMBELA-SISWA
              </button>
              <button
                type="button"
                onClick={() => handleQuickCode('RUMBELA-TUTOR')}
                className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold hover:bg-purple-500/30 border border-purple-400/30 transition-colors"
              >
                RUMBELA-TUTOR
              </button>
              <button
                type="button"
                onClick={() => handleQuickCode('RUMBELA-ADMIN')}
                className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-semibold hover:bg-amber-500/30 border border-amber-400/30 transition-colors"
              >
                RUMBELA-ADMIN
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-3 text-center max-w-xs">
              Kode di atas harus didaftarkan dulu di Firebase (lihat <strong>DEPLOYMENT.md</strong> bagian "Seed Access Codes") sebelum bisa dipakai login.
            </p>
          </div>
        </div>
      ) : (
        /* STEP 2: STUDENT PROFILE ONBOARDING */
        <div className="w-full bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl flex flex-col animate-fadeIn">
          <div className="text-center mb-5">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30">
              Profil Siswa Baru
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-2">Lengkapi Identitasmu</h2>
            <p className="text-xs text-white/70 mt-1">
              Data ini membantu mesin adaptif menyiapkan soal yang sesuai tingkatanmu.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Nama Panggilan:</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Misal: Alif, Kayla, Kevin"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-amber-400"
                disabled={isSubmitting}
              />
              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* Avatar Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/80">Pilih Karakter Avatarmu:</label>
              <div className="flex items-center justify-between gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAvatarKey(av);
                    }}
                    className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-transform cursor-pointer border ${
                      avatarKey === av
                        ? 'bg-amber-400 border-amber-200 scale-110 shadow-md'
                        : 'bg-white/10 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Education Stage Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Jenjang Pendidikan:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['PAUD', 'TK', 'SD', 'SMP'] as EducationStage[]).map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setStage(stg);
                      setGradeCode(STAGE_GRADES[stg][0].code);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      stage === stg
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                        : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Grade Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-white/80">Pilih Kelas:</label>
              <select
                value={gradeCode}
                onChange={(e) => setGradeCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              >
                {STAGE_GRADES[stage].map((gr) => (
                  <option key={gr.code} value={gr.code}>
                    {gr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Selesai & Buka Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
