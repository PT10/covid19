import { Injectable } from '@angular/core';
import { RawDataProviderService } from './raw-data-provider.service';
import { AppEventService } from '../events/app-event.service';
import { EventNames } from '../events/EventNames';

@Injectable()
export class ConfigService {

  defaultView: string;
  numDaysOnSlider: number;
  numDaysInFurure: number;
  fileNameToken: string;
  worstPerformanceFactor: number;

  _latestDataDate: Date;
  get latestDataDate(): Date {
    return this._latestDataDate;
  }

  set latestDataDate(_data: Date) {
    this._latestDataDate = _data;
  }

  constructor(private dataService: RawDataProviderService,
    private eventService: AppEventService) {

    const url = "assets/config.json";
    this.dataService.sendGetRequest(url).subscribe(data => {
      this.defaultView = data.defaultView;
      this.fileNameToken = data.fileNameToken;
      this.numDaysOnSlider = data.numDaysOnSlider;
      this.numDaysInFurure = data.numDaysInFurure;
      this.worstPerformanceFactor = data.worstPerformanceFactor;

      this.eventService.publish(EventNames.CONFIG_LOADED);
    })
   }

}
