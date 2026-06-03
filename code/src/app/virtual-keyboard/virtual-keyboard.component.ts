import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-virtual-keyboard',
  templateUrl: './virtual-keyboard.component.html',
  styleUrls: ['./virtual-keyboard.component.scss']
})
export class VirtualKeyboardComponent implements OnDestroy {
  @Input() disabled: boolean = false;
  @Output() letterPress = new EventEmitter<string>();
  @Output() backspacePress = new EventEmitter<void>();

  pressedKey: string | null = null;
  private pressCueTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly rows: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  ngOnDestroy(): void {
    this.clearPressCueTimeout();
  }

  onLetterClick(letter: string, event: MouseEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.showPressCue(letter);
    this.letterPress.emit(letter);
  }

  onBackspaceClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.showPressCue('backspace');
    this.backspacePress.emit();
  }

  private showPressCue(key: string): void {
    this.clearPressCueTimeout();
    this.pressedKey = null;

    setTimeout(() => {
      this.pressedKey = key;
      this.pressCueTimeoutId = setTimeout(() => {
        this.pressedKey = null;
        this.pressCueTimeoutId = null;
      }, 160);
    }, 0);
  }

  private clearPressCueTimeout(): void {
    if (this.pressCueTimeoutId) {
      clearTimeout(this.pressCueTimeoutId);
      this.pressCueTimeoutId = null;
    }
  }
}
