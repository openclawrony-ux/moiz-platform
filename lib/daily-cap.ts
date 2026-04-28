export interface DailyCapOptions {
  capUsd: number;
  now?: () => Date;
}

export interface DailyCapState {
  dayUtc: string;
  totalUsd: number;
}

export interface DailyCap {
  hasBudget(): boolean;
  add(costUsd: number): void;
  snapshot(): DailyCapState;
}

function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function createDailyCap(options: DailyCapOptions): DailyCap {
  const now = options.now ?? (() => new Date());
  let state: DailyCapState = { dayUtc: utcDay(now()), totalUsd: 0 };

  function rollIfNeeded(): void {
    const today = utcDay(now());
    if (today !== state.dayUtc) {
      state = { dayUtc: today, totalUsd: 0 };
    }
  }

  return {
    hasBudget(): boolean {
      rollIfNeeded();
      return state.totalUsd < options.capUsd;
    },
    add(costUsd: number): void {
      rollIfNeeded();
      state = { ...state, totalUsd: state.totalUsd + costUsd };
    },
    snapshot(): DailyCapState {
      rollIfNeeded();
      return { ...state };
    },
  };
}

let defaultCap: DailyCap | null = null;

export function defaultDailyCap(): DailyCap {
  if (!defaultCap) {
    const raw = process.env.DAILY_USD_CAP;
    const parsed = raw ? Number.parseFloat(raw) : NaN;
    const capUsd = Number.isFinite(parsed) && parsed > 0 ? parsed : 1.5;
    defaultCap = createDailyCap({ capUsd });
  }
  return defaultCap;
}

export function resetDefaultDailyCapForTests(): void {
  defaultCap = null;
}
