import React from 'react';
import { ArrowRight, Target, Calendar, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Stage, Shooter, ShooterScore, PageId } from '../types';

interface EnterScoresViewProps {
  stages: Stage[];
  shooters: Shooter[];
  scores: ShooterScore[];
  onSelectStage: (stage: Stage) => void;
  onNavigate: (page: PageId) => void;
}

export const EnterScoresView: React.FC<EnterScoresViewProps> = ({
  stages,
  shooters,
  scores,
  onSelectStage,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">الرئيسية</span>
        </button>
        <h1 className="text-lg font-black text-white">اختيار المرحلة</h1>
        <div className="w-8 flex justify-end">
          <img src="/8.png" alt="رمز المرحلة" className="w-6 h-6 object-contain opacity-80" onError={(e) => { (e.target as HTMLImageElement).src = '/assets/aistudio/8_2dc2ee03.png'; }} />
        </div>
      </div>

      {/* Stages List */}
      {stages.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 my-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
          <p className="text-base font-bold text-white mb-1">لا توجد مراحل مسجلة حالياً</p>
          <p className="text-xs text-slate-400 mb-4">قم بإضافة مرحلة أولاً للبدء برصد وتسجيل نتائج الرماة</p>
          <button
            onClick={() => onNavigate('build-stages')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
          >
            إضافة مرحلة جديدة
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium">اختر المرحلة التي تجري عليها الرماية الآن:</p>
          {stages.map((stage, idx) => {
            const points = (stage.targets || 0) * 10;
            const completedCount = scores.filter(
              (s) => s.stageId === stage.name && shooters.some((sh) => sh.id === s.shooterId)
            ).length;
            const isFinished = completedCount > 0 && completedCount === shooters.length;

            return (
              <div
                key={stage.id || idx}
                onClick={() => onSelectStage(stage)}
                className="group flex items-center justify-between p-3.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all active:scale-[0.99] shadow-md relative overflow-hidden"
              >
                {/* Status indicator bar */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1.5 ${
                    isFinished ? 'bg-emerald-500' : completedCount > 0 ? 'bg-amber-400' : 'bg-slate-600'
                  }`}
                />

                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                      {stage.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      الأهداف: <strong className="text-white tabular-nums">{stage.targets || 0}</strong>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span>
                      النقاط: <strong className="text-amber-400 tabular-nums">{points}</strong>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {stage.date ? stage.date.split('-').reverse().join('/') : '-'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs flex items-center gap-2">
                    <span className="text-slate-400">الإنجاز:</span>
                    <span className={`font-bold tabular-nums ${completedCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {completedCount} / {shooters.length} رامي
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stage.image && (
                    <img
                      src={stage.image}
                      alt={stage.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700"
                    />
                  )}
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
