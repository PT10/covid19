import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';
import { indiaStateCodes } from '../map-provider.service';

@Component({
  selector: 'app-india-confirmed-cases',
  templateUrl: './india-confirmed-cases.component.html',
  styleUrls: ['./india-confirmed-cases.component.css']
})
export class IndiaConfirmedCasesComponent extends BaseCases {

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      super(dataService, eventService, populationService, route, config,ref);

      this.mapType = "india";
      this.chartType = "Confirmed";
      this.chartTitle = 'Covid-19 daily India confirmed trends by state';
      this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_state_wise_daily_Confirmed_';
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

  setChartOptions() {
    const me = this;
    this.chartOption.series = [{
      name: 'County covid19 trends',
      type: 'map',
      roam: true,
      map: 'India',
      scaleLimit: {min: 1},
      itemStyle: {
        emphasis: {
          label: {
            show: false
          },
          areaColor: undefined
        }
      },
      data: this.processedSeriesData
    }]
    
    this.chartOption.tooltip = {
      trigger: 'item',
      formatter: function(params) {
        let countyObj = me.seriesData.find(d => {
          return d['State'] === params['name']
        });

        if (countyObj) {
          countyObj = JSON.parse(JSON.stringify(countyObj));
          if (countyObj.forecastDelta < 0) {
            countyObj.forecastDelta = 0;
          }
          if (countyObj.forecast < 0) {
            countyObj.forecast = 0;
          }
          return indiaStateCodes[countyObj['State']] + 
          '<br/>' + 'New Cases: ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
          '<br/>' + 'Total Cases: ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
        }
        return params['name'];
    }}
  }

  getStateFullName(_abb) {
    return indiaStateCodes[_abb];
  }

}
