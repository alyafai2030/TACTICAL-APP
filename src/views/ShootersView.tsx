import React, { useState, useMemo, useRef } from 'react';
import { 
  ArrowRight, 
  UserPlus, 
  FileSpreadsheet, 
  Trash2, 
  Search, 
  Edit2, 
  X, 
  Save, 
  ShieldAlert,
  Users,
  Award
} from 'lucide-react';
import { Shooter, ShooterScore, PageId } from '../types';
import { normalizeArabic } from '../utils/storage';
import { importShootersFromExcel } from '../utils/excel';
import { ConfirmModal } from '../components/ConfirmModal';

interface ShootersViewProps {
  shooters: Shooter[];
  scores: ShooterScore[];
  onSaveShooters: (shooters: Shooter[]) => void;
  onClearAllShooters: (deleteScoresAlso: boolean) => void;
  onDeleteSingleShooter: (id: string) => void;
  onNavigate: (page: PageId) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShootersView: React.FC<ShootersViewProps> = ({
  shooters,
  scores,
  onSaveShooters,
  onClearAllShooters,
  onDeleteSingleShooter,
  onNavigate,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  
  // Modal states for Delete All Shooters
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteScoresAlso, setDeleteScoresAlso] = useState(true);

  // Modal states for single shooter delete
  const [shooterToDelete, setShooterToDelete] = useState<Shooter | null>(null);

  // Form states for Add / Edit shooter modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShooterId, setEditingShooterId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRank, setFormRank] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formTeam, setFormTeam] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing unique teams for suggestions
  const teams = useMemo(() => {
    return Array.from(new Set(shooters.map((s) => s.team).filter(Boolean)));
  }, [shooters]);

  // Filter shooters
  const filtered = useMemo(() => {
    return shooters.filter((s) => {
      const matchTeam = !selectedTeam || s.team === selectedTeam;
      const matchQuery =
        !searchQuery ||
        normalizeArabic(s.name).includes(normalizeArabic(searchQuery)) ||
        s.number.includes(searchQuery) ||
        normalizeArabic(s.rank).includes(normalizeArabic(searchQuery));
      return matchTeam && matchQuery;
    });
  }, [shooters, selectedTeam, searchQuery]);

  // Group filtered shooters by team
  const groupedByTeam = useMemo(() => {
    const map: Record<string, Shooter[]> = {};
    filtered.forEach((s) => {
      const t = s.team || 'بدون فريق';
      if (!map[t]) map[t] = [];
      map[t].push(s);
    });
    return map;
  }, [filtered]);

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingShooterId(null);
    setFormName('');
    setFormRank('');
    setFormNumber('');
    setFormTeam(teams[0] || 'فريق 1');
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (shooter: Shooter) => {
    setEditingShooterId(shooter.id);
    setFormName(shooter.name);
    setFormRank(shooter.rank || '');
    setFormNumber(shooter.number || '');
    setFormTeam(shooter.team || 'فريق 1');
    setIsFormOpen(true);
  };

  // Submit Save/Edit shooter
  const handleSaveShooter = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    const trimmedNumber = formNumber.trim();
    const trimmedRank = formRank.trim();
    const trimmedTeam = formTeam.trim() || 'فريق 1';

    if (!trimmedName) {
      showToast('الرجاء كتابة اسم الرامي!', 'error');
      return;
    }

    // Check duplicate badge number
    if (trimmedNumber) {
      const isDuplicate = shooters.some(
        (s) => s.number === trimmedNumber && s.id !== editingShooterId
      );
      if (isDuplicate) {
        showToast('رقم الرامي مسجل مسبقاً لررامي آخر!', 'error');
        return;
      }
    }

    if (editingShooterId) {
      // Edit
      const updated = shooters.map((s) =>
        s.id === editingShooterId
          ? {
              ...s,
              name: trimmedName,
              rank: trimmedRank,
              number: trimmedNumber,
              team: trimmedTeam,
            }
          : s
      );
      onSaveShooters(updated);
      showToast('تم تعديل بيانات الرامي بنجاح!', 'success');
    } else {
      // Add
      const newShooter: Shooter = {
        id: `shooter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        rank: trimmedRank,
        number: trimmedNumber,
        team: trimmedTeam,
      };
      onSaveShooters([...shooters, newShooter]);
      showToast('تمت إضافة الرامي بنجاح!', 'success');
    }

    setIsFormOpen(false);
  };

  // Handle Excel file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importShootersFromExcel(file, shooters);
      if (res.importedCount > 0) {
        onSaveShooters([...shooters, ...res.newShooters]);
        let msg = `تم استيراد ${res.importedCount} رامي بنجاح!`;
        if (res.duplicateNumbers.length > 0) {
          msg += ` (تم تخطي ${res.duplicateNumbers.length} رقم مكرر)`;
        }
        showToast(msg, 'success');
      } else {
        showToast('لم يتم العثور على رماة جدد في الملف!', 'info');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء قراءة الملف';
      showToast(errorMsg, 'error');
    }

    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm delete all shooters
  const handleConfirmDeleteAll = () => {
    onClearAllShooters(deleteScoresAlso);
    setIsDeleteAllModalOpen(false);
    showToast('تم حذف جميع أسماء الرماة بنجاح!', 'success');
  };

  // Confirm single shooter delete
  const handleConfirmSingleDelete = () => {
    if (shooterToDelete) {
      onDeleteSingleShooter(shooterToDelete.id);
      showToast(`تم حذف الرامي "${shooterToDelete.name}" بنجاح!`, 'success');
      setShooterToDelete(null);
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
          <h1 className="text-lg font-black text-white">الرماة</h1>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-700 tabular-nums">
            {shooters.length}
          </span>
        </div>

        {/* Action Buttons cluster */}
        <div className="flex items-center gap-2">
          {/* USER REQUESTED FEATURE: Delete All Shooters Button */}
          <button
            onClick={() => setIsDeleteAllModalOpen(true)}
            disabled={shooters.length === 0}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all min-h-[40px] min-w-[40px] ${
              shooters.length === 0
                ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500/50 shadow-sm'
            }`}
            title="حذف جميع أسماء الرماة"
            aria-label="حذف جميع أسماء الرماة"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
          </button>

          {/* Import Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="استيراد رماة من Excel"
            aria-label="استيراد رماة من Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Add Shooter */}
          <button
            onClick={handleOpenAdd}
            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="إضافة رامي جديد"
            aria-label="إضافة رامي جديد"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Search & Team Filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن رامي بالاسم أو الرقم أو الرتبة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        {teams.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTeam('')}
              className={`px-3 py-1 text-xs rounded-xl whitespace-nowrap transition-colors min-h-[36px] ${
                selectedTeam === ''
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              الكل ({shooters.length})
            </button>
            {teams.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTeam(t)}
                className={`px-3 py-1 text-xs rounded-xl whitespace-nowrap transition-colors min-h-[36px] ${
                  selectedTeam === t
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t} ({shooters.filter((s) => s.team === t).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shooters List */}
      {shooters.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800 p-6 my-4">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">قائمة الرماة فارغة</p>
          <p className="text-xs text-slate-400 mb-4">
            أضف رماة جدد أو قم باستيراد جدول الرماة من ملف Excel
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة رامي</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span>استيراد Excel</span>
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
          لا توجد نتائج تطابق البحث
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByTeam).map(([teamName, teamShooters]) => (
            <div key={teamName} className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-amber-400 border-b border-slate-800 pb-1">
                <span>{teamName}</span>
                <span className="text-slate-400 tabular-nums">{teamShooters.length} رامي</span>
              </div>

              <div className="space-y-2">
                {teamShooters.map((shooter) => {
                  const shooterScoresCount = scores.filter(
                    (sc) => sc.shooterId === shooter.id
                  ).length;

                  return (
                    <div
                      key={shooter.id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-sm hover:border-slate-600 transition-all"
                    >
                      <div className="flex-1 pr-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-base">
                            {shooter.name}
                          </span>
                          {shooterScoresCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                              <Award className="w-3 h-3" />
                              <span>{shooterScoresCount} مرحلة</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          {shooter.rank && <span>{shooter.rank}</span>}
                          {shooter.rank && <span>·</span>}
                          <span>
                            رقم: <strong className="text-slate-200 tabular-nums">{shooter.number || '-'}</strong>
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">{shooter.team}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pl-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(shooter)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="تعديل بيانات الرامي"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShooterToDelete(shooter)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="حذف الرامي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER REQUESTED: Delete All Shooters Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        title="حذف جميع أسماء الرماة"
        message={`هل أنت متأكد من حذف جميع أسماء الرماة المسجلين في التطبيق (${shooters.length} رامي)؟ لن يمكنك التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف جميع الرماة"
        cancelText="إلغاء التراجع"
        isDanger={true}
        extraOptionLabel="حذف جميع النتائج والدرجات المسجلة لهؤلاء الرماة أيضاً"
        extraOptionChecked={deleteScoresAlso}
        onExtraOptionChange={setDeleteScoresAlso}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setIsDeleteAllModalOpen(false)}
      />

      {/* Single Shooter Delete Confirmation */}
      <ConfirmModal
        isOpen={!!shooterToDelete}
        title="حذف رامي"
        message={`هل أنت متأكد من حذف الرامي "${shooterToDelete?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        isDanger={true}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setShooterToDelete(null)}
      />

      {/* Add / Edit Shooter Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              <span>{editingShooterId ? 'تعديل بيانات رامي' : 'إضافة رامي جديد'}</span>
            </h3>

            <form onSubmit={handleSaveShooter} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الاسم الكامل <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد سالم اليافعي"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الرتبة
                  </label>
                  <input
                    type="text"
                    placeholder="ملازم أول / نقيب..."
                    value={formRank}
                    onChange={(e) => setFormRank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الرقم العسكري / الشارة
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 101"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الفريق
                </label>
                <input
                  type="text"
                  list="teams-list"
                  placeholder="مثال: فريق الصقور"
                  value={formTeam}
                  onChange={(e) => setFormTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <datalist id="teams-list">
                  {teams.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
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
                  <span>حفظ البيانات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
