import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'code';

  constructor(_themeService: ThemeService) {
    // Inject so the service initializes (applies persisted theme + data-theme attr)
    // before any board/cell components render.
  }
}
