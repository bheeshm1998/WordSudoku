import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Difficulty, BOARD_SIZES, DIFFICULTY_LEVELS } from '../constants';
import { StatsService, StatsData } from '../services/stats.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  stats: StatsData | null = null;
  boardSizes = BOARD_SIZES;
  difficulties = DIFFICULTY_LEVELS;
  
  difficultyLabels: Record<Difficulty, string> = {
    [Difficulty.Easy]: 'Easy',
    [Difficulty.Medium]: 'Medium',
    [Difficulty.Hard]: 'Hard'
  };

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.statsService.getStats();
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('stats-backdrop')) {
      this.onClose();
    }
  }

  getSolvedBySize(size: number): number {
    return this.stats?.solvedBySize[size] || 0;
  }

  getAverageTime(boardSize: number, difficulty: Difficulty): string {
    return this.statsService.getAverageTime(boardSize, difficulty);
  }

  getBestTime(boardSize: number, difficulty: Difficulty): string {
    return this.statsService.getBestTime(boardSize, difficulty);
  }

  getTotalTimePlayed(): string {
    return this.statsService.getTotalTimePlayed();
  }

  getCurrentStreak(): number {
    return this.statsService.getCurrentStreak();
  }

  onResetStats(): void {
    const confirmed = confirm('Are you sure you want to reset all your statistics? This action cannot be undone.');
    if (confirmed) {
      this.statsService.resetStats();
      this.loadStats();
    }
  }
}