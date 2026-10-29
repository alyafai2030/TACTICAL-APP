import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Trash2, 
  Share2, 
  FileText, 
  Trophy, 
  Filter, 
  Calendar 
} from 'lucide-react';
import { Stage, Shooter, ShooterScore, PageId } from '../types';
import { exportResultsCSV } from '../utils/excel';
import { ConfirmModal } from '../components/ConfirmModal';

interface ResultsViewProps {
  stages: Stage[];
  shooters: Shooter[];
  scores: ShooterScore[];
  onClearAllScores: () => void;
  onNavigate: (page: PageId) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  stages,
  shooters,
  scores,
  onClearAllScores,
  onNavigate,
  showToast,
}) => {
  const [selectedStageName, setSelectedStageName] = useState<string>('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Active stage object
  const activeStage = useMemo(() => {
    return stages.find((s) => s.name === selectedStageName) || null;
  }, [stages, selectedStageName]);

  // Filtered scores
  const filteredScores = useMemo(() => {
    if (!selectedStageName) return scores;
    return scores.filter((s) => s.stageId === selectedStageName);
  }, [scores, selectedStageName]);

  // Best score per shooter on this filter, sorted by Hit Factor descending
  const calculatedRows = useMemo(() => {
    const map = new Map<string, ShooterScore>();
    filteredScores.forEach((item) => {
      const key = `${item.shooterId}-${item.stageId}`;
      const prev = map.get(key);
      if (!prev || (item.hitFactor || 0) > (prev.hitFactor || 0)) {
        map.set(key, item);
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => (b.hitFactor || 0) - (a.hitFactor || 0));

    // Highest HF in current view
    const maxHf = list.length > 0 ? Math.max(...list.map((s) => s.hitFactor || 0)) : 0;

    return list.map((sc, idx) => {
      const shooter = shooters.find((sh) => sh.id === sc.shooterId);
      const stage = stages.find((stg) => stg.name === sc.stageId);
      const stageMaxPoints = stage ? stage.targets * 10 : 50;

      const hf = sc.hitFactor || 0;
      const percentageNum = maxHf > 0 ? (hf / maxHf) * 100 : 0;
      const percentageStr = percentageNum.toFixed(2);
      const finalResult = ((percentageNum * stageMaxPoints) / 100).toFixed(1);

      return {
        rank: idx + 1,
        shooterId: sc.shooterId,
        shooterName: shooter?.name || 'رامي غير معروف',
        shooterRank: shooter?.rank || '',
        shooterNumber: shooter?.number || '',
        team: shooter?.team || '',
        stageName: sc.stageId,
        time: sc.time,
        totalScore: sc.totalScore,
        hitFactor: hf.toFixed(2),
        percentage: percentageStr,
        result: finalResult,
      };
    });
  }, [filteredScores, shooters, stages]);

  const handleShareOrExport = () => {
    if (calculatedRows.length === 0) {
      showToast('لا توجد نتائج لتصديرها أو مشاركتها!', 'info');
      return;
    }

    try {
      exportResultsCSV(calculatedRows, selectedStageName || 'جميع_المراحل');
      showToast('تم تصدير ملف النتائج بنجاح!', 'success');
    } catch {
      showToast('حدث خطأ أثناء تصدير النتائج', 'error');
    }
  };

  const handleConfirmClear = () => {
    onClearAllScores();
    setIsClearModalOpen(false);
    showToast('تم حذف جميع النتائج بنجاح!', 'success');
  };

  return (
    <div className="min-h-screen pb-24 px-3 pt-4 max-w-md mx-auto text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">الرئيسية</span>
        </button>

        <h1 className="text-lg font-black text-white">جدول النتائج والترتيب</h1>

        <button
          onClick={() => setIsClearModalOpen(true)}
          disabled={scores.length === 0}
          className={`p-2 rounded-xl border transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
            scores.length === 0
              ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
          }`}
          title="حذف جميع النتائج"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      {/* Stage Selector */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 mb-3 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400 shrink-0" />
          <label className="text-xs font-semibold text-slate-300">المرحلة المعروضة:</label>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedStageName}
            onChange={(e) => setSelectedStageName(e.target.value)}
            className="flex-1 py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">جميع المراحل ({scores.length} نتيجة)</option>
            {stages.map((stg) => (
              <option key={stg.id} value={stg.name}>
                {stg.name}
              </option>
            ))}
          </select>

          {activeStage?.date && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 bg-slate-900/60 px-2.5 py-2 rounded-xl border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeStage.date.split('-').reverse().join('/')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Export & Details */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={handleShareOrExport}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-sky-400 border border-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm min-h-[40px]"
        >
          <Share2 className="w-4 h-4" />
          <span>تصدير CSV / مشاركة</span>
        </button>

        <button
          onClick={() => onNavigate('shooting-details')}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition-colors shadow-sm min-h-[40px]"
        >
          <FileText className="w-4 h-4" />
          <span>تفاصيل الرماية (A,C,D..)</span>
        </button>
      </div>

      {/* Results Table */}
      {calculatedRows.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 my-4">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">لا توجد نتائج مسجلة</p>
          <p className="text-xs text-slate-400 mb-4">
            قم بالدخول إلى شاشة &quot;إدخال النتائج&quot; لبدء تسجيل أوقات ورميات الرماة
          </p>
          <button
            onClick={() => onNavigate('enter-scores')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
          >
            الانتقال لتسجيل النتائج
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-700 text-[11px]">
                  <th className="py-2.5 px-1.5 font-bold">ت</th>
                  <th className="py-2.5 px-2 text-right font-bold">الرامي</th>
                  <th className="py-2.5 px-1.5 font-bold">المرحلة</th>
                  <th className="py-2.5 px-1 font-bold">الوقت</th>
                  <th className="py-2.5 px-1 font-bold">النقاط</th>
                  <th className="py-2.5 px-1.5 font-extrabold text-amber-400">Hit-F</th>
                  <th className="py-2.5 px-1 text-sky-400 font-bold">%</th>
                  <th className="py-2.5 px-1 font-bold">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {calculatedRows.map((row) => {
                  const isFirst = row.rank === 1;
                  const isSecond = row.rank === 2;
                  const isThird = row.rank === 3;

                  return (
                    <tr
                      key={`${row.shooterId}-${row.stageName}`}
                      className={`hover:bg-slate-700/40 transition-colors ${
                        isFirst
                          ? 'bg-amber-500/10'
                          : isSecond
                          ? 'bg-slate-700/25'
                          : isThird
                          ? 'bg-amber-900/10'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-1.5 font-extrabold">
                        {isFirst && <span className="text-amber-400">🥇 1</span>}
                        {isSecond && <span className="text-slate-300">🥈 2</span>}
                        {isThird && <span className="text-amber-600">🥉 3</span>}
                        {!isFirst && !isSecond && !isThird && (
                          <span className="text-slate-400 tabular-nums">{row.rank}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-right">
                        <div className="font-extrabold text-white text-xs leading-snug">
                          {row.shooterName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.shooterRank} · {row.team}
                        </div>
                      </td>

                      <td className="py-2.5 px-1.5 text-slate-300 text-[11px] truncate max-w-[85px]">
                        {row.stageName.replace('المرحلة', 'م.')}
                      </td>

                      <td className="py-2.5 px-1 font-semibold text-slate-300 tabular-nums">
                        {row.time}
                      </td>

                      <td className="py-2.5 px-1 font-extrabold text-white tabular-nums">
                        {row.totalScore}
                      </td>

                      <td className="py-2.5 px-1.5 font-black text-amber-400 tabular-nums">
                        {row.hitFactor}
                      </td>

                      <td className="py-2.5 px-1 font-extrabold text-sky-400 tabular-nums">
                        {row.percentage}%
                      </td>

                      <td className="py-2.5 px-1 font-bold text-emerald-400 tabular-nums">
                        {row.result}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clear All Scores Confirmation */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="حذف جميع النتائج"
        message="هل أنت متأكد من حذف جميع نتائج الرماة المسجلة في التطبيق؟ هذا الإجراء لا يمكن التراجع عنه!"
        confirmText="نعم، حذف جميع النتائج"
        cancelText="إلغاء"
        isDanger={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
