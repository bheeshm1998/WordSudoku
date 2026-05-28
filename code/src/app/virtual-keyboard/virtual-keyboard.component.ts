import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrls: ['./virtual-keyboard.component.scss']
})
export class VirtualKeyboardComponent {
  @Input() disabled: boolean = false;
  @Output() letterPress = new EventEmitter<string>();
  @Output() backspacePress = new EventEmitter<void>();

  readonly rows: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  onLetterClick(letter: string, event: MouseEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.letterPress.emit(letter);
  }

  onBackspaceClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.backspacePress.emit();
  }
}
