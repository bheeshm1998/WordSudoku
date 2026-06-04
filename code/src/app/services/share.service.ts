import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

export interface ShareData {
  boardSize: number;
  difficulty: string | null;
  timeTaken: string;
  board: { letter: string; isLocked: boolean }[][];
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  /**
   * Generate share text with custom message
   */
  generateShareTextWithMessage(data: ShareData): string {
    const timeFormatted = data.timeTaken.split('.')[0];
    return `🔡 Just discovered the coolest twist on Sudoku. It tests your English vocabulary instead of numbers! I finished this board in ${timeFormatted}. Genuinely fun, give it a play and challenge your friends!

wordsudoku.xyz`;
  }

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
        grid += this.getLetterEmoji(cell.letter, cell.isLocked);
      }
      grid += '\n';
    }
    return grid;
  }

  private getLetterEmoji(letter: string, isLocked: boolean): string {
    const upper = letter?.toUpperCase();
    const idx = upper ? upper.charCodeAt(0) - 65 : -1;
    if (idx < 0 || idx > 25) return isLocked ? '🟦' : '⬜';
    // Prefilled: Squared Latin Capital Letters U+1F130-U+1F149 (outlined box, like 🅿️ style)
    // User-filled: Negative Squared Latin Capital U+1F150-U+1F169 (filled box, like 🅰️🅱️ style)
    return String.fromCodePoint(isLocked ? 0x1F130 + idx : 0x1F150 + idx) + '️';
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
   * Capture the board element as a canvas/image
   */
  async captureBoardAsCanvas(boardElement: HTMLElement): Promise<string | null> {
    try {
      const canvas = await html2canvas(boardElement, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true
      });
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Failed to capture board:', err);
      return null;
    }
  }

  /**
   * Share using native share sheet (mobile) with image
   */
  async shareViaNativeWithImage(shareData: { title: string; text: string; imageBase64: string }): Promise<boolean> {
    if (!this.isShareSupported()) {
      return false;
    }

    try {
      const blob = this.dataURLtoBlob(shareData.imageBase64);
      const file = new File([blob], 'word-sudoku-board.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          files: [file]
        });
        return true;
      }

      await navigator.share({
        title: shareData.title,
        text: shareData.text
      });
      return true;
    } catch (err) {
      console.log('Share cancelled or failed:', err);
      return false;
    }
  }

  private dataURLtoBlob(dataURL: string): Blob {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
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
  private capitalizeDifficulty(difficulty: string | null): string {
    if (!difficulty) return 'Standard';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
  }
}