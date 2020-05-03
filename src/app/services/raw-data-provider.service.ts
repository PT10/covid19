import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/Rx';

const serverURL = "http://localhost:4200/";

@Injectable()
export class RawDataProviderService {

  constructor(private httpConnection: Http) { }

  sendGetRequest(_url: string, _headers?: {}): Observable<any> {
    let url = serverURL + _url

    return this.httpConnection.get(url)
    .map(_response => {
      let resData = _response.json();

      return resData;
    });
  }
}
