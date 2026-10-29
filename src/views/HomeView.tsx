import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Play, Users, Layers, Award, HardDrive } from 'lucide-react';
import { PageId, Stage, Shooter, ShooterScore } from '../types';
import { soundEffects } from '../utils/audio';
import { getRemainingStoragePercentage } from '../utils/storage';
import { getAssetUrl } from '../utils/assets';

interface HomeViewProps {
  stages: Stage[];
  shooters: Shooter[];
  scores: ShooterScore[];
  onNavigate: (page: PageId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stages,
  shooters,
  scores,
  onNavigate,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundEffects.isEnabled());
  const [storagePerc, setStoragePerc] = useState(getRemainingStoragePercentage());

  const slides = [
    { src: getAssetUrl('1.png'), alt: 'رماية تكتيكية - وضعية الرمي' },
    { src: getAssetUrl('2.png'), alt: 'رماية تكتيكية - تبديل المخزن أثناء الحركة' },
    { src: getAssetUrl('3.png'), alt: 'رماية تكتيكية - التصويب الدقيق' },
  ];

  useEffect(() => {
    setStoragePerc(getRemainingStoragePercentage());
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.setSoundEnabled(next);
    if (next) soundEffects.playStartBuzzer();
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-md mx-auto text-slate-100 flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black tracking-wide text-white font-serif">
              الرماية التكتيكية
            </h1>
          </div>
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'صوت صافرة الرماية مفعّل' : 'صوت الصافرة مكتوم'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xs:inline">{soundEnabled ? 'الصافرة نشطة' : 'صامت'}</span>
          </button>
        </div>

        {/* Tactical Emblem */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-amber-500/20 blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <img
              src={getAssetUrl('tr.png')}
              alt="شعار الرماية التكتيكية"
              className="relative w-36 h-36 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getAssetUrl('assets/aistudio/tr_ca43038f.png');
              }}
            />
          </div>
        </div>

        {/* Action Photo Slideshow */}
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-950 my-3">
          {slides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.src}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentSlide ? 'opacity-90 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />
          
          {/* Indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40'
                }`}
                aria-label={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>الرماة</span>
            </div>
            <div className="text-xl font-extrabold text-white tabular-nums">{shooters.length}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>المراحل</span>
            </div>
            <div className="text-xl font-extrabold text-white tabular-nums">{stages.length}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>النتائج</span>
            </div>
            <div className="text-xl font-extrabold text-white tabular-nums">{scores.length}</div>
          </div>
        </div>

        {/* Storage Bar Indicator */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-300 my-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <span>سعة التخزين المتبقية:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  storagePerc > 50 ? 'bg-emerald-500' : storagePerc > 20 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${storagePerc}%` }}
              />
            </div>
            <span className="font-bold text-sky-300 tabular-nums">{storagePerc}%</span>
          </div>
        </div>

        {/* Fast Action Buttons */}
        <div className="space-y-2 my-4">
          <button
            onClick={() => onNavigate('enter-scores')}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-950/20 transition-all active:scale-[0.99] min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-950/20 rounded-lg">
                <Play className="w-5 h-5 text-slate-950 fill-current" />
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold leading-tight">إدخال النتائج والتوقيت</div>
                <div className="text-xs text-slate-900/80 font-medium">ابدأ احتساب النقاط والـ Hit Factor للمرحلة</div>
              </div>
            </div>
            <span className="text-xl font-bold">←</span>
          </button>

          <button
            onClick={() => onNavigate('view-results')}
            className="w-full flex items-center justify-between p-3.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-semibold rounded-xl transition-all active:scale-[0.99] min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700/50 rounded-lg text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-sm font-bold leading-tight">جدول الترتيب والنتائج</div>
                <div className="text-xs text-slate-400">استعراض تصنيف الرماة ومشاركة التقارير</div>
              </div>
            </div>
            <span className="text-xl text-slate-400">←</span>
          </button>
        </div>
      </div>

      {/* Developer Logo & Signature Footer */}
      <div className="pt-4 border-t border-slate-800/60 flex flex-col items-center justify-center text-center">
        <img
          src={getAssetUrl('my4.png')}
          alt="شعار محمد اليافعي"
          className="w-20 h-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getAssetUrl('assets/aistudio/my4_088c8d7d.png');
          }}
        />
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          تطبيق الرماية التكتيكية &copy; 2026
        </div>
      </div>
    </div>
  );
};
