import React from 'react';
import { Home, Edit3, Layers, Users, BarChart3 } from 'lucide-react';
import { PageId } from '../types';

interface BottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  // Hide navigation during the active scoring pad so user has complete focus & screen space
  if (currentPage === 'add-score') {
    return null;
  }

  const items = [
    {
      id: 'home' as PageId,
      label: 'الرئيسية',
      icon: Home,
      isActive: currentPage === 'home',
    },
    {
      id: 'enter-scores' as PageId,
      label: 'إدخال النتائج',
      icon: Edit3,
      isActive: currentPage === 'enter-scores' || currentPage === 'stage-detail',
    },
    {
      id: 'build-stages' as PageId,
      label: 'المراحل',
      icon: Layers,
      isActive: currentPage === 'build-stages' || currentPage === 'add-stage',
    },
    {
      id: 'edit-shooters' as PageId,
      label: 'الرماة',
      icon: Users,
      isActive: currentPage === 'edit-shooters' || currentPage === 'add-shooter',
    },
    {
      id: 'view-results' as PageId,
      label: 'النتائج',
      icon: BarChart3,
      isActive: currentPage === 'view-results' || currentPage === 'shooting-details',
    },
  ];

  return (
    <nav 
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 transition-all shadow-lg"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all ${
                item.isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110' : ''}`} />
                {item.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </div>
              <span className={`text-[11px] mt-1 whitespace-nowrap tracking-tight ${item.isActive ? 'font-bold text-amber-400' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
