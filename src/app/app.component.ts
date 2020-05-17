import { Component, OnInit } from '@angular/core';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { usStateCodes } from './map-provider.service';
import * as echarts from 'echarts/lib/echarts';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from './services/config.service';
import { AppEventService } from './events/app-event.service';
import { EventNames } from './events/EventNames';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {

  view;
  chartTitle = "";
  selectedDate: Date;
  lastDay: Date;
  firstDay: Date;
  numDaysOnSlider = 15; // Number of days user can navigate on the slider
  numDaysInFurure = 0;  // To be added in today's date to find last day
  globeMapRegistered = false;
  usMapRegistered = false;
  indiaMapRegistered = false;
  configLoaded: boolean;
  isShown;
  chartLoadingInProgress = false;
  best;
  worst;

  constructor(private dataService: RawDataProviderService, 
    private route: ActivatedRoute,
    private config: ConfigService,
    private eventService: AppEventService) {
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        const fmtDate = params['date'].replace(/_/g, '/');
        this.selectedDate = new Date(fmtDate);
      }
      if (params['view']) {
        this.view = params['view']
      }
    });
    this.eventService.getObserver(EventNames.CONFIG_LOADED).subscribe(() => {
      this.onConfigLoad();
    });
    this.eventService.getObserver(EventNames.CHART_LOAING_COMPLETE).subscribe(() => {
      this.chartLoadingInProgress = false;
    });
  }

  onConfigLoad() {
    this.numDaysOnSlider = this.config.numDaysOnSlider;
    this.numDaysInFurure = this.config.numDaysInFurure;

    // View and date can be set already by params
    if (!this.view) {
      this.view = this.config.defaultView;
    }

    const refDate = new Date();
    if (!this.selectedDate) {
      this.selectedDate = new Date(refDate);
    }

    this.firstDay = new Date(refDate);
    this.firstDay.setDate(this.firstDay.getDate() - (this.numDaysOnSlider - this.numDaysInFurure) + 1); // 1 for current day
    this.lastDay = new Date(refDate);
    this.lastDay.setDate(this.lastDay.getDate() + this.numDaysInFurure);

    this.configLoaded = true;
  }

  ngOnInit() {
    const globeUrl = 'assets/globeGeo.json'
    this.dataService.sendGetRequest(globeUrl).subscribe(data => {
      const globeMapJSon = data;
      echarts.registerMap('world', globeMapJSon);

      this.globeMapRegistered = true;
    });

    const usUrl = 'assets/usGeo.json';
    this.dataService.sendGetRequest(usUrl).subscribe(data => {
      const usMapJSon = this.processCountyNames(data);
      echarts.registerMap('USA', usMapJSon);
      this.usMapRegistered = true;
    });

    const indiaUrl = 'assets/indiaGeo.json';
    this.dataService.sendGetRequest(indiaUrl).subscribe(data => {
      const indiaMapJSon = data;
      echarts.registerMap('India', indiaMapJSon);
      this.indiaMapRegistered = true;
    });
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

}
