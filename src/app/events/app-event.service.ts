import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import { Observable }    from 'rxjs/Observable';
import { EventNames} from './EventNames';


@Injectable()
export class AppEventService {
	private eventList: PubSub[] = [];

  constructor() { 
  	for(var name in EventNames) {
  		let eventName = EventNames[name];
  		let subject = new Subject<any>();
  		this.eventList[eventName] = {
  			subject: subject,
  			observable: subject.asObservable()
  		};
  	}
  }

  publish(_eventName, _eventData?) {
  	this.eventList[_eventName].subject.next(_eventData);
  }

  getObserver(_eventName): Observable<any> {
  	return this.eventList[_eventName].observable;
  }
}

interface PubSub {
	subject: Subject<any>
	observable: Observable<any>
}
