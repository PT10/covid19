import { Input, OnInit, AfterViewInit, ViewChild, OnChanges, Output, EventEmitter } from '@angular/core';
import { EChartOption } from 'echarts';
import * as echarts from 'echarts/lib/echarts';
import * as $ from 'jquery';
import { Utils } from './utils';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { AppEventService } from './events/app-event.service';
import { EventNames } from './events/EventNames';
import { FetchPopulationService } from './services/fetch-population.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from './services/config.service';
import { ChangeDetectorRef } from '@angular/core';
import { indiaStateCodes } from './map-provider.service';

export abstract class BaseCases implements OnInit, AfterViewInit, OnChanges {
  seriesData = [];
  processedSeriesData = [];
  errorMessage: string;
  inProgress: boolean;
  drilldownInProgress: boolean;
  maxVal = 100;
  minVal = -100;
  chartOption: EChartOption;
  drilldownLineChartOption: EChartOption;
  chartTitle: string;
  chartInstance;
  drilldownLineChartInstance;
  fileNameTemplate: string;
  fileNameToken = 'delta2';
  //dayIndex = 7;

  dataFolder = "data"

  @Input()
  selectedDate: Date;

  @Input()
  numDaysOnSlider: number;

  @Output()
  chartTitleChange: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('charts')
  echartInstance

  @ViewChild('charts2')
  echartInstanceDrilldown

  // Used by US map components to set zoom for the first time each map is loaded
  firstTimeAccess = true;

  directLink = false;

  selectedRegion: string = "";

  mapType: string;
  chartType: string;

  bestPerformers: string;
  worstPerformers: string;

  @Output()
  onPerformersFound: EventEmitter<any> = new EventEmitter<any> ();

  // Used for falling back to data availability on landing page
  static initialLoading = true;

