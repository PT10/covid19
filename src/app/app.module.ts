import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';

import { NgxEchartsModule } from 'ngx-echarts';
import { MapProviderService } from './map-provider.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSliderModule } from '@angular/material/slider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { UsActiveCasesComponent } from './us-active-cases/us-active-cases.component';
import { WorldActiveCasesComponent } from './world-active-cases/world-active-cases.component';
import { WorldJsonProviderService } from './world-json-provider.service';
import { UsDeathCasesComponent } from './us-death-cases/us-death-cases.component';
import { WorldDeathCasesComponent } from './world-death-cases/world-death-cases.component';

@NgModule({
  imports:      [ BrowserModule, FormsModule, NgxEchartsModule, HttpClientModule, MatSliderModule, MatProgressSpinnerModule ],
  declarations: [ AppComponent, HelloComponent, UsActiveCasesComponent, WorldActiveCasesComponent, UsDeathCasesComponent, WorldDeathCasesComponent],
  bootstrap:    [ AppComponent ],
  providers: [MapProviderService, WorldJsonProviderService]
})
export class AppModule { }
