import { Injectable } from '@angular/core';
import { Cell } from '../model';

export interface Conflict {
  type: 'duplicate' | 'word';
  cells: { row: number; col: number }[];
  word?: string;
  message?: string;
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
}

@Injectable({
  providedIn: 'root'
})
export class ConflictDetectionService {
  private dictionaryWords: Set<string> = new Set();

  setDictionary(dictionary: Set<string>): void {
    this.dictionaryWords = dictionary;
  }

  /**
   * Detects all conflicts on the board:
   * Type A: Letter repeated in same row or column
   * Type B: Real word formed in any row or column (including reversed)
   */
  detectAllConflicts(board: Cell[][], boardSize: number): ConflictDetectionResult {
    const conflicts: Conflict[] = [];

    // Check for duplicates in rows
    for (let row = 0; row < boardSize; row++) {
      const rowConflicts = this.checkRowForDuplicates(board, row, boardSize);
      conflicts.push(...rowConflicts);
    }

    // Check for duplicates in columns
    for (let col = 0; col < boardSize; col++) {
      const colConflicts = this.checkColumnForDuplicates(board, col, boardSize);
      conflicts.push(...colConflicts);
    }

    // Check for real words in rows
    for (let row = 0; row < boardSize; row++) {
      const rowWordConflicts = this.checkRowForWords(board, row, boardSize);
      conflicts.push(...rowWordConflicts);
    }

    // Check for real words in columns
    for (let col = 0; col < boardSize; col++) {
      const colWordConflicts = this.checkColumnForWords(board, col, boardSize);
      conflicts.push(...colWordConflicts);
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Get all cells that are part of any conflict
   */
  getConflictCells(board: Cell[][], boardSize: number): Set<string> {
    const conflictCells = new Set<string>();
    const result = this.detectAllConflicts(board, boardSize);

    for (const conflict of result.conflicts) {
      for (const cell of conflict.cells) {
        conflictCells.add(`${cell.row},${cell.col}`);
      }
    }

    return conflictCells;
  }

  /**
   * Get only the cells involved in duplicate-letter conflicts (no word checks).
   * Used for live in-progress feedback so word formations don't trigger alerts
   * until the board is fully filled.
   */
  getDuplicateConflictCells(board: Cell[][], boardSize: number): Set<string> {
    const conflictCells = new Set<string>();

    for (let row = 0; row < boardSize; row++) {
      const rowConflicts = this.checkRowForDuplicates(board, row, boardSize);
      for (const conflict of rowConflicts) {
        for (const cell of conflict.cells) {
          conflictCells.add(`${cell.row},${cell.col}`);
        }
      }
    }

    for (let col = 0; col < boardSize; col++) {
      const colConflicts = this.checkColumnForDuplicates(board, col, boardSize);
      for (const conflict of colConflicts) {
        for (const cell of conflict.cells) {
          conflictCells.add(`${cell.row},${cell.col}`);
        }
      }
    }

    return conflictCells;
  }

  /**
   * Check a specific row for duplicate letters
   */
  private checkRowForDuplicates(board: Cell[][], row: number, boardSize: number): Conflict[] {
    const conflicts: Conflict[] = [];
    const letterPositions: Map<string, { row: number; col: number }[]> = new Map();

    for (let col = 0; col < boardSize; col++) {
      const letter = board[row][col].letter.toUpperCase();
      if (letter) {
        if (!letterPositions.has(letter)) {
          letterPositions.set(letter, []);
        }
        letterPositions.get(letter)!.push({ row, col });
      }
    }

    // Find duplicates (letter appears more than once in the row)
    for (const [letter, positions] of letterPositions.entries()) {
      if (positions.length > 1) {
        conflicts.push({
          type: 'duplicate',
          cells: positions,
          message: `${letter} is repeated in row ${row + 1}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Check a specific column for duplicate letters
   */
  private checkColumnForDuplicates(board: Cell[][], col: number, boardSize: number): Conflict[] {
    const conflicts: Conflict[] = [];
    const letterPositions: Map<string, { row: number; col: number }[]> = new Map();

    for (let row = 0; row < boardSize; row++) {
      const letter = board[row][col].letter.toUpperCase();
      if (letter) {
        if (!letterPositions.has(letter)) {
          letterPositions.set(letter, []);
        }
        letterPositions.get(letter)!.push({ row, col });
      }
    }

    // Find duplicates (letter appears more than once in the column)
    for (const [letter, positions] of letterPositions.entries()) {
      if (positions.length > 1) {
        conflicts.push({
          type: 'duplicate',
          cells: positions,
          message: `${letter} is repeated in column ${col + 1}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Check a specific row for real words (length >= 3)
   */
  private checkRowForWords(board: Cell[][], row: number, boardSize: number): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check left-to-right
    for (let startCol = 0; startCol <= boardSize - 3; startCol++) {
      for (let endCol = startCol + 3; endCol <= boardSize; endCol++) {
        const word = this.constructWordFromCells(board, row, startCol, row, endCol - 1);
        const validation = this.validateWord(word);
        if (validation.isRealWord) {
          conflicts.push({
            type: 'word',
            cells: this.getCellsInRange(row, startCol, row, endCol - 1),
            word: validation.reversed ? this.reverseWord(word) : word,
            message: validation.reversed ? `${this.reverseWord(word)} exists (reversed)` : `${word} exists`
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check a specific column for real words (length >= 3)
   */
  private checkColumnForWords(board: Cell[][], col: number, boardSize: number): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check top-to-bottom
    for (let startRow = 0; startRow <= boardSize - 3; startRow++) {
      for (let endRow = startRow + 3; endRow <= boardSize; endRow++) {
        const word = this.constructWordFromCells(board, startRow, col, endRow - 1, col);
        const validation = this.validateWord(word);
        if (validation.isRealWord) {
          conflicts.push({
            type: 'word',
            cells: this.getCellsInRange(startRow, col, endRow - 1, col),
            word: validation.reversed ? this.reverseWord(word) : word,
            message: validation.reversed ? `${this.reverseWord(word)} exists (reversed)` : `${word} exists`
          });
        }
      }
    }

    return conflicts;
  }

  private constructWordFromCells(board: Cell[][], startRow: number, startCol: number, endRow: number, endCol: number): string {
    let word = '';
    if (startRow === endRow) {
      for (let col = startCol; col <= endCol; col++) {
        word += board[startRow][col].letter;
      }
    } else if (startCol === endCol) {
      for (let row = startRow; row <= endRow; row++) {
        word += board[row][startCol].letter;
      }
    }
    return word.toLowerCase();
  }

  private getCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    if (startRow === endRow) {
      for (let col = startCol; col <= endCol; col++) {
        cells.push({ row: startRow, col });
      }
    } else if (startCol === endCol) {
      for (let row = startRow; row <= endRow; row++) {
        cells.push({ row, col: startCol });
      }
    }
    return cells;
  }

  private validateWord(word: string): { isRealWord: boolean; reversed: boolean } {
    if (word.length < 3) {
      return { isRealWord: false, reversed: false };
    }

    if (this.dictionaryWords.has(word)) {
      return { isRealWord: true, reversed: false };
    }

    const reversed = this.reverseWord(word);
    if (this.dictionaryWords.has(reversed)) {
      return { isRealWord: true, reversed: true };
    }

    return { isRealWord: false, reversed: false };
  }

  private reverseWord(word: string): string {
    return word.split('').reverse().join('');
  }

  private hasDuplicateCharacters(word: string): string {
    const charSet = new Set();
    for (const char of word) {
      if (charSet.has(char)) {
        return char;
      }
      charSet.add(char);
    }
    return '';
  }
}