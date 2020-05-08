import { Component } from '@angular/core';
import { BaseCases } from '../baseCases';
import { RawDataProviderService } from '../services/raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { FetchPopulationService } from '../services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-world-active-cases',
  templateUrl: './world-active-cases.component.html',
  styleUrls: ['./world-active-cases.component.css']
})
export class WorldActiveCasesComponent extends BaseCases {

  relocatedCounties;
  selectedDateIndex: number;
  inProgress = false;

  absMin: number;
  absMax: number;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService) {
    super(dataService, eventService, populationService, route, config);
    this.chartTitle = 'Covid-19 daily world active trends';

    this.fileNameTemplate = this.dataFolder + '/result_' + this.fileNameToken + '_time_series_covid19_confirmed_global_';
    //this.fileNameTemplate = this.dataFolder + '/result_forecast_delta_time_series_covid19_confirmed_global_';
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
        // const densFactor = this.populationService.countryPopTotal[data['Country/Region']];

        // actualDeltas.push((data.cases/densFactor) * 1000000);
      });

      actualDeltas = actualDeltas.sort((a, b) => {return b - a});
      this.maxVal = actualDeltas[0];
      this.minVal = actualDeltas[actualDeltas.length - 1];

      if (this.maxVal > (-1 * this.minVal)) {
        this.minVal = -1 * this.maxVal;
      } else {
        this.maxVal = -1 * this.minVal;
      }

      // this.absMax = actualDeltas[10];
      // this.absMin = actualDeltas[actualDeltas.length - 11];
      
      this.processedSeriesData = this.seriesData.map(data => {
        let val;
        if (data.actualDelta === 0 ) {
          val = this.minVal;
        }else {
          val = data.actualDelta - data.forecastDelta
        }
        /*val = data.cases;
        const densFactor = this.populationService.countryPopTotal[data['Country/Region']];
        if (densFactor) {
          val = (val / densFactor) * 1000000

          val = (val - this.absMin) / (this.absMax - this.absMin) * 100

        }*/
        return {name: data['Country/Region'], value: val}
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
            /*let val = countyObj.cases;
            const densFactor = me.populationService.countryPopTotal[countyObj['Country/Region']];
            if (densFactor) {
              val = (val / densFactor) * 1000000
            }
            val = (val - me.absMin) / (me.absMax - me.absMin) * 100
*/
            return countyObj['Country/Region'] +
            '<br/>' + 'New Cases: ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
            '<br/>' + 'Total Cases: ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
            
          //  '<br/>' + 'Cases: ' + countyObj.cases + 
          //  '<br/>' + 'Score: ' + val
          }
          return params['name'];
      }}
  }

}