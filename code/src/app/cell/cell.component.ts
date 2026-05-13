import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Cell } from '../model';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss']
})
export class CellComponent implements OnInit {

  isActive = false;
  yoyo: string = `linear-gradient(90deg, rgba(255,137,90,1) 0%, rgba(255,148,106,1) 100%)`
  @Input("cellInfo") cellInfo :Cell = {row: -1, col: -1, letter: "", isActive: false, isLocked: false, background:""};
  @Output() cellValueChange = new EventEmitter<string>();
  @Output() cellClick = new EventEmitter<{row: number, col: number}>();
  @Output() cellFocused = new EventEmitter<{row: number, col: number}>();

  @ViewChild("cellInput") cellInput!: ElementRef;

  previousValue: string = "";
  colorblindModeEnabled: boolean = false;

  constructor(private settingsService: SettingsService) { 
  }

  ngOnInit(): void {
    this.colorblindModeEnabled = this.settingsService.isColorblindModeEnabled();
  }

  onCellFocus(): void {
    this.cellFocused.emit({row: this.cellInfo.row, col: this.cellInfo.col});
    if (!this.cellInfo.isLocked) {
      // Defer so the browser doesn't override the selection after focus settles
      setTimeout(() => this.cellInput.nativeElement.select(), 0);
    }
  }

  // onKeyPress(event: any){
  //   console.log("Event is ", event);
  //   if(!this.cellInfo.isActive){
  //     event.preventDefault();
  //     return;
  //   }
  //   let keyCode: string = event.code;
  //   if((keyCode === "Backspace" || keyCode === "Delete") && this.cellInfo.letter != ""){
  //     this.cellValueChange.emit("");
  //   } else{
  //     let letter: string = keyCode.substring(3, 4);
  //     console.log("Letter is ", letter);
  //     if(letter >= "A" && letter <= "Z"){
  //       if(letter !== this.cellInfo.letter){
  //         console.log("Emitting ", letter);
  //         this.cellValueChange.emit(letter);
  //       }        
  //     } else{
  //       console.log("preventing default ");
  //       event.preventDefault();
  //     }
  //   }        
  // }

  onClickInput(){
    if (this.cellInfo.isLocked) {
      return;
    }
    this.cellClick.emit({row: this.cellInfo.row, col: this.cellInfo.col});
    // Select all so typing replaces the existing letter rather than appending
    this.cellInput.nativeElement.select();
  }

  onInputEvent(event: any){
    // Prevent any input on locked cells
    if (this.cellInfo.isLocked) {
      event.preventDefault();
      return;
    }

    if (event.isComposing) return;

    if(!this.cellInfo.isActive){
      this.cellInput.nativeElement.value = this.previousValue;
      this.cellInfo.letter = this.previousValue;
      return;
    }

    const raw = ((event.target as HTMLInputElement).value || '').toUpperCase();
    // Strip everything that isn't A-Z (handles numbers silently accumulating on mobile)
    const lettersOnly = raw.replace(/[^A-Z]/g, '');
    const validChar = lettersOnly.charAt(lettersOnly.length - 1);

    // Always hard-reset the DOM value so nothing accumulates invisibly
    if (!validChar) {
      this.cellInput.nativeElement.value = this.previousValue;
      return;
    }

    this.cellInput.nativeElement.value = validChar;
    this.cellInfo.letter = validChar;
    this.previousValue = validChar;
    this.cellValueChange.emit(validChar);
  }

  getAriaLabel(): string {
    const row = this.cellInfo.row + 1;
    const col = this.cellInfo.col + 1;
    let label = `Row ${row}, Column ${col}`;
    
    if (this.cellInfo.isLocked) {
      label += `, locked, letter ${this.cellInfo.letter || 'empty'}`;
    } else if (this.cellInfo.letter) {
      label += `, letter ${this.cellInfo.letter}`;
    } else {
      label += ', empty';
    }
    
    if (this.cellInfo.hasConflict) {
      label += ', conflict';
    }
    
    return label;
  }

}
