import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { Utils } from '../../utils';
import { AppEventService } from '../../events/app-event.service';
import { EventNames } from '../../events/EventNames';
import * as $ from 'jquery';
import { MatSliderChange } from '@angular/material';
import { BaseCases } from '../../tabs/baseCases';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit, OnChanges {

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

  formatDate = Utils.formatDate;

  constructor(private eventService: AppEventService,
    private configService: ConfigService) { 
    
  }

  /*
  On the landing page slider will settle on the latest date for which the data is available for the default tab.
  When user switches to a different tab, slider will settle on the new date for which the new tab has the latest data
  When user manually changes the slider index then it sets initial loading flaG to false and then onwards
  the date/ slider index is not changes if user navigates across tabs.

  Similarly while slider is not reset manually and user clicks on Run, we start from the beginnig of the slider until 
  the end is reached or no data is found. IF user has manually reset the slider then we start from the current position
  on clicking Run. 

  */

  ngOnInit() {
    this.setSelectedDateIndex();
    
    this.firstDay = Utils.formatDate(this.firstDay);
    this.eventService.getObserver(EventNames.NAVIGATE_BACK).subscribe(data => {
      if (this.selectedDateIndex > 1) {
        this.selectedDateIndex--;
        this.onDateChangedImpl();
      } else {
        this.eventService.publish(EventNames.SET_ERROR);
      }
    });

    this.eventService.getObserver(EventNames.PLAY_STATUS_CHANGED).subscribe(data => {
      if (!data.started) {
        this.playing = false;
      }
    });
  }

  ngOnChanges() {
    this.setSelectedDateIndex();
  }

  onDateChanged() {
    this.eventService.publish(EventNames.SLIDER_RESET);
    this.onDateChangedImpl();
  }

  onDateChangedImpl() {
    const diff = this.numDays - this.selectedDateIndex;
    const tempDate: Date = new Date(this.lastDay);
    tempDate.setDate(this.lastDay.getDate() - diff);
    this.selectedDate = tempDate;
    
    this.selectedDateChange.emit(this.selectedDate);
    $('.mat-slider-thumb-label-text').text(Utils.getDateMonth(this.selectedDate));
  }

  async startPlay() {
    this.playing = true;

    this.eventService.publish(EventNames.PLAY_STATUS_CHANGED, {started: true});

    if (BaseCases.initialLoading) {
      this.selectedDateIndex = 0;
    }
    
    while(this.selectedDateIndex !== this.numDays && this.playing) {
      this.selectedDateIndex++;
      this.onDateChangedImpl();

      // onDateChange() will trigger chart loading for new date
      // Wait until the chart is loaded completely and then wait for the delay amount
      // until the slider moves forward
      let chartLoadingFinished = false;
      this.eventService.getObserver(EventNames.CHART_LOAING_COMPLETE).subscribe(data => {
        chartLoadingFinished = true;
      });

      while (!chartLoadingFinished && this.playing) {
        await this.delay(500);
      }

      await this.delay(this.configService.chartRunDelayInMS);
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

  setSelectedDateIndex() {
    const diffTime = Math.abs(this.lastDay - this.selectedDate);
    this.selectedDateIndex = Math.round((this.numDays - (diffTime / (1000 * 60 * 60 * 24)))); //this.defaultSelectedIndex; //this.numDays;
    $('.mat-slider-thumb-label-text').text(Utils.getDateMonth(this.selectedDate));
  }

}
