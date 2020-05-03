import { Component, OnInit, ViewChild } from '@angular/core';
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
  todayDate: Date;
  firstDay: Date;
  selectedDate: Date;
  selectedDateIndex = 7;
  mapRegistered = false;
  isShown;

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

  onDateChanged(data) {
    this.selectedDateIndex = (7 - data.value) * -1;
    const tempDate: Date = new Date(this.todayDate);
    tempDate.setDate(this.todayDate.getDate() + this.selectedDateIndex);
    this.selectedDate = tempDate;
    /*this.getData();
    this.chartInstance.setOption({title:{text:this.chartTitle + ' (' + this.formatDate(this.selectedDate) + ')'}});*/
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
