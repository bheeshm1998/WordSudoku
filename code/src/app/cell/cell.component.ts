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
    // Prevent any interaction with locked cells
    if (this.cellInfo.isLocked) {
      return;
    }
    this.cellClick.emit({row: this.cellInfo.row, col: this.cellInfo.col});
    this.cellInput.nativeElement.setSelectionRange(this.cellInput.nativeElement.value.length, this.cellInput.nativeElement.value.length);
    // so that the cursor always is at the end of the input text
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

    let inputText: string = (event.target as HTMLInputElement).value || '';
    inputText = inputText.toUpperCase();
    inputText = inputText.charAt(inputText.length - 1);

    // Only allow A-Z letters
    if (!/^[A-Z]$/.test(inputText)) {
      this.cellInput.nativeElement.value = this.previousValue;
      return;
    }

    this.cellInput.nativeElement.value = inputText;
    this.cellInfo.letter = inputText;
    this.previousValue = inputText;
    this.cellValueChange.emit(inputText);
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
