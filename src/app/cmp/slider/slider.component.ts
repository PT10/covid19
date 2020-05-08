import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { Utils } from '../../utils';
import { AppEventService } from '../../events/app-event.service';
import { EventNames } from '../../events/EventNames';
import * as $ from 'jquery';
import { MatSliderChange } from '@angular/material';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  @Input()
  numDays: number;

  @Input()
  selectedDate: any;

  @Input()
  lastDay: any;

  @Input()
  firstDay: any;

  @Input()
  defaultSelectedIndex: number

  @Output()
  selectedDateChange: EventEmitter<any> = new EventEmitter<any>();

  selectedDateIndex;

  playing: boolean = false;

  delayAmt = 2000;
  
  firstTimePlay = false;

  formatDate = Utils.formatDate;

  constructor(private eventService: AppEventService) { 
    
  }

  ngOnInit() {
    const diffTime = Math.abs(this.lastDay - this.selectedDate);
    this.selectedDateIndex = Math.round((this.numDays - (diffTime / (1000 * 60 * 60 * 24)))); //this.defaultSelectedIndex; //this.numDays;

    this.firstDay = Utils.formatDate(this.firstDay);
    console.log("Selected date in init: " + this.selectedDate);
    console.log("Last date in init: " + this.lastDay);
    console.log("numDays in init: " + this.numDays);
    console.log("Selected Index in init: " + this.selectedDateIndex);
    this.eventService.getObserver(EventNames.NAVIGATE_BACK).subscribe(data => {
      console.log("Selected Index: " + this.selectedDateIndex);
      if (this.selectedDateIndex > 1) {
        this.selectedDateIndex--;
        this.onDateChanged();
      }
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      if (!data.started) {
        this.playing = false;
      }
    });

    this.eventService.getObserver(EventNames.INITIAL_LOADING_COMPLETED).subscribe(data => {
      this.firstTimePlay = true;
    });
  }

  onDateChanged() {
    this.firstTimePlay = false;
    const diff = this.numDays - this.selectedDateIndex;
    const tempDate: Date = new Date(this.lastDay);
    tempDate.setDate(this.lastDay.getDate() - diff);
    this.selectedDate = tempDate;
    console.log("Selected date changed to: " + this.selectedDate);
    
    this.selectedDateChange.emit(this.selectedDate);
    $('.mat-slider-thumb-label-text').text(Utils.getDateMonth(this.selectedDate));
  }

  async startPlay() {
    this.playing = true;

    this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: true});

    if (this.firstTimePlay) {
      this.firstTimePlay = false;
      this.selectedDateIndex = 0;
    }
    
    while(this.selectedDateIndex !== this.numDays && this.playing) {
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

  onSlide(event: MatSliderChange) {
    const index = event.value - 1;
    const tempFirstDay = new Date(this.firstDay);
    tempFirstDay.setDate(tempFirstDay.getDate() + index);
    $('.mat-slider-thumb-label-text').text(Utils.getDateMonth(tempFirstDay));
  }


}
