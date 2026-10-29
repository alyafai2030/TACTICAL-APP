import { Shooter, Stage, ShooterScore } from '../types';

const INITIAL_STAGES: Stage[] = [
  {
    id: 'stage-1',
    name: 'المرحلة 1 - الرماية السريعة',
    date: '2026-10-25',
    rounds: 10,
    targets: 5,
    image: '/1.png'
  },
  {
    id: 'stage-2',
    name: 'المرحلة 2 - الحواجز التكتيكية',
    date: '2026-10-26',
    rounds: 16,
    targets: 8,
    image: '/2.png'
  },
  {
    id: 'stage-3',
    name: 'المرحلة 3 - المسافات المتغيرة',
    date: '2026-10-28',
    rounds: 12,
    targets: 6,
    image: '/3.png'
  }
];

const INITIAL_SHOOTERS: Shooter[] = [
  {
    id: 'shooter-1',
    name: 'محمد سالم اليافعي',
    rank: 'ملازم أول',
    number: '101',
    team: 'فريق الصقور'
  },
  {
    id: 'shooter-2',
    name: 'أحمد فهد الدوسري',
    rank: 'نقيب',
    number: '102',
    team: 'فريق الصقور'
  },
  {
    id: 'shooter-3',
    name: 'سلطان خالد العتيبي',
    rank: 'رائد',
    number: '103',
    team: 'فريق النخبة'
  },
  {
    id: 'shooter-4',
    name: 'عمر فهد القحطاني',
    rank: 'ملازم',
    number: '104',
    team: 'فريق النخبة'
  },
  {
    id: 'shooter-5',
    name: 'عبدالله يوسف المنصوري',
    rank: 'رقيب أول',
    number: '105',
    team: 'فريق الفرسان'
  }
];

const INITIAL_SCORES: ShooterScore[] = [
  {
    shooterId: 'shooter-1',
    stageId: 'المرحلة 1 - الرماية السريعة',
    time: '8.45',
    procedurals: 0,
    totalScore: 48,
    hitFactor: 5.68,
    scores: [
      { target: 1, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 2, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 3, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 4, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 5, A: 2, C: 0, D: 0, M: 0, NS: 0 }
    ]
  },
  {
    shooterId: 'shooter-2',
    stageId: 'المرحلة 1 - الرماية السريعة',
    time: '9.20',
    procedurals: 0,
    totalScore: 46,
    hitFactor: 5.00,
    scores: [
      { target: 1, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 2, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 3, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 4, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 5, A: 2, C: 0, D: 0, M: 0, NS: 0 }
    ]
  },
  {
    shooterId: 'shooter-3',
    stageId: 'المرحلة 1 - الرماية السريعة',
    time: '10.15',
    procedurals: 0,
    totalScore: 44,
    hitFactor: 4.33,
    scores: [
      { target: 1, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 2, A: 2, C: 0, D: 0, M: 0, NS: 0 },
      { target: 3, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 4, A: 1, C: 1, D: 0, M: 0, NS: 0 },
      { target: 5, A: 2, C: 0, D: 0, M: 0, NS: 0 }
    ]
  }
];

export function getStoredStages(): Stage[] {
  try {
    const data = localStorage.getItem('stages');
    if (!data) {
      localStorage.setItem('stages', JSON.stringify(INITIAL_STAGES));
      return INITIAL_STAGES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_STAGES;
  }
}

export function saveStages(stages: Stage[]): void {
  localStorage.setItem('stages', JSON.stringify(stages));
}

export function getStoredShooters(): Shooter[] {
  try {
    const data = localStorage.getItem('shooters');
    if (!data) {
      localStorage.setItem('shooters', JSON.stringify(INITIAL_SHOOTERS));
      return INITIAL_SHOOTERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SHOOTERS;
  }
}

export function saveShooters(shooters: Shooter[]): void {
  localStorage.setItem('shooters', JSON.stringify(shooters));
}

export function getStoredScores(): ShooterScore[] {
  try {
    const data = localStorage.getItem('shooterScores');
    if (!data) {
      localStorage.setItem('shooterScores', JSON.stringify(INITIAL_SCORES));
      return INITIAL_SCORES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SCORES;
  }
}

export function saveScores(scores: ShooterScore[]): void {
  localStorage.setItem('shooterScores', JSON.stringify(scores));
}

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F]/g, '') // Remove tashkeel/diacritics
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getRemainingStoragePercentage(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    const max = 5 * 1024 * 1024; // 5MB standard localStorage
    const rem = Math.max(0, max - total);
    return parseFloat(((rem / max) * 100).toFixed(2));
  } catch {
    return 99.5;
  }
}
