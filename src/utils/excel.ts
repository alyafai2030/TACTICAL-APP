import * as XLSX from 'xlsx';
import { Shooter, ShooterScore, Stage } from '../types';
import { normalizeArabic } from './storage';

export interface ImportShootersResult {
  importedCount: number;
  duplicateNumbers: string[];
  newShooters: Shooter[];
}

export async function importShootersFromExcel(
  file: File,
  existingShooters: Shooter[]
): Promise<ImportShootersResult> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames.length) {
    throw new Error('الملف لا يحتوي على أي صفحات بيانات!');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (jsonData.length === 0) {
    throw new Error('الملف فارغ أو لا يحتوي على بيانات صالحة!');
  }

  const headers = (jsonData[0] as string[]).map((h) =>
    (h ?? '').toString().trim().toLowerCase()
  );
  const dataRows = jsonData.slice(1) as (string | number)[][];

  // Column matching
  const findCol = (aliases: string[], fallbackIdx: number): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h.includes(alias.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return fallbackIdx;
  };

  const nameCol = findCol(['الاسم', 'اسم الرامي', 'name', 'full name'], 0);
  const rankCol = findCol(['الرتبة', 'رتبة', 'rank'], 1);
  const numberCol = findCol(['الرقم', 'رقم', 'number', 'badge', 'id'], 2);
  const teamCol = findCol(['الفريق', 'فريق', 'team'], 3);

  const duplicateNumbers: string[] = [];
  const addedShooters: Shooter[] = [];
  const existingNumbers = new Set(existingShooters.map((s) => s.number.trim()).filter(Boolean));

  dataRows.forEach((row, rowIdx) => {
    const rawName = (row[nameCol] ?? '').toString().trim();
    const rawNumber = (row[numberCol] ?? '').toString().trim();
    const rawRank = (row[rankCol] ?? '').toString().trim();
    const rawTeam = (row[teamCol] ?? '').toString().trim() || 'فريق 1';

    if (!rawName && !rawNumber) return; // skip empty rows

    if (rawNumber && existingNumbers.has(rawNumber)) {
      duplicateNumbers.push(rawNumber);
      return;
    }

    if (rawName) {
      if (rawNumber) existingNumbers.add(rawNumber);
      addedShooters.push({
        id: `shooter-${Date.now()}-${rowIdx}-${Math.random().toString(36).substring(2, 7)}`,
        name: rawName,
        rank: rawRank,
        number: rawNumber,
        team: rawTeam,
      });
    }
  });

  return {
    importedCount: addedShooters.length,
    duplicateNumbers,
    newShooters: addedShooters,
  };
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportResultsCSV(
  scores: Array<{
    rank: number;
    shooterName: string;
    shooterRank: string;
    shooterNumber: string;
    team: string;
    stageName: string;
    time: string;
    totalScore: number;
    hitFactor: string;
    percentage: string;
    result: string;
  }>,
  stageTitle: string
): void {
  const headers = ['ت', 'اسم الرامي', 'الرتبة', 'الرقم', 'الفريق', 'المرحلة', 'الوقت', 'النقاط', 'Hit Factor', 'النسبة المئوية', 'النتيجة النهائية'];
  const rows = scores.map((s) => [
    s.rank,
    `"${s.shooterName.replace(/"/g, '""')}"`,
    `"${s.shooterRank.replace(/"/g, '""')}"`,
    `"${s.shooterNumber.replace(/"/g, '""')}"`,
    `"${s.team.replace(/"/g, '""')}"`,
    `"${s.stageName.replace(/"/g, '""')}"`,
    s.time,
    s.totalScore,
    s.hitFactor,
    `"${s.percentage}%"`,
    s.result,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const safeTitle = (stageTitle || 'جميع_المراحل').replace(/[\s/\\?%*:|"<>]/g, '_');
  downloadCSV(csv, `نتائج_الرماية_${safeTitle}.csv`);
}

export function exportShootingDetailsCSV(
  details: Array<{
    rank: number;
    shooterRank: string;
    shooterNumber: string;
    shooterName: string;
    team: string;
    stageName: string;
    A: number;
    C: number;
    D: number;
    M: number;
    NS: number;
    totalScore: number;
    time: string;
    hitFactor: string;
    percentage: string;
    result: string;
  }>,
  stageTitle: string
): void {
  const headers = ['ت', 'الرتبة', 'الرقم', 'اسم الرامي', 'الفريق', 'المرحلة', 'A (5)', 'C (4)', 'D (2)', 'M (0)', 'NS (-5)', 'النقاط', 'الوقت', 'Hit Factor', 'النسبة%', 'النتيجة'];
  const rows = details.map((d) => [
    d.rank,
    `"${d.shooterRank.replace(/"/g, '""')}"`,
    `"${d.shooterNumber.replace(/"/g, '""')}"`,
    `"${d.shooterName.replace(/"/g, '""')}"`,
    `"${d.team.replace(/"/g, '""')}"`,
    `"${d.stageName.replace(/"/g, '""')}"`,
    d.A,
    d.C,
    d.D,
    d.M,
    d.NS,
    d.totalScore,
    d.time,
    d.hitFactor,
    `"${d.percentage}%"`,
    d.result,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const safeTitle = (stageTitle || 'جميع_المراحل').replace(/[\s/\\?%*:|"<>]/g, '_');
  downloadCSV(csv, `تفاصيل_الرماية_${safeTitle}.csv`);
}

export async function importResultsFromExcel(
  file: File,
  shooters: Shooter[],
  stages: Stage[],
  existingScores: ShooterScore[]
): Promise<{ importedCount: number; updatedScores: ShooterScore[] }> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames.length) {
    throw new Error('الملف لا يحتوي على صفحات بيانات!');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (jsonData.length === 0) {
    throw new Error('الملف فارغ!');
  }

  const headers = (jsonData[0] as string[]).map((h) =>
    (h ?? '').toString().trim().toLowerCase()
  );
  const rows = jsonData.slice(1) as (string | number)[][];

  const findCol = (aliases: string[], fallbackIdx: number): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h.includes(alias.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return fallbackIdx;
  };

  const nameCol = findCol(['اسم الرامي', 'الاسم', 'name'], 0);
  const stageCol = findCol(['المرحلة', 'مرحلة', 'stage'], 1);
  const timeCol = findCol(['الوقت', 'time'], 2);
  const scoreCol = findCol(['النقاط', 'points', 'score'], 3);
  const hfCol = findCol(['hit factor', 'hit-f', 'hf'], 4);

  const updated = [...existingScores];
  let importedCount = 0;

  rows.forEach((r) => {
    const rawName = (r[nameCol] ?? '').toString().trim();
    const rawStage = (r[stageCol] ?? '').toString().trim();
    if (!rawName || !rawStage) return;

    const matchedShooter = shooters.find(
      (s) => normalizeArabic(s.name) === normalizeArabic(rawName)
    );
    if (!matchedShooter) return;

    const parsedTime = parseFloat((r[timeCol] ?? '').toString()) || 10.0;
    const parsedScore = parseInt((r[scoreCol] ?? '').toString(), 10) || 0;
    const parsedHf = parseFloat((r[hfCol] ?? '').toString()) || (parsedTime > 0 ? parsedScore / parsedTime : 0);

    const existIdx = updated.findIndex(
      (s) => s.shooterId === matchedShooter.id && s.stageId === rawStage
    );

    const scoreItem: ShooterScore = {
      shooterId: matchedShooter.id,
      stageId: rawStage,
      time: parsedTime.toFixed(2),
      procedurals: 0,
      totalScore: parsedScore,
      hitFactor: parseFloat(parsedHf.toFixed(2)),
      scores: [],
    };

    if (existIdx !== -1) {
      updated[existIdx] = scoreItem;
    } else {
      updated.push(scoreItem);
    }
    importedCount++;
  });

  return {
    importedCount,
    updatedScores: updated,
  };
}
