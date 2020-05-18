import { Component, ChangeDetectorRef } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-us-death-cases',
  templateUrl: './us-death-cases.component.html',
  styleUrls: ['./us-death-cases.component.css']
})
export class UsDeathCasesComponent extends BaseCases {

  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      super(dataService, eventService, populationService, route, config,ref);

      this.mapType = "us";
      this.chartType = "deaths";
      this.chartTitle = 'Covid-19 daily US death trends by county';
      this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_time_series_covid19_deaths_US_';
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
        if (!data['Admin2']) {
          return;
        }
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        this.processedSeriesData.push({name: data['Admin2'] + ' (' + data['Province_State'] + ')', value: val});
      });
  }

  setChartOptions() {
    const me = this;
    this.chartOption.series = [{
      name: 'County covid19 trends',
      type: 'map',
      roam: true,
      map: 'USA',
      scaleLimit: {min: 2},
      itemStyle: {
        emphasis: {
          label: {
            show: false
          },
          areaColor: undefined,
          borderType: 'solid',
          shadowColor: 'rgba(0, 0, 0, 0.8)',
          shadowBlur: 20
        }
      },
      data: this.processedSeriesData
    }]

    // Set Position of US map first time as it aligns to global center by default
    if (this.firstTimeAccess) {
      this.chartOption.series[0]['center'] = [-100, 36]
      this.chartOption.series[0]['zoom'] = 5;
      this.firstTimeAccess = false;
    }
    
    this.chartOption.tooltip = {
        trigger: 'item',
        formatter: function(params) {
          let countyObj = me.seriesData.find(d => {
            return d['Admin2'] + ' (' + d['Province_State'] + ')' === params['name']
          });

          if (countyObj) {
            countyObj = JSON.parse(JSON.stringify(countyObj));
            if (countyObj.forecastDelta < 0) {
              countyObj.forecastDelta = 0;
            }
            if (countyObj.forecast < 0) {
              countyObj.forecast = 0;
            }
            return countyObj['Admin2'] + '(' + countyObj['Province_State'] + ')' + 
            '<br/>' + 'New Deaths: ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
            '<br/>' + 'Total Deaths: ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
          }
          return params['name'];
      }}
  }

}