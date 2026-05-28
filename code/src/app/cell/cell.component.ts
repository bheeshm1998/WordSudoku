import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Cell } from '../model';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss']
})
export class CellComponent implements OnInit {

  @Input("cellInfo") cellInfo: Cell = { row: -1, col: -1, letter: "", isActive: false, isLocked: false, background: "" };
  @Output() cellValueChange = new EventEmitter<string>();
  @Output() cellClick = new EventEmitter<{ row: number, col: number }>();
  @Output() cellFocused = new EventEmitter<{ row: number, col: number }>();

  @ViewChild("cellButton") cellButton!: ElementRef<HTMLButtonElement>;

  colorblindModeEnabled: boolean = false;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.colorblindModeEnabled = this.settingsService.isColorblindModeEnabled();
  }

  onCellFocus(): void {
    this.cellFocused.emit({ row: this.cellInfo.row, col: this.cellInfo.col });
  }

  onClickButton(event: MouseEvent): void {
    if (this.cellInfo.isLocked) {
      return;
    }
    this.cellClick.emit({ row: this.cellInfo.row, col: this.cellInfo.col });
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
