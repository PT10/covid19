import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { HttpModule } from '@angular/http';

import { NgxEchartsModule } from 'ngx-echarts';
import { MapProviderService } from './map-provider.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { UsconfirmedCasesComponent } from './us-confirmed-cases/us-confirmed-cases.component';
import { WorldConfirmedCasesComponent } from './world-confirmed-cases/world-confirmed-cases.component';
import { UsDeathCasesComponent } from './us-death-cases/us-death-cases.component';
import { WorldDeathCasesComponent } from './world-death-cases/world-death-cases.component';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { ProgressBarComponent } from './cmp/progress-bar/progress-bar.component';
import { MatProgressBarModule } from '@angular/material';
import { SliderComponent } from './cmp/slider/slider.component';
import { AppEventService } from './events/app-event.service';
import { RouterModule } from '@angular/router';
import { FetchPopulationService } from './services/fetch-population.service';
import { ConfigService } from './services/config.service';

@NgModule({
  imports:      [ BrowserModule, FormsModule, HttpModule, NgxEchartsModule,  RouterModule.forRoot([]),
    HttpClientModule, MatSliderModule, MatProgressSpinnerModule, MatProgressBarModule ],
  declarations: [ AppComponent, HelloComponent, UsconfirmedCasesComponent, WorldConfirmedCasesComponent, UsDeathCasesComponent, WorldDeathCasesComponent, ProgressBarComponent, SliderComponent],
  bootstrap:    [ AppComponent ],
  providers: [MapProviderService, RawDataProviderService, AppEventService, FetchPopulationService,
    ConfigService]
})
export class AppModule { }
