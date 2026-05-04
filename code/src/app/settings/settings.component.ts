import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { ThemeService } from '../services/theme.service';
import { ThemeName, THEME_LABELS, THEME_NAMES } from '../constants';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  assistModeEnabled: boolean = true;
  soundEnabled: boolean = false;
  colorblindModeEnabled: boolean = false;

  readonly themes = THEME_NAMES;
  readonly themeLabels = THEME_LABELS;
  selectedTheme: ThemeName = 'green';

  constructor(
    private settingsService: SettingsService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.assistModeEnabled = this.settingsService.isAssistModeEnabled();
    this.soundEnabled = this.settingsService.isSoundEnabled();
    this.colorblindModeEnabled = this.settingsService.isColorblindModeEnabled();
    this.selectedTheme = this.themeService.getCurrentTheme();
  }

  onSelectTheme(theme: ThemeName): void {
    this.selectedTheme = theme;
    this.themeService.setTheme(theme);
  }

  onToggleAssistMode(): void {
    this.assistModeEnabled = !this.assistModeEnabled;
    this.settingsService.setAssistMode(this.assistModeEnabled);
  }

  onToggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.settingsService.setSoundEnabled(this.soundEnabled);
  }

  onToggleColorblindMode(): void {
    this.colorblindModeEnabled = !this.colorblindModeEnabled;
    this.settingsService.setColorblindMode(this.colorblindModeEnabled);
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