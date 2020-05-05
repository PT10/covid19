import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Utils } from '../../utils';
import { AppEventService } from '../../events/app-event.service';
import { EventNames } from '../../events/EventNames';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  @Input()
  numDays: number;

  @Input()
  selectedDate: Date;

  @Output()
  selectedDateChange: EventEmitter<any> = new EventEmitter<any>();

  selectedDateIndex = 7;
  firstDay;

  playing: boolean = false;

  delayAmt = 2000;
  
  todayDate: Date = new Date();

  constructor(private eventService: AppEventService) { 
    this.firstDay = new Date();
    this.firstDay.setDate(this.firstDay.getDate() - 6);
    this.firstDay = Utils.formatDate(this.firstDay);
    this.selectedDate = new Date();
  }

  ngOnInit() {
    this.eventService.getObserver(EventNames.NAVIGATE_BACK).subscribe(data => {
      this.selectedDateIndex--;
      this.onDateChanged()
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      if (!data.started) {
        this.playing = false;
      }
    });
  }

  onDateChanged() {
    const diff = this.numDays - this.selectedDateIndex;
    const tempDate: Date = new Date(this.todayDate);
    tempDate.setDate(this.todayDate.getDate() - diff);
    this.selectedDate = tempDate;
    
    this.selectedDateChange.emit(this.selectedDate);
  }

  async startPlay() {
    this.playing = true;

    this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: true});
    
    while(this.selectedDateIndex !== 7 && this.playing) {
      this.selectedDateIndex++;
      this.onDateChanged();
      await this.delay(this.delayAmt);
    }

    this.playing = false;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopPlay() {
    this.playing = false;
    this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: false});
  }

}
