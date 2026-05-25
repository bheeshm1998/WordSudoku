import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { applyThemePalette, ThemeName, THEME_NAMES } from '../constants';

const STORAGE_KEY = 'wordSudoku_theme';
const DEFAULT_THEME: ThemeName = 'blue';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeName>(this.loadTheme());
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.getValue());
  }

  private loadTheme(): ThemeName {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
      if (stored && THEME_NAMES.includes(stored)) {
        return stored;
      }
    } catch {}
    return DEFAULT_THEME;
  }

  getCurrentTheme(): ThemeName {
    return this.themeSubject.getValue();
  }

  setTheme(theme: ThemeName): void {
    if (!THEME_NAMES.includes(theme) || theme === this.themeSubject.getValue()) return;
    this.applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    this.themeSubject.next(theme);
  }

  private applyTheme(theme: ThemeName): void {
    applyThemePalette(theme);
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', theme);
    }
  }
}
