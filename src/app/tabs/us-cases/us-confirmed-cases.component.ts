import { Component, ChangeDetectorRef } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../../services/raw-data-provider.service';
import { AppEventService } from '../../events/app-event.service';
import { FetchPopulationService } from '../../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../../services/config.service';


@Component({
  selector: 'app-us-confirmed-cases',
  templateUrl: '../report.html',
  styleUrls: ['../report.css']
})
export class UsconfirmedCasesComponent extends BaseCases {

  //usMap = this.processCountyNames();
  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      super(dataService, eventService, populationService, config,ref);

      this.mapType = "us";
      this.chartType = "confirmed";
      this.chartTitle = 'Covid-19 daily US confirmed trends by county';
      this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_time_series_covid19_confirmed_US_';
  }

  processData(_data: any) {
    this.seriesData = _data;
      let actualDeltas = [];
      this.seriesData.forEach(data => {
        if (!data['Admin2']) {
          return;
        }
        actualDeltas.push(data.actualDelta - data.forecastDelta);
      });

      this.setMinMaxForVisualMap(actualDeltas);

      this.processedSeriesData = [];
      this.seriesData.map(data => {
        if (!data['Admin2']) {
          return;
        }
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        this.processedSeriesData.push({name: this.getSeriesName(data), value: val});
      });
  }

  setChartOptions() {
    // Set Position of US map first time as it aligns to global center by default
    if (this.firstTimeAccess) {
      this.chartOption.series[0]['center'] = [-100, 36]
      this.chartOption.series[0]['zoom'] = 5;
      this.firstTimeAccess = false;
    }
  }

  getSeriesName(_data) {
    return _data['Admin2'] + ' (' + _data['Province_State'] + ')'
  }

  getDrilldownDataFileUrl() {
    return this.dataFolder + '/result_' + this.fileNameToken + '_' +
    this.selectedRegion + '_time_series_covid19_' + this.chartType + '_US.json';
  }

  getResolvedRegionName(_regionName) {
    return _regionName;
  }
}