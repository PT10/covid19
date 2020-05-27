import { Component, ChangeDetectorRef } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-world-confirmed-cases',
  templateUrl: '../report.html',
  styleUrls: ['../report.css']
})
export class WorldConfirmedCasesComponent extends BaseCases {

  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  absMin: number;
  absMax: number;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      super(dataService, eventService, populationService, config,ref);

      this.mapType = "globe";
      this.chartType = "confirmed";
      this.chartTitle = 'Covid-19 daily world confirmed trends';
      this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_time_series_covid19_confirmed_global_';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  processData(_data: any) {
    let actualDeltas = [];
    this.seriesData = _data;
      // Aggregate state wise to country level if any
      const tempSeriesData = [];
      this.seriesData.forEach(data => {
        if (!data['Province/State']) {
          tempSeriesData.push(data);
        }
      });
      this.seriesData = tempSeriesData;

      this.seriesData.forEach(data => {
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

      this.processedSeriesData = this.seriesData.map(data => {
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        return {name: data['Country/Region'], value: val}
      });
  }

  getSeriesName(_data) {
    return _data['Country/Region']
  }

}