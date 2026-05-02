import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  assistModeEnabled: boolean = true;
  soundEnabled: boolean = false;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.assistModeEnabled = this.settingsService.isAssistModeEnabled();
    this.soundEnabled = this.settingsService.isSoundEnabled();
  }

  onToggleAssistMode(): void {
    this.assistModeEnabled = !this.assistModeEnabled;
    this.settingsService.setAssistMode(this.assistModeEnabled);
  }

  onToggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.settingsService.setSoundEnabled(this.soundEnabled);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('settings-backdrop')) {
      this.onClose();
    }
  }
}