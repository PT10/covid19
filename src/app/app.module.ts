import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { HttpModule } from '@angular/http';

import { NgxEchartsModule } from 'ngx-echarts';
import { MapProviderService } from './services/map-provider.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { UsconfirmedCasesComponent } from './tabs/us-cases/us-confirmed-cases.component';
import { WorldConfirmedCasesComponent } from './tabs/world-cases/world-confirmed-cases.component';
import { UsDeathCasesComponent } from './tabs/us-cases/us-death-cases.component';
import { WorldDeathCasesComponent } from './tabs/world-cases/world-death-cases.component';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { ProgressBarComponent } from './cmp/progress-bar/progress-bar.component';
import { MatProgressBarModule, MatDialogModule } from '@angular/material';
import { SliderComponent } from './cmp/slider/slider.component';
import { AppEventService } from './events/app-event.service';
import { RouterModule } from '@angular/router';
import { FetchPopulationService } from './services/fetch-population.service';
import { ConfigService } from './services/config.service';
import { IndiaConfirmedCasesComponent } from './tabs/india-cases/india-confirmed-cases.component';
import { IndiaDeathCasesComponent } from './tabs/india-cases/india-death-cases.component';
import { EmbedComponent } from './cmp/embed/embed.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClipboardModule } from 'ngx-clipboard';

@NgModule({
  imports:      [ 
    BrowserModule, 
    BrowserAnimationsModule,
    FormsModule, 
    HttpModule, 
    NgxEchartsModule,  
    RouterModule.forRoot([]),
    HttpClientModule, 
    MatSliderModule, 
    MatProgressSpinnerModule, 
    MatProgressBarModule, 
    MatDialogModule,
    ClipboardModule
   ],
  declarations: [ 
    AppComponent, 
    HelloComponent, 
    UsconfirmedCasesComponent, 
    WorldConfirmedCasesComponent, 
    UsDeathCasesComponent, 
    WorldDeathCasesComponent, 
    ProgressBarComponent, 
    SliderComponent, 
    IndiaConfirmedCasesComponent, 
    IndiaDeathCasesComponent, 
    EmbedComponent],
  entryComponents: [
    EmbedComponent
  ],
  bootstrap:    [ AppComponent ],
  providers: [
    MapProviderService, 
    RawDataProviderService, 
    AppEventService, 
    FetchPopulationService,
    ConfigService]
})
export class AppModule { }
