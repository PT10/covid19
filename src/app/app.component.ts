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
  firstDay: any;
  selectedDate: Date = new Date();
  selectedDateIndex = 7;
  mapRegistered = false;
  isShown;
  _tickInterval = 7;

  constructor(private dataService: RawDataProviderService) {
    
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