  static playStarted: boolean;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService,
    protected ref: ChangeDetectorRef) {
      this.route.queryParams.subscribe(params => {
        if (params['date']) {
          this.directLink = true;
        }
      });

      this.fileNameToken = this.config.fileNameToken;
      this.drilldownLineChartInstance = undefined;
  }

  setChartOptions() {};
  abstract processData(_data: any);
  abstract getSeriesName(_data: any);

  ngOnInit() {
    $(window).resize((params) => {
      if (this.selectedRegion) {
        this.drilldownLineChartInstance.resize();
      } else {
        this.chartInstance.resize();
      }
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      BaseCases.playStarted = data.started;
    });

    this.eventService.getObserver(EventNames.SLIDER_RESET).subscribe(data => {
      BaseCases.initialLoading = false;
    });

    this.eventService.getObserver(EventNames.SET_ERROR).subscribe(data => {
      this.setError();
    });

    this.changeChartTitle();
  }

  ngAfterViewInit() {
    this.chartInstance = echarts.init(this.echartInstance.nativeElement);
    this.drilldownLineChartInstance = echarts.init(this.echartInstanceDrilldown.nativeElement);
  }

  ngOnChanges() {
    this.selectedRegion = undefined;
    this.getData();
  }

  getData() {
    const url = this.fileNameTemplate +  Utils.formatDateForFileName(this.selectedDate) + '.json';
    this.dataService.sendGetRequest(url, true).subscribe(data => {
      data = this.processDataJson(data);
      
      if (BaseCases.initialLoading) { // Sqave the latest data available date for the drill down 
        this.config.latestDataDate = this.selectedDate;
      }

      this.changeChartTitle();
      this.processData(data);
      this.removeDuplicates();
      this.setBestWorstPerformers();
      this.initChart();
      this.clearError();
      this.eventService.publish(EventNames.CHART_LOAING_COMPLETE);
    }, error => {
      this.changeChartTitle();
      this.onPerformersFound.emit({best: undefined, worst: undefined});
      this.eventService.publish(EventNames.CHART_LOAING_COMPLETE);

      if (BaseCases.playStarted) { // If play is started stop the play and navigate to last date
        this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: false});
        this.eventService.publish(EventNames.NAVIGATE_BACK);
      } else if (BaseCases.initialLoading && !this.directLink && this.numDaysOnSlider-- > 0) {
        //if (this.numDaysOnSlider-- !== 0) {
          this.eventService.publish(EventNames.NAVIGATE_BACK);
        //}
      } else {
        this.setError();
        this.inProgress = false;
      }
    });
  }

  setBestWorstPerformers() {
    const performers = this.processedSeriesData.sort((a, b) => {
      if (a.value < b.value) {
        return -1;
      } else if (a.value === b.value) {
        return 0;
      } else {
          return 1;
        }
    });

    this.bestPerformers = performers.slice(0, 5).map(d => {
      if (this.mapType === "india") {
        return indiaStateCodes[d.name]
      }
      return d.name;
    }).reverse().join(', ');

    let i = 0;
    const worstPerformers = []
    performers.reverse().forEach(series => {
      if (++i > 5) {
        return;
      }
      if (series.name.startsWith('Unassigned')) {
        return;
      }
      if (series.value < this.maxVal * this.config['worstPerformanceFactor']) {
        return;
      }
      if (this.mapType === "india") {
        worstPerformers.push(indiaStateCodes[series.name]);
      } else {
        worstPerformers.push(series.name);
      }
    })

    this.worstPerformers = worstPerformers.join(', ');

    this.onPerformersFound.emit({best: this.bestPerformers, worst: this.worstPerformers});
  }

  initChart() {
    this.clearError();
    //this.chartTitleChange.emit(this.chartTitle);
    this.chartOption = this.getChartOptions();
    
    this.setChartOptions();

    this.chartInstance.setOption(this.chartOption);
    this.chartInstance.on('click', (data) => {
      this.selectedRegion = data.data.name;
      this.initDrilldown();
    });

    this.inProgress = false;
  }

  initDrilldown() {
    this.drilldownInProgress = true;
    let url;
    if (this.mapType === 'globe') {
      url = this.dataFolder + '/result_' + this.fileNameToken + '_' +
        this.selectedRegion + '_time_series_covid19_' + this.chartType + '_global.json' ;
    } else if (this.mapType === 'india') {
      url = this.dataFolder + '/result_' + this.fileNameToken + '_' +
        this.selectedRegion + ' (India)_state_wise_daily_' + this.chartType + '.json';
    } else {
      url = this.dataFolder + '/result_' + this.fileNameToken + '_' +
        this.selectedRegion + '_time_series_covid19_' + this.chartType + '_US.json';
    }

    this.dataService.sendGetRequest(url).subscribe(data => {
      this.drilldownLineChartOption = this.getDrilldownChartOptions(data);

      this.drilldownInProgress = false;
      this.ref.detectChanges();

      this.drilldownLineChartInstance.setOption(this.drilldownLineChartOption);
      this.drilldownLineChartInstance.resize();
    }, error => {
      this.setError("Forecasted data not found for " + this.selectedRegion);
      this.drilldownInProgress = false;
    });
  }

  getChartOptions(): EChartOption {
    const me = this;
    return {
      /*backgroundColor: '#003865',
      title: {
        text: me.chartTitle + ' (' + 
          Utils.formatDate(me.selectedDate) + ')',
        left: 'center',
        top: 0,
        itemGap: 0,
        textStyle: {
            color: '#eee'
      }},*/
      visualMap: [{
        left: 'right',
        top: 'top',
        orient: 'horizontal',
        min: me.maxVal,
        max: me.minVal,
        //itemHeight: 200,
        itemWidth: 10,
        textGap: 20,
        inRange: {
            color: ['red', 'yellow', 'green'].reverse()
        },
        //text: ['High', 'Low'],
        align: 'bottom',
        textStyle: {
          color: 'white'
        },
        calculable: true
      }],
      series: [{
        name: 'County covid19 trends',
        type: 'map',
        roam: true,
        map: this.mapType,
        scaleLimit: {min: 1},
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
      }],
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          let countyObj = me.seriesData.find(d => {
            return me.getSeriesName(d) === params['name']
          });

          if (countyObj) {
            countyObj = JSON.parse(JSON.stringify(countyObj));
            if (countyObj.forecastDelta < 0) {
              countyObj.forecastDelta = 0;
            }
            if (countyObj.forecast < 0) {
              countyObj.forecast = 0;
            }

            const type = me.chartType.toLowerCase() === 'confirmed' ? 'cases' : 'deaths';
            const name = me.mapType === 'india' ? indiaStateCodes[me.getSeriesName(countyObj)] : me.getSeriesName(countyObj);
            return name +
            '<br/>' + 'New ' + type + ': ' + countyObj.actualDelta + ' (Forecasted: ' + countyObj.forecastDelta + ')' +
            '<br/>' + 'Total ' + type + ': ' + countyObj.actual + ' (Forecasted: ' + countyObj.forecast + ')'
          }
          return params['name'];
      }}
    }
  }

  getDrilldownChartOptions(_seriesData) {
   let series: any = JSON.parse(JSON.stringify(_seriesData));
   series = series[0];

   const actualHistorical = series.actualHistorical;
   actualHistorical.push(series.actual);

   // Forecast can never be less than last actual
   const forecastCases = series.forecastCases.map(data => {
     if (data < series.actual) {
       return series.actual
     }
     return data;
   });
   const actual = actualHistorical.concat(forecastCases);
   const lowerbaseline = actualHistorical.concat(series.lowerBaseline);
   const upperBaseline = actualHistorical.concat(series.upperBaseline);

   // Add all dates to create x axis series
   const currentDate = new Date(this.config.latestDataDate);
   const dates = [];
   for (let i = actualHistorical.length - 1; i > 0 ; i--) { // -1 becaue 0th is actual (current)
     const temp = new Date(currentDate);
     temp.setDate(temp.getDate() - i)
     dates.push(Utils.formatDate(temp));
   }
   dates.push(Utils.formatDate(this.config.latestDataDate));
   for (let i = 1; i < 7; i++) {
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate() + i)
    dates.push(Utils.formatDate(temp));
   }

   const seriesData = [];
   for (let i = 0; i < actual.length; i++) {
    let lower = lowerbaseline[i];
    let upper = upperBaseline[i]
    let forecast = actual[i];
    let actualVal = series.actual;

    if (lower < actualVal) {
      lower = actualVal;
    } else if(lower > forecast) {
      lower = forecast
    }

    if (upper < actualVal) {
      upper = actualVal
    } else if (upper < forecast) {
      upper = forecast
    }

    seriesData.push( {
      actual: forecast,
      lower: lower,
      upper: upper
    });
   }

   return {
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const actual = params.find(p => p.seriesName === 'Actual');
            const lower = params.find(p => p.seriesName === 'Lower');
            const upper = params.find(p => p.seriesName === 'Upper');

            const actualSeriesName = params[0].dataIndex < actualHistorical.length ? 'Actual' : 'Forecast';
            let data = params[0]['axisValue'] + '<br/>' + 
              actualSeriesName + ': ' + Math.round(actual['value']) + '<br/>';

            if (params[0].dataIndex >= (actualHistorical.length)) {
              data += upper['seriesName'] + ': ' + Math.round(upper['value'] + Math.round(lower['value'])) + '<br/>' +
                lower['seriesName'] + ': ' + Math.round(lower['value']) + '<br/>'
            }

            return data;
          }
      },
      xAxis: {
        type: 'category',
        data: dates,
        splitLine: {
            show: false
        },
        axisLine: {
          lineStyle: {
            color: 'white'
          }
          
        },
        boundaryGap: false
      },
      yAxis: {
        splitNumber: 3,
        splitLine: {
            show: false
        },
        axisLine: {
          lineStyle: {
            color: 'white'
          }
          
        }
      },
      grid: {
        containLabel: true
      },
      series: [
        {
          // Lower confidence band
          name: 'Lower',
          type: 'line',
          data: this.config.showBaseline ? seriesData.map(d =>  {
            return d.lower;
          }): [],
          lineStyle: {
              opacity: 0
          },
          stack: 'confidence-band',
          symbol: 'none'
      }, {
        // Upper confidence band
          name: 'Upper',
          type: 'line',
          data: this.config.showBaseline ?  seriesData.map(d => {
            return d.upper - d.lower;
          }) : [],
          lineStyle: {
              opacity: 0
          },
          areaStyle: {
              color: 'yellow',
              opacity: 0.2
          },
          stack: 'confidence-band',
          symbol: 'none'
      }, {
        // Historical data series
          type: 'line',
          name: 'Actual',
          data: seriesData.slice(0, actualHistorical.length).map(d => d.actual),
          hoverAnimation: false,
          symbolSize: 6,
          itemStyle: {
              color: '#c23531'
          },
          showSymbol: false,
          markPoint: {
            symbol: 'circle',
            symbolSize: 10,
            label: {
              formatter: 'Actual',
              position: 'bottom',
              color: 'white'
            },
            data: [{
              coord: [actualHistorical.length - 1, actualHistorical[actualHistorical.length - 1]]
            }]
          }
      }, {
        // Forecast data series
        type: 'line',
        name: 'Actual',
        data: seriesData.map(d => d.actual),
        hoverAnimation: false,
        symbolSize: 6,
        itemStyle: {
            color: '#c23531'
        },
        lineStyle: {
          type: 'dotted'
        },
        showSymbol: false,
        markPoint: {
          symbol: 'circle',
          symbolSize: 10,
          label: {
            formatter: 'Forecasted',
            position: 'bottom',
            color: 'white'
          },
          data: [{
            coord: [dates.length - 1, actual[actual.length - 1]]
          }]
        }
      }]
    }
  }

  drilldownBackClicked(event) {
    this.selectedRegion = undefined; 
    this.errorMessage = undefined;
    this.ref.detectChanges();
    this.chartInstance.resize();

  }

  processDataJson(_data: string): any[] {
    if (_data.endsWith(',')) {
      _data = _data.substr(0, _data.lastIndexOf(','))
    }
    _data = '[' + _data + ']';
    const data = JSON.parse(_data);

    const finalData = [];
    data.map((d: any) => {
      d.forEach(dd => {
        //if (!finalData.find(series => series.name === dd.name)) {
          finalData.push(dd);
        //}
      });
    })

    return finalData;
  }

  removeDuplicates() {
    const tempData = []
    this.processedSeriesData.forEach(data => {
      if (!tempData.find(d => d.name === data.name)) {
        tempData.push(data);
      }
    });
    this.processedSeriesData = tempData;
  }

  changeChartTitle() {
    this.chartTitleChange.emit(this.chartTitle + ' (' + 
      Utils.formatDate(this.selectedDate) + ')');
  }

  clearError() {
    this.errorMessage = undefined;
  }

  setError(_error?: string) {
    this.errorMessage = _error ? _error : 'No data found for ' + Utils.formatDate(this.selectedDate);
  }
}