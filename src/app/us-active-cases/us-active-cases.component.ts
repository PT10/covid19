import { Component } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';


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

  chartTitle = 'Covid 19 daily US active trends';

  constructor(private dataService: RawDataProviderService) {
    super();
  }

  getData() {
    this.inProgress = true;

    const url = 'assets/result_time_series_covid19_confirmed_US_05_01_2020.json';
    this.dataService.sendGetRequest(url).subscribe(data => {
      this.seriesData = data;
      let actualDeltas = [];
      this.seriesData.forEach(data => {
        actualDeltas.push(data.actualDelta - data.forecastDelta);
      });

      actualDeltas = actualDeltas.sort((a, b) => {return b - a});
      this.maxVal = actualDeltas[5];
      this.minVal = actualDeltas[actualDeltas.length - 6];
      
      this.processedSeriesData = this.seriesData.map(data => {
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        } /*else if (data.forecastDelta === 0) {
          val = 100;
        } */else {
          // val = (data.actualDelta - data.forecastDelta) / data.forecastDelta * 100;
          val = data.actualDelta - data.forecastDelta
        }
        return {name: data['Admin2'] + ' (' + data['Province_State'] + ')', value: val}
      });

      this.chartOption = this.getChartOptions();
      this.setChartOptions();
      this.chartInstance.setOption(this.chartOption);
      this.inProgress = false;
    }, error => {
      this.inProgress = false;
    })
  }

  setChartOptions() {
    const me = this;
    this.chartOption.series = [{
          name: 'County covid19 trends',
          type: 'map',
          roam: true,
          map: 'USA',
          center: [-110, 45],
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
        }
      ]
    
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