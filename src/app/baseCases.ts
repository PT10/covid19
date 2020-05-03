import { Input, OnInit, AfterViewInit, ViewChild, OnChanges } from '@angular/core';
import { usStateCodes } from './map-provider.service';
import { EChartOption } from 'echarts';
import * as echarts from 'echarts/lib/echarts';
import * as $ from 'jquery';

export abstract class BaseCases implements OnInit, AfterViewInit, OnChanges {
  seriesData = [];
  processedSeriesData = [];
  inProgress: boolean;
  maxVal: number;
  minVal: number;
  chartOption: EChartOption;
  chartTitle: string;
  chartInstance;
  chartHeight: string

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

  processCountyNames(usMap) {
    const newFeatures = usMap['features'].map(feature => {
      const copyObj = JSON.parse(JSON.stringify(feature));
      copyObj.properties['name'] = copyObj.properties['name'] + ' (' +  usStateCodes[copyObj.properties['state']] + ')';

      return copyObj;
    });

    return {
      type: "FeatureCollection",
      features: newFeatures
    }
  }

  formatDate(date:Date) {
    return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  }
}