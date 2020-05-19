import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/Rx';

@Injectable()
export class RawDataProviderService {

  constructor(private httpConnection: Http) { }

  sendGetRequest(_url: string, _skipDecode?: boolean): Observable<any> {
    let url =_url

    return this.httpConnection.get(url)
    .map(_response => {
      if (_skipDecode) {
        return _response.text();                                                                            
      }
      return _response.json();
    });
  }
}
