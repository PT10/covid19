import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { indiaStateCodes } from '../map-provider.service';

@Component({
  selector: 'app-india-death-cases',
  templateUrl: './india-death-cases.component.html',
  styleUrls: ['./india-death-cases.component.css']
})
export class IndiaDeathCasesComponent extends BaseCases {

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      super(dataService, eventService, populationService, route, config,ref);

      this.mapType = "india";
      this.chartType = "Deceased";
      this.chartTitle = 'Covid-19 daily India deaths trends by state';
      this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_state_wise_daily_Deceased_';
  }

  processData(_data: any) {
    this.seriesData = _data;
      let actualDeltas = [];
      this.seriesData.forEach(data => {
        if (data['State'] === 'TT') {
          return;
        }
        actualDeltas.push(data.actualDelta - data.forecastDelta);
      });

      actualDeltas = actualDeltas.sort((a, b) => {return b - a});
      this.maxVal = actualDeltas[0];
      this.minVal = actualDeltas[actualDeltas.length - 1];

      if (this.maxVal > (-1 * this.minVal)) {
        this.minVal = -1 * this.maxVal;
      } else {
        this.maxVal = -1 * this.minVal;
      }
      
      this.processedSeriesData = [];
      this.seriesData.map(data => {
        if (data['State'] === 'TT') {
          return;
        }
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        this.processedSeriesData.push({name: data['State'], value: val});
      });
  }

  getStateFullName(_abb) {
    return indiaStateCodes[_abb];
  }

  getSeriesName(_data) {
    return _data['State']
  }

}