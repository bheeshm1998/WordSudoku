import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BoardComponent } from './board/board.component';
import { CellComponent } from './cell/cell.component';
import { HttpClientModule } from '@angular/common/http';
import { WordMeaningComponent } from './word-meaning/word-meaning.component';
import { FormsModule } from '@angular/forms';
import { SettingsComponent } from './settings/settings.component';
import { StatsComponent } from './stats/stats.component';
import { VirtualKeyboardComponent } from './virtual-keyboard/virtual-keyboard.component';

@NgModule({
  declarations: [
    AppComponent,
    BoardComponent,
    CellComponent,
    WordMeaningComponent,
    SettingsComponent,
    StatsComponent,
    VirtualKeyboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
