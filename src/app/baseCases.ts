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

  abstract setChartOptions();
  abstract processData(_data: any);

  ngOnInit() {
    $(window).resize((params) => {
      if (this.drilldownLineChartInstance) {
        this.drilldownLineChartInstance.resize();
      } else {
        this.chartInstance.resize();
      }
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      BaseCases.playStarted = data.started;
    });
  }

  ngAfterViewInit() {
    this.chartInstance = echarts.init(this.echartInstance.nativeElement);
    this.drilldownLineChartInstance = echarts.init(this.echartInstanceDrilldown.nativeElement);
  }

  ngOnChanges() {
    this.clearError();
    this.selectedRegion = undefined;
    this.getData();
  }

  getData() {
    const url = this.fileNameTemplate +  Utils.formatDateForFileName(this.selectedDate) + '.json';
    this.dataService.sendGetRequest(url).subscribe(data => {
      if (BaseCases.initialLoading) { // For the slider "play" to reset to 0 first time
        this.eventService.publish(EventNames.INITIAL_LOADING_COMPLETED);
      }
      BaseCases.initialLoading = false;

      this.changeChartTitle();

      this.processData(data);
      this.initChart();
      this.eventService.publish(EventNames.CHART_LOAING_COMPLETE);
    }, error => {
      this.changeChartTitle();
      this.eventService.publish(EventNames.CHART_LOAING_COMPLETE);
      if (BaseCases.initialLoading && !this.directLink) {
        if (this.numDaysOnSlider-- == 0) {
          BaseCases.initialLoading = false;
          this.eventService.publish(EventNames.INITIAL_LOADING_COMPLETED);
        } else {
          this.eventService.publish(EventNames.NAVIGATE_BACK);
        }
      } else if (BaseCases.playStarted) {
        this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: false});
        this.eventService.publish(EventNames.NAVIGATE_BACK);
      } 
      else {
        this.setError();
        this.inProgress = false;
      }
    });
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
      }]
    }
  }

  getDrilldownChartOptions(_seriesData) {
   let series: any = JSON.parse(JSON.stringify(_seriesData));
   series = series[0];

   const actualHistorical = series.actualHistorical;
   actualHistorical.push(series.actual);

   const actual = actualHistorical.concat(series.forecastCases);
   const lowerbaseline = actualHistorical.concat(series.lowerBaseline);
   const upperBaseline = actualHistorical.concat(series.upperBaseline);

   const currentDate = new Date(this.selectedDate);
   const dates = [];
   for (let i = actualHistorical.length; i > 0; i--) {
     const temp = new Date(currentDate);
     temp.setDate(temp.getDate() - i)
     dates.push(Utils.formatDate(temp));
   }
   dates.push(Utils.formatDate(this.selectedDate));
   for (let i = 1; i < 7; i++) {
    const temp = new Date(currentDate);
    temp.setDate(temp.getDate() + i)
    dates.push(Utils.formatDate(temp));
   }

   const seriesData = [];
   for (let i = 0; i < actual.length; i++) {
     seriesData.push( {
        actual: actual[i],
        lower: lowerbaseline[i],
        upper: upperBaseline[i]
     });
   }

   return {
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const actual = params.find(p => p.seriesName === 'Actual');
            const lower = params.find(p => p.seriesName === 'Lower');
            const upper = params.find(p => p.seriesName === 'Upper');

            const actualSeriesName = params[0].dataIndex < 5 ? 'Actual' : 'Forecast';
            let data = params[0]['axisValue'] + '<br/>' + 
              actualSeriesName + ': ' + Math.round(actual['value']) + '<br/>';

            if (params[0].dataIndex >= 5) {
              data += upper['seriesName'] + ': ' + (Math.round(upper['value']) + Math.round(lower['value'])) + '<br/>' +
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
      series: [
        {
          name: 'Lower',
          type: 'line',
          data: seriesData.map(d => d.lower),
          lineStyle: {
              opacity: 0
          },
          stack: 'confidence-band',
          symbol: 'none'
      }, {
          name: 'Upper',
          type: 'line',
          data: seriesData.map(d => d.upper - d.lower),
          lineStyle: {
              opacity: 0
          },
          areaStyle: {
              color: '#ccc'
          },
          stack: 'confidence-band',
          symbol: 'none'
      }, {
          type: 'line',
          name: 'Actual',
          data: seriesData.map(d => d.actual),
          hoverAnimation: false,
          symbolSize: 6,
          itemStyle: {
              color: '#c23531'
          },
          showSymbol: false
      }
      ]
    }

  }

  drilldownBackClicked(event) {
    this.selectedRegion = ''; 
    this.errorMessage = undefined;
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