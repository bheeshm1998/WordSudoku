import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Settings {
  assistModeEnabled: boolean;
  soundEnabled: boolean;
  colorblindModeEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  assistModeEnabled: true,
  soundEnabled: false,
  colorblindModeEnabled: false
};

const STORAGE_KEY = 'wordSudoku_settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  private loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage');
    }
    return DEFAULT_SETTINGS;
  }

  private saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage');
    }
  }

  getCurrentSettings(): Settings {
    return this.settingsSubject.getValue();
  }

  isAssistModeEnabled(): boolean {
    return this.settingsSubject.getValue().assistModeEnabled;
  }

  toggleAssistMode(): void {
    const current = this.settingsSubject.getValue();
    const updated: Settings = {
      ...current,
      assistModeEnabled: !current.assistModeEnabled
    };
    this.settingsSubject.next(updated);
    this.saveSettings(updated);
  }

  setAssistMode(enabled: boolean): void {
    const current = this.settingsSubject.getValue();
    if (current.assistModeEnabled !== enabled) {
      const updated: Settings = {
        ...current,
        assistModeEnabled: enabled
      };
      this.settingsSubject.next(updated);
      this.saveSettings(updated);
    }
  }

  isSoundEnabled(): boolean {
    return this.settingsSubject.getValue().soundEnabled;
  }

  toggleSound(): void {
    const current = this.settingsSubject.getValue();
    const updated: Settings = {
      ...current,
      soundEnabled: !current.soundEnabled
    };
    this.settingsSubject.next(updated);
    this.saveSettings(updated);
  }

  setSoundEnabled(enabled: boolean): void {
    const current = this.settingsSubject.getValue();
    if (current.soundEnabled !== enabled) {
      const updated: Settings = {
        ...current,
        soundEnabled: enabled
      };
      this.settingsSubject.next(updated);
      this.saveSettings(updated);
    }
  }

  isColorblindModeEnabled(): boolean {
    return this.settingsSubject.getValue().colorblindModeEnabled;
  }

  toggleColorblindMode(): void {
    const current = this.settingsSubject.getValue();
    const updated: Settings = {
      ...current,
      colorblindModeEnabled: !current.colorblindModeEnabled
    };
    this.settingsSubject.next(updated);
    this.saveSettings(updated);
  }

  setColorblindMode(enabled: boolean): void {
    const current = this.settingsSubject.getValue();
    if (current.colorblindModeEnabled !== enabled) {
      const updated: Settings = {
        ...current,
        colorblindModeEnabled: enabled
      };
      this.settingsSubject.next(updated);
      this.saveSettings(updated);
    }
  }
}