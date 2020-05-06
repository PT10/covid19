import { Component, OnInit } from '@angular/core';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { usStateCodes } from './map-provider.service';
import * as echarts from 'echarts/lib/echarts';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {

  view = 'usActive';
  chartTitle = "";
  firstDay: any;
  selectedDate: Date;
  numDaysOnSlider = 7; // Number of days user can navigate on the slider
  numDaysInFurure = 0;  // To be added in today's date to find last day
  selectedDateIndex;
  mapRegistered = false;
  isShown;

  constructor(private dataService: RawDataProviderService) {
    this.selectedDate = new Date();
    this.selectedDate.setDate(this.selectedDate.getDate() + this.numDaysInFurure);
  }

  ngOnInit() {
    this.selectedDateIndex = this.numDaysOnSlider;
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
