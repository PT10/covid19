import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {

  view = 'usActive';
  todayDate: Date;
  firstDay: Date;
  selectedDate: Date;
  selectedDateIndex = 7;

  constructor() {
    this.todayDate = new Date();
    this.selectedDate = new Date();
  }

  ngOnInit() {
  }

  onDateChanged(data) {
    this.selectedDateIndex = (7 - data.value) * -1;
    const tempDate: Date = new Date(this.todayDate);
    tempDate.setDate(this.todayDate.getDate() + this.selectedDateIndex);
    this.selectedDate = tempDate;
    /*this.getData();
    this.chartInstance.setOption({title:{text:this.chartTitle + ' (' + this.formatDate(this.selectedDate) + ')'}});*/
  }
}
