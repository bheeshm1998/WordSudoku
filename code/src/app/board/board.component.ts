import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { BEST_SCORE_DEFAULT_STRING, BOARD_SIZES, BoardSize, CELL_COLOR, DIFFICULTY_LEVELS, FAILURE_INFO, getLetterSetForDifficulty, getPlayerPoolLetters, GRADIENT, INITIALIZING_WORD, NUM_OF_PREFILLED_CELLS, START_TIME_TEXT, updateBoardConfig, WORDS_FILE_PATH, getCurrentNumPrefilledCells } from '../constants';
import { Cell, WordMeaning, WordValidation } from '../model';
import { Difficulty, BOARD_SIZES as CONFIG_BOARD_SIZES, DIFFICULTY_LEVELS as CONFIG_DIFFICULTIES, getCurrentBoardSize, getCurrentDifficulty } from '../constants';
import { FileServiceService } from '../services/file-service.service';
import { DictionaryService } from '../services/dictionary.service';
import { ConflictDetectionService, Conflict } from '../services/conflict-detection.service';

// Confetti particle interface for completion animation
export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}
import { SettingsService } from '../services/settings.service';
import { ThemeService } from '../services/theme.service';
import { HistoryService } from '../services/history.service';
import { StatsService } from '../services/stats.service';
import { ShareService } from '../services/share.service';
import { getAListOfRandomIndicesDistributedUniformly } from '../utils/utility-methods';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit, OnDestroy {

  board: Cell[][] = [];

  foundWord: string = "";
  foundMeaning: string = "";

  failureDetail: string = "";
  failureReason: string = "";

  gridSize: string = '';

  solveStatus: string = "";

  ALL_WORDS: Set<string> = new Set();

  wordMeaning!: WordMeaning | null;
  disableUserAction: boolean = false;

  timeTaken = START_TIME_TEXT;
  startTime = Date.now();
  intervalId: any;
  bestScore: string | null = BEST_SCORE_DEFAULT_STRING;
  showNewBestIndicator: boolean = false;

  availableBoardSizes = BOARD_SIZES;
  selectedBoardSize: BoardSize = 9;
  
  availableDifficulties: Difficulty[] = [];
  selectedDifficulty: Difficulty | null = Difficulty.Medium;

  private currentGameId: string | null = null;

  // Settings panel
  showSettings: boolean = false;
  
  // Stats panel
  showStats: boolean = false;
  
  // Conflict detection
  allConflicts: Conflict[] = [];
  currentConflictIndex: number = -1;
  showStrictModeFeedback: boolean = false;
  private settingsSubscription!: Subscription;
  assistModeEnabled: boolean = true;

  // Row/column highlighting
  selectedRow: number = -1;
  selectedCol: number = -1;

  // Assist-mode directional cue: an animated rectangle that sweeps along a
  // found word from its first letter to its last, then fades out. Only one is
  // shown at a time (matching the single-conflict display).
  wordBox: {
    left: number; top: number; width: number; height: number;
    horizontal: boolean; origin: string;
  } | null = null;
  private wordBoxTimeout: any;
  private pendingWordBox: {
    startR: number; startC: number; endR: number; endC: number;
    direction: 'LTR' | 'RTL' | 'TTB' | 'BTT';
  } | null = null;

  // Undo/Redo state
  canUndo: boolean = false;
  canRedo: boolean = false;
  private historySubscription?: Subscription;

  // Completion animation state
  showCompletionAnimation: boolean = false;
  prefersReducedMotion: boolean = false;
  confettiParticles: ConfettiParticle[] = [];
  private completionAnimationPlayed: boolean = false;
  
  // Sound
  soundEnabled: boolean = false;
  private soundSubscription?: Subscription;

  // Share functionality
  showCopiedToast: boolean = false;
  private toastTimeoutId: any;

  // Success modal
  showSuccessModal: boolean = false;

  // Keyboard navigation state
  focusedRow: number = -1;
  focusedCol: number = -1;
  validLetters: Set<string> = new Set();

  constructor(
    private fileService: FileServiceService, 
    private dictionaryService: DictionaryService,
    private conflictDetectionService: ConflictDetectionService,
    private settingsService: SettingsService,
    private historyService: HistoryService,
    private statsService: StatsService,
    private shareService: ShareService,
    private themeService: ThemeService
  ) {}

  private themeSubscription?: Subscription;

  ngOnInit(): void {
    this.loadWordsFile();
    this.loadPersistedSettings();
    const persistedState = this.loadPersistedGameState();
    if (persistedState && !this.shouldStartNewGame(persistedState)) {
      this.selectedBoardSize = persistedState.boardSize;
      this.selectedDifficulty = persistedState.difficulty || Difficulty.Medium;
      this.initializeGameState();
      this.restoreGameState(persistedState);
    } else {
      this.initializeTheBoard();
    }
    this.loadBestScores();
    this.updateBestScoreForCurrentConfig();

    // Subscribe to settings changes
    this.settingsSubscription = this.settingsService.settings$.subscribe(settings => {
      const previousMode = this.assistModeEnabled;
      this.assistModeEnabled = settings.assistModeEnabled;
      this.soundEnabled = settings.soundEnabled;
      
      // If mode changed, clear conflicts and re-evaluate
      if (previousMode !== this.assistModeEnabled && this.board.length > 0) {
        this.clearAllConflictHighlights();
        if (this.assistModeEnabled) {
          // Assist mode: show all conflicts immediately
          this.updateConflictHighlights();
        } else {
          // Strict mode: clear feedback unless board is complete
          if (this.checkIfTheBoardIsFullyFilled(this.board)) {
            this.startStrictModeFeedback();
          }
        }
      }
    });

    // Subscribe to sound setting
    this.soundSubscription = this.settingsService.settings$.subscribe(settings => {
      this.soundEnabled = settings.soundEnabled;
    });

    // Subscribe to theme changes — repaint cells with the new palette.
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      if (this.board.length === 0) return;
      // Re-paint locked + active/inactive cells; preserve gradient highlights
      // for any currently-found word + duplicate flashes by re-running the
      // appropriate post-state recoloring.
      this.repaintBoardForTheme();
    });

    // Check for prefers-reduced-motion
    this.checkPrefersReducedMotion();
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => this.prefersReducedMotion = e.matches);
    }

    // Subscribe to history state changes
    this.historySubscription = this.historyService.canUndo$.subscribe(canUndo => {
      this.canUndo = canUndo;
    });
    this.historyService.canRedo$.subscribe(canRedo => {
      this.canRedo = canRedo;
    });
  }

  ngOnDestroy(): void {
    this.persistGameState();
    this.clearTimer();
    this.clearWordBox();
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
    }
    if (this.historySubscription) {
      this.historySubscription.unsubscribe();
    }
    if (this.soundSubscription) {
      this.soundSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private checkPrefersReducedMotion(): void {
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  private playSuccessSound(): void {
    if (!this.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      // Play a pleasant success chord (C-E-G arpeggio)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * duration);
      });
      
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + notes.length * duration + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + notes.length * duration + 0.2);
    } catch (e) {
      console.warn('Could not play success sound:', e);
    }
  }

  private triggerCompletionAnimation(): void {
    // Prevent animation from playing multiple times
    if (this.completionAnimationPlayed) {
      return;
    }
    this.completionAnimationPlayed = true;
    
    // If user prefers reduced motion, just show success state immediately
    if (this.prefersReducedMotion) {
      this.showCompletionAnimation = true;
      this.setCellsToSuccessColor();
      return;
    }
    
    // Start the completion animation sequence
    this.showCompletionAnimation = true;
    
    // Phase 1: Wave pulse animation on cells (row by row from top-left)
    this.animateCellPulseWave();
    
    // Phase 2: After pulse wave, shift to brighter green
    setTimeout(() => {
      this.setCellsToSuccessColor();
    }, this.selectedBoardSize * 50 + 300); // Wait for wave to complete plus a bit
    
    // Phase 3: Confetti burst from center
    setTimeout(() => {
      this.triggerConfettiBurst();
    }, this.selectedBoardSize * 50 + 300);
    
    // Phase 4: Timer highlight animation
    setTimeout(() => {
      // Timer highlight is handled via CSS class in template
    }, this.selectedBoardSize * 50 + 400);
    
    // Phase 5: Play success sound
    setTimeout(() => {
      this.playSuccessSound();
    }, 200);
  }
  
  private animateCellPulseWave(): void {
    const cellElements = document.querySelectorAll('.board .cell');
    cellElements.forEach((cell, index) => {
      const row = Math.floor(index / this.selectedBoardSize);
      const col = index % this.selectedBoardSize;
      const delay = (row + col) * 30; // Diagonal wave timing
      
      setTimeout(() => {
        cell.classList.add('cell-pulse');
        setTimeout(() => {
          cell.classList.remove('cell-pulse');
        }, 300);
      }, delay);
    });
  }
  
  private setCellsToSuccessColor(): void {
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        if (!this.board[i][j].isLocked) {
          this.board[i][j].background = '#52b488'; // Brighter green for success
        }
      }
    }
  }
  
  private triggerConfettiBurst(): void {
    const confettiColors = ['#2d6a4f', '#40916c', '#52b488', '#74c69d', '#95d5b2', '#d97706', '#f59e0b'];
    const boardElement = document.querySelector('.board');
    if (!boardElement) return;
    
    const boardRect = boardElement.getBoundingClientRect();
    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;
    
    const particleCount = 30;
    this.confettiParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = 3 + Math.random() * 4;
      
      this.confettiParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2, // Slight upward bias
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        size: 4 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1
      });
    }
    
    // Animate confetti using requestAnimationFrame
    this.animateConfetti();
  }
  
  private animateConfetti(): void {
    const gravity = 0.15;
    const friction = 0.98;
    const duration = 1500; // 1.5 seconds total
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > duration || this.confettiParticles.length === 0) {
        this.confettiParticles = [];
        return;
      }
      
      // Update particle positions
      this.confettiParticles.forEach(particle => {
        particle.vy += gravity;
        particle.vx *= friction;
        particle.vy *= friction;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.life = 1 - (elapsed / duration);
      });
      
      // Remove dead particles
      this.confettiParticles = this.confettiParticles.filter(p => p.life > 0);
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  private loadPersistedSettings(): void {
    const savedDifficulty = localStorage.getItem('wordSudoku_difficulty');
    if (savedDifficulty && Object.values(Difficulty).includes(savedDifficulty as Difficulty)) {
      this.selectedDifficulty = savedDifficulty as Difficulty;
    }
    const savedBoardSize = localStorage.getItem('wordSudoku_boardSize');
    if (savedBoardSize && (savedBoardSize === '5' || savedBoardSize === '9')) {
      this.selectedBoardSize = parseInt(savedBoardSize, 10) as BoardSize;
    }
  }

  private persistSettings(): void {
    if (this.selectedDifficulty) {
      localStorage.setItem('wordSudoku_difficulty', this.selectedDifficulty);
    } else {
      localStorage.removeItem('wordSudoku_difficulty');
    }
    localStorage.setItem('wordSudoku_boardSize', String(this.selectedBoardSize));
  }

  onDifficultyChange(difficulty: Difficulty) {
    if (difficulty === this.selectedDifficulty) return;

    if (this.currentGameId) {
      localStorage.removeItem(`gameState_${this.currentGameId}`);
    }

    this.selectedDifficulty = difficulty;
    this.persistSettings();
    this.initializeGameState();
    this.clearTimer();
    this.updateBestScoreForCurrentConfig();
    this.initializeTheBoard();
  }

  onBoardSizeChange(newSize: BoardSize) {
    if (newSize === this.selectedBoardSize) return;

    if (this.currentGameId) {
      localStorage.removeItem(`gameState_${this.currentGameId}`);
    }

    this.selectedBoardSize = newSize;
    if (newSize === 5) {
      this.selectedDifficulty = null;
      this.availableDifficulties = [];
    } else {
      this.availableDifficulties = DIFFICULTY_LEVELS;
      if (!this.selectedDifficulty) {
        this.selectedDifficulty = Difficulty.Easy;
      }
    }
    this.persistSettings();
    this.initializeGameState();
    this.clearTimer();
    this.updateBestScoreForCurrentConfig();
    this.initializeTheBoard();
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private initializeGameState(): void {
    updateBoardConfig(this.selectedBoardSize, this.selectedDifficulty);
    this.availableDifficulties = this.selectedBoardSize === 9 ? DIFFICULTY_LEVELS : [];
  }

  loadWordsFile() {
    this.fileService.getFileContent(WORDS_FILE_PATH).subscribe(res => {
      this.ALL_WORDS = new Set(
        res.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0)
      );
      this.conflictDetectionService.setDictionary(this.ALL_WORDS);
    });
  }

  onCellClick(row: number, col: number) {
    // Update selected row/col tracking
    this.selectedRow = row;
    this.selectedCol = col;
    this.focusedRow = row;
    this.focusedCol = col;

    // Clear previous row/col highlights first
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        this.board[i][j].isInSelectedRow = false;
        this.board[i][j].isInSelectedCol = false;
      }
    }

    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        if (!this.board[i][j].isLocked) {
          if (row == i && col == j) {
            this.board[i][j].isActive = !this.board[i][j].isActive;

          } else {
            this.board[i][j].isActive = false;
          }
          if (this.board[i][j].isActive) {
            this.board[i][j].background = CELL_COLOR.ACTIVE_CELL;
          } else {
            this.board[i][j].background = CELL_COLOR.INACTIVE_CELL;
          }
        }
        // Set row/column highlight for selected cell
        if (i === row) {
          this.board[i][j].isInSelectedRow = true;
        }
        if (j === col) {
          this.board[i][j].isInSelectedCol = true;
        }
      }
    }
    if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      this.checkIfTheBoardIsSolved(this.board);
    }
  }

  onCellFocused(row: number, col: number): void {
    this.focusedRow = row;
    this.focusedCol = col;
  }

  moveFocusToCell(row: number, col: number): void {
    if (row < 0 || row >= this.selectedBoardSize || col < 0 || col >= this.selectedBoardSize) {
      return;
    }
    this.onCellClick(row, col);
    
    // Focus the cell button element
    setTimeout(() => {
      const cellButton = document.querySelector(`[data-row="${row}"][data-col="${col}"] button.cell-button`);
      if (cellButton) {
        (cellButton as HTMLButtonElement).focus();
      }
    }, 0);
  }

  isValidLetter(letter: string): boolean {
    return this.validLetters.has(letter.toUpperCase());
  }

  private moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.focusedRow < 0 || this.focusedCol < 0) {
      // Initialize to first non-locked cell if no focus
      for (let i = 0; i < this.selectedBoardSize; i++) {
        for (let j = 0; j < this.selectedBoardSize; j++) {
          if (!this.board[i][j].isLocked) {
            this.moveFocusToCell(i, j);
            return;
          }
        }
      }
      return;
    }

    let newRow = this.focusedRow;
    let newCol = this.focusedCol;

    switch (direction) {
      case 'up':
        newRow = this.focusedRow - 1;
        break;
      case 'down':
        newRow = this.focusedRow + 1;
        break;
      case 'left':
        newCol = this.focusedCol - 1;
        break;
      case 'right':
        newCol = this.focusedCol + 1;
        break;
    }

    // Wrap around logic
    if (newRow < 0) newRow = this.selectedBoardSize - 1;
    if (newRow >= this.selectedBoardSize) newRow = 0;
    if (newCol < 0) newCol = this.selectedBoardSize - 1;
    if (newCol >= this.selectedBoardSize) newCol = 0;

    this.moveFocusToCell(newRow, newCol);
  }

  private fillFocusedCell(letter: string): void {
    if (this.disableUserAction) return;
    if (this.focusedRow < 0 || this.focusedCol < 0) {
      // Auto-select the first non-locked, unfilled cell so the virtual keyboard
      // works even when the user hasn't tapped a cell yet.
      const target = this.findFirstEditableCell();
      if (!target) return;
      this.onCellClick(target.row, target.col);
    }
    if (this.board[this.focusedRow][this.focusedCol].isLocked) return;

    this.onCellValueChange(letter.toUpperCase(), this.focusedRow, this.focusedCol);
  }

  private clearFocusedCell(): void {
    if (this.disableUserAction) return;
    if (this.focusedRow < 0 || this.focusedCol < 0) return;
    if (this.board[this.focusedRow][this.focusedCol].isLocked) return;

    this.onCellValueChange('', this.focusedRow, this.focusedCol);
  }

  private findFirstEditableCell(): { row: number, col: number } | null {
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        if (!this.board[i][j].isLocked && this.board[i][j].letter === '') {
          return { row: i, col: j };
        }
      }
    }
    // Fall back to first non-locked cell (board may be fully filled)
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        if (!this.board[i][j].isLocked) return { row: i, col: j };
      }
    }
    return null;
  }

  onVirtualKeyPress(letter: string): void {
    this.fillFocusedCell(letter);
  }

  onVirtualBackspace(): void {
    this.clearFocusedCell();
  }

