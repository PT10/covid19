import { Injectable } from '@angular/core';
import { RawDataProviderService } from './raw-data-provider.service';

@Injectable()
export class FetchPopulationService {

  countryPopDesnity = {};
  countryPopTotal = {};
  usPopDensity = {};

  constructor(private dataProvider: RawDataProviderService) {
    this.dataProvider.sendGetRequest('assets/populationDensity.json').subscribe(data => {
      this.countryPopDesnity = data;
      console.log(data);
    });

    this.dataProvider.sendGetRequest('assets/countryPopulationTotal.json').subscribe(data => {
      this.countryPopTotal = data;
    });

  }
}
