export interface DailyStats {
  date: string; // "YYYY-MM-DD"
  reviews: number;
  studyTimeMs: number;
  correctRate: number;
}

export interface MaturityBucket {
  range: string; // e.g. "0-7"
  count: number;
}

export interface DeckStats {
  new: number;
  learning: number;
  review: number;
  suspended: number;
  total: number;
}

export interface ChildDeckData {
  name: string;
  dailyStats: DailyStats[];
}

export interface DeckData {
  name: string;
  slug: string;
  stats: DeckStats;
  maturityDistribution: MaturityBucket[];
  dailyStats: DailyStats[];
  children: ChildDeckData[];
}

export interface AnkiData {
  fetchedAt: string;
  decks: DeckData[];
}
