import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface HistoryEntry {
  row: number;
  col: number;
  previousLetter: string;
  newLetter: string;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);

  canUndo$ = this.canUndoSubject.asObservable();
  canRedo$ = this.canRedoSubject.asObservable();

  /**
   * Records a cell modification in history.
   * Only called for committed changes (not mid-typing).
   * Pre-filled (locked) cells are never recorded.
   */
  recordChange(entry: HistoryEntry): void {
    // Clear redo stack when a new change is made after undoing
    this.redoStack = [];
    this.canRedoSubject.next(false);

    // Don't record if previous and new are the same
    if (entry.previousLetter === entry.newLetter) {
      return;
    }

    this.undoStack.push(entry);
    this.canUndoSubject.next(true);
  }

  /**
   * Undo the last change and return it for application.
   * Returns null if nothing to undo.
   */
  undo(): HistoryEntry | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const entry = this.undoStack.pop()!;
    this.redoStack.push(entry);

    this.canUndoSubject.next(this.undoStack.length > 0);
    this.canRedoSubject.next(true);

    return entry;
  }

  /**
   * Redo the last undone change and return it for application.
   * Returns null if nothing to redo.
   */
  redo(): HistoryEntry | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const entry = this.redoStack.pop()!;
    this.undoStack.push(entry);

    this.canUndoSubject.next(true);
    this.canRedoSubject.next(this.redoStack.length > 0);

    return entry;
  }

  /**
   * Get current can-undo state
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Get current can-redo state
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clear all history - called when starting a new game
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.canUndoSubject.next(false);
    this.canRedoSubject.next(false);
  }
}
