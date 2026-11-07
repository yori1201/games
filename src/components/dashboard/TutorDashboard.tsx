import React, { useState } from 'react';
import { StudentProfile, StudentLevelProgress, SubjectCode, EducationStage } from '../../types/game';
import { sound } from '../../lib/audio';
import { Users, Filter, Star, Zap, Award, Unlock, Search, ArrowLeft, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface TutorDashboardProps {
  students: StudentProfile[];
  progressList: StudentLevelProgress[];
  onManualUnlock: (studentId: string, subjectCode: SubjectCode, levelNumber: number, reason: string) => void;
  onBackToApp: () => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  students,
  progressList,
  onManualUnlock,
  onBackToApp,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [overrideModal, setOverrideModal] = useState<{ open: boolean; subject: SubjectCode; level: number } | null>(null);
  const [overrideReason, setOverrideReason] = useState('Tutor mengkonfirmasi penguasaan kompetensi di kelas les');

  const filteredStudents = students.filter((s) => {
    const matchStage = selectedStage === 'ALL' || s.educationStage === selectedStage;
    const matchSearch = s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.accessCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStage && matchSearch;
  });

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const studentProgress = progressList.filter((p) => p.studentId === activeStudent?.id);

  const getSubjectBreakdown = (subject: SubjectCode) => {
    const list = studentProgress.filter((p) => p.subjectCode === subject);
    const mastered = list.filter((p) => p.status === 'MASTERED').length;
    const inProgress = list.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'AVAILABLE').length;
    const needsPractice = list.filter((p) => (p.masteryScore || 0) < 80 && (p.attemptCount || 0) > 0).length;
    const avgScore = list.length > 0 ? Math.round(list.reduce((acc, p) => acc + (p.masteryScore || 0), 0) / list.length) : 0;
    return { mastered, inProgress, needsPractice, avgScore, list };
  };

  const handleConfirmUnlock = () => {
    if (!overrideModal || !activeStudent) return;
    sound.playCorrect();
    onManualUnlock(activeStudent.id, overrideModal.subject, overrideModal.level, overrideReason);
    setOverrideModal(null);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6 text-white select-none">
      {/* HEADER BAR */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/15 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBackToApp();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 transition-all border border-white/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Game</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Dashboard Tutor & Pengelola Rumbela</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Authoritative Analytics
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Pantau penguasaan kompetensi, pola kesalahan, dan kemajuan adaptif siswa secara real-time
            </p>
          </div>
        </div>

        {/* Filter by Education Stage */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/15 text-xs">
            {['ALL', 'TK', 'SD', 'SMP'].map((stg) => (
              <button
                key={stg}
                onClick={() => {
                  sound.playClick();
                  setSelectedStage(stg);
                }}
                className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                  selectedStage === stg ? 'bg-amber-400 text-slate-950 shadow' : 'text-white/80 hover:text-white'
                }`}
              >
                {stg === 'ALL' ? 'Semua Jenjang' : stg}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* TWO COLUMN WORKSPACE: Student Roster (Left) & Competency Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Student Roster */}
        <aside className="lg:col-span-4 flex flex-col gap-3 bg-slate-900/70 backdrop-blur-md p-4 rounded-3xl border border-white/15 shadow-xl h-fit">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Daftar Siswa ({filteredStudents.length})</span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau kode akses..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Students List */}
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredStudents.map((s) => {
              const isSelected = s.id === activeStudent?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedStudentId(s.id);
                  }}
                  className={`p-3 rounded-2xl text-left transition-all flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.avatarKey || '🦊'}</span>
                    <div>
                      <p className="text-xs font-bold leading-tight">{s.displayName}</p>
                      <p className="text-[10px] text-white/70">
                        {s.gradeCode.replace('_', ' ')} · Kode: <span className="font-mono">{s.accessCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 fill-amber-300" />
                      {s.stars || 0}
                    </span>
                    <span className="text-[10px] text-white/60 font-mono">{s.xp || 0} XP</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT COLUMN: Competency Mastery Matrix & Recommendations */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {activeStudent ? (
            <>
              {/* Active Student Overview Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-3xl border border-white/20 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-4xl">
                    {activeStudent.avatarKey || '🦊'}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{activeStudent.displayName}</h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      Jenjang: <span className="text-amber-300 font-bold">{activeStudent.educationStage} ({activeStudent.gradeCode})</span> · Streak: <span className="text-orange-400 font-bold">{activeStudent.streak} Hari</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-center">
                    <span className="text-[10px] text-white/60 uppercase block">Total XP</span>
                    <span className="text-sm font-bold font-mono text-cyan-300">{activeStudent.xp}</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-center">
                    <span className="text-[10px] text-white/60 uppercase block">Total Bintang</span>
                    <span className="text-sm font-bold font-mono text-amber-300">{activeStudent.stars}</span>
                  </div>
                </div>
              </div>

              {/* 3 Subject Mastery Breakdown */}
              {(['MATH', 'ENGLISH', 'LOGIC'] as SubjectCode[]).map((subj) => {
                const breakdown = getSubjectBreakdown(subj);
                const subjTitle = subj === 'MATH' ? 'Matematika' : subj === 'ENGLISH' ? 'English Quest' : 'Coding & Logika';

                return (
                  <div
                    key={subj}
                    className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-white/15 shadow-xl flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <h4 className="text-base font-bold">{subjTitle}</h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono">
                          Rata-rata Mastery: {breakdown.avgScore}%
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{breakdown.mastered} Mastered</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{breakdown.needsPractice} Perlu Latihan</span>
                        </span>
                      </div>
                    </div>

                    {/* Level Grid (1 to 10) for this Subject */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvlNum) => {
                        const lvlProg = breakdown.list.find((p) => p.levelNumber === lvlNum);
                        const isMastered = lvlProg?.status === 'MASTERED';
                        const isAvailable = lvlProg?.status === 'AVAILABLE' || lvlNum === 1;

                        return (
                          <div
                            key={lvlNum}
                            className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                              isMastered
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                                : isAvailable
                                ? 'bg-blue-500/15 border-blue-400/40 text-blue-200'
                                : 'bg-white/5 border-white/10 text-white/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black font-mono">Level {lvlNum}</span>
                              {isMastered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>

                            <div className="my-2">
                              <div className="text-[10px] text-white/80">
                                {isMastered ? 'Mastery 100%' : isAvailable ? 'Terbuka' : 'Terkunci'}
                              </div>
                              <div className="text-[10px] font-mono text-amber-300">
                                {lvlProg?.stars ? `${lvlProg.stars} Bintang` : '0 Bintang'}
                              </div>
                            </div>

                            {!isMastered && (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  setOverrideModal({ open: true, subject: subj, level: lvlNum });
                                }}
                                className="mt-1 w-full py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/90 flex items-center justify-center gap-1 transition-colors border border-white/15 cursor-pointer"
                                title="Buka manual level untuk siswa"
                              >
                                <Unlock className="w-3 h-3 text-amber-300" />
                                <span>Buka</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-8 text-center text-white/60 bg-white/5 rounded-3xl border border-white/10">
              Pilih siswa dari daftar untuk melihat detail penguasaan kompetensi.
            </div>
          )}
        </main>
      </div>

      {/* MANUAL UNLOCK OVERRIDE MODAL */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-300">
              <Unlock className="w-5 h-5" />
              <span>Konfirmasi Pembukaan Level Manual</span>
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Anda akan membuka secara manual <strong>{overrideModal.subject} Level {overrideModal.level}</strong> untuk siswa <strong>{activeStudent?.displayName}</strong>.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">Alasan Pembukaan (Audit Log):</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold hover:bg-white/20 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmUnlock}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs font-bold shadow-lg hover:from-amber-300 hover:to-orange-400 transition-all cursor-pointer"
              >
                Buka Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
