import { Input, OnInit, AfterViewInit, ViewChild, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import * as echarts from 'echarts/lib/echarts';
import * as $ from 'jquery';
import { Utils } from './utils';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { AppEventService } from './events/app-event.service';
import { EventNames } from './events/EventNames';

export abstract class BaseCases implements OnInit, AfterViewInit, OnChanges {
  seriesData = [];
  processedSeriesData = [];
  errorMessage: string;
  inProgress: boolean;
  maxVal = 100;
  minVal = -100;
  chartOption: EChartOption;
  chartTitle: string;
  chartInstance;
  fileNameTemplate: string;
  dayIndex = 7;

  dataFolder = "data/"

  @Input()
  selectedDate: Date;

  @ViewChild('charts')
  echartInstance

  // Used by US map components to set zoom for the first time each map is loaded
  firstTimeAccess = true;

  // Used for falling back to data availability on landing page
  static initialLoading = true;

  playStarted: boolean

  constructor(protected dataService: RawDataProviderService, protected eventService: AppEventService) {
   
  }

  abstract setChartOptions();
  abstract processData(_data: any);

  getData() {
    const url = this.fileNameTemplate +  Utils.formatDateForFileName(this.selectedDate) + '.json';
    this.dataService.sendGetRequest(url).subscribe(data => {
      BaseCases.initialLoading = false;
      this.processData(data);
      this.initChart();
    }, error => {
      if (BaseCases.initialLoading) {
        if (this.dayIndex-- == 0) {
          BaseCases.initialLoading = false;
        } else {
          this.eventService.publish(EventNames.NAVIGATE_BACK);
        }
      } else if (this.playStarted) {
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
    this.chartOption = this.getChartOptions();
    this.setChartOptions();
    this.chartInstance.setOption(this.chartOption);
    this.inProgress = false;
  }

  ngOnInit() {
    $(window).resize((params) => {
      this.chartInstance.resize();
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      this.playStarted = data.started;
    });
  }

  ngAfterViewInit() {
    this.chartInstance = echarts.init(this.echartInstance.nativeElement);
  }

  ngOnChanges() {
    this.clearError();
    this.getData()

    if (this.chartInstance) {
      this.chartInstance.setOption({title: {text: this.chartTitle + Utils.formatDate(this.selectedDate)}});
    }
  }

  getChartOptions(): EChartOption {
    const me = this;
    return {
      backgroundColor: '#003865',
      title: {
        text: me.chartTitle + ' (' + 
          Utils.formatDate(me.selectedDate) + ')',
        left: 'center',
        top: 0,
        itemGap: 0,
        textStyle: {
            color: '#eee'
      }},
      visualMap: [{
        left: 'right',
        orient: 'horizontal',
        min: me.maxVal,
        max: me.minVal,
        inRange: {
            color: ['red', 'orange', 'yellow', 'green'].reverse()
        },
        text: ['High', 'Low'],
        textStyle: {
          color: 'white'
        },
        calculable: true
      }]
    }
  }

  clearError() {
    this.errorMessage = undefined;
  }

  setError(_error?: string) {
    this.errorMessage = _error ? _error : 'No data found for ' + Utils.formatDate(this.selectedDate);
  }
}