import { Component, OnInit, OnDestroy } from '@angular/core';
import { BEST_SCORE_DEFAULT_STRING, BOARD_SIZE, BOARD_SIZES, CELL_COLOR, FAILURE_INFO, GRADIENT, INITIALIZING_WORD, NUM_OF_PREFILLED_CELLS, START_TIME_TEXT, updateBoardConfig, WORDS_FILE_PATH } from '../constants';
import { Cell, WordMeaning, WordValidation } from '../model';
import { FileServiceService } from '../services/file-service.service';
import { DictionaryService } from '../services/dictionary.service';
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

  gridSize: string = `repeat(${BOARD_SIZE}, 1fr)`;

  solveStatus: string = "";

  ALL_WORDS: Set<string> = new Set();

  wordMeaning!: WordMeaning | null;
  disableUserAction: boolean = false;

  timeTaken = START_TIME_TEXT;
  startTime = Date.now();
  intervalId: any;
  bestScore: string | null = BEST_SCORE_DEFAULT_STRING;

  availableBoardSizes = BOARD_SIZES;
  selectedBoardSize: number = BOARD_SIZE;

  private currentGameId: string | null = null;

  constructor(private fileService: FileServiceService, private dictionaryService: DictionaryService) {
    
  }

  ngOnInit(): void {
    this.loadWordsFile();
    const persistedState = this.loadPersistedGameState();
    if (persistedState && !this.shouldStartNewGame(persistedState)) {
      this.selectedBoardSize = persistedState.boardSize;
      updateBoardConfig(persistedState.boardSize);
      this.restoreGameState(persistedState);
    } else {
      this.initializeTheBoard();
    }
    let currentBestScore = localStorage.getItem("bestScore");
    if(currentBestScore != undefined){
      this.bestScore = currentBestScore;
    }
  }

  ngOnDestroy(): void {
    this.persistGameState();
    this.clearTimer();
  }

  onBoardSizeChange(newSize: number) {
    if (newSize === this.selectedBoardSize) return;
    
    if (this.currentGameId) {
      localStorage.removeItem(`gameState_${this.currentGameId}`);
    }
    
    this.selectedBoardSize = newSize;
    updateBoardConfig(newSize);
    this.clearTimer();
    this.initializeTheBoard();
  }

  clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  loadWordsFile() {
    this.fileService.getFileContent(WORDS_FILE_PATH).subscribe(res => {
      this.ALL_WORDS = new Set(
        res.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0)
      );
    });
  }

  onCellClick(row: number, col: number) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
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
      }
    }
    if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      this.checkIfTheBoardIsSolved(this.board);
    }
  }

  initializeTheBoard() {
    this.gridSize = `repeat(${BOARD_SIZE}, 1fr)`;
    this.board = [];
    this.failureDetail = "";
    this.failureReason = "";
    this.currentGameId = this.generateGameId();
    localStorage.setItem("lastGameId", this.currentGameId);
    this.disableUserAction = false;
    this.solveStatus = "";
    for (let i = 0; i < BOARD_SIZE; i++) {
      this.board.push([]);
      for (let j = 0; j < BOARD_SIZE; j++) {
        this.board[i].push({ row: i, col: j, letter: "", isActive: false, isLocked: false, background: CELL_COLOR.INACTIVE_CELL });
      }
    }
    this.fillTheBoardWithAWord(this.shuffleString(INITIALIZING_WORD));
    this.startTime = Date.now();
    this.timeTaken = START_TIME_TEXT;
    this.startTimerInterval();
  }


  onCellValueChange(input: string, row: number, col: number) {
    this.solveStatus = "";
    this.failureReason = "";
    this.setDefaultColors();
    this.board[row][col].letter = input;
    this.persistGameState();
    if (this.checkIfTheBoardIsFullyFilled(this.board)) {
      if (this.checkIfTheBoardIsSolved(this.board)) {
        this.solveStatus = "SUCCESS";
        this.onBoardSuccessfullCompletion();
      } else {
        this.solveStatus = "TRY AGAIN";
      }
    }
  }

  onBoardSuccessfullCompletion(){
    this.disableUserAction = true;
    clearInterval(this.intervalId);
    this.updateTheScoresData();
  }

  updateTheScoresData(){
    let lastBest = localStorage.getItem("bestScore");
    if(lastBest){
      let recordBroken = this.checkIfRecordBroke(lastBest, this.timeTaken);
      if(recordBroken == true){
        localStorage.setItem("bestScore", this.timeTaken);
      }
    } else{
      localStorage.setItem("bestScore", this.timeTaken);
    }
    this.bestScore = localStorage.getItem("bestScore");
  }

  checkIfRecordBroke(lastBest: string, current: string): boolean{
    let oldTime = lastBest.split(":");
    const currentTime = current.split(":");
    const oldTimeInMillis: number = Number(oldTime[0]) * 60 * 1000 + Number(oldTime[1].split(".")[0]) * 1000 + Number(oldTime[1].split(".")[1]);
    const currentTimeInMillis: number = Number(currentTime[0]) * 60 * 1000 + Number(currentTime[1].split(".")[0]) * 1000 + Number(currentTime[1].split(".")[1]);
    if(currentTimeInMillis < oldTimeInMillis){
      return true;
    } else{
      return false;
    }
  }

  checkIfTheBoardIsSolved(board: Cell[][]): boolean {
    // checking if the rows contain any duplicates
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let i = 0; i <= BOARD_SIZE - 3; i++) {
        for (let j = i + 3; j <= BOARD_SIZE; j++) {
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
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let i = 0; i <= BOARD_SIZE - 3; i++) {
        for (let j = i + 3; j <= BOARD_SIZE; j++) {
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
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let i = 0; i <= BOARD_SIZE - 3; i++) {
        for (let j = i + 3; j <= BOARD_SIZE; j++) {
          let word: string = this.constructWordFromIndices(this.board, row, i, row, j);
          let validationStatus = this.validateWord(word);
          if (validationStatus.wordAlreadyExists) {
            if (validationStatus.doesReverseExist) {
              this.failureDetail = this.reverseWord(word.toUpperCase()) + " exists";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = this.reverseWord(word.toUpperCase());
              this.colorExistingWord(this.board, row, j, row, i);
            } else {
              this.failureDetail = word + " exists";
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
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let i = 0; i <= BOARD_SIZE - 3; i++) {
        for (let j = i + 3; j <= BOARD_SIZE; j++) {
          let word: string = this.constructWordFromIndices(this.board, i, col, j, col);
          let validationStatus = this.validateWord(word);
          if (validationStatus.wordAlreadyExists) {
            if (validationStatus.doesReverseExist) {
              this.failureDetail = this.reverseWord(word.toUpperCase()) + " exists";
              this.failureReason = FAILURE_INFO.WORD_EXISTS;
              this.foundWord = this.reverseWord(word.toUpperCase());
              this.colorExistingWord(this.board, j, col, i, col);
            } else {
              this.failureDetail = word + " exists";
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
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[index][i].letter === char && !board[index][i].isLocked) {
          board[index][i].background = CELL_COLOR.DUPLICATE_CHAR_CELL;
        }
      }
    } else {
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[i][index].letter === char && !board[i][index].isLocked) {
          board[i][index].background = CELL_COLOR.DUPLICATE_CHAR_CELL;
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
      } else {
        for (let i = startCol - 1; i >= endCol; i--) {
          let colorKey = `rightToLeft_${startCol - i - 1}`;
          board[startRow][i].background = GRADIENT[colorKey];
        }
      }
    } else if (startCol == endCol) {
      if (startRow < endRow) {
        for (let i = startRow; i < endRow; i++) {
          let colorKey = `topToBottom_${i - startRow}`;
          board[i][startCol].background = GRADIENT[colorKey];
        }
      } else {
        for (let i = startRow - 1; i >= endRow; i--) {
          let colorKey = `bottomToTop_${startRow - i - 1}`;
          board[i][startCol].background = GRADIENT[colorKey];
        }
      }
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
    let randomIndices = getAListOfRandomIndicesDistributedUniformly(BOARD_SIZE, NUM_OF_PREFILLED_CELLS);
    for (let i = 0; i < NUM_OF_PREFILLED_CELLS; i++) {
      let row = Math.floor(randomIndices[i] / BOARD_SIZE);
      let col = randomIndices[i] % BOARD_SIZE;
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

  setDefaultColors() {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
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
    for(let i=0; i< BOARD_SIZE; i++){
      if(this.board[row][i].letter === letter){
        countInRow += 1;
      }
    }
    for(let i=0; i< BOARD_SIZE; i++){
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
      const millisElapsed = Date.now() - this.startTime;
      const secondsElapsed = millisElapsed / 1000;
      const minutesElapsed = secondsElapsed / 60;
  
      const millisText = String(millisElapsed).slice(-3)[0];
      const secondsText = this.formatNumber(Math.floor(secondsElapsed) % 60, 2);
      const minutesText = this.formatNumber(Math.floor(minutesElapsed),2);
      if(Number(minutesText) >= 60){
        clearInterval(this.intervalId);
      }
  
      this.timeTaken = `${minutesText}:${secondsText}.${millisText}`;
    }, 100 )
  }

  private generateGameId(): string {
    return `game_${this.selectedBoardSize}_${Date.now()}`;
  }

  private persistGameState(): void {
    if (!this.currentGameId) return;
    
    const gameState = {
      gameId: this.currentGameId,
      boardSize: this.selectedBoardSize,
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
    if (!persistedState) return true;
    if (persistedState.boardSize !== this.selectedBoardSize) return true;
    if (persistedState.solveStatus === 'SUCCESS') return true;
    return false;
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
      const millisElapsed = Date.now() - this.startTime;
      const secondsElapsed = millisElapsed / 1000;
      const minutesElapsed = secondsElapsed / 60;
  
      const millisText = String(millisElapsed).slice(-3)[0];
      const secondsText = this.formatNumber(Math.floor(secondsElapsed) % 60, 2);
      const minutesText = this.formatNumber(Math.floor(minutesElapsed), 2);
      if (Number(minutesText) >= 60) {
        clearInterval(this.intervalId);
      }
  
      this.timeTaken = `${minutesText}:${secondsText}.${millisText}`;
    }, 100);
  }

}
