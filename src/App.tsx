import { useState, useEffect, useCallback } from 'react';
import { PageId, Stage, Shooter, ShooterScore } from './types';
import { 
  getStoredStages, 
  saveStages, 
  getStoredShooters, 
  saveShooters, 
  getStoredScores, 
  saveScores 
} from './utils/storage';
import { ToastContainer, ToastMessage } from './components/Toast';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { EnterScoresView } from './views/EnterScoresView';
import { StageDetailView } from './views/StageDetailView';
import { ScorePadView } from './views/ScorePadView';
import { BuildStagesView } from './views/BuildStagesView';
import { ShootersView } from './views/ShootersView';
import { ResultsView } from './views/ResultsView';
import { ShootingDetailsView } from './views/ShootingDetailsView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [stages, setStages] = useState<Stage[]>(() => getStoredStages());
  const [shooters, setShooters] = useState<Shooter[]>(() => getStoredShooters());
  const [scores, setScores] = useState<ShooterScore[]>(() => getStoredScores());

  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [currentShooter, setCurrentShooter] = useState<Shooter | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to storage on state changes
  useEffect(() => {
    saveStages(stages);
  }, [stages]);

  useEffect(() => {
    saveShooters(shooters);
  }, [shooters]);

  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  // Stage selection for scoring
  const handleSelectStage = (stage: Stage) => {
    setCurrentStage(stage);
    setCurrentPage('stage-detail');
  };

  // Shooter selection for scoring
  const handleSelectShooter = (shooter: Shooter) => {
    setCurrentShooter(shooter);
    setCurrentPage('add-score');
  };

  // Save/Update score
  const handleSaveScore = (score: ShooterScore) => {
    setScores((prev) => {
      const idx = prev.findIndex(
        (s) => s.shooterId === score.shooterId && s.stageId === score.stageId
      );
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = score;
        return copy;
      }
      return [...prev, score];
    });

    showToast('تم حفظ نتيجة الرامي بنجاح!', 'success');
    // Return to stage shooters roster so scorer can pick next shooter
    setCurrentPage('stage-detail');
  };

  // Delete All Shooters (Explicit User Request)
  const handleClearAllShooters = (deleteScoresAlso: boolean) => {
    setShooters([]);
    localStorage.removeItem('shooters');

    if (deleteScoresAlso) {
      setScores([]);
      localStorage.removeItem('shooterScores');
    }
  };

  // Delete single shooter
  const handleDeleteSingleShooter = (id: string) => {
    setShooters((prev) => prev.filter((s) => s.id !== id));
    setScores((prev) => prev.filter((sc) => sc.shooterId !== id));
  };

  // Clear all scores
  const handleClearAllScores = () => {
    setScores([]);
    localStorage.removeItem('shooterScores');
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      <main className="flex-1 w-full">
        {currentPage === 'home' && (
          <HomeView
            stages={stages}
            shooters={shooters}
            scores={scores}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'enter-scores' && (
          <EnterScoresView
            stages={stages}
            shooters={shooters}
            scores={scores}
            onSelectStage={handleSelectStage}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'stage-detail' && (
          <StageDetailView
            currentStage={currentStage}
            shooters={shooters}
            scores={scores}
            onSelectShooter={handleSelectShooter}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'add-score' && (
          <ScorePadView
            currentStage={currentStage}
            currentShooter={currentShooter}
            existingScores={scores}
            onSaveScore={handleSaveScore}
            onBack={() => setCurrentPage('stage-detail')}
          />
        )}

        {currentPage === 'build-stages' && (
          <BuildStagesView
            stages={stages}
            onSaveStages={setStages}
            onNavigate={setCurrentPage}
            showToast={showToast}
          />
        )}

        {currentPage === 'edit-shooters' && (
          <ShootersView
            shooters={shooters}
            scores={scores}
            onSaveShooters={setShooters}
            onClearAllShooters={handleClearAllShooters}
            onDeleteSingleShooter={handleDeleteSingleShooter}
            onNavigate={setCurrentPage}
            showToast={showToast}
          />
        )}

        {currentPage === 'view-results' && (
          <ResultsView
            stages={stages}
            shooters={shooters}
            scores={scores}
            onClearAllScores={handleClearAllScores}
            onNavigate={setCurrentPage}
            showToast={showToast}
          />
        )}

        {currentPage === 'shooting-details' && (
          <ShootingDetailsView
            stages={stages}
            shooters={shooters}
            scores={scores}
            onSaveScores={setScores}
            onNavigate={setCurrentPage}
            showToast={showToast}
          />
        )}
      </main>

      {/* Fixed Navigation Bar */}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}
