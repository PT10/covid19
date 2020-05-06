import { Component } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';


@Component({
  selector: 'app-us-active-cases',
  templateUrl: './us-active-cases.component.html',
  styleUrls: ['./us-active-cases.component.css']
})
export class UsActiveCasesComponent extends BaseCases {

  //usMap = this.processCountyNames();
  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService) {
    super(dataService, eventService, populationService);
    this.chartTitle = 'Covid-19 daily US active trends';
    this.fileNameTemplate = this.dataFolder + 'result_anomaly_time_series_covid19_confirmed_US_';
  }

  processData(_data: any) {
    this.seriesData = _data;
      let actualDeltas = [];
      this.seriesData.forEach(data => {
        actualDeltas.push(data.actualDelta - data.forecastDelta);
      });

      actualDeltas = actualDeltas.sort((a, b) => {return b - a});
      this.maxVal = actualDeltas[0];
      this.minVal = actualDeltas[actualDeltas.length - 1];
      
      this.processedSeriesData = this.seriesData.map(data => {
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        return {name: data['Admin2'] + ' (' + data['Province_State'] + ')', value: val}
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
          areaColor: undefined
        }
      },
      data: this.processedSeriesData
    }]

    // Set Position of US map first time as it aligns to global center by default
    if (this.firstTimeAccess) {
      this.chartOption.series[0]['center'] = [-110, 45]
      this.firstTimeAccess = false;
    }
    
    this.chartOption.tooltip = {
        trigger: 'item',
        formatter: function(params) {
          const countyObj = me.seriesData.find(d => {
            return d['Admin2'] + ' (' + d['Province_State'] + ')' === params['name']
          });

          if (countyObj) {
            return countyObj['Admin2'] + '(' + countyObj['Province_State'] + ')' + 
            '<br/>' + 'New Cases: ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
            '<br/>' + 'Total Cases: ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
          }
          return params['name'];
      }}
  }

}