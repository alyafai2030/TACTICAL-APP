import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowRight, 
  Share2, 
  FileSpreadsheet, 
  Filter, 
  ArrowUpDown 
} from 'lucide-react';
import { Stage, Shooter, ShooterScore, PageId } from '../types';
import { exportShootingDetailsCSV, importResultsFromExcel } from '../utils/excel';

interface ShootingDetailsViewProps {
  stages: Stage[];
  shooters: Shooter[];
  scores: ShooterScore[];
  onSaveScores: (scores: ShooterScore[]) => void;
  onNavigate: (page: PageId) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type SortColumn =
  | 'rank'
  | 'name'
  | 'number'
  | 'rankTitle'
  | 'stage'
  | 'A'
  | 'C'
  | 'D'
  | 'M'
  | 'NS'
  | 'points'
  | 'time'
  | 'hitFactor'
  | 'percentage'
  | 'result';

export const ShootingDetailsView: React.FC<ShootingDetailsViewProps> = ({
  stages,
  shooters,
  scores,
  onSaveScores,
  onNavigate,
  showToast,
}) => {
  const [selectedStageName, setSelectedStageName] = useState<string>('');
  const [sortCol, setSortCol] = useState<SortColumn>('hitFactor');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStage = useMemo(() => {
    return stages.find((s) => s.name === selectedStageName) || null;
  }, [stages, selectedStageName]);

  const filteredScores = useMemo(() => {
    if (!selectedStageName) return scores;
    return scores.filter((s) => s.stageId === selectedStageName);
  }, [scores, selectedStageName]);

  const detailsList = useMemo(() => {
    // Unique best score per shooter-stage
    const map = new Map<string, ShooterScore>();
    filteredScores.forEach((sc) => {
      const key = `${sc.shooterId}-${sc.stageId}`;
      const prev = map.get(key);
      if (!prev || (sc.hitFactor || 0) > (prev.hitFactor || 0)) {
        map.set(key, sc);
      }
    });

    const list = Array.from(map.values());
    const maxHf = list.length > 0 ? Math.max(...list.map((s) => s.hitFactor || 0)) : 0;

    return list.map((sc, index) => {
      const shooter = shooters.find((sh) => sh.id === sc.shooterId);
      const stage = stages.find((stg) => stg.name === sc.stageId);
      const stageMaxPoints = stage ? stage.targets * 10 : 50;

      let A = 0;
      let C = 0;
      let D = 0;
      let M = 0;
      let NS = 0;

      if (sc.scores && Array.isArray(sc.scores)) {
        sc.scores.forEach((t) => {
          A += t.A || 0;
          C += t.C || 0;
          D += t.D || 0;
          M += t.M || 0;
          NS += t.NS || 0;
        });
      }

      const hf = sc.hitFactor || 0;
      const percentageNum = maxHf > 0 ? (hf / maxHf) * 100 : 0;
      const percentageStr = percentageNum.toFixed(1);
      const resultStr = ((percentageNum * stageMaxPoints) / 100).toFixed(1);

      return {
        rank: index + 1,
        shooterId: sc.shooterId,
        shooterName: shooter?.name || 'غير معروف',
        shooterRank: shooter?.rank || '-',
        shooterNumber: shooter?.number || '-',
        team: shooter?.team || '-',
        stageName: sc.stageId,
        A,
        C,
        D,
        M,
        NS,
        totalScore: sc.totalScore,
        time: sc.time,
        hitFactor: hf.toFixed(2),
        percentage: percentageStr,
        result: resultStr,
      };
    });
  }, [filteredScores, shooters, stages]);

  // Sorting
  const sortedList = useMemo(() => {
    const arr = [...detailsList];
    arr.sort((a, b) => {
      let vA: string | number = 0;
      let vB: string | number = 0;

      switch (sortCol) {
        case 'rank':
          vA = a.rank;
          vB = b.rank;
          break;
        case 'name':
          vA = a.shooterName;
          vB = b.shooterName;
          break;
        case 'number':
          vA = parseInt(a.shooterNumber, 10) || 0;
          vB = parseInt(b.shooterNumber, 10) || 0;
          break;
        case 'rankTitle':
          vA = a.shooterRank;
          vB = b.shooterRank;
          break;
        case 'stage':
          vA = a.stageName;
          vB = b.stageName;
          break;
        case 'A':
          vA = a.A;
          vB = b.A;
          break;
        case 'C':
          vA = a.C;
          vB = b.C;
          break;
        case 'D':
          vA = a.D;
          vB = b.D;
          break;
        case 'M':
          vA = a.M;
          vB = b.M;
          break;
        case 'NS':
          vA = a.NS;
          vB = b.NS;
          break;
        case 'points':
          vA = a.totalScore;
          vB = b.totalScore;
          break;
        case 'time':
          vA = parseFloat(a.time) || 0;
          vB = parseFloat(b.time) || 0;
          break;
        case 'hitFactor':
          vA = parseFloat(a.hitFactor) || 0;
          vB = parseFloat(b.hitFactor) || 0;
          break;
        case 'percentage':
          vA = parseFloat(a.percentage) || 0;
          vB = parseFloat(b.percentage) || 0;
          break;
        case 'result':
          vA = parseFloat(a.result) || 0;
          vB = parseFloat(b.result) || 0;
          break;
      }

      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortAsc ? vA.localeCompare(vB, 'ar') : vB.localeCompare(vA, 'ar');
      }
      return sortAsc ? (vA as number) - (vB as number) : (vB as number) - (vA as number);
    });

    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [detailsList, sortCol, sortAsc]);

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(false); // default desc for scores
    }
  };

  const handleExportCSV = () => {
    if (sortedList.length === 0) {
      showToast('لا توجد تفاصيل للتصدير!', 'info');
      return;
    }
    try {
      exportShootingDetailsCSV(sortedList, selectedStageName || 'جميع_المراحل');
      showToast('تم تصدير ملف تفاصيل الرماية بنجاح!', 'success');
    } catch {
      showToast('حدث خطأ أثناء التصدير', 'error');
    }
  };

  const handleImportResults = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importResultsFromExcel(file, shooters, stages, scores);
      if (res.importedCount > 0) {
        onSaveScores(res.updatedScores);
        showToast(`تم استيراد ${res.importedCount} نتيجة بنجاح!`, 'success');
      } else {
        showToast('لم يتم العثور على نتائج جديدة مطابقة!', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء قراءة الملف';
      showToast(msg, 'error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pb-24 px-2 pt-4 max-w-lg mx-auto text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-3 px-1">
        <button
          onClick={() => onNavigate('view-results')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">النتائج</span>
        </button>

        <h1 className="text-base font-extrabold text-white">تفاصيل الرماية</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="تصدير تفاصيل الرماية CSV"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="استيراد نتائج من Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleImportResults}
      />

      {/* Stage Selector */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2.5 mb-3 shadow-sm flex items-center gap-2">
        <Filter className="w-4 h-4 text-amber-400 shrink-0" />
        <select
          value={selectedStageName}
          onChange={(e) => setSelectedStageName(e.target.value)}
          className="flex-1 py-1.5 px-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
        >
          <option value="">جميع المراحل ({scores.length} نتيجة)</option>
          {stages.map((stg) => (
            <option key={stg.id} value={stg.name}>
              {stg.name}
            </option>
          ))}
        </select>
        {activeStage?.date && (
          <span className="text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1.5 rounded-lg border border-slate-700 tabular-nums shrink-0">
            {activeStage.date.split('-').reverse().join('/')}
          </span>
        )}
      </div>

      {/* Details Breakdown Table */}
      {sortedList.length === 0 ? (
        <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-sm p-4">
          لا توجد نتائج مسجلة لهذه المرحلة
        </div>
      ) : (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-700 select-none">
                  <th onClick={() => handleSort('rank')} className="py-2 px-1 cursor-pointer hover:text-amber-400">
                    <span className="flex items-center justify-center gap-0.5">ت<ArrowUpDown className="w-2.5 h-2.5" /></span>
                  </th>
                  <th onClick={() => handleSort('name')} className="py-2 px-1.5 cursor-pointer hover:text-amber-400 text-right">
                    <span className="flex items-center gap-0.5">الرامي<ArrowUpDown className="w-2.5 h-2.5" /></span>
                  </th>
                  <th onClick={() => handleSort('rankTitle')} className="py-2 px-1 cursor-pointer hover:text-amber-400">
                    الرتبة
                  </th>
                  <th onClick={() => handleSort('number')} className="py-2 px-1 cursor-pointer hover:text-amber-400">
                    الرقم
                  </th>
                  <th onClick={() => handleSort('stage')} className="py-2 px-1 cursor-pointer hover:text-amber-400">
                    المرحلة
                  </th>
                  <th onClick={() => handleSort('A')} className="py-2 px-1 text-emerald-400 cursor-pointer hover:underline font-bold">
                    A
                  </th>
                  <th onClick={() => handleSort('C')} className="py-2 px-1 text-sky-400 cursor-pointer hover:underline font-bold">
                    C
                  </th>
                  <th onClick={() => handleSort('D')} className="py-2 px-1 text-amber-400 cursor-pointer hover:underline font-bold">
                    D
                  </th>
                  <th onClick={() => handleSort('M')} className="py-2 px-1 text-slate-400 cursor-pointer hover:underline font-bold">
                    M
                  </th>
                  <th onClick={() => handleSort('NS')} className="py-2 px-1 text-rose-400 cursor-pointer hover:underline font-bold">
                    NS
                  </th>
                  <th onClick={() => handleSort('points')} className="py-2 px-1 cursor-pointer hover:text-amber-400 font-bold">
                    النقاط
                  </th>
                  <th onClick={() => handleSort('time')} className="py-2 px-1 cursor-pointer hover:text-amber-400 font-bold">
                    الوقت
                  </th>
                  <th onClick={() => handleSort('hitFactor')} className="py-2 px-1 text-amber-400 cursor-pointer hover:underline font-extrabold">
                    Hit-F
                  </th>
                  <th onClick={() => handleSort('percentage')} className="py-2 px-1 text-sky-400 cursor-pointer hover:underline font-bold">
                    %
                  </th>
                  <th onClick={() => handleSort('result')} className="py-2 px-1 text-emerald-400 cursor-pointer hover:underline font-bold">
                    النتيجة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {sortedList.map((item) => (
                  <tr key={`${item.shooterId}-${item.stageName}`} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-2 px-1 font-bold text-slate-400 tabular-nums">{item.rank}</td>
                    <td className="py-2 px-1.5 text-right font-extrabold text-white text-xs truncate max-w-[90px]">
                      {item.shooterName}
                    </td>
                    <td className="py-2 px-1 text-slate-300 text-[10px]">{item.shooterRank}</td>
                    <td className="py-2 px-1 text-slate-400 tabular-nums text-[10px]">{item.shooterNumber}</td>
                    <td className="py-2 px-1 text-slate-300 text-[10px] truncate max-w-[70px]">
                      {item.stageName.replace('المرحلة', 'م.')}
                    </td>
                    <td className="py-2 px-1 font-bold text-emerald-400 tabular-nums">{item.A}</td>
                    <td className="py-2 px-1 font-bold text-sky-400 tabular-nums">{item.C}</td>
                    <td className="py-2 px-1 font-bold text-amber-400 tabular-nums">{item.D}</td>
                    <td className="py-2 px-1 text-slate-400 tabular-nums">{item.M}</td>
                    <td className="py-2 px-1 font-bold text-rose-400 tabular-nums">{item.NS}</td>
                    <td className="py-2 px-1 font-extrabold text-white tabular-nums">{item.totalScore}</td>
                    <td className="py-2 px-1 font-semibold text-slate-300 tabular-nums">{item.time}</td>
                    <td className="py-2 px-1 font-black text-amber-400 tabular-nums">{item.hitFactor}</td>
                    <td className="py-2 px-1 font-bold text-sky-400 tabular-nums">{item.percentage}%</td>
                    <td className="py-2 px-1 font-bold text-emerald-400 tabular-nums">{item.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
