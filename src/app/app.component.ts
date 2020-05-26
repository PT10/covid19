import { Component, OnInit } from '@angular/core';
import { RawDataProviderService } from './services/raw-data-provider.service';
import { usStateCodes } from './map-provider.service';
import * as echarts from 'echarts/lib/echarts';
import { ActivatedRoute } from '@angular/router';
import { ConfigService } from './services/config.service';
import { AppEventService } from './events/app-event.service';
import { EventNames } from './events/EventNames';
import { BaseCases } from './baseCases';
import { Utils } from './utils';
import { MatDialog } from '@angular/material';
import { EmbedComponent } from './cmp/embed/embed.component';

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

  fullScreen = false;
  drillDownState = false;

  constructor(private dataService: RawDataProviderService, 
    private route: ActivatedRoute,
    private config: ConfigService,
    private eventService: AppEventService,
    private dialog: MatDialog) {
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        const fmtDate = params['date'].replace(/_/g, '/');
        this.selectedDate = new Date(fmtDate);
        this.selectedDate.setHours(23);
        this.selectedDate.setMinutes(59);
        
        this.config.directLinkAccess = true;
      }
      if (params['view']) {
        this.view = params['view']
      }
      if (params['embed'] === 'true') {
        this.fullScreen = true;
        this.config.embedMode = true;
      }
    });
    this.eventService.getObserver(EventNames.CONFIG_LOADED).subscribe(() => {
      this.onConfigLoad();
    });
    this.eventService.getObserver(EventNames.CHART_LOAING_COMPLETE).subscribe(() => {
      this.chartLoadingInProgress = false;
    });
    this.eventService.getObserver(EventNames.FULL_SCREEN_MODE).subscribe((data) => {
      this.fullScreen = data.state;
    });
    this.eventService.getObserver(EventNames.CHART_DRILLDOWN).subscribe(data => {
      this.drillDownState = data.state;
    })
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
      echarts.registerMap('globe', globeMapJSon);

      this.globeMapRegistered = true;
    });

    const usUrl = 'assets/usGeo.json';
    this.dataService.sendGetRequest(usUrl).subscribe(data => {
      const usMapJSon = this.processCountyNames(data);
      echarts.registerMap('us', usMapJSon);
      this.usMapRegistered = true;
    });

    const indiaUrl = 'assets/indiaGeo.json';
    this.dataService.sendGetRequest(indiaUrl).subscribe(data => {
      const indiaMapJSon = data;
      echarts.registerMap('india', indiaMapJSon);
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

  // Before the slider is manually reset if user navigates across tabs it should always show latest data
  // Hence we start fron the last date and navigate backwards till latest data is found
  setSliderDate() {
    if (BaseCases.initialLoading) {
      this.selectedDate = new Date(this.lastDay);
    }
  }

  activateLink(_view) {
    this.config.directLinkAccess = false;
    this.view = _view;
    if (BaseCases.initialLoading) {
      this.selectedDate = new Date(this.lastDay);
    }
    this.chartLoadingInProgress = true;
    this.worst = undefined;
  }

  getFullScreenTitle() {
    const result = this.view.replace( /([A-Z])/g, " $1" );
    const viewName = result.charAt(0).toUpperCase() + result.slice(1);
    return viewName + ' - ' + Utils.formatDate(this.selectedDate);  
  }

  share(_type) {
    const myUrl = this.getMyUrl();
    let shareLink;

    switch (_type) {
      case 'twitter' :
        shareLink = this.getTwitterLink(myUrl);
        break;
      case 'fb':
        shareLink = this.getFbLink(myUrl);
        break;
      case 'linkedin':
        shareLink = this.getLinkedInLink(myUrl);
        break;
    }

    var left = (screen.width/2) - 300;
    var top = (screen.height/2) - 150;
    window.open(shareLink, '_blank', 'width=' + (screen.width/2) + ',height=' + screen.height/2 + ',top=' + top + ',left=' + left);
    return false;
  }

  onEmbed() {
    this.dialog.open(EmbedComponent, {
      disableClose: true, 
      data: {date: this.selectedDate, view: this.view}, 
      height: '179px', 
      width: '60%',
      backdropClass: 'panel-bg'
    });
  }

  getMyUrl(){
    let myUrl: string = Utils.getAbsoluteUrl();
    myUrl += '?view=' + this.view + '&date=' + Utils.formatDateForFileName(this.selectedDate)

    return myUrl;
  }

  getTwitterLink(_myUrl) {
    return 'https://twitter.com/intent/tweet?&text=' + this.getTitle() + '&url=' + encodeURIComponent(_myUrl)
  }

  getFbLink(_myUrl) {
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(_myUrl) +'&t=' + this.getTitle() ;
  }

  getLinkedInLink(_myUrl) {
    return 'http://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(_myUrl)
  }

  getTitle() {
    return encodeURIComponent('COVID-19 daily trends by Bolt Analytics');
  }

}
