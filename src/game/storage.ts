import type { QuickSaveData, StageId, StageRecord } from '../types/game';

const CAMPAIGN_KEY = 'saidi_commandos_campaign_v1';
const QUICKSAVE_KEY = 'saidi_commandos_quicksave_v1';

const DEFAULT_PROGRESS: Record<StageId, StageRecord> = {
  village: { completed: false, bestTimeSec: null, bestAlerts: null },
  camp: { completed: false, bestTimeSec: null, bestAlerts: null },
  farms: { completed: false, bestTimeSec: null, bestAlerts: null },
  mountain: { completed: false, bestTimeSec: null, bestAlerts: null },
};

export function loadCampaignProgress(): Record<StageId, StageRecord> {
  try {
    const raw = localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return structuredClone(DEFAULT_PROGRESS);
    const parsed = JSON.parse(raw) as Partial<Record<StageId, StageRecord>>;
    return {
      village: parsed.village ?? { ...DEFAULT_PROGRESS.village },
      camp: parsed.camp ?? { ...DEFAULT_PROGRESS.camp },
      farms: parsed.farms ?? { ...DEFAULT_PROGRESS.farms },
      mountain: parsed.mountain ?? { ...DEFAULT_PROGRESS.mountain },
    };
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveStageCompletion(
  stageId: StageId,
  elapsedSec: number,
  alerts: number,
): Record<StageId, StageRecord> {
  const prog = loadCampaignProgress();
  const prev = prog[stageId];
  prog[stageId] = {
    completed: true,
    bestTimeSec:
      prev.bestTimeSec === null ? elapsedSec : Math.min(prev.bestTimeSec, elapsedSec),
    bestAlerts:
      prev.bestAlerts === null ? alerts : Math.min(prev.bestAlerts, alerts),
  };
  try {
    localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(prog));
  } catch {
    // Ignore storage quota errors
  }
  return prog;
}

export function writeQuickSave(data: QuickSaveData): boolean {
  try {
    localStorage.setItem(QUICKSAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function readQuickSave(): QuickSaveData | null {
  try {
    const raw = localStorage.getItem(QUICKSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuickSaveData;
  } catch {
    return null;
  }
}
