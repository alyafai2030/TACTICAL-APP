import React, { useState, useMemo } from 'react';
import { ArrowRight, Search, Filter, CheckCircle2, Clock } from 'lucide-react';
import { Stage, Shooter, ShooterScore, PageId } from '../types';
import { normalizeArabic } from '../utils/storage';

interface StageDetailViewProps {
  currentStage: Stage | null;
  shooters: Shooter[];
  scores: ShooterScore[];
  onSelectShooter: (shooter: Shooter) => void;
  onNavigate: (page: PageId) => void;
}

export const StageDetailView: React.FC<StageDetailViewProps> = ({
  currentStage,
  shooters,
  scores,
  onSelectShooter,
  onNavigate,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const teams = useMemo(() => {
    return Array.from(new Set(shooters.map((s) => s.team).filter(Boolean)));
  }, [shooters]);

  if (!currentStage) {
    return (
      <div className="min-h-screen p-6 text-center text-slate-300">
        <p>لم يتم اختيار مرحلة.</p>
        <button
          onClick={() => onNavigate('enter-scores')}
          className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl"
        >
          العودة لاختيار المرحلة
        </button>
      </div>
    );
  }

  // Calculate scores on this stage
  const stageScores = scores.filter((s) => s.stageId === currentStage.name);
  const maxHitFactor = stageScores.length > 0
    ? Math.max(...stageScores.map((sc) => sc.hitFactor || 0))
    : 0;

  // Filter shooters
  const filtered = shooters.filter((sh) => {
    const matchTeam = !selectedTeam || sh.team === selectedTeam;
    const matchSearch =
      !searchQuery ||
      normalizeArabic(sh.name).includes(normalizeArabic(searchQuery)) ||
      sh.number.includes(searchQuery);
    return matchTeam && matchSearch;
  });

  const completedCount = stageScores.length;

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-3">
        <button
          onClick={() => onNavigate('enter-scores')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">المراحل</span>
        </button>
        <div className="text-center">
          <h1 className="text-base font-extrabold text-white truncate max-w-[190px]">
            {currentStage.name}
          </h1>
          <span className="text-xs text-amber-400 font-medium">
            الأهداف: {currentStage.targets} · النقاط: {currentStage.targets * 10}
          </span>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300 border border-slate-700 tabular-nums">
          {completedCount}/{shooters.length}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الرقم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Team filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full py-2 px-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">جميع الفرق ({shooters.length} رامي)</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t} ({shooters.filter((s) => s.team === t).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shooters List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
            لا يوجد رماة يطابقون البحث
          </div>
        ) : (
          filtered.map((shooter) => {
            const scoreItem = stageScores.find((sc) => sc.shooterId === shooter.id);
            const isScored = !!scoreItem;
            const hf = scoreItem?.hitFactor ?? 0;
            const perc = maxHitFactor > 0 ? ((hf / maxHitFactor) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={shooter.id}
                onClick={() => onSelectShooter(shooter)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] shadow-sm ${
                  isScored
                    ? 'bg-slate-800/90 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-slate-800/60 border-slate-700/60 hover:border-amber-500/50'
                }`}
              >
                <div className="flex-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base leading-tight">
                      {shooter.name}
                    </span>
                    {isScored && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    {shooter.rank && <span>{shooter.rank}</span>}
                    {shooter.rank && <span>·</span>}
                    <span>رقم: <strong className="text-slate-200 tabular-nums">{shooter.number || '-'}</strong></span>
                    <span>·</span>
                    <span className="text-amber-400/90 font-medium">{shooter.team}</span>
                  </div>
                </div>

                <div className="text-left shrink-0 pl-1">
                  {isScored ? (
                    <div>
                      <div className="text-sm font-extrabold text-emerald-400 tabular-nums">
                        HF: {hf.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium tabular-nums">
                        {perc}% · {scoreItem.time}ث
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>تسجيل</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
