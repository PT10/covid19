import { Injectable } from '@angular/core';
import { RawDataProviderService } from './raw-data-provider.service';

@Injectable()
export class FetchPopulationService {

  countyPopDesnity = {};
  usPopDensity = {};

  constructor(private dataProvider: RawDataProviderService) {
    this.dataProvider.sendGetRequest('assets/populationDensity.json').subscribe(data => {
      this.countyPopDesnity = data;
      console.log(data);
    });
    
  }
}