initializeTheBoard() {
    this.initializeGameState();
    this.gridSize = `repeat(${this.selectedBoardSize}, 1fr)`;
    this.board = [];
    this.failureDetail = "";
    this.failureReason = "";
    this.currentGameId = this.generateGameId();
    localStorage.setItem("lastGameId", this.currentGameId);
    this.disableUserAction = false;
    this.solveStatus = "";
    this.clearStrictModeState();
    this.assistModeEnabled = this.settingsService.isAssistModeEnabled();
    this.showCompletionAnimation = false;
    this.completionAnimationPlayed = false;
    this.confettiParticles = [];
    this.clearWordBox();

    this.historyService.clear();
    this.canUndo = false;
    this.canRedo = false;

    this.focusedRow = -1;
    this.focusedCol = -1;

    this.validLetters = getPlayerPoolLetters();

    for (let i = 0; i < this.selectedBoardSize; i++) {
      this.board.push([]);
      for (let j = 0; j < this.selectedBoardSize; j++) {
        this.board[i].push({ row: i, col: j, letter: "", isActive: false, isLocked: false, background: CELL_COLOR.INACTIVE_CELL, hasConflict: false, isInSelectedRow: false, isInSelectedCol: false });
      }
    }

    const letterSet = getLetterSetForDifficulty(this.selectedDifficulty);
    this.fillTheBoardWithAWord(this.shuffleString(letterSet));
    this.startTime = Date.now();
    this.timeTaken = START_TIME_TEXT;
    this.startTimerInterval();
  }


  onCellValueChange(input: string, row: number, col: number) {
    // Skip recording changes for locked cells
    if (this.board[row][col].isLocked) {
      return;
    }

    this.solveStatus = "";
    this.failureReason = "";
    this.failureDetail = "";
    this.setDefaultColors();
    this.clearAllConflictHighlights();
    
    // Record the change in history before applying the new value
    const previousLetter = this.board[row][col].letter;
    this.board[row][col].letter = input;
    this.persistGameState();

    // Record to history for undo/redo (only if value actually changed)
    this.historyService.recordChange({
      row,
      col,
      previousLetter,
      newLetter: input
    });

    if (this.assistModeEnabled) {
      // Assist Mode: show real-time conflict feedback
      this.updateConflictHighlights();
    } else if (this.showStrictModeFeedback) {
      // Strict Mode: check if current conflict was fixed, advance to next
      const result = this.conflictDetectionService.detectAllConflicts(this.board, this.selectedBoardSize);
      this.allConflicts = result.conflicts;
      
      if (this.allConflicts.length > 0) {
        // Still have conflicts, show the first one
        this.currentConflictIndex = 0;
        this.highlightCurrentConflict();
      } else {
        // No more conflicts - puzzle solved!
        this.showStrictModeFeedback = false;
        this.currentConflictIndex = -1;
        this.solveStatus = "SUCCESS";
        this.onBoardSuccessfullCompletion();
      }
      return;
    }

    if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      if (this.checkIfTheBoardIsSolved(this.board)) {
        this.solveStatus = "SUCCESS";
        this.onBoardSuccessfullCompletion();
      } else {
        this.solveStatus = "TRY AGAIN";
        if (!this.assistModeEnabled) {
          // Strict Mode: start showing conflicts one at a time
          this.startStrictModeFeedback();
        }
      }
    } else {
      // Board not fully filled - clear strict mode feedback
      this.clearStrictModeState();
    }
  }

  private startStrictModeFeedback(): void {
    const result = this.conflictDetectionService.detectAllConflicts(this.board, this.selectedBoardSize);
    this.allConflicts = result.conflicts;
    
    if (this.allConflicts.length > 0) {
      this.currentConflictIndex = 0;
      this.showStrictModeFeedback = true;
      this.highlightCurrentConflict();
    }
  }

  private highlightCurrentConflict(): void {
    if (this.currentConflictIndex >= 0 && this.currentConflictIndex < this.allConflicts.length) {
      const conflict = this.allConflicts[this.currentConflictIndex];
      this.clearAllConflictHighlights();
      
      for (const cell of conflict.cells) {
        this.board[cell.row][cell.col].hasConflict = true;
      }
      
      this.failureDetail = conflict.message || '';
      this.failureReason = conflict.type === 'word' ? FAILURE_INFO.WORD_EXISTS : FAILURE_INFO.DUPLICATE;
      
      if (conflict.type === 'word' && conflict.word) {
        this.foundWord = conflict.word;
      }
    }
  }

  private clearStrictModeState(): void {
    this.allConflicts = [];
    this.currentConflictIndex = -1;
    this.showStrictModeFeedback = false;
  }

  private clearAllConflictHighlights(): void {
    this.clearWordBox();
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        this.board[i][j].hasConflict = false;
      }
    }
  }

  private updateConflictHighlights(): void {
    // Live feedback: only flag duplicate-letter conflicts. Word-formation
    // conflicts are deferred until the board is fully filled (handled by
    // checkIfTheBoardIsSolved below).
    const boardFull = this.checkIfTheBoardIsFullyFilled(this.board);
    const conflictCells = boardFull
      ? this.conflictDetectionService.getConflictCells(this.board, this.selectedBoardSize)
      : this.conflictDetectionService.getDuplicateConflictCells(this.board, this.selectedBoardSize);

    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        this.board[i][j].hasConflict = conflictCells.has(`${i},${j}`);
      }
    }
  }

  onBoardSuccessfullCompletion(){
    this.disableUserAction = true;
    clearInterval(this.intervalId);
    this.updateTheScoresData();
    this.recordSolveStats();
    this.triggerCompletionAnimation();
    // Show the success modal after the completion animation has played
    setTimeout(() => {
      this.showSuccessModal = true;
    }, this.selectedBoardSize * 50 + 800);
  }

  onCloseSuccessModal(): void {
    this.showSuccessModal = false;
  }

  private recordSolveStats(): void {
    this.statsService.recordSolve(
      this.selectedBoardSize,
      this.selectedDifficulty,
      this.timeTaken
    );
  }

  checkIfRecordBroke(lastBest: string, current: string): boolean{
    return this.timeStringToMillis(current) < this.timeStringToMillis(lastBest);
  }

  // Accepts both "MM:SS" (current format) and the legacy "MM:SS.t" stored
  // in localStorage from previous versions.
  private timeStringToMillis(str: string): number {
    const [m, rest] = str.split(":");
    const [s, t] = (rest ?? "0").split(".");
    return Number(m) * 60 * 1000 + Number(s) * 1000 + (t ? Number(t) * 100 : 0);
  }

  checkIfTheBoardIsSolved(board: Cell[][]): boolean {
    // checking if the rows contain any duplicates
    for (let row = 0; row < this.selectedBoardSize; row++) {
      for (let i = 0; i <= this.selectedBoardSize - 3; i++) {
        for (let j = i + 3; j <= this.selectedBoardSize; j++) {
          let word: string = this.constructWordFromIndices(this.board, row, i, row, j);
          let validationStatus = this.validateWord(word)
          if (validationStatus.hasDuplicates) {
            this.failureDetail = validationStatus.duplicateCharacter + " is repeated";
            this.failureReason = FAILURE_INFO.DUPLICATE;
            this.colorDuplicateCharacters(board, validationStatus.duplicateCharacter, row, true);
            return false;
          }
        }
      }
    }
// checking if the columns contain any duplicates
    for (let col = 0; col < this.selectedBoardSize; col++) {
      for (let i = 0; i <= this.selectedBoardSize - 3; i++) {
        for (let j = i + 3; j <= this.selectedBoardSize; j++) {
          let word: string = this.constructWordFromIndices(this.board, i, col, j, col);
          let validationStatus = this.validateWord(word)
          if (validationStatus.hasDuplicates) {
            this.failureDetail = validationStatus.duplicateCharacter + " is repeated";
            this.failureReason = FAILURE_INFO.DUPLICATE;
            this.colorDuplicateCharacters(board, validationStatus.duplicateCharacter, col, false);
            return false;
          }
        }
      }
    }
// checking if the rows contain any valid word
    for (let row = 0; row < this.selectedBoardSize; row++) {
      for (let i = 0; i <= this.selectedBoardSize - 3; i++) {
        for (let j = i + 3; j <= this.selectedBoardSize; j++) {
          let word: string = this.constructWordFromIndices(this.board, row, i, row, j);
          let validationStatus = this.validateWord(word);
          if (validationStatus.wordAlreadyExists) {
            if (validationStatus.doesReverseExist) {
              this.failureDetail = this.reverseWord(word.toUpperCase()) + " is a valid word";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = this.reverseWord(word.toUpperCase());
              this.colorExistingWord(this.board, row, j, row, i);
            } else {
              this.failureDetail = word + " is a valid word";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = word;
              this.colorExistingWord(this.board, row, i, row, j);
            }
            return false;
          }
        }
      }
    }
// checking if the cols contain any valid word
    for (let col = 0; col < this.selectedBoardSize; col++) {
      for (let i = 0; i <= this.selectedBoardSize - 3; i++) {
        for (let j = i + 3; j <= this.selectedBoardSize; j++) {
          let word: string = this.constructWordFromIndices(this.board, i, col, j, col);
          let validationStatus = this.validateWord(word);
          if (validationStatus.wordAlreadyExists) {
            if (validationStatus.doesReverseExist) {
              this.failureDetail = this.reverseWord(word.toUpperCase()) + " is a valid word";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = this.reverseWord(word.toUpperCase());
              this.colorExistingWord(this.board, j, col, i, col);
            } else {
              this.failureDetail = word + " is a valid word";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = word;
              this.colorExistingWord(this.board, i, col, j, col);
            }
            return false;
          }
        }
      }
    }
    this.failureReason = "";
    this.foundWord = "";
    return true;
  }

  colorDuplicateCharacters(board: Cell[][], char: string, index: number, isRow: boolean) {
    if (isRow) {
      for (let i = 0; i < this.selectedBoardSize; i++) {
        if (board[index][i].letter === char) {
          board[index][i].background = board[index][i].isLocked
            ? CELL_COLOR.DUPLICATE_CHAR_CELL_LOCKED
            : CELL_COLOR.DUPLICATE_CHAR_CELL;
        }
      }
    } else {
      for (let i = 0; i < this.selectedBoardSize; i++) {
        if (board[i][index].letter === char) {
          board[i][index].background = board[i][index].isLocked
            ? CELL_COLOR.DUPLICATE_CHAR_CELL_LOCKED
            : CELL_COLOR.DUPLICATE_CHAR_CELL;
        }
      }
    }
  }

  colorExistingWord(board: Cell[][], startRow: number, startCol: number, endRow: number, endCol: number) {
    if (startRow == endRow) {
      if (startCol < endCol) {
        for (let i = startCol; i < endCol; i++) {
          let colorKey = `leftToRight_${i - startCol}`;
          board[startRow][i].background = GRADIENT[colorKey];
        }
        // First letter at startCol, last at endCol-1, read left-to-right.
        this.triggerWordBox(startRow, startCol, startRow, endCol - 1, 'LTR');
      } else {
        for (let i = startCol - 1; i >= endCol; i--) {
          let colorKey = `rightToLeft_${startCol - i - 1}`;
          board[startRow][i].background = GRADIENT[colorKey];
        }
        // First letter at startCol-1, last at endCol, read right-to-left.
        this.triggerWordBox(startRow, startCol - 1, startRow, endCol, 'RTL');
      }
    } else if (startCol == endCol) {
      if (startRow < endRow) {
        for (let i = startRow; i < endRow; i++) {
          let colorKey = `topToBottom_${i - startRow}`;
          board[i][startCol].background = GRADIENT[colorKey];
        }
        // First letter at startRow, last at endRow-1, read top-to-bottom.
        this.triggerWordBox(startRow, startCol, endRow - 1, startCol, 'TTB');
      } else {
        for (let i = startRow - 1; i >= endRow; i--) {
          let colorKey = `bottomToTop_${startRow - i - 1}`;
          board[i][startCol].background = GRADIENT[colorKey];
        }
        // First letter at startRow-1, last at endRow, read bottom-to-top.
        this.triggerWordBox(startRow - 1, startCol, endRow, startCol, 'BTT');
      }
    }
  }

  /**
   * Queues the assist-mode directional box for a found word. The box is laid
   * out from the live cell geometry on the next tick (after the DOM reflects
   * the current board) and removed once its sweep-and-fade animation ends.
   */
  private triggerWordBox(
    startR: number, startC: number, endR: number, endC: number,
    direction: 'LTR' | 'RTL' | 'TTB' | 'BTT'
  ): void {
    if (!this.assistModeEnabled) return;

    this.pendingWordBox = { startR, startC, endR, endC, direction };
    // Drop any existing box first so the *ngIf recreates the element and the
    // CSS animation restarts for the new word.
    this.wordBox = null;
    if (this.wordBoxTimeout) {
      clearTimeout(this.wordBoxTimeout);
    }
    setTimeout(() => this.layoutWordBox(), 0);
  }

  private layoutWordBox(): void {
    const p = this.pendingWordBox;
    if (!p) return;

    const boardEl = document.querySelector('.board') as HTMLElement | null;
    if (!boardEl) return;

    const minR = Math.min(p.startR, p.endR);
    const maxR = Math.max(p.startR, p.endR);
    const minC = Math.min(p.startC, p.endC);
    const maxC = Math.max(p.startC, p.endC);

    const tl = boardEl.querySelector(`[data-row="${minR}"][data-col="${minC}"]`) as HTMLElement | null;
    const br = boardEl.querySelector(`[data-row="${maxR}"][data-col="${maxC}"]`) as HTMLElement | null;
    if (!tl || !br) return;

    const boardRect = boardEl.getBoundingClientRect();
    const tlRect = tl.getBoundingClientRect();
    const brRect = br.getBoundingClientRect();

    const horizontal = p.direction === 'LTR' || p.direction === 'RTL';
    const origin =
      p.direction === 'LTR' ? 'left center' :
      p.direction === 'RTL' ? 'right center' :
      p.direction === 'TTB' ? 'center top' :
      'center bottom';

    this.wordBox = {
      left: tlRect.left - boardRect.left,
      top: tlRect.top - boardRect.top,
      width: brRect.right - tlRect.left,
      height: brRect.bottom - tlRect.top,
      horizontal,
      origin
    };

    // Remove the box after its sweep-and-fade animation completes.
    this.wordBoxTimeout = setTimeout(() => {
      this.wordBox = null;
    }, 1400);
  }

  private clearWordBox(): void {
    this.pendingWordBox = null;
    this.wordBox = null;
    if (this.wordBoxTimeout) {
      clearTimeout(this.wordBoxTimeout);
      this.wordBoxTimeout = null;
    }
  }

  constructWordFromIndices(board: Cell[][], startRow: number, startCol: number, endRow: number, endCol: number): string {
    let word: string = "";
    if (startRow == endRow) {
      for (let i = startCol; i < endCol; i++) {
        word += board[startRow][i].letter;
      }
    } else if (startCol == endCol) {
      for (let i = startRow; i < endRow; i++) {
        word += board[i][startCol].letter;
      }
    }
    return word;
  }


  checkIfTheBoardIsFullyFilled(board: Cell[][]): boolean {
    for (let row of board) {
      for (let cell of row) {
        if (cell.letter === "") {
          this.solveStatus = "";
          this.foundWord = "";
          return false;
        }
      }
    }
    return true;
  }

  wordAlreadyExists(word: string) {
    return this.ALL_WORDS.has(word.toLowerCase());
  }

  validateWord(word: string): WordValidation {
    let duplicateCharacter = this.hasDuplicateCharacters(word);
    if (duplicateCharacter != "") {
      return { hasDuplicates: true, wordAlreadyExists: false, duplicateCharacter: duplicateCharacter, doesReverseExist: false };
    } else if (this.wordAlreadyExists(word)) {
      return { hasDuplicates: false, wordAlreadyExists: true, duplicateCharacter: "", doesReverseExist: false };
    } else if (this.wordAlreadyExists(this.reverseWord(word))) {
      return { hasDuplicates: false, wordAlreadyExists: true, duplicateCharacter: "", doesReverseExist: true };
    }
    return { hasDuplicates: false, wordAlreadyExists: false, duplicateCharacter: "", doesReverseExist: false };
  }

  /**
   * If the word contains duplicate characters, then it returns the character, else returns an empty string
   * @param word 
   * @returns 
   */
  hasDuplicateCharacters(word: string): string {
    const charSet = new Set();
    for (const char of word) {
      if (charSet.has(char)) {
        return char;
      }
      charSet.add(char);
    }
    return "";
  }

  fillTheBoardWithAWord(word: string) {
    const numPrefilled = getCurrentNumPrefilledCells();
    let randomIndices = getAListOfRandomIndicesDistributedUniformly(this.selectedBoardSize, numPrefilled);
    for (let i = 0; i < numPrefilled; i++) {
      let row = Math.floor(randomIndices[i] / this.selectedBoardSize);
      let col = randomIndices[i] % this.selectedBoardSize;
      let randomLetterIndex = this.generateARandomNumber(0, word.length - 1);
      while(this.hasDuplicateInRowOrColumn(row, col, word[randomLetterIndex])){
        randomLetterIndex = this.generateARandomNumber(0, word.length - 1);
      }
      this.board[row][col].letter = word[randomLetterIndex];
      this.board[row][col].isLocked = true;
      this.board[row][col].background = CELL_COLOR.BLOCKED_CELL;
    }
  }

  /**
   * Generates a random number between min and max both inclusive
   * @param min 
   * @param max 
   */
  generateARandomNumber(min: number, max: number) {
    return Math.round(Math.random() * (max - min))
  }

  reverseWord(word: string) {
    return word.split('').reverse().join('');
  }

  private repaintBoardForTheme(): void {
    // Cell backgrounds are inline strings sourced from CELL_COLOR; the theme
    // service has already mutated those values, so a default-color pass picks
    // up the new palette. If a "found word" gradient is currently displayed,
    // re-run the gradient coloring so it uses the new theme's stops.
    this.setDefaultColors();
    if (this.failureReason === FAILURE_INFO.WORD_EXISTS && this.foundWord) {
      this.checkIfTheBoardIsSolved(this.board);
    } else if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      this.checkIfTheBoardIsSolved(this.board);
    }
  }

  setDefaultColors() {
    for (let i = 0; i < this.selectedBoardSize; i++) {
      for (let j = 0; j < this.selectedBoardSize; j++) {
        if (!this.board[i][j].isLocked) {
          if (this.board[i][j].isActive) {
            this.board[i][j].background = CELL_COLOR.ACTIVE_CELL;
          } else {
            this.board[i][j].background = CELL_COLOR.INACTIVE_CELL;
          }
        } else {
          this.board[i][j].background = CELL_COLOR.BLOCKED_CELL;
        }
      }
    }
  }

  onClickRestart() {
    this.clearTimer();
    if (this.currentGameId) {
      localStorage.removeItem(`gameState_${this.currentGameId}`);
    }
    this.disableUserAction = false;
    this.timeTaken = START_TIME_TEXT;
    this.startTime = Date.now();
    this.showSuccessModal = false;
    this.initializeTheBoard();
  }

  getWordMeaning(word: string) {
    this.dictionaryService.getWordMeanings(word).subscribe(res => {
      this.wordMeaning = res;
      
    },
      error => {
        alert("Sorry, no meanings found")
      })
  }

  onClickSeeMeaning() {
    this.getWordMeaning(this.foundWord);
  }

  onCloseModal() {
    this.wordMeaning = null;
  }

  // Settings panel methods
  openSettings(): void {
    this.showSettings = true;
  }

  onCloseSettings(): void {
    this.showSettings = false;
  }

  // Stats panel methods
  openStats(): void {
    this.showStats = true;
  }

  onCloseStats(): void {
    this.showStats = false;
  }

  shuffleString(inputString: string): string {
    const stringArray = inputString.split(''); // Convert the string to an array of characters
    for (let i = stringArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Generate a random index
      [stringArray[i], stringArray[j]] = [stringArray[j], stringArray[i]]; // Swap characters
    }
    return stringArray.join(''); // Convert the array back to a string
  }

  /**
   * Returns true if there is a duplicate, false otherwise
   * @param row 
   * @param col 
   * @param letter 
   * @returns 
   */
  hasDuplicateInRowOrColumn(row: number, col: number, letter: string): boolean{
    // check in row
    let countInRow = 0;
    let countInCol = 0;
    for(let i=0; i< this.selectedBoardSize; i++){
      if(this.board[row][i].letter === letter){
        countInRow += 1;
      }
    }
    for(let i=0; i< this.selectedBoardSize; i++){
      if(this.board[i][col].letter === letter){
        countInCol += 1;
      }
    }
    if(countInRow >= 1 || countInCol >= 1){
      return true;
    }
    return false;
  }

  formatNumber(number: number, desiredLength: number){
    const stringNumber = String(number);
    return stringNumber.padStart(desiredLength, '0');
  }

  updateTime(){
    this.intervalId = setInterval (() =>   {
      this.tickTimer();
    }, 500)
  }

  private tickTimer(): void {
    const millisElapsed = Date.now() - this.startTime;
    // Cap timer at 60:00 - stop the interval and clamp the display.
    if (millisElapsed >= 60 * 60 * 1000) {
      this.timeTaken = "60:00";
      clearInterval(this.intervalId);
      return;
    }
    const secondsElapsed = millisElapsed / 1000;
    const minutesElapsed = secondsElapsed / 60;
    const secondsText = this.formatNumber(Math.floor(secondsElapsed) % 60, 2);
    const minutesText = this.formatNumber(Math.floor(minutesElapsed), 2);
    this.timeTaken = `${minutesText}:${secondsText}`;
  }

  private generateGameId(): string {
    return `game_${this.selectedBoardSize}_${Date.now()}`;
  }

  private persistGameState(): void {
    if (!this.currentGameId) return;
    
    const gameState = {
      gameId: this.currentGameId,
      boardSize: this.selectedBoardSize,
      difficulty: this.selectedDifficulty,
      board: this.board,
      timeTaken: this.timeTaken,
      startTime: this.startTime,
      disableUserAction: this.disableUserAction,
      solveStatus: this.solveStatus
    };
    localStorage.setItem(`gameState_${this.currentGameId}`, JSON.stringify(gameState));
  }

  private loadPersistedGameState(): any | null {
    const lastGameId = localStorage.getItem("lastGameId");
    if (!lastGameId) return null;
    
    const persistedState = localStorage.getItem(`gameState_${lastGameId}`);
    if (!persistedState) return null;
    
    try {
      return JSON.parse(persistedState);
    } catch {
      return null;
    }
  }

  private shouldStartNewGame(persistedState: any): boolean {
    return true;
  }

  private restoreGameState(persistedState: any): void {
    this.currentGameId = persistedState.gameId;
    this.board = persistedState.board;
    this.timeTaken = persistedState.timeTaken;
    this.startTime = persistedState.startTime;
    this.disableUserAction = persistedState.disableUserAction;
    this.solveStatus = persistedState.solveStatus;
    
    this.gridSize = `repeat(${this.selectedBoardSize}, 1fr)`;
    this.startTimerInterval();
  }

  private startTimerInterval(): void {
    this.intervalId = setInterval(() => {
      this.tickTimer();
    }, 500);
  }

  // Keyboard shortcuts for undo/redo and cell navigation
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Check for Cmd/Ctrl key
    const isModifierPressed = event.ctrlKey || event.metaKey;
    
    if (isModifierPressed) {
      // Undo: Cmd/Ctrl + Z
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        this.performUndo();
      }
      // Redo: Cmd/Ctrl + Shift + Z OR Cmd/Ctrl + Y
      else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault();
        this.performRedo();
      }
    } else if (!event.shiftKey && !event.altKey) {
      // Arrow key navigation
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          this.moveFocus('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.moveFocus('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.moveFocus('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.moveFocus('right');
          break;
        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            // Move focus backward
            this.moveFocus('left');
          } else {
            // Move focus forward
            this.moveFocus('right');
          }
          break;
        case 'Backspace':
        case 'Delete':
          event.preventDefault();
          this.clearFocusedCell();
          break;
        default:
          // Letter key input (A-Z) — only accept letters in the valid letters pool
          if (/^[a-zA-Z]$/.test(event.key)) {
            const letter = event.key.toUpperCase();
            if (this.validLetters.has(letter)) {
              event.preventDefault();
              this.fillFocusedCell(letter);
            }
          }
      }
    }
  }

  performUndo(): void {
    if (!this.canUndo || this.disableUserAction) {
      return;
    }

    const entry = this.historyService.undo();
    if (entry) {
      // Restore the previous letter
      this.board[entry.row][entry.col].letter = entry.previousLetter;
      this.persistGameState();
      
      // Re-evaluate conflicts based on current assist mode setting
      this.reEvaluateConflicts();
    }
  }

  performRedo(): void {
    if (!this.canRedo || this.disableUserAction) {
      return;
    }

    const entry = this.historyService.redo();
    if (entry) {
      // Restore the new letter
      this.board[entry.row][entry.col].letter = entry.newLetter;
      this.persistGameState();
      
      // Re-evaluate conflicts based on current assist mode setting
      this.reEvaluateConflicts();
    }
  }

  private reEvaluateConflicts(): void {
    // Clear existing feedback
    this.solveStatus = "";
    this.failureReason = "";
    this.failureDetail = "";
    this.foundWord = "";
    this.setDefaultColors();
    this.clearAllConflictHighlights();
    this.clearStrictModeState();

    if (this.assistModeEnabled) {
      // Assist Mode: show all conflicts immediately
      this.updateConflictHighlights();
    } else if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      // Strict Mode: check if solved or show first conflict
      if (this.checkIfTheBoardIsSolved(this.board)) {
        this.solveStatus = "SUCCESS";
        this.onBoardSuccessfullCompletion();
      } else {
        this.startStrictModeFeedback();
      }
    }
  }

  // Best score management methods
  private getBestScoreKey(): string {
    return `${this.selectedBoardSize}_${this.selectedDifficulty}`;
  }

  private loadBestScores(): void {
    const stored = localStorage.getItem('wordSudoku_bestScores');
    if (!stored) {
      // Migrate legacy bestScore if exists
      const legacyScore = localStorage.getItem('bestScore');
      if (legacyScore) {
        const bestScores: Record<string, string> = {};
        bestScores[this.getBestScoreKey()] = legacyScore;
        localStorage.setItem('wordSudoku_bestScores', JSON.stringify(bestScores));
      }
    }
  }

  updateBestScoreForCurrentConfig(): void {
    const key = this.getBestScoreKey();
    const stored = localStorage.getItem('wordSudoku_bestScores');
    let bestScores: Record<string, string> = {};
    
    if (stored) {
      try {
        bestScores = JSON.parse(stored);
      } catch (e) {
        bestScores = {};
      }
    }
    
    this.bestScore = bestScores[key] || BEST_SCORE_DEFAULT_STRING;
  }

  updateTheScoresData(): void {
    const key = this.getBestScoreKey();
    const stored = localStorage.getItem('wordSudoku_bestScores');
    let bestScores: Record<string, string> = {};
    
    if (stored) {
      try {
        bestScores = JSON.parse(stored);
      } catch (e) {
        bestScores = {};
      }
    }
    
    const currentBest = bestScores[key];
    if (!currentBest || this.checkIfRecordBroke(currentBest, this.timeTaken)) {
      bestScores[key] = this.timeTaken;
      localStorage.setItem('wordSudoku_bestScores', JSON.stringify(bestScores));
      this.bestScore = this.timeTaken;
      this.showNewBestIndicator = true;
      
      // Auto-hide the indicator after 3 seconds
      setTimeout(() => {
        this.showNewBestIndicator = false;
      }, 3000);
    } else {
      this.bestScore = currentBest;
    }
  }

  // Share functionality
  onClickShare(): void {
    const shareData = {
      boardSize: this.selectedBoardSize,
      difficulty: this.selectedDifficulty,
      timeTaken: this.timeTaken,
      board: this.board
    };

    const shareText = this.shareService.generateShareTextWithMessage(shareData);
    const boardElement = document.querySelector('.board') as HTMLElement;

    if (boardElement && this.shareService.isShareSupported()) {
      this.shareService.captureBoardAsCanvas(boardElement).then(imageData => {
        if (imageData) {
          this.shareService.shareViaNativeWithImage({
            title: 'Word Sudoku',
            text: shareText,
            imageBase64: imageData
          });
        } else {
          this.shareService.shareViaNative({
            title: 'Word Sudoku',
            text: shareText
          });
        }
      });
    } else {
      this.shareService.copyToClipboard(shareText).then(success => {
        if (success) {
          this.showCopiedToast = true;
          
          if (this.toastTimeoutId) {
            clearTimeout(this.toastTimeoutId);
          }
          
          this.toastTimeoutId = setTimeout(() => {
            this.showCopiedToast = false;
          }, 2000);
        }
      });
    }
  }

}
