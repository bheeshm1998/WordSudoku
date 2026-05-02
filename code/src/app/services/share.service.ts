import { Injectable } from '@angular/core';

export interface ShareData {
  boardSize: number;
  difficulty: string;
  timeTaken: string;
  board: { letter: string; isLocked: boolean }[][];
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  /**
   * Generate the Wordle-style text share content
   */
  generateShareText(data: ShareData): string {
    const today = new Date();
    const dateStr = this.formatDate(today);
    
    // Format time (e.g., "01:21" from "01:21.3")
    const timeParts = data.timeTaken.split('.');
    const timeFormatted = timeParts[0]; // Remove milliseconds

    const text = `Word Sudoku
${data.boardSize}x${data.boardSize} · ${this.capitalizeDifficulty(data.difficulty)}
⏱ ${timeFormatted}
Solved on ${dateStr}

wordsudoku.xyz`;

    return text;
  }

  /**
   * Generate emoji grid representation of the board
   */
  generateEmojiGrid(board: { letter: string; isLocked: boolean }[][]): string {
    if (!board || board.length === 0) return '';

    let grid = '\n';
    for (const row of board) {
      for (const cell of row) {
        // 🟩 for locked cells (prefilled), ⬜ for user-filled cells
        grid += cell.isLocked ? '🟩' : '⬜';
      }
      grid += '\n';
    }
    return grid;
  }

  /**
   * Generate full share text with emoji grid
   */
  generateShareTextWithGrid(data: ShareData): string {
    const baseText = this.generateShareText(data);
    const emojiGrid = this.generateEmojiGrid(data.board);
    return baseText + emojiGrid;
  }

  /**
   * Check if Web Share API is supported (mobile devices)
   */
  isShareSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  /**
   * Share using native share sheet (mobile)
   */
  async shareViaNative(shareData: { title: string; text: string }): Promise<boolean> {
    if (!this.isShareSupported()) {
      return false;
    }

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Copy text to clipboard (desktop)
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackErr) {
        console.error('Failed to copy to clipboard:', fallbackErr);
        return false;
      }
    }
  }

  /**
   * Format date as "May 2"
   */
  private formatDate(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  /**
   * Capitalize difficulty string
   */
  private capitalizeDifficulty(difficulty: string): string {
    if (!difficulty) return '';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  }
}