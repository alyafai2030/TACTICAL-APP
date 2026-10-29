import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowRight, Save, RotateCcw, Play, Square, Minus, Plus, Target, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Stage, Shooter, ShooterScore, TargetScore, SCORING_POINTS } from '../types';
import { soundEffects } from '../utils/audio';

interface ScorePadViewProps {
  currentStage: Stage | null;
  currentShooter: Shooter | null;
  existingScores: ShooterScore[];
  onSaveScore: (score: ShooterScore) => void;
  onBack: () => void;
}

export const ScorePadView: React.FC<ScorePadViewProps> = ({
  currentStage,
  currentShooter,
  existingScores,
  onSaveScore,
  onBack,
}) => {
  if (!currentStage || !currentShooter) {
    return (
      <div className="min-h-screen p-6 text-center text-slate-300">
        <p>الرجاء اختيار المرحلة والرامي أولاً.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">
          رجوع
        </button>
      </div>
    );
  }

  const targetCount = currentStage.targets || 1;

  // Find existing score for this shooter on this stage
  const existing = useMemo(() => {
    return existingScores.find(
      (s) => s.shooterId === currentShooter.id && s.stageId === currentStage.name
    );
  }, [existingScores, currentShooter.id, currentStage.name]);

  // Timer states
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    return existing ? parseFloat(existing.time) || 0 : 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [manualTime, setManualTime] = useState<string>(() => {
    return existing ? existing.time : '';
  });
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Procedural errors
  const [procedurals, setProcedurals] = useState<number>(() => {
    return existing ? existing.procedurals || 0 : 0;
  });

  // Target hits matrix
  const [targetHits, setTargetHits] = useState<TargetScore[]>(() => {
    if (existing && existing.scores && existing.scores.length > 0) {
      // Map existing or fill missing
      return Array.from({ length: targetCount }, (_, i) => {
        const targetNum = i + 1;
        const found = existing.scores.find((s) => s.target === targetNum);
        return (
          found || {
            target: targetNum,
            A: 0,
            C: 0,
            D: 0,
            M: 0,
            NS: 0,
          }
        );
      });
    }

    return Array.from({ length: targetCount }, (_, i) => ({
      target: i + 1,
      A: 0,
      C: 0,
      D: 0,
      M: 0,
      NS: 0,
    }));
  });

  // Timer management
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setTimerSeconds(elapsed);
        setManualTime(elapsed.toFixed(2));
      }, 50);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      // Stop
      setIsTimerRunning(false);
      soundEffects.playStopBuzzer();
    } else {
      // Start
      soundEffects.playStartBuzzer();
      startTimeRef.current = Date.now() - timerSeconds * 1000;
      setIsTimerRunning(true);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerSeconds(0);
    setManualTime('');
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    setManualTime(val);
    const parsed = parseFloat(val) || 0;
    setTimerSeconds(parsed);
  };

  // Target Hit clicking logic:
  // Standard tactical shooting permits max 2 scored hits per target:
  // - Either clicking the same button twice (e.g. A=2)
  // - Or clicking two different buttons once each (e.g. A=1, C=1)
  // When 2 hits are reached, all remaining 0-hit buttons on this target are disabled.
  // Clicking an active (1 or 2) button resets it to 0, which re-enables the disabled buttons.
  const handleHitClick = (targetNum: number, zone: keyof typeof SCORING_POINTS) => {
    soundEffects.playHitClick();
    setTargetHits((prev) =>
      prev.map((t) => {
        if (t.target !== targetNum) return t;

        const currentVal = t[zone] || 0;
        const totalHitsOther =
          (t.A || 0) +
          (t.C || 0) +
          (t.D || 0) +
          (t.M || 0) +
          (t.NS || 0) -
          currentVal;

        const currentTotal = totalHitsOther + currentVal;

        // If target already has 2 hits total:
        if (currentTotal >= 2) {
          // If clicking an active button that has recorded hits (1 or 2):
          // Reset this button to 0 so total hits drops below 2 and other buttons re-enable!
          if (currentVal > 0) {
            return { ...t, [zone]: 0 };
          }
          // Disabled buttons cannot be clicked
          return t;
        }

        // Target currently has 0 or 1 hit total:
        if (currentVal === 0) {
          // 0 -> 1 hit
          return { ...t, [zone]: 1 };
        } else if (currentVal === 1) {
          // 1 -> 2 hits (since currentTotal < 2, totalHitsOther must be 0)
          return { ...t, [zone]: 2 };
        } else {
          // Was 2: reset to 0
          return { ...t, [zone]: 0 };
        }
      })
    );
  };

  const handleResetTarget = (targetNum: number) => {
    setTargetHits((prev) =>
      prev.map((t) =>
        t.target === targetNum ? { target: targetNum, A: 0, C: 0, D: 0, M: 0, NS: 0 } : t
      )
    );
  };

  // Calculations
  const calculatedPoints = useMemo(() => {
    let raw = 0;
    targetHits.forEach((t) => {
      raw += (t.A || 0) * SCORING_POINTS.A;
      raw += (t.C || 0) * SCORING_POINTS.C;
      raw += (t.D || 0) * SCORING_POINTS.D;
      raw += (t.M || 0) * SCORING_POINTS.M;
      raw += (t.NS || 0) * SCORING_POINTS.NS;
    });
    return raw - procedurals * 5;
  }, [targetHits, procedurals]);

  const activeTime = parseFloat(manualTime) || timerSeconds;
  const hitFactor = useMemo(() => {
    if (activeTime <= 0) return 0;
    const factor = calculatedPoints / activeTime;
    return Math.max(0, parseFloat(factor.toFixed(2)));
  }, [calculatedPoints, activeTime]);

  // Max HF on this stage
  const maxHitFactor = useMemo(() => {
    const stageScores = existingScores.filter(
      (s) => s.stageId === currentStage.name && s.shooterId !== currentShooter.id
    );
    const existingMax = stageScores.length > 0
      ? Math.max(...stageScores.map((s) => s.hitFactor || 0))
      : 0;
    return Math.max(existingMax, hitFactor);
  }, [existingScores, currentStage.name, currentShooter.id, hitFactor]);

  const percentage = useMemo(() => {
    if (maxHitFactor <= 0 || hitFactor <= 0) return '0.00';
    return ((hitFactor / maxHitFactor) * 100).toFixed(2);
  }, [hitFactor, maxHitFactor]);

  // Scored targets count (targets with 2 hits completed)
  const completedTargetsCount = useMemo(() => {
    return targetHits.filter(
      (t) => (t.A || 0) + (t.C || 0) + (t.D || 0) + (t.M || 0) + (t.NS || 0) === 2
    ).length;
  }, [targetHits]);

  const handleSave = () => {
    if (activeTime <= 0) {
      alert('يرجى تشغيل المؤقت أو إدخال وقت صحيح أكبر من الصفر!');
      return;
    }

    const newScore: ShooterScore = {
      shooterId: currentShooter.id,
      stageId: currentStage.name,
      time: activeTime.toFixed(2),
      procedurals,
      totalScore: calculatedPoints,
      hitFactor,
      scores: targetHits,
    };

    if (parseFloat(percentage) >= 99.0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti optional
      }
    }

    onSaveScore(newScore);
  };

  return (
    <div className="min-h-screen pb-20 px-3 pt-3 max-w-md mx-auto text-slate-100" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">رجوع</span>
        </button>
        <h1 className="text-base font-extrabold text-white">إدخال النتائج</h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm">حفظ</span>
        </button>
      </div>

      {/* Shooter & Stage Info Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 mb-3 text-xs shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-400">الرامي: </span>
            <strong className="text-white text-sm">{currentShooter.name}</strong>
            <div className="text-[11px] text-amber-400 font-medium">
              {currentShooter.rank} · رقم: {currentShooter.number} · {currentShooter.team}
            </div>
          </div>
          <div className="text-left">
            <span className="text-slate-400">المرحلة: </span>
            <strong className="text-amber-300 text-sm block truncate">{currentStage.name}</strong>
            <div className="text-[11px] text-slate-400">
              الأهداف المكتملة: <strong className="text-white tabular-nums">{completedTargetsCount}/{targetCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Timer & Procedurals Section */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 mb-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          {/* Timer Display & Controls */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium mb-0.5">الوقت (ثانية)</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={manualTime}
                  onChange={handleManualTimeChange}
                  className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-base font-extrabold text-amber-400 focus:outline-none focus:border-amber-400 tabular-nums"
                />
                <button
                  onClick={handleToggleTimer}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all min-h-[40px] ${
                    isTimerRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTimerRunning ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isTimerRunning ? 'إيقاف' : 'تشغيل'}</span>
                </button>
                <button
                  onClick={handleResetTimer}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl min-h-[40px]"
                  title="إعادة ضبط المؤقت"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Procedural Errors */}
          <div className="flex flex-col items-center pl-1 border-r border-slate-700/80 pr-2">
            <span className="text-[10px] text-slate-400 font-medium mb-0.5">أخطاء (-5)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setProcedurals((p) => Math.max(0, p - 1))}
                className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-extrabold text-rose-400 tabular-nums">
                {procedurals}
              </span>
              <button
                onClick={() => setProcedurals((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Target Hits Table */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-md mb-3">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-700">
                <th className="py-2 px-1 text-slate-400 font-bold">الهدف</th>
                <th className="py-2 px-1 text-emerald-400 font-bold">A (+5)</th>
                <th className="py-2 px-1 text-sky-400 font-bold">C (+4)</th>
                <th className="py-2 px-1 text-amber-400 font-bold">D (+2)</th>
                <th className="py-2 px-1 text-slate-400 font-bold">M (0)</th>
                <th className="py-2 px-1 text-rose-400 font-bold">NS (-5)</th>
                <th className="py-2 px-1 text-slate-500 font-normal">مسح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {targetHits.map((target) => {
                const totalHits =
                  (target.A || 0) +
                  (target.C || 0) +
                  (target.D || 0) +
                  (target.M || 0) +
                  (target.NS || 0);

                const isTargetFull = totalHits >= 2;

                return (
                  <tr key={target.target} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2 px-1 font-bold text-slate-200">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold">T{target.target}</span>
                        <span className={`text-[10px] tabular-nums font-bold ${
                          totalHits === 2
                            ? 'text-emerald-400'
                            : totalHits === 1
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }`}>
                          {totalHits}/2
                        </span>
                      </div>
                    </td>

                    {/* Zone A (+5) */}
                    <td className="py-1 px-1">
                      {(() => {
                        const val = target.A || 0;
                        const isDisabled = isTargetFull && val === 0;
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleHitClick(target.target, 'A')}
                            className={`w-10 h-9 rounded-lg font-bold text-sm transition-all border ${
                              isDisabled
                                ? 'opacity-20 cursor-not-allowed bg-slate-900/30 text-slate-600 border-slate-800 pointer-events-none'
                                : val === 2
                                ? 'bg-emerald-600 text-white border-emerald-300 shadow-md font-black ring-1 ring-emerald-400'
                                : val === 1
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 font-extrabold ring-1 ring-emerald-500/30'
                                : 'bg-slate-900/70 text-slate-400 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 hover:text-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={
                              isDisabled
                                ? 'تم تسجيل نقطتين في هذا الهدف - الزر معطّل'
                                : val > 0
                                ? `A: ${val} (انقر للإلغاء)`
                                : 'A (+5)'
                            }
                          >
                            {val}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Zone C (+4) */}
                    <td className="py-1 px-1">
                      {(() => {
                        const val = target.C || 0;
                        const isDisabled = isTargetFull && val === 0;
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleHitClick(target.target, 'C')}
                            className={`w-10 h-9 rounded-lg font-bold text-sm transition-all border ${
                              isDisabled
                                ? 'opacity-20 cursor-not-allowed bg-slate-900/30 text-slate-600 border-slate-800 pointer-events-none'
                                : val === 2
                                ? 'bg-sky-600 text-white border-sky-300 shadow-md font-black ring-1 ring-sky-400'
                                : val === 1
                                ? 'bg-sky-500/25 text-sky-300 border-sky-400 font-extrabold ring-1 ring-sky-500/30'
                                : 'bg-slate-900/70 text-slate-400 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 hover:text-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={
                              isDisabled
                                ? 'تم تسجيل نقطتين في هذا الهدف - الزر معطّل'
                                : val > 0
                                ? `C: ${val} (انقر للإلغاء)`
                                : 'C (+4)'
                            }
                          >
                            {val}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Zone D (+2) */}
                    <td className="py-1 px-1">
                      {(() => {
                        const val = target.D || 0;
                        const isDisabled = isTargetFull && val === 0;
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleHitClick(target.target, 'D')}
                            className={`w-10 h-9 rounded-lg font-bold text-sm transition-all border ${
                              isDisabled
                                ? 'opacity-20 cursor-not-allowed bg-slate-900/30 text-slate-600 border-slate-800 pointer-events-none'
                                : val === 2
                                ? 'bg-amber-600 text-white border-amber-300 shadow-md font-black ring-1 ring-amber-400'
                                : val === 1
                                ? 'bg-amber-500/25 text-amber-300 border-amber-400 font-extrabold ring-1 ring-amber-500/30'
                                : 'bg-slate-900/70 text-slate-400 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 hover:text-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={
                              isDisabled
                                ? 'تم تسجيل نقطتين في هذا الهدف - الزر معطّل'
                                : val > 0
                                ? `D: ${val} (انقر للإلغاء)`
                                : 'D (+2)'
                            }
                          >
                            {val}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Zone M (Miss, 0) */}
                    <td className="py-1 px-1">
                      {(() => {
                        const val = target.M || 0;
                        const isDisabled = isTargetFull && val === 0;
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleHitClick(target.target, 'M')}
                            className={`w-10 h-9 rounded-lg font-bold text-sm transition-all border ${
                              isDisabled
                                ? 'opacity-20 cursor-not-allowed bg-slate-900/30 text-slate-600 border-slate-800 pointer-events-none'
                                : val === 2
                                ? 'bg-slate-600 text-white border-slate-300 shadow-md font-black'
                                : val === 1
                                ? 'bg-slate-600/40 text-slate-200 border-slate-400 font-extrabold'
                                : 'bg-slate-900/70 text-slate-400 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 hover:text-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={
                              isDisabled
                                ? 'تم تسجيل نقطتين في هذا الهدف - الزر معطّل'
                                : val > 0
                                ? `M: ${val} (انقر للإلغاء)`
                                : 'M (0)'
                            }
                          >
                            {val}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Zone NS (No Shoot, -5) */}
                    <td className="py-1 px-1">
                      {(() => {
                        const val = target.NS || 0;
                        const isDisabled = isTargetFull && val === 0;
                        return (
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleHitClick(target.target, 'NS')}
                            className={`w-10 h-9 rounded-lg font-bold text-sm transition-all border ${
                              isDisabled
                                ? 'opacity-20 cursor-not-allowed bg-slate-900/30 text-slate-600 border-slate-800 pointer-events-none'
                                : val === 2
                                ? 'bg-rose-600 text-white border-rose-300 shadow-md font-black ring-1 ring-rose-400'
                                : val === 1
                                ? 'bg-rose-500/25 text-rose-300 border-rose-400 font-extrabold ring-1 ring-rose-500/30'
                                : 'bg-slate-900/70 text-slate-400 border-slate-700/80 hover:bg-slate-750 hover:border-slate-500 hover:text-slate-200 cursor-pointer active:scale-95'
                            }`}
                            title={
                              isDisabled
                                ? 'تم تسجيل نقطتين في هذا الهدف - الزر معطّل'
                                : val > 0
                                ? `NS: ${val} (انقر للإلغاء)`
                                : 'NS (-5)'
                            }
                          >
                            {val}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Clear target */}
                    <td className="py-1 px-1">
                      <button
                        type="button"
                        onClick={() => handleResetTarget(target.target)}
                        className={`p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors ${
                          totalHits > 0 ? 'opacity-100 text-rose-400/80' : 'opacity-25'
                        }`}
                        title="إعادة ضبط الهدف كاملاً"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Score Summary Strip */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-lg mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">إجمالي النقاط</div>
            <div className="text-lg font-black text-amber-400 tabular-nums">
              {calculatedPoints}
            </div>
          </div>

          <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">Hit Factor</div>
            <div className="text-lg font-black text-emerald-400 tabular-nums">
              {hitFactor.toFixed(2)}
            </div>
          </div>

          <div className="p-2 bg-slate-900/90 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">النسبة المئوية</div>
            <div className="text-lg font-black text-sky-400 tabular-nums">
              {percentage}%
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-3 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition-all active:scale-[0.99] min-h-[48px]"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950 fill-current" />
          <span>حفظ نتيجة الرامي والمتابعة</span>
        </button>
      </div>
    </div>
  );
};
