import { Injectable } from '@angular/core';
import { Difficulty, BOARD_SIZES } from '../constants';

export interface SolveRecord {
  boardSize: number;
  difficulty: Difficulty;
  timeTaken: string; // Format: "MM:SS.s"
  completedAt: string; // ISO date string
}

export interface StatsData {
  totalSolved: number;
  solvedBySize: Record<number, number>;
  solveTimesByConfig: Record<string, number[]>; // key: "boardSize_difficulty"
  bestTimesByConfig: Record<string, string>; // key: "boardSize_difficulty"
  totalTimePlayedMs: number;
  lastPlayedDate: string | null;
  currentStreak: number;
}

const STORAGE_KEY = 'wordSudoku_stats';
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  
  private stats: StatsData;

  constructor() {
    this.stats = this.loadStats();
  }

  private loadStats(): StatsData {
    const defaultStats: StatsData = {
      totalSolved: 0,
      solvedBySize: { 5: 0, 7: 0, 9: 0 },
      solveTimesByConfig: {},
      bestTimesByConfig: {},
      totalTimePlayedMs: 0,
      lastPlayedDate: null,
      currentStreak: 0
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure all required fields exist
        return {
          ...defaultStats,
          ...parsed,
          solvedBySize: { ...defaultStats.solvedBySize, ...parsed.solvedBySize },
          solveTimesByConfig: parsed.solveTimesByConfig || {},
          bestTimesByConfig: parsed.bestTimesByConfig || {}
        };
      } catch (e) {
        console.error('Failed to parse stats from localStorage', e);
      }
    }
    return defaultStats;
  }

  private saveStats(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
  }

  private getConfigKey(boardSize: number, difficulty: Difficulty): string {
    return `${boardSize}_${difficulty}`;
  }

  private parseTimeToMs(timeStr: string): number {
    // Format: "MM:SS.s"
    const parts = timeStr.split(':');
    const minutes = parseInt(parts[0], 10);
    const secondsPart = parts[1].split('.');
    const seconds = parseInt(secondsPart[0], 10);
    const ms = parseInt(secondsPart[1] || '0', 10);
    return minutes * 60 * 1000 + seconds * 1000 + ms;
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  recordSolve(boardSize: number, difficulty: Difficulty, timeTaken: string): void {
    const configKey = this.getConfigKey(boardSize, difficulty);
    const timeMs = this.parseTimeToMs(timeTaken);
    const today = this.getTodayDateString();

    // Update total solved count
    this.stats.totalSolved++;

    // Update solved by size
    if (!this.stats.solvedBySize[boardSize]) {
      this.stats.solvedBySize[boardSize] = 0;
    }
    this.stats.solvedBySize[boardSize]++;

    // Record solve time for average calculation
    if (!this.stats.solveTimesByConfig[configKey]) {
      this.stats.solveTimesByConfig[configKey] = [];
    }
    this.stats.solveTimesByConfig[configKey].push(timeMs);

    // Update best time if applicable
    const currentBest = this.stats.bestTimesByConfig[configKey];
    if (!currentBest || this.parseTimeToMs(timeTaken) < this.parseTimeToMs(currentBest)) {
      this.stats.bestTimesByConfig[configKey] = timeTaken;
    }

    // Update total time played
    this.stats.totalTimePlayedMs += timeMs;

    // Update streak
    this.updateStreak(today);

    this.saveStats();
  }

  private updateStreak(today: string): void {
    const lastPlayed = this.stats.lastPlayedDate;

    if (lastPlayed === today) {
      // Already played today, no streak change
      return;
    } else if (lastPlayed === this.getYesterdayDateString()) {
      // Played yesterday, increment streak
      this.stats.currentStreak++;
    } else if (lastPlayed === null) {
      // First time playing
      this.stats.currentStreak = 1;
    } else {
      // Streak broken (missed a day or first time)
      this.stats.currentStreak = 1;
    }

    this.stats.lastPlayedDate = today;
  }

  getStats(): StatsData {
    return { ...this.stats };
  }

  getAverageTime(boardSize: number, difficulty: Difficulty): string {
    const configKey = this.getConfigKey(boardSize, difficulty);
    const times = this.stats.solveTimesByConfig[configKey];
    
    if (!times || times.length === 0) {
      return '-';
    }

    const sum = times.reduce((a, b) => a + b, 0);
    const avgMs = sum / times.length;
    return this.formatMsToTime(avgMs);
  }

  getBestTime(boardSize: number, difficulty: Difficulty): string {
    const configKey = this.getConfigKey(boardSize, difficulty);
    return this.stats.bestTimesByConfig[configKey] || '-';
  }

  getTotalTimePlayed(): string {
    const ms = this.stats.totalTimePlayedMs;
    // Round up to the next whole minute (e.g., 25s -> 1min, 0s -> 0min)
    const totalMinutes = ms > 0 ? Math.ceil(ms / 60000) : 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}hrs ${minutes}min`;
  }

  getCurrentStreak(): number {
    return this.stats.currentStreak;
  }

  private formatMsToTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
  }

  resetStats(): void {
    this.stats = {
      totalSolved: 0,
      solvedBySize: { 5: 0, 7: 0, 9: 0 },
      solveTimesByConfig: {},
      bestTimesByConfig: {},
      totalTimePlayedMs: 0,
      lastPlayedDate: null,
      currentStreak: 0
    };
    this.saveStats();
  }
}