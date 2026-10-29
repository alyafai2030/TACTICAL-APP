import React, { useState } from 'react';
import { 
  ArrowRight, 
  Plus, 
  Edit2, 
  Trash2, 
  Target, 
  Calendar, 
  Layers, 
  Image as ImageIcon, 
  X, 
  Save 
} from 'lucide-react';
import { Stage, PageId } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface BuildStagesViewProps {
  stages: Stage[];
  onSaveStages: (stages: Stage[]) => void;
  onNavigate: (page: PageId) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const BuildStagesView: React.FC<BuildStagesViewProps> = ({
  stages,
  onSaveStages,
  onNavigate,
  showToast,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formRounds, setFormRounds] = useState<number>(10);
  const [formTargets, setFormTargets] = useState<number>(5);
  const [formImage, setFormImage] = useState<string | null>(null);

  const [stageToDeleteIdx, setStageToDeleteIdx] = useState<number | null>(null);

  const handleOpenAdd = () => {
    setEditingStageIndex(null);
    setFormName(`المرحلة ${stages.length + 1}`);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRounds(10);
    setFormTargets(5);
    setFormImage(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (idx: number) => {
    const stg = stages[idx];
    setEditingStageIndex(idx);
    setFormName(stg.name);
    setFormDate(stg.date || new Date().toISOString().split('T')[0]);
    setFormRounds(stg.rounds || 10);
    setFormTargets(stg.targets || 5);
    setFormImage(stg.image || null);
    setIsFormOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim() || `المرحلة ${stages.length + 1}`;
    if (formTargets <= 0) {
      showToast('يجب أن يكون عدد الأهداف 1 على الأقل!', 'error');
      return;
    }

    const stageObj: Stage = {
      id: editingStageIndex !== null ? stages[editingStageIndex].id : `stage-${Date.now()}`,
      name: trimmedName,
      date: formDate,
      rounds: formRounds,
      targets: formTargets,
      image: formImage,
    };

    if (editingStageIndex !== null) {
      const updated = [...stages];
      updated[editingStageIndex] = stageObj;
      onSaveStages(updated);
      showToast('تم تعديل المرحلة بنجاح!', 'success');
    } else {
      onSaveStages([...stages, stageObj]);
      showToast('تمت إضافة المرحلة بنجاح!', 'success');
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (stageToDeleteIdx !== null) {
      const name = stages[stageToDeleteIdx].name;
      const updated = stages.filter((_, i) => i !== stageToDeleteIdx);
      onSaveStages(updated);
      showToast(`تم حذف "${name}" بنجاح!`, 'success');
      setStageToDeleteIdx(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-3">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold p-1 rounded-lg min-h-[44px]"
        >
          <ArrowRight className="w-5 h-5" />
          <span className="text-sm">الرئيسية</span>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-lg font-black text-white">بناء المراحل</h1>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-700 tabular-nums">
            {stages.length}
          </span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="إضافة مرحلة جديدة"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Stages List */}
      {stages.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 my-4">
          <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">لا توجد مراحل حالياً</p>
          <p className="text-xs text-slate-400 mb-4">قم بإضافة مرحلة رماية جديدة مع تحديد عدد الأهداف والطلقات</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول مرحلة</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const points = (stage.targets || 0) * 10;
            return (
              <div
                key={stage.id || idx}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex-1 pr-1">
                  <h3 className="font-extrabold text-white text-base leading-tight">
                    {stage.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      الأهداف: <strong className="text-white tabular-nums">{stage.targets}</strong>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span>
                      الطلقات: <strong className="text-slate-200 tabular-nums">{stage.rounds}</strong>
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {points} نقطة
                    </span>
                  </div>
                  {stage.date && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{stage.date.split('-').reverse().join('/')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {stage.image && (
                    <img
                      src={stage.image}
                      alt={stage.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleOpenEdit(idx)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                      title="تعديل المرحلة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStageToDeleteIdx(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف المرحلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Stage Modal */}
      <ConfirmModal
        isOpen={stageToDeleteIdx !== null}
        title="حذف مرحلة"
        message={`هل أنت متأكد من حذف المرحلة "${stageToDeleteIdx !== null ? stages[stageToDeleteIdx]?.name : ''}"؟`}
        confirmText="حذف المرحلة"
        cancelText="إلغاء"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setStageToDeleteIdx(null)}
      />

      {/* Add / Edit Stage Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>{editingStageIndex !== null ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم المرحلة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المرحلة 1 - الرماية السريعة"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تاريخ الرماية
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عدد الأهداف (Targets)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formTargets}
                    onChange={(e) => setFormTargets(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 tabular-nums"
                  />
                  <span className="text-[10px] text-amber-400/90 mt-0.5 block">
                    النقاط الكلية: {formTargets * 10}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عدد الطلقات (Rounds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formRounds}
                    onChange={(e) => setFormRounds(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 tabular-nums"
                  />
                </div>
              </div>

              {/* Stage Image */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  صورة المرحلة (مخطط أو صورة توضيحية)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 border-dashed rounded-xl cursor-pointer text-xs text-slate-300 hover:text-white transition-colors">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>اختيار صورة من الجهاز</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage(null)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                      title="حذف الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Preset quick image selection */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400">نماذج جاهزة:</span>
                  {['/1.png', '/2.png', '/3.png', '/stage.png'].map((imgSrc, i) => (
                    <img
                      key={i}
                      src={imgSrc}
                      alt={`نموذج ${i + 1}`}
                      onClick={() => setFormImage(imgSrc)}
                      className={`w-9 h-9 rounded-lg object-cover cursor-pointer border-2 transition-transform hover:scale-105 ${
                        formImage === imgSrc ? 'border-amber-400 shadow-sm' : 'border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {formImage && (
                  <div className="mt-2 text-center">
                    <img
                      src={formImage}
                      alt="معاينة المرحلة"
                      className="max-h-28 mx-auto rounded-xl border border-slate-700 object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl min-h-[44px]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md active:scale-95 min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ المرحلة</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
