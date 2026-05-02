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

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.assistModeEnabled = this.settingsService.isAssistModeEnabled();
  }

  onToggleAssistMode(): void {
    this.assistModeEnabled = !this.assistModeEnabled;
    this.settingsService.setAssistMode(this.assistModeEnabled);
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