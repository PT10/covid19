import { Component, OnInit, ViewChild } from '@angular/core';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { usStateCodes } from './map-provider.service';
import * as echarts from 'echarts/lib/echarts';
import { Options } from 'ng5-slider';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {

  view = 'usActive';
  todayDate: Date;
  firstDay: Date;
  selectedDate: Date;
  selectedDateIndex = 7;
  mapRegistered = false;
  isShown;
  _tickInterval = 7;

  constructor(private dataService: RawDataProviderService) {
    this.todayDate = new Date();
    this.selectedDate = new Date();
  }

  ngOnInit() {
    const usUrl = 'assets/usGeo.json';
    this.dataService.sendGetRequest(usUrl).subscribe(data => {
      const usMapJSon = this.processCountyNames(data);
      echarts.registerMap('USA', usMapJSon);

      const globeUrl = 'assets/globeGeo.json'
      this.dataService.sendGetRequest(globeUrl).subscribe(data => {
        const globeMapJSon = data;
        echarts.registerMap('world', globeMapJSon);

        this.mapRegistered = true;
      });
      
    }, error => {

    });
  }

  onDateChanged() {
    const diff = this._tickInterval - this.selectedDateIndex;
    const tempDate: Date = new Date(this.todayDate);
    tempDate.setDate(this.todayDate.getDate() - diff);
    this.selectedDate = tempDate;
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

  get tickInterval(): number | 'auto' {
    return this._tickInterval;
  }

  set tickInterval(v) {
    this._tickInterval = Number(v);
  }
}
