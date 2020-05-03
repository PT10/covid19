import { Component } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';

@Component({
  selector: 'app-world-active-cases',
  templateUrl: './world-active-cases.component.html',
  styleUrls: ['./world-active-cases.component.css']
})
export class WorldActiveCasesComponent extends BaseCases {

  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  chartTitle = 'Covid 19 daily world active trends';

  constructor(private dataService: RawDataProviderService) {
    super();

    this.fileNameTemplate = 'assets/result_time_series_covid19_confirmed_global_';
  }

  ngOnInit() {
    super.ngOnInit();
  }

  getData() {
    this.inProgress = true;
    let actualDeltas = [];

    const url = this.fileNameTemplate +  this.formatDateForFileName(this.selectedDate) + '.json';
    this.dataService.sendGetRequest(url).subscribe(data => {
      this.seriesData = data;
      // Aggregate state wise to country level if any
      const tempSeriesData = [];
      this.seriesData.forEach(data => {
        if (!this.seriesData['Province/State']) {
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
        return {name: data['Country/Region'], value: val}
      });

      this.clearError();
      this.chartOption = this.getChartOptions();
      this.setChartOptions();
      this.chartInstance.setOption(this.chartOption);
      this.inProgress = false;
    }, error => {
      this.setError();
      this.inProgress = false;
    });
    
  }
  

  setChartOptions() {
    const me = this;
    this.chartOption.series = [{
          name: 'County covid19 trends',
          type: 'map',
          roam: true,
          map: 'world',
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
        }
      ]
    
    this.chartOption.tooltip = {
        trigger: 'item',
        formatter: function(params) {
          const countyObj = me.seriesData.find(d => {
            return d['Country/Region'] === params['name']
          });

          if (countyObj) {
            return countyObj['Country/Region'] +
            '<br/>' + 'New Cases: ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
            '<br/>' + 'Total Cases: ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
          }
          return params['name'];
      }}
  }

}