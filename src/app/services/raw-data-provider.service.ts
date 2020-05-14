import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/Rx';

@Injectable()
export class RawDataProviderService {

  constructor(private httpConnection: Http) { }

  sendGetRequest(_url: string, _headers?: {}): Observable<any> {
    let url =_url

    return this.httpConnection.get(url)
    .map(_response => {
      let resData = _response.json();

      return resData;
    });
  }
}
