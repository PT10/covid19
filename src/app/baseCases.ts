import { Input, OnInit, AfterViewInit, ViewChild, OnChanges } from '@angular/core';
import { EChartOption } from 'echarts';
import * as echarts from 'echarts/lib/echarts';
import * as $ from 'jquery';

export abstract class BaseCases implements OnInit, AfterViewInit, OnChanges {
  seriesData = [];
  processedSeriesData = [];
  errorMessage: string;
  inProgress: boolean;
  maxVal: number;
  minVal: number;
  chartOption: EChartOption;
  chartTitle: string;
  chartInstance;
  chartHeight: string
  fileNameTemplate: string;

  @Input()
  selectedDate: Date;

  @ViewChild('charts')
  echartInstance

  constructor() {
   
  }

  abstract setChartOptions();
  abstract getData();

  ngOnInit() {
    this.chartHeight = (window.document.body.offsetHeight - 100) + 'px';
    $(window).resize((params) => {
      this.chartHeight = window.document.body.offsetHeight - 100 + 'px';
      this.chartInstance.resize();
    });
  }

  ngAfterViewInit() {
    this.chartInstance = echarts.init(this.echartInstance.nativeElement);
  }

  ngOnChanges() {
    this.clearError();
    this.getData()

    if (this.chartInstance) {
      this.chartInstance.setOption({title: {text: this.chartTitle + this.formatDate(this.selectedDate)}});
    }
  }

  getChartOptions(): EChartOption {
    const me = this;
    return {
      backgroundColor: '#003865',
      title: {
        text: me.chartTitle + ' (' + 
          me.formatDate(me.selectedDate) + ')',
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

  formatDate(date:Date) {
    return ("0" + (date.getMonth() + 1)).slice(-2) + '/' + ("0" + date.getDate()).slice(-2) + '/' + date.getFullYear();
  }

  formatDateForFileName(date:Date) {
    return ("0" + (date.getMonth() + 1)).slice(-2) + '_' + ("0" + date.getDate()).slice(-2) + '_' + date.getFullYear();
  }

  clearError() {
    this.errorMessage = undefined;
  }

  setError(_error?: string) {
    this.errorMessage = _error ? _error : 'No data found for ' + this.formatDate(this.selectedDate);
  }
}