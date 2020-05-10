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
  fileNameToken = 'delta2';
  //dayIndex = 7;

  dataFolder = "data/"

  @Input()
  selectedDate: Date;

  @Input()
  numDaysOnSlider: number;

  @Output()
  chartTitleChange: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('charts')
  echartInstance

  // Used by US map components to set zoom for the first time each map is loaded
  firstTimeAccess = true;

  directLink = false;

  // Used for falling back to data availability on landing page
  static initialLoading = true;

  static playStarted: boolean;

  constructor(protected dataService: RawDataProviderService, 
    protected eventService: AppEventService,
    protected populationService: FetchPopulationService,
    protected route: ActivatedRoute,
    protected config: ConfigService) {
      this.route.queryParams.subscribe(params => {
        if (params['date']) {
          this.directLink = true;
        }
      });

      this.fileNameToken = this.config.fileNameToken;
  }

  abstract setChartOptions();
  abstract processData(_data: any);

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
    }, error => {
      this.changeChartTitle();

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
    this.inProgress = false;

    this.eventService.publish(EventNames.CHART_LOAING_COMPLETE);
  }

  ngOnInit() {
    $(window).resize((params) => {
      this.chartInstance.resize();
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      BaseCases.playStarted = data.started;
    });
  }

  ngAfterViewInit() {
    this.chartInstance = echarts.init(this.echartInstance.nativeElement);
  }

  ngOnChanges() {
    this.clearError();
    this.getData();
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